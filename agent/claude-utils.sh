#!/bin/bash
# claude-utils.sh - Utility functions for Claude JSON interaction and session management

# Maximum number of retries for Claude errors (from config or default to 3)
MAX_CLAUDE_RETRIES=${CLAUDE_MAX_RETRIES:-3}

# Unified function to execute Claude with recursive retry and processor handling
# Usage: execute_claude OUTVAR promptStr jsonFormatMessageStr processorFunc itemId itemType [attempt] [maxRetries] [resumeSessionId] [lastResult]
execute_claude() {
    local __outvar=$1
    local prompt_str=$2
    local json_format_msg=$3
    local processor_func=$4
    local item_id=$5
    local item_type=$6
    local attempt=${7:-1}
    local max_retries=${8:-$MAX_CLAUDE_RETRIES}
    local resume_session_id=${9:-""}
    local last_result=${10:-""}

    # Stop condition
    if [ $attempt -gt $max_retries ]; then
        handle_claude_max_retries "$item_id" "Exceeded max attempts ($max_retries)" "$last_result"
        return 2
    fi

    log INFO "Executing Claude (attempt $attempt/$max_retries)..." >&2

    # Build Claude command (fresh run by default; resume only for invalid result JSON)
    local claude_cmd="claude -p --dangerously-skip-permissions --output-format json"
    if [ -n "$resume_session_id" ]; then
        claude_cmd="$claude_cmd -r $resume_session_id"
    fi

    # Execute Claude; only the command itself runs in a subshell via pipe
    local claude_result
    claude_result=$(printf "%s" "$prompt_str" | $claude_cmd)
    local exit_code=$?

    # Carry last result across retries; update when we can parse top-level JSON
    local last_result_for_retry="$last_result"

    if [ $exit_code -ne 0 ]; then
        log WARNING "Claude command failed with exit code $exit_code; retrying fresh" >&2
        execute_claude "$__outvar" "$prompt_str" "$json_format_msg" "$processor_func" "$item_id" "$item_type" $((attempt+1)) "$max_retries" "" "$last_result_for_retry"
        return $?
    fi

    # Validate top-level JSON and required attributes
    if ! echo "$claude_result" | jq empty >/dev/null 2>&1; then
        log WARNING "Top-level Claude output is not valid JSON; retrying fresh" >&2
        execute_claude "$__outvar" "$prompt_str" "$json_format_msg" "$processor_func" "$item_id" "$item_type" $((attempt+1)) "$max_retries" "" "$last_result_for_retry"
        return $?
    fi

    # Extract top-level .result as a string or JSON string for context across retries
    local top_result_value
    top_result_value=$(echo "$claude_result" | jq -r 'try (.result | (type=="string" ? . : tojson)) // ""' 2>/dev/null)
    last_result_for_retry="$top_result_value"

    local has_required=$(echo "$claude_result" | jq -r '((.is_error!=null) and (.duration_ms!=null) and (.result!=null) and (.session_id!=null) and (.total_cost_usd!=null))')
    if [ "$has_required" != "true" ]; then
        log WARNING "Top-level Claude output missing required fields; retrying fresh" >&2
        execute_claude "$__outvar" "$prompt_str" "$json_format_msg" "$processor_func" "$item_id" "$item_type" $((attempt+1)) "$max_retries" "" "$last_result_for_retry"
        return $?
    fi

    local is_error=$(echo "$claude_result" | jq -r '.is_error // false')
    local session_id=$(echo "$claude_result" | jq -r '.session_id // ""')

    if [ "$is_error" = "true" ]; then
        local result_msg=$(echo "$claude_result" | jq -r '.result // ""')
        log WARNING "Claude returned is_error=true: $result_msg; retrying fresh" >&2
        execute_claude "$__outvar" "$prompt_str" "$json_format_msg" "$processor_func" "$item_id" "$item_type" $((attempt+1)) "$max_retries" "" "$last_result_for_retry"
        return $?
    fi

    # Parse the result into a JSON string (no injection of sessionId)
    local result_type=$(echo "$claude_result" | jq -r '.result | type')
    local result_json
    if [ "$result_type" = "string" ]; then
        result_json=$(echo "$claude_result" | jq -r '.result')
    else
        result_json=$(echo "$claude_result" | jq -c '.result')
    fi

    # Update last_result_for_retry with the parsed/normalized result content
    last_result_for_retry="$result_json"

    # Validate result JSON; on failure, re-prompt with schema using resume (session_id)
    if ! echo "$result_json" | jq empty >/dev/null 2>&1; then
        local invalid_msg="Your response was invalid. Make sure your response is a valid JSON, without markdown or backticks, which follows this format:\n${json_format_msg}"
        log INFO "Result JSON invalid; requesting correction via session resume" >&2
        execute_claude "$__outvar" "$invalid_msg" "$json_format_msg" "$processor_func" "$item_id" "$item_type" $((attempt+1)) "$max_retries" "$session_id" "$last_result_for_retry"
        return $?
    fi

    # Invoke processor (performs GitHub operations). Processors must return: 0=success, 2=recoverable JSON error, 1=other error
    if ! declare -f "$processor_func" >/dev/null 2>&1; then
        log ERROR "Processor function not found: $processor_func" >&2
        return 1
    fi

    if $processor_func "$result_json" >/dev/null 2>&1; then
        # Success - return the top-level result for logging/inspection
        printf -v "${__outvar}" '%s' "$claude_result"
        return 0
    else
        local proc_rc=$?
        if [ $proc_rc -eq 2 ]; then
            local invalid_msg="Your response was invalid. Make sure your response is a valid JSON, without markdown or backticks, which follows this format:\n${json_format_msg}"
            log INFO "Processor reported recoverable JSON error; requesting correction via session resume" >&2
            execute_claude "$__outvar" "$invalid_msg" "$json_format_msg" "$processor_func" "$item_id" "$item_type" $((attempt+1)) "$max_retries" "$session_id" "$last_result_for_retry"
            return $?
        else
            log ERROR "Processor failed with non-recoverable error (rc=$proc_rc)" >&2
            return 1
        fi
    fi
}

