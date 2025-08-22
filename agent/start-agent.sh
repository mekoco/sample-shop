#!/bin/bash
# start-agent.sh - Unified orchestration script for all agent types
# Runs in the agent's root directory and manages GitHub issues/PRs based on agent type

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Source shared logging
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/agent-common-functions.sh"

# Load agent configuration
if [ ! -f "${SCRIPT_DIR}/agent-config.sh" ]; then
    log ERROR "agent-config.sh not found in: ${SCRIPT_DIR}"
    log ERROR "Please ensure the agent was properly set up"
    exit 1
fi

# Source the agent configuration (already contains AGENT_ID and AGENT_TYPE)
source "${SCRIPT_DIR}/agent-config.sh"

# Source utility scripts for JSON processing
source "${SCRIPT_DIR}/claude-utils.sh"
source "${SCRIPT_DIR}/json-processor.sh"

# Validate that required variables are set from agent-config.sh
if [ -z "$AGENT_ID" ] || [ -z "$AGENT_TYPE" ]; then
    log ERROR "Required configuration not found in agent-config.sh"
    log ERROR "AGENT_ID: ${AGENT_ID:-not set}"
    log ERROR "AGENT_TYPE: ${AGENT_TYPE:-not set}"
    exit 1
fi

# Set ACTION_FILES_DIR based on agent root directory
export ACTION_FILES_DIR="${AGENT_ROOT_DIR}/agent/action-files"
if [ ! -d "$ACTION_FILES_DIR" ]; then
    log ERROR "Action files directory not found: $ACTION_FILES_DIR"
    log ERROR "Please ensure the agent was properly set up with action files"
    exit 1
fi

# Validate agent type
if [[ ! "$AGENT_TYPE" =~ ^(dev|reviewer|merger|tester)$ ]]; then
    log ERROR "Invalid AGENT_TYPE: $AGENT_TYPE. Must be one of: dev, reviewer, merger, tester"
    exit 1
fi

# Execute reset-env.sh if it exists in the agent's directory
RESET_ENV_SCRIPT="${AGENT_ROOT_DIR}/agent-scripts/reset-env.sh"
if [ ! -f "$RESET_ENV_SCRIPT" ]; then
    log ERROR "Reset environment script not found: $RESET_ENV_SCRIPT"
    log ERROR "Please create the agent-scripts/reset-env.sh script in the agent directory"
    exit 1
fi

log INFO "Executing reset environment script..."
if ! bash "$RESET_ENV_SCRIPT"; then
    log ERROR "Failed to execute reset environment script"
    exit 1
fi
log SUCCESS "Reset environment script executed successfully"

# Register the agent in the registry
REGISTRY_FILE="${SCRIPT_DIR}/../config/agent-registry.json"
if [ -f "$REGISTRY_FILE" ]; then
    # Check if agent is already registered
    if ! jq -e ".agents[] | select(.id == ${AGENT_ID} and .type == \"${AGENT_TYPE}\")" "$REGISTRY_FILE" >/dev/null 2>&1; then
        # Add agent to registry
        jq ".agents += [{\"id\": ${AGENT_ID}, \"type\": \"${AGENT_TYPE}\", \"status\": \"running\", \"started_at\": \"$(date -Iseconds)\"}] | .last_updated = \"$(date -Iseconds)\"" "$REGISTRY_FILE" > "${REGISTRY_FILE}.tmp" && mv "${REGISTRY_FILE}.tmp" "$REGISTRY_FILE"
        log SUCCESS "Agent registered in registry"
    else
        # Update existing registration
        jq "(.agents[] | select(.id == ${AGENT_ID} and .type == \"${AGENT_TYPE}\") | .status) = \"running\" | .last_updated = \"$(date -Iseconds)\"" "$REGISTRY_FILE" > "${REGISTRY_FILE}.tmp" && mv "${REGISTRY_FILE}.tmp" "$REGISTRY_FILE"
        log INFO "Agent registration updated"
    fi
fi

log INFO "Starting ${AGENT_TYPE^^} Agent ${AGENT_ID}"
log INFO "Agent Label: ${AGENT_LABEL}"

