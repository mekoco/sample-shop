#!/bin/bash
# github-utils.sh - Utility functions for GitHub operations

# Function to post a comment to a PR
post_pr_comment() {
    local pr_number=$1
    local comment_content=$2
    
    if [ -z "$pr_number" ] || [ -z "$comment_content" ]; then
        log ERROR "Missing required parameters for posting PR comment"
        return 1
    fi
    
    log INFO "Posting comment to PR #${pr_number}..."
    
    if gh pr comment "$pr_number" --body "$comment_content"; then
        log SUCCESS "Successfully posted comment to PR #${pr_number}"
        return 0
    else
        log ERROR "Failed to post comment to PR #${pr_number}"
        return 1
    fi
}

# Function to post a comment to an issue
post_issue_comment() {
    local issue_number=$1
    local comment_content=$2
    
    if [ -z "$issue_number" ] || [ -z "$comment_content" ]; then
        log ERROR "Missing required parameters for posting issue comment"
        return 1
    fi
    
    log INFO "Posting comment to issue #${issue_number}..."
    
    if gh issue comment "$issue_number" --body "$comment_content"; then
        log SUCCESS "Successfully posted comment to issue #${issue_number}"
        return 0
    else
        log ERROR "Failed to post comment to issue #${issue_number}"
        return 1
    fi
}

# Function to add labels to a PR
add_pr_labels() {
    local pr_number=$1
    shift
    local labels=("$@")
    
    if [ -z "$pr_number" ] || [ ${#labels[@]} -eq 0 ]; then
        log INFO "No labels to add to PR #${pr_number}"
        return 0
    fi
    
    log INFO "Adding labels to PR #${pr_number}: ${labels[*]}"
    
    for label in "${labels[@]}"; do
        if [ -n "$label" ]; then
            gh pr edit "$pr_number" --add-label "$label" || {
                log WARNING "Failed to add label '$label' to PR #${pr_number}"
            }
        fi
    done
    
    log SUCCESS "Finished adding labels to PR #${pr_number}"
    return 0
}

# Function to remove labels from a PR
remove_pr_labels() {
    local pr_number=$1
    shift
    local labels=("$@")
    
    if [ -z "$pr_number" ] || [ ${#labels[@]} -eq 0 ]; then
        log INFO "No labels to remove from PR #${pr_number}"
        return 0
    fi
    
    log INFO "Removing labels from PR #${pr_number}: ${labels[*]}"
    
    for label in "${labels[@]}"; do
        if [ -n "$label" ]; then
            gh pr edit "$pr_number" --remove-label "$label" || {
                log WARNING "Failed to remove label '$label' from PR #${pr_number}"
            }
        fi
    done
    
    log SUCCESS "Finished removing labels from PR #${pr_number}"
    return 0
}

# Function to add labels to an issue
add_issue_labels() {
    local issue_number=$1
    shift
    local labels=("$@")
    
    if [ -z "$issue_number" ] || [ ${#labels[@]} -eq 0 ]; then
        log INFO "No labels to add to issue #${issue_number}"
        return 0
    fi
    
    log INFO "Adding labels to issue #${issue_number}: ${labels[*]}"
    
    for label in "${labels[@]}"; do
        if [ -n "$label" ]; then
            gh issue edit "$issue_number" --add-label "$label" || {
                log WARNING "Failed to add label '$label' to issue #${issue_number}"
            }
        fi
    done
    
    log SUCCESS "Finished adding labels to issue #${issue_number}"
    return 0
}

# Function to remove labels from an issue
remove_issue_labels() {
    local issue_number=$1
    shift
    local labels=("$@")
    
    if [ -z "$issue_number" ] || [ ${#labels[@]} -eq 0 ]; then
        log INFO "No labels to remove from issue #${issue_number}"
        return 0
    fi
    
    log INFO "Removing labels from issue #${issue_number}: ${labels[*]}"
    
    for label in "${labels[@]}"; do
        if [ -n "$label" ]; then
            gh issue edit "$issue_number" --remove-label "$label" || {
                log WARNING "Failed to remove label '$label' from issue #${issue_number}"
            }
        fi
    done
    
    log SUCCESS "Finished removing labels from issue #${issue_number}"
    return 0
}

# Function to create a new PR from current branch
create_pr() {
    local pr_title=$1
    local pr_body=$2
    local base_branch=${3:-"main"}
    
    log INFO "Creating new PR..."
    
    # Get current branch
    local current_branch=$(git branch --show-current)
    
    if [ "$current_branch" = "$base_branch" ]; then
        log ERROR "Cannot create PR from base branch"
        return 1
    fi
    
    # Create PR and capture the PR number
    local pr_output=$(gh pr create --title "$pr_title" --body "$pr_body" --base "$base_branch" 2>&1)
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        # Extract PR number from output (usually in the URL)
        local pr_number=$(echo "$pr_output" | grep -oE '/pull/[0-9]+' | grep -oE '[0-9]+' | head -1)
        
        if [ -n "$pr_number" ]; then
            log SUCCESS "Created PR #${pr_number}"
            echo "$pr_number"
            return 0
        else
            log WARNING "PR created but could not extract PR number"
            echo "$pr_output"
            return 0
        fi
    else
        log ERROR "Failed to create PR: $pr_output"
        return 1
    fi
}

# Function to check if a PR exists for current branch
get_pr_for_branch() {
    local branch=${1:-$(git branch --show-current)}
    
    # Get PR number for the branch
    local pr_number=$(gh pr list --head "$branch" --json number --jq '.[0].number' 2>/dev/null)
    
    if [ -n "$pr_number" ]; then
        echo "$pr_number"
        return 0
    else
        return 1
    fi
}