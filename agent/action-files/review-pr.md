I'll review GitHub PR #${issue_number} as a ${agent_type} agent (ID: ${agent_id}) following these steps:

1. Fetch and analyze the PR details:
   - Run `gh pr view ${issue_number} --json title,body,commits,files,reviews,comments`
   - Understand the purpose and scope of changes
   - Check PR description for completeness

2. Checkout the PR branch for local review:
   - Run `gh pr checkout ${issue_number}`
   - Verify branch with `git status`

3. Review the code changes:
   - Examine modified files: `gh pr diff ${issue_number}`
   - Check for code quality and style consistency
   - Verify adherence to project conventions
   - Look for potential bugs or edge cases
   - Assess performance implications
   - Review security considerations

4. Test the changes locally:
   - Run backend tests: `cd backend && npm test`
   - Run frontend tests if applicable
   - Ensure all tests pass

5. Run lint and type checks:
   - Execute `npm run lint` to check for style issues
   - Execute `npm run typecheck` to verify type safety

6. If significant changes, test with containers:
   - Build containers: `docker compose build`
   - Run basic e2e tests: `cd frontend && npm run test:e2e:basic`
   - Check for runtime errors

7. Document review findings:
   - List any critical issues found
   - Note minor improvements needed
   - Highlight good practices observed

8. Determine review outcome:
   - APPROVE if changes are good and tests pass
   - REQUEST CHANGES if issues need to be fixed
   - COMMENT if clarification is needed

9. Post review on GitHub:
   - Use `gh pr review ${issue_number} --comment --body "[Review details]"`
   - Or approve: `gh pr review ${issue_number} --approve --body "[Approval message]"`
   - Or request changes: `gh pr review ${issue_number} --request-changes --body "[Change requests]"`

10. Add inline comments for specific issues:
    - Comment on specific lines of code
    - Provide constructive feedback
    - Suggest improvements where applicable

11. Update PR labels:
    - Add appropriate review status labels
    - Mark as approved or needs-changes

12. Request re-review if changes were requested:
    - Monitor for updates
    - Re-review when changes are made

Review completed by ${agent_type} Agent ${agent_id}