# Function to check if an issue/PR is already claimed by another agent
is_claimed_by_other() {
    local issue_number=$1
    local labels=$(gh pr view $issue_number --json labels --jq '.labels[].name' 2>/dev/null || gh issue view $issue_number --json labels --jq '.labels[].name' 2>/dev/null)
    
    # Check for other agent labels of the same type
    echo "$labels" | grep -E "^agent-${AGENT_TYPE}:[0-9]+$" | grep -v "^${AGENT_LABEL}$" | head -1
}

# Function to claim an issue/PR
claim_work() {
    local issue_number=$1
    local is_pr=$2
    
    log INFO "Claiming work item #${issue_number}..."
    
    # Add agent label to claim the work
    if [ "$is_pr" = "true" ]; then
        gh pr edit $issue_number --add-label "${AGENT_LABEL}" || {
            log ERROR "Failed to add label to PR #${issue_number}"
            return 1
        }
    else
        gh issue edit $issue_number --add-label "${AGENT_LABEL}" || {
            log ERROR "Failed to add label to issue #${issue_number}"
            return 1
        }
    fi
    
    log SUCCESS "Successfully claimed work item #${issue_number} with label ${AGENT_LABEL}"
    return 0
}


# Generic function to execute claude with an action file and JSON output
execute_claude_action() {
    local action_name=$1
    local item_id=$2
    local item_type=$3  # "issue" or "pr"
    local is_pr=$([ "$item_type" = "pr" ] && echo "true" || echo "false")
    
    log INFO "Attempting to use action file: ${action_name}.md for ${item_type} #${item_id}"
    
    # Prepare the action file with template replacements
    local action_file=$(prepare_action_file "$action_name" "$item_id" 2>&1)
    local prepare_exit_code=$?
    
    if [ $prepare_exit_code -ne 0 ]; then
        log ERROR "Failed to prepare action file for ${action_name}"
        log ERROR "prepare_action_file output: ${action_file}"
        handle_blocked $item_id $is_pr "Failed to prepare action file: ${action_name}.md - ${action_file}"
        return 1
    fi
    
    if [ -z "$action_file" ] || [ ! -f "$action_file" ]; then
        log ERROR "Action file preparation returned invalid file: '${action_file}'"
        handle_blocked $item_id $is_pr "Invalid action file returned from preparation: ${action_file}"
        return 1
    fi
    
    log INFO "Successfully prepared action file: ${action_file}"
    
    # Execute Claude with new unified flow (pass prompt string, schema, and processor)
    local prompt_str
    prompt_str=$(cat "$action_file")
    local claude_result
    local session_id
    local processor
    local schema
    case $action_name in
        fix-issue|fix-pr)
            processor="process_fix_pr_result"
            schema="$DEV_JSON_FORMAT"
            ;;
        review-pr)
            processor="process_review_pr_result"
            schema="$REVIEWER_JSON_FORMAT"
            ;;
        validate-pr)
            processor="process_validate_pr_result"
            schema="$MERGER_JSON_FORMAT"
            ;;
        test-pr|test-issue)
            processor="process_test_result"
            schema="$TESTER_JSON_FORMAT"
            ;;
        *)
            log WARNING "Unknown action type: $action_name"
            rm -f "$action_file"
            return 1
            ;;
    esac
    
    if ! execute_claude claude_result "$prompt_str" "$schema" "$processor" "$item_id" "$item_type" 1 "$MAX_CLAUDE_RETRIES" ""; then
        local exit_code=$?
        rm -f "$action_file"
        if [ $exit_code -eq 2 ]; then
            log INFO "Max retries reached for ${item_type} #${item_id}, continuing with next item"
            return 2
        else
            log ERROR "Claude failed to complete ${item_type} #${item_id}"
            handle_blocked $item_id $is_pr "Claude execution failed for action: ${action_name}"
            return 1
        fi
    fi
    
    # Clean up the temporary action file
    rm -f "$action_file"
    
    log SUCCESS "Claude completed work on ${item_type} #${item_id}" 
    return 0
}