# Wrapper retained for backward compatibility but should be superseded by direct execute_claude usage
# Usage: execute_claude_json OUTVAR action_file pr_id item_type [max_retries]
execute_claude_json() {
    local __outvar=$1
    local action_file=$2
    local pr_id=$3
    local item_type=${4:-"pr"}
    local max_retries=${5:-$MAX_CLAUDE_RETRIES}

    if [ ! -f "$action_file" ]; then
        log ERROR "Action file not found: $action_file" >&2
        return 1
    fi

    # Best-effort: choose processor and schema based on item_type and filename
    local prompt_str=$(cat "$action_file")
    local processor="process_fix_pr_result"
    local schema="${DEV_JSON_FORMAT:-"{}"}"
    case "$(basename "$action_file")" in
        review-pr.md)
            processor="process_review_pr_result"
            schema="${REVIEWER_JSON_FORMAT:-"{}"}"
            ;;
        validate-pr.md)
            processor="process_validate_pr_result"
            schema="${MERGER_JSON_FORMAT:-"{}"}"
            ;;
        test-pr.md)
            processor="process_test_result"
            schema="${TESTER_JSON_FORMAT:-"{}"}"
            ;;
        *)
            processor="process_fix_pr_result"
            schema="${DEV_JSON_FORMAT:-"{}"}"
            ;;
    esac

    execute_claude "$__outvar" "$prompt_str" "$schema" "$processor" "$pr_id" "$item_type" 1 "$max_retries" "" ""
    return $?
}

# Function to handle max retries reached
handle_claude_max_retries() {
    local pr_id=$1
    local last_error=$2
    local last_result=$3
    
    log ERROR "Max retries reached for PR #${pr_id}, adding needs-human label"
    
    # Post comment about the failure
    local comment="## 🚫 Claude Execution Failed - Human Intervention Required

**Agent:** ${AGENT_LABEL}
**Time:** $(date '+%Y-%m-%d %H:%M:%S')
**Status:** Failed after ${MAX_CLAUDE_RETRIES} attempts

### Last Error Output
\`\`\`
${last_error}
\`\`\`

### Last Claude Result (.result of last response)
\`\`\`
${last_result}
\`\`\`

### Agent Environment
- Agent ID: ${AGENT_ID}
- Agent Type: ${AGENT_TYPE}
- Max Retries: ${MAX_CLAUDE_RETRIES}

### Next Steps
A human needs to review and resolve this issue. The agent will continue with other work items.

---
*This is an automated message from ${AGENT_TYPE^^} Agent ${AGENT_ID}*"
    
    # Post comment and add needs-human label to PR
    gh pr comment "$pr_id" --body "$comment" 2>/dev/null || log WARNING "Failed to post comment to PR #${pr_id}"
    gh pr edit "$pr_id" --add-label "needs-human" 2>/dev/null || log WARNING "Failed to add needs-human label to PR #${pr_id}"
    
    log INFO "Posted failure comment and added needs-human label to PR #${pr_id}"
}
