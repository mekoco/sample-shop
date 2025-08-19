---
description: Fix a GitHub issue given its issue ID
args:
  - name: issue_id
    description: The GitHub issue number to fix
    required: true
---

I'll fix GitHub issue #{{arg:issue_id}} by following these steps:

1. Ensure we're on the latest master branch:
   - Switch to master: `git checkout master`
   - Pull latest changes: `git pull origin master`
2. Create a new branch for the fix: `git checkout -b fix-{{arg:issue_id}}-<short-description-in-kebab-case>`
3. Fetch and analyze the GitHub issue details using `gh issue view {{arg:issue_id}}`
4. Review any linked PRs, comments, and related context
5. Investigate the problem and document findings
6. Understand the requirements and acceptance criteria
7. Implement the necessary changes
8. Test the implementation:
   - Run all backend integration tests: `cd backend && npm test`
   - Ensure all tests pass without failures
9. Run lint and type checks (`npm run lint` and `npm run typecheck`)
<!-- 10. Deploy and test with containers:
   - Build containers: `docker compose build`
   - Run basic e2e tests: `cd frontend && npm run test:e2e:basic`
   - Check container logs for critical errors -->
11. Prepare the changes for commit with a concise summary that includes:
    - High-level description of the problem investigation results
    - Summary of the fix implemented
    - Any relevant technical decisions made
12. Push the branch to remote: `git push -u origin <branch-name>`
13. Create a pull request using `gh pr create` with:
    - A clear title describing the fix
    - A comprehensive description including problem summary and solution
    - Link to the issue using "Fixes #{{arg:issue_id}}"
14. Apply relevant labels to the PR based on the issue labels and change type:
    - Use `gh pr edit <pr-number> --add-label <label1>,<label2>...`
    - Common labels: bug, enhancement, frontend, backend, documentation, tests
15. Comment on the issue with a link to the created PR

{{git:status}}

{{bash:gh issue view {{arg:issue_id}} --json title,body,comments,labels,assignees,milestone,state}}