# Function to prepare action file with template replacements
prepare_action_file() {
    local action_name=$1
    local issue_number=$2
    
    # Check if ACTION_FILES_DIR is set
    if [ -z "$ACTION_FILES_DIR" ]; then
        log ERROR "ACTION_FILES_DIR is not set - cannot prepare action file"
        echo "ACTION_FILES_DIR not configured"
        return 1
    fi
    
    local action_file="${ACTION_FILES_DIR}/${action_name}.md"
    local temp_file=$(mktemp)
    
    if [ ! -f "$action_file" ]; then
        log ERROR "Action file not found: $action_file"
        log ERROR "ACTION_FILES_DIR: ${ACTION_FILES_DIR}"
        log ERROR "Looking for: ${action_name}.md"
        echo "Action file not found: ${action_file}"
        return 1
    fi
    
    # Replace template variables
    if ! sed -e "s/\${issue_number}/${issue_number}/g" \
             -e "s/\${agent_type}/${AGENT_TYPE}/g" \
             -e "s/\${agent_id}/${AGENT_ID}/g" \
             "$action_file" > "$temp_file"; then
        log ERROR "Failed to process action file template: $action_file"
        rm -f "$temp_file"
        echo "Failed to process template"
        return 1
    fi
    
    echo "$temp_file"
    return 0
}

# Function to handle blocking situations
handle_blocked() {
    local issue_number=$1
    local is_pr=$2
    local error_message=$3
    
    log ERROR "Agent blocked on work item #${issue_number}: ${error_message}"
    
    # Post detailed comment about the blocking issue
    local comment="## 🚫 ${AGENT_TYPE^^} Agent ${AGENT_ID} Blocked

**Agent:** ${AGENT_LABEL}
**Time:** $(date '+%Y-%m-%d %H:%M:%S')
**Status:** Blocked - requires human intervention

### Error Details
${error_message}

### Agent Environment
- Agent ID: ${AGENT_ID}
- Agent Type: ${AGENT_TYPE}

### Next Steps
A human needs to review and resolve this blocking issue before the agent can continue.

---
*This is an automated message from ${AGENT_TYPE^^} Agent ${AGENT_ID}*"
    
    if [ "$is_pr" = "true" ]; then
        gh pr comment $issue_number --body "$comment"
        gh pr edit $issue_number --add-label "needs-human"
    else
        gh issue comment $issue_number --body "$comment"
        gh issue edit $issue_number --add-label "needs-human"
    fi
    
    log INFO "Posted blocking comment and added needs-human label to #${issue_number}"
}

