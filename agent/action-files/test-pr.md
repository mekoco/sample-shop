I'll run comprehensive tests on GitHub PR #${issue_number} as a ${agent_type} agent (ID: ${agent_id}) following these steps:

1. Fetch PR information:
   - Run `gh pr view ${issue_number} --json title,body,commits,files,reviews,comments`
   - Understand the changes and their scope
   - Identify what needs to be tested

2. Checkout the PR branch:
   - Run `gh pr checkout ${issue_number}`
   - Ensure we have the latest changes
   - Verify branch with `git status`

3. Run static analysis:
   - Execute linting: `npm run lint`
   - Execute type checking: `npm run typecheck`
   - Check for code style violations
   - Ensure no static analysis errors

4. Run unit tests:
   - Backend unit tests: `cd backend && npm test`
   - Frontend unit tests: `cd frontend && npm test`
   - Verify all unit tests pass
   - Check code coverage meets thresholds

5. Run integration tests:
   - Backend integration: `cd backend && npm run test:integration`
   - API endpoint testing
   - Database integration tests
   - Ensure all integrations work correctly

6. Run end-to-end tests:
   - Basic e2e suite: `cd frontend && npm run test:e2e:basic`
   - Full e2e suite: `cd frontend && npm run test:e2e:full`
   - Verify user workflows function correctly
   - Check for UI regressions

7. Performance testing:
   - Run performance benchmarks if available
   - Check for performance regressions
   - Measure response times
   - Monitor memory usage

8. Security testing:
   - Run security audit: `npm audit`
   - Check for vulnerabilities
   - Scan for exposed secrets
   - Verify secure coding practices

9. Build verification:
   - Development build: `npm run build`
   - Production build: `npm run build:prod`
   - Verify builds complete successfully
   - Check bundle sizes

10. Docker testing:
    - Build containers: `docker compose build`
    - Run containers: `docker compose up -d`
    - Verify container health
    - Run smoke tests against containers
    - Clean up: `docker compose down`

11. Cross-browser testing (if applicable):
    - Test in Chrome
    - Test in Firefox
    - Test in Safari
    - Verify consistent behavior

12. Regression testing:
    - Run regression test suite if available
    - Verify no existing functionality is broken
    - Check backward compatibility

13. Generate test report:
    - Compile all test results
    - Create comprehensive test summary
    - Include coverage metrics
    - Note any warnings or issues

14. Post test results:
    - Comment on PR with detailed test report
    - Include pass/fail status for each test category
    - Add test coverage information
    - Provide recommendations if issues found

15. Update PR labels:
    - Add "tests-passed" if all tests succeed
    - Add "tests-failed" if any tests fail
    - Add "needs-dev" if fixes are required

Test execution completed by ${agent_type} Agent ${agent_id}