---
description: Review a GitHub pull request by analyzing code changes, providing feedback, and suggesting improvements
args:
  - name: pr_number
    description: The GitHub pull request number to review
    required: true
---

I'll conduct a comprehensive review of GitHub PR #{{arg:pr_number}} by following these steps:

1. Fetch and analyze the PR details:
   - Run `gh pr view {{arg:pr_number}} --json title,body,comments,reviews,labels,assignees,state,mergeable,mergeStateStatus`
   - Review PR description and context
   - Check current review status and existing comments
2. Checkout the PR branch locally:
   - Run `gh pr checkout {{arg:pr_number}}`
   - Verify current branch with `git status`
3. Analyze the code changes:
   - Run `git diff origin/master...HEAD` to see all changes
   - Review modified files for code quality, style, and logic
   - Check for potential bugs, security issues, or performance problems
4. Review code structure and patterns:
   - Verify adherence to project conventions (CLAUDE.md guidelines)
   - Check import patterns, component structure, and naming conventions
   - Ensure proper error handling and type safety
5. Analyze business logic changes:
   - Review service layer implementations
   - Verify API endpoint changes follow REST conventions
   - Check database schema changes and migrations
6. Test the changes:
   - Run backend integration tests: `cd backend && npm test`
   - Run frontend tests if applicable
   - Check for test coverage of new functionality
7. Run quality checks:
   - Execute `npm run lint` to check code style
   - Execute `npm run typecheck` to verify type safety
   - Look for any warnings or errors
8. Security and performance review:
   - Check for exposed secrets or sensitive data
   - Review authentication and authorization changes
   - Analyze potential performance impacts
9. Documentation review:
   - Verify code comments are appropriate and helpful
   - Check if API changes require documentation updates
   - Ensure complex logic is well-documented
10. Generate comprehensive review feedback:
    - Categorize findings (critical, major, minor, suggestions)
    - Provide specific line-by-line feedback where applicable
    - Suggest improvements with code examples
11. Submit review on GitHub:
    - Use `gh pr review {{arg:pr_number}}` with appropriate status
    - Add detailed comments for each issue found
    - Request changes if critical issues exist, approve if ready
12. Provide summary report:
    - Overall assessment of code quality
    - Key strengths and areas for improvement
    - Recommendations for next steps

{{git:status}}

{{bash:gh pr view {{arg:pr_number}} --json title,body,comments,reviews,labels,assignees,state,mergeable,mergeStateStatus}}