# Main orchestration loop based on agent type
case $AGENT_TYPE in
    dev)
        # DEV Agent - handles issues and PRs that need development
        log INFO "Entering DEV agent orchestration loop..."
        
        while true; do
            log INFO "[Orchestrator] Fetching issues/PRs with 'needs-dev' label..."
            
            # Get all issues with needs-dev label
            ISSUES_JSON=$(gh issue list --label "needs-dev" --state open --json number,title,body,url,createdAt,labels --limit 20 2>/dev/null || echo "[]")
            
            # Get all PRs with needs-dev label
            PRS_JSON=$(gh pr list --label "needs-dev" --state open --json number,title,body,url,createdAt,labels --limit 20 2>/dev/null || echo "[]")
            
            # Combine and sort by creation date (FIFO)
            # Process issues and PRs separately, then combine
            ISSUES_WITH_TYPE=$(echo "$ISSUES_JSON" | jq 'map(. + {type: "issue"})')
            PRS_WITH_TYPE=$(echo "$PRS_JSON" | jq 'map(. + {type: "pr"})')
            ALL_ITEMS=$(jq -n --argjson issues "$ISSUES_WITH_TYPE" --argjson prs "$PRS_WITH_TYPE" '$issues + $prs | sort_by(.createdAt)')
            
            ITEM_COUNT=$(echo "$ALL_ITEMS" | jq '. | length')
            
            if [ "$ITEM_COUNT" -eq "0" ]; then
                log INFO "[Orchestrator] No items with needs-dev label found. Waiting 60 seconds..."
                sleep 60
                continue
            fi
            
            log INFO "[Orchestrator] Found ${ITEM_COUNT} items with needs-dev label"
            
            # Find first unclaimed item
            SELECTED_ITEM=""
            for i in $(seq 0 $((ITEM_COUNT - 1))); do
                ITEM=$(echo "$ALL_ITEMS" | jq -r ".[$i]")
                ITEM_NUMBER=$(echo "$ITEM" | jq -r '.number')
                ITEM_TYPE=$(echo "$ITEM" | jq -r '.type')
                
                # Check if already claimed by another agent
                OTHER_AGENT=$(is_claimed_by_other $ITEM_NUMBER)
                
                if [ -z "$OTHER_AGENT" ]; then
                    # Check if we already own it
                    OUR_LABEL=$(echo "$ITEM" | jq -r '.labels[].name' | grep "^${AGENT_LABEL}$" || true)
                    
                    if [ -z "$OUR_LABEL" ]; then
                        log INFO "Found unclaimed ${ITEM_TYPE} #${ITEM_NUMBER}"
                    else
                        log INFO "Resuming work on ${ITEM_TYPE} #${ITEM_NUMBER} (already claimed by us)"
                    fi
                    
                    SELECTED_ITEM="$ITEM"
                    break
                else
                    log INFO "Skipping ${ITEM_TYPE} #${ITEM_NUMBER} (claimed by ${OTHER_AGENT})"
                fi
            done
            
            if [ -z "$SELECTED_ITEM" ]; then
                log INFO "[Orchestrator] All items are claimed by other agents. Waiting 60 seconds..."
                sleep 60
                continue
            fi
            
            # Extract item details
            ISSUE_ID=$(echo "$SELECTED_ITEM" | jq -r '.number')
            ISSUE_TITLE=$(echo "$SELECTED_ITEM" | jq -r '.title')
            ISSUE_TYPE=$(echo "$SELECTED_ITEM" | jq -r '.type')
            IS_PR=$([ "$ISSUE_TYPE" = "pr" ] && echo "true" || echo "false")
            
            log INFO "[Orchestrator] Selected ${ISSUE_TYPE} #${ISSUE_ID}: ${ISSUE_TITLE}"
            
            # Claim the work item if not already claimed by us
            OUR_LABEL=$(echo "$SELECTED_ITEM" | jq -r '.labels[].name' | grep "^${AGENT_LABEL}$" || true)
            if [ -z "$OUR_LABEL" ]; then
                if ! claim_work $ISSUE_ID $IS_PR; then
                    log ERROR "Failed to claim ${ISSUE_TYPE} #${ISSUE_ID}, skipping..."
                    sleep 10
                    continue
                fi
            fi
            
            # Prepare action file based on type
            if [ "$IS_PR" = "true" ]; then
                ACTION_NAME="fix-pr"
            else
                ACTION_NAME="fix-issue"
            fi
            
            # Execute claude action
            execute_claude_action "$ACTION_NAME" "$ISSUE_ID" "$ISSUE_TYPE"
            local exec_result=$?
            
            if [ $exec_result -eq 0 ]; then
                # Labels are handled by the process_fix_pr_result function based on JSON
                log SUCCESS "[Orchestrator] DEV Agent ${AGENT_ID} completed ${ISSUE_TYPE} #${ISSUE_ID}"
            elif [ $exec_result -eq 2 ]; then
                # Max retries reached, continue with next item
                log INFO "Continuing to next item after max retries on ${ISSUE_TYPE} #${ISSUE_ID}"
                sleep 10
                continue
            else
                # Error already handled by execute_claude_action
                sleep 10
                continue
            fi
            
            # Brief pause before next iteration
            log INFO "Waiting 10 seconds before checking for next work item..."
            sleep 10
        done
        ;;
        
    reviewer)
        # REVIEWER Agent - reviews PRs that need review
        log INFO "Entering REVIEWER agent orchestration loop..."
        
        while true; do
            log INFO "[Orchestrator] Fetching PRs with 'needs-review' label..."
            
            # Get all PRs with needs-review label
            PRS_JSON=$(gh pr list --label "needs-review" --state open --json number,title,body,url,createdAt,labels --limit 20 2>/dev/null || echo "[]")
            
            PR_COUNT=$(echo "$PRS_JSON" | jq '. | length')
            
            if [ "$PR_COUNT" -eq "0" ]; then
                log INFO "[Orchestrator] No PRs with needs-review label found. Waiting 60 seconds..."
                sleep 60
                continue
            fi
            
            log INFO "[Orchestrator] Found ${PR_COUNT} PRs with needs-review label"
            
            # Find first unclaimed PR
            SELECTED_PR=""
            for i in $(seq 0 $((PR_COUNT - 1))); do
                PR=$(echo "$PRS_JSON" | jq -r ".[$i]")
                PR_NUMBER=$(echo "$PR" | jq -r '.number')
                
                # Check if already claimed by another reviewer
                OTHER_AGENT=$(is_claimed_by_other $PR_NUMBER)
                
                if [ -z "$OTHER_AGENT" ]; then
                    # Check if we already own it
                    OUR_LABEL=$(echo "$PR" | jq -r '.labels[].name' | grep "^${AGENT_LABEL}$" || true)
                    
                    if [ -z "$OUR_LABEL" ]; then
                        log INFO "Found unclaimed PR #${PR_NUMBER}"
                    else
                        log INFO "Resuming review of PR #${PR_NUMBER} (already claimed by us)"
                    fi
                    
                    SELECTED_PR="$PR"
                    break
                else
                    log INFO "Skipping PR #${PR_NUMBER} (claimed by ${OTHER_AGENT})"
                fi
            done
            
            if [ -z "$SELECTED_PR" ]; then
                log INFO "[Orchestrator] All PRs are claimed by other reviewers. Waiting 60 seconds..."
                sleep 60
                continue
            fi
            
            # Extract PR details
            PR_ID=$(echo "$SELECTED_PR" | jq -r '.number')
            PR_TITLE=$(echo "$SELECTED_PR" | jq -r '.title')
            
            log INFO "[Orchestrator] Selected PR #${PR_ID}: ${PR_TITLE}"
            
            # Claim the PR if not already claimed by us
            OUR_LABEL=$(echo "$SELECTED_PR" | jq -r '.labels[].name' | grep "^${AGENT_LABEL}$" || true)
            if [ -z "$OUR_LABEL" ]; then
                if ! claim_work $PR_ID "true"; then
                    log ERROR "Failed to claim PR #${PR_ID}, skipping..."
                    sleep 10
                    continue
                fi
            fi
            
            # Execute claude review action
            execute_claude_action "review-pr" "$PR_ID" "pr"
            local exec_result=$?
            
            if [ $exec_result -eq 0 ]; then
                # Labels are handled by the process_review_pr_result function based on JSON
                log SUCCESS "[Orchestrator] REVIEWER Agent ${AGENT_ID} completed review of PR #${PR_ID}"
            elif [ $exec_result -eq 2 ]; then
                # Max retries reached, continue with next item
                log INFO "Continuing to next PR after max retries on PR #${PR_ID}"
                sleep 10
                continue
            else
                # Error already handled by execute_claude_action
                sleep 10
                continue
            fi
            
            # Brief pause before next iteration
            log INFO "Waiting 10 seconds before checking for next PR to review..."
            sleep 10
        done
        ;;
        
    tester)
        # TESTER Agent - runs comprehensive tests on issues and PRs
        log INFO "Entering TESTER agent orchestration loop..."
        
        while true; do
            log INFO "[Orchestrator] Fetching issues/PRs with 'needs-tests' label..."
            
            # Get all issues with needs-tests label
            ISSUES_JSON=$(gh issue list --label "needs-tests" --state open --json number,title,body,url,createdAt,labels --limit 20 2>/dev/null || echo "[]")
            
            # Get all PRs with needs-tests label
            PRS_JSON=$(gh pr list --label "needs-tests" --state open --json number,title,body,url,createdAt,labels --limit 20 2>/dev/null || echo "[]")
            
            # Combine and sort by creation date (FIFO)
            ISSUES_WITH_TYPE=$(echo "$ISSUES_JSON" | jq 'map(. + {type: "issue"})')
            PRS_WITH_TYPE=$(echo "$PRS_JSON" | jq 'map(. + {type: "pr"})')
            ALL_ITEMS=$(jq -n --argjson issues "$ISSUES_WITH_TYPE" --argjson prs "$PRS_WITH_TYPE" '$issues + $prs | sort_by(.createdAt)')
            
            ITEM_COUNT=$(echo "$ALL_ITEMS" | jq '. | length')
            
            if [ "$ITEM_COUNT" -eq "0" ]; then
                log INFO "[Orchestrator] No items with needs-tests label found. Waiting 60 seconds..."
                sleep 60
                continue
            fi
            
            log INFO "[Orchestrator] Found ${ITEM_COUNT} items with needs-tests label"
            
            # Find first unclaimed item
            SELECTED_ITEM=""
            for i in $(seq 0 $((ITEM_COUNT - 1))); do
                ITEM=$(echo "$ALL_ITEMS" | jq -r ".[$i]")
                ITEM_NUMBER=$(echo "$ITEM" | jq -r '.number')
                ITEM_TYPE=$(echo "$ITEM" | jq -r '.type')
                
                # Check if already claimed by another agent
                OTHER_AGENT=$(is_claimed_by_other $ITEM_NUMBER)
                
                if [ -z "$OTHER_AGENT" ]; then
                    # Check if we already own it
                    OUR_LABEL=$(echo "$ITEM" | jq -r '.labels[].name' | grep "^${AGENT_LABEL}$" || true)
                    
                    if [ -z "$OUR_LABEL" ]; then
                        log INFO "Found unclaimed ${ITEM_TYPE} #${ITEM_NUMBER}"
                    else
                        log INFO "Resuming testing of ${ITEM_TYPE} #${ITEM_NUMBER} (already claimed by us)"
                    fi
                    
                    SELECTED_ITEM="$ITEM"
                    break
                else
                    log INFO "Skipping ${ITEM_TYPE} #${ITEM_NUMBER} (claimed by ${OTHER_AGENT})"
                fi
            done
            
            if [ -z "$SELECTED_ITEM" ]; then
                log INFO "[Orchestrator] All items are claimed by other agents. Waiting 60 seconds..."
                sleep 60
                continue
            fi
            
            # Extract item details
            ITEM_ID=$(echo "$SELECTED_ITEM" | jq -r '.number')
            ITEM_TITLE=$(echo "$SELECTED_ITEM" | jq -r '.title')
            ITEM_TYPE=$(echo "$SELECTED_ITEM" | jq -r '.type')
            IS_PR=$([ "$ITEM_TYPE" = "pr" ] && echo "true" || echo "false")
            
            log INFO "[Orchestrator] Selected ${ITEM_TYPE} #${ITEM_ID}: ${ITEM_TITLE}"
            
            # Claim the work item if not already claimed by us
            OUR_LABEL=$(echo "$SELECTED_ITEM" | jq -r '.labels[].name' | grep "^${AGENT_LABEL}$" || true)
            if [ -z "$OUR_LABEL" ]; then
                if ! claim_work $ITEM_ID $IS_PR; then
                    log ERROR "Failed to claim ${ITEM_TYPE} #${ITEM_ID}, skipping..."
                    sleep 10
                    continue
                fi
            fi
            
            # Prepare action file based on type
            if [ "$IS_PR" = "true" ]; then
                ACTION_NAME="test-pr"
            else
                ACTION_NAME="test-issue"
            fi
            
            # Execute claude test action
            execute_claude_action "$ACTION_NAME" "$ITEM_ID" "$ITEM_TYPE"
            local exec_result=$?
            
            if [ $exec_result -eq 0 ]; then
                # Labels are handled by the process_test_result function based on JSON
                log SUCCESS "[Orchestrator] TESTER Agent ${AGENT_ID} completed testing of ${ITEM_TYPE} #${ITEM_ID}"
            elif [ $exec_result -eq 2 ]; then
                # Max retries reached, continue with next item
                log INFO "Continuing to next item after max retries on ${ITEM_TYPE} #${ITEM_ID}"
                sleep 10
                continue
            else
                # Error already handled by execute_claude_action
                sleep 10
                continue
            fi
            
            # Brief pause before next iteration
            log INFO "Waiting 10 seconds before checking for next item to test..."
            sleep 10
        done
        ;;
        
    merger)
        # MERGER Agent - validates PRs for merging
        log INFO "Entering MERGER agent orchestration loop..."
        
        while true; do
            log INFO "[Orchestrator] Fetching PRs with 'needs-merge' label..."
            
            # Get all PRs with needs-merge label
            PRS_JSON=$(gh pr list --label "needs-merge" --state open --json number,title,body,url,createdAt,labels,mergeable --limit 20 2>/dev/null || echo "[]")
            
            PR_COUNT=$(echo "$PRS_JSON" | jq '. | length')
            
            if [ "$PR_COUNT" -eq "0" ]; then
                log INFO "[Orchestrator] No PRs with needs-merge label found. Waiting 60 seconds..."
                sleep 60
                continue
            fi
            
            log INFO "[Orchestrator] Found ${PR_COUNT} PRs with needs-merge label"
            
            # Find first unclaimed PR
            SELECTED_PR=""
            for i in $(seq 0 $((PR_COUNT - 1))); do
                PR=$(echo "$PRS_JSON" | jq -r ".[$i]")
                PR_NUMBER=$(echo "$PR" | jq -r '.number')
                PR_MERGEABLE=$(echo "$PR" | jq -r '.mergeable')
                
                # Check if PR is mergeable
                if [ "$PR_MERGEABLE" != "MERGEABLE" ] && [ "$PR_MERGEABLE" != "null" ]; then
                    log WARNING "PR #${PR_NUMBER} is not mergeable (status: ${PR_MERGEABLE}), skipping..."
                    continue
                fi
                
                # Check if already claimed by another merger
                OTHER_AGENT=$(is_claimed_by_other $PR_NUMBER)
                
                if [ -z "$OTHER_AGENT" ]; then
                    # Check if we already own it
                    OUR_LABEL=$(echo "$PR" | jq -r '.labels[].name' | grep "^${AGENT_LABEL}$" || true)
                    
                    if [ -z "$OUR_LABEL" ]; then
                        log INFO "Found unclaimed PR #${PR_NUMBER}"
                    else
                        log INFO "Resuming validation of PR #${PR_NUMBER} (already claimed by us)"
                    fi
                    
                    SELECTED_PR="$PR"
                    break
                else
                    log INFO "Skipping PR #${PR_NUMBER} (claimed by ${OTHER_AGENT})"
                fi
            done
            
            if [ -z "$SELECTED_PR" ]; then
                log INFO "[Orchestrator] All PRs are claimed by other mergers. Waiting 60 seconds..."
                sleep 60
                continue
            fi
            
            # Extract PR details
            PR_ID=$(echo "$SELECTED_PR" | jq -r '.number')
            PR_TITLE=$(echo "$SELECTED_PR" | jq -r '.title')
            
            log INFO "[Orchestrator] Selected PR #${PR_ID}: ${PR_TITLE}"
            
            # Claim the PR if not already claimed by us
            OUR_LABEL=$(echo "$SELECTED_PR" | jq -r '.labels[].name' | grep "^${AGENT_LABEL}$" || true)
            if [ -z "$OUR_LABEL" ]; then
                if ! claim_work $PR_ID "true"; then
                    log ERROR "Failed to claim PR #${PR_ID}, skipping..."
                    sleep 10
                    continue
                fi
            fi
            
            # Execute claude validation action
            execute_claude_action "validate-pr" "$PR_ID" "pr"
            local exec_result=$?
            
            if [ $exec_result -eq 0 ]; then
                # Labels are handled by the process_validate_pr_result function based on JSON
                log SUCCESS "[Orchestrator] MERGER Agent ${AGENT_ID} completed validation of PR #${PR_ID}"
            elif [ $exec_result -eq 2 ]; then
                # Max retries reached, continue with next item
                log INFO "Continuing to next PR after max retries on PR #${PR_ID}"
                sleep 10
                continue
            else
                # Error already handled by execute_claude_action
                sleep 10
                continue
            fi
            
            # Brief pause before next iteration
            log INFO "Waiting 10 seconds before checking for next PR to validate..."
            sleep 10
        done
        ;;
        
    *)
        log ERROR "Unknown agent type: $AGENT_TYPE"
        exit 1
        ;;
esac