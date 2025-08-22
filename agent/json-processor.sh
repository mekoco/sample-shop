#!/bin/bash
# json-processor.sh - Functions to process Claude JSON results for PR actions

# Source required utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/github-utils.sh"
source "${SCRIPT_DIR}/claude-utils.sh"

# JSON format expectations for each agent type
DEV_JSON_FORMAT='{
  "prComment": "string", // content of comment to be posted detailing your fix
  "prNumber": "number", // number of the PR you worked on
  "failed": "boolean" // whether the you failed to implement/fix the issue/PR due to (but not limited to) environment errors, invalid PR/issue, implementation difficulties. Cause of the fix/implementation failure must be detailed in prComment. In case of failure, a human will read the prComment and address issues manually
}'

REVIEWER_JSON_FORMAT='{
  "prComment": "string", // content of review comment to be posted to the PR
  "prNumber": "number", // number of the PR you worked on
  "isApproved": "boolean | \"minor-fixes\"", // "minor-fixes" means PR is approved but minor fixes are suggested
  "failed": "boolean" // whether the agent failed to review the PR due to (but not limited to) environment errors, invalid PR. Cause of the review failure must be detailed in prComment. In case of failure, a human will read the prComment and address issues manually
}'

TESTER_JSON_FORMAT='{
  "prComment": "string", // content of comment to be posted to the PR. The comment details the tests created or tell that no tests are needed for simple tasks. Explicitly state which are stubs in the tests that need to be implemented by the dev and which are mocks
  "prNumber": "number", // number of the PR you worked on. If was given an issue, this should be a newly created PR for the issue.
  "failed": "boolean" // whether the agent failed to create tests for the PR due to (but not limited to) environment errors, invalid PR/issue. Cause of the failure to craft tests must be detailed in prComment. In case of failure, a human will read the prComment and address issues manually
}'

MERGER_JSON_FORMAT='{
  "prComment": "string", // content of comment to be posted to the PR. The comment details whether the comment is approved for merging. In case of issues with the PR that would make it ineligible for merging, detail it in the comment, such as failing tests, linting etc.
  "prNumber": "number", // number of the PR you worked on
  "failed": "boolean" // whether the agent failed to validate the merge-ability of the PR due to (but not limited to) environment errors, invalid PR/issue. Cause of the failure to validate the merge-ability of the PR must be detailed in prComment. In case of failure, a human will read the prComment and address issues manually
}'

# Process result for fix-pr actions (Dev agent)
process_fix_pr_result() {
    local result=$1

    log INFO "Processing Dev agent result for PR..."

    if ! echo "$result" | jq empty >/dev/null 2>&1; then
        log ERROR "Invalid JSON format in result"
        return 2
    fi

    local pr_comment=$(echo "$result" | jq -r '.prComment // ""')
    local pr_number=$(echo "$result" | jq -r '.prNumber // ""')
    local failed=$(echo "$result" | jq -r '.failed // false')

    if [ -z "$pr_number" ] || [ "$pr_number" = "null" ]; then
        log ERROR "Missing required field: prNumber"
        return 2
    fi
    if [ -z "$pr_comment" ] || [ "$pr_comment" = "null" ]; then
        log ERROR "Missing required field: prComment"
        return 2
    fi
    if [ "$failed" != "true" ] && [ "$failed" != "false" ]; then
        log ERROR "Invalid or missing 'failed' field; must be boolean"
        return 2
    fi

    log INFO "Processing Dev agent PR #${pr_number}"

    post_pr_comment "$pr_number" "$pr_comment"

    if [ "$failed" = "true" ]; then
        add_pr_labels "$pr_number" "needs-human"
    else
        remove_pr_labels "$pr_number" "needs-dev"
        local pr_labels=$(gh pr view "$pr_number" --json labels -q '.labels[].name' 2>/dev/null || echo "")
        local has_needs_merge=false
        while IFS= read -r label; do
            if [ "$label" = "needs-merge" ]; then
                has_needs_merge=true
                break
            fi
        done <<< "$pr_labels"
        if [ "$has_needs_merge" = "false" ]; then
            add_pr_labels "$pr_number" "needs-reviewer"
        fi
    fi

    log SUCCESS "Successfully processed Dev agent PR #${pr_number}"
    return 0
}

# Process result for review-pr action (Reviewer agent)
process_review_pr_result() {
    local result=$1

    log INFO "Processing Reviewer agent result..."

    if ! echo "$result" | jq empty >/dev/null 2>&1; then
        log ERROR "Invalid JSON format in result"
        return 2
    fi

    local pr_comment=$(echo "$result" | jq -r '.prComment // ""')
    local pr_number=$(echo "$result" | jq -r '.prNumber // ""')
    local is_approved=$(echo "$result" | jq -r '.isApproved // false')
    local failed=$(echo "$result" | jq -r '.failed // false')

    if [ -z "$pr_number" ] || [ "$pr_number" = "null" ]; then
        log ERROR "Missing required field: prNumber"
        return 2
    fi
    if [ -z "$pr_comment" ] || [ "$pr_comment" = "null" ]; then
        log ERROR "Missing required field: prComment"
        return 2
    fi
    if [ "$is_approved" != "true" ] && [ "$is_approved" != "false" ] && [ "$is_approved" != "minor-fixes" ]; then
        log ERROR "Invalid isApproved field; must be true, false, or minor-fixes"
        return 2
    fi
    if [ "$failed" != "true" ] && [ "$failed" != "false" ]; then
        log ERROR "Invalid or missing 'failed' field; must be boolean"
        return 2
    fi

    log INFO "Processing review for PR #${pr_number}"

    post_pr_comment "$pr_number" "$pr_comment"

    if [ "$failed" = "true" ]; then
        add_pr_labels "$pr_number" "needs-human"
    else
        if [ "$is_approved" = "false" ]; then
            remove_pr_labels "$pr_number" "needs-review"
            add_pr_labels "$pr_number" "needs-dev"
        elif [ "$is_approved" = "minor-fixes" ]; then
            remove_pr_labels "$pr_number" "needs-review"
            add_pr_labels "$pr_number" "needs-dev" "needs-merge"
        else
            remove_pr_labels "$pr_number" "needs-review"
            add_pr_labels "$pr_number" "needs-merge"
        fi
    fi

    log SUCCESS "Successfully processed review for PR #${pr_number}"
    return 0
}

# Process result for validate-pr action (Merger agent)
process_validate_pr_result() {
    local result=$1

    log INFO "Processing Merger agent result..."

    if ! echo "$result" | jq empty >/dev/null 2>&1; then
        log ERROR "Invalid JSON format in result"
        return 2
    fi

    local pr_comment=$(echo "$result" | jq -r '.prComment // ""')
    local pr_number=$(echo "$result" | jq -r '.prNumber // ""')
    local failed=$(echo "$result" | jq -r '.failed // false')

    if [ -z "$pr_number" ] || [ "$pr_number" = "null" ]; then
        log ERROR "Missing required field: prNumber"
        return 2
    fi
    if [ -z "$pr_comment" ] || [ "$pr_comment" = "null" ]; then
        log ERROR "Missing required field: prComment"
        return 2
    fi
    if [ "$failed" != "true" ] && [ "$failed" != "false" ]; then
        log ERROR "Invalid or missing 'failed' field; must be boolean"
        return 2
    fi

    log INFO "Processing validation for PR #${pr_number}"

    post_pr_comment "$pr_number" "$pr_comment"

    if [ "$failed" = "true" ]; then
        add_pr_labels "$pr_number" "needs-human"
    else
        remove_pr_labels "$pr_number" "needs-merge"
        add_pr_labels "$pr_number" "can-merge"
    fi

    log SUCCESS "Successfully processed validation for PR #${pr_number}"
    return 0
}

# Process result for test actions (Tester agent)
process_test_result() {
    local result=$1

    log INFO "Processing Tester agent result for PR..."

    if ! echo "$result" | jq empty >/dev/null 2>&1; then
        log ERROR "Invalid JSON format in result"
        return 2
    fi

    local pr_comment=$(echo "$result" | jq -r '.prComment // ""')
    local pr_number=$(echo "$result" | jq -r '.prNumber // ""')
    local failed=$(echo "$result" | jq -r '.failed // false')

    if [ -z "$pr_number" ] || [ "$pr_number" = "null" ]; then
        log ERROR "Missing required field: prNumber"
        return 2
    fi
    if [ -z "$pr_comment" ] || [ "$pr_comment" = "null" ]; then
        log ERROR "Missing required field: prComment"
        return 2
    fi
    if [ "$failed" != "true" ] && [ "$failed" != "false" ]; then
        log ERROR "Invalid or missing 'failed' field; must be boolean"
        return 2
    fi

    log INFO "Processing test results for PR #${pr_number}"

    post_pr_comment "$pr_number" "$pr_comment"

    if [ "$failed" = "true" ]; then
        add_pr_labels "$pr_number" "needs-human"
    else
        remove_pr_labels "$pr_number" "needs-test"
        add_pr_labels "$pr_number" "needs-dev"
    fi

    log SUCCESS "Successfully processed test results for PR #${pr_number}"
    return 0
}