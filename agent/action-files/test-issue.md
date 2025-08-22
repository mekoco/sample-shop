I'll create and run tests for GitHub issue #${issue_number} as a ${agent_type} agent (ID: ${agent_id}) following these steps:

1. Fetch and analyze the issue:
   - Run `gh issue view ${issue_number} --json title,body,comments,labels`
   - Understand the issue and requirements
   - Identify what needs to be tested

2. Check for related PR:
   - Look for PR linked to this issue
   - If PR exists, checkout that branch
   - If no PR, work on main branch

3. Analyze the issue type:
   - Bug fix: Create regression tests
   - New feature: Create feature tests
   - Enhancement: Update existing tests
   - Performance: Create performance tests

4. Create unit tests:
   - Write tests for affected components
   - Cover edge cases and error scenarios
   - Ensure proper test isolation
   - Follow testing best practices

5. Create integration tests:
   - Test component interactions
   - Verify API endpoints if applicable
   - Test database operations
   - Ensure proper data flow

6. Create end-to-end tests:
   - Write user journey tests
   - Cover the reported issue scenario
   - Test related workflows
   - Verify fix from user perspective

7. Run the new tests:
   - Execute newly created tests
   - Verify they properly catch the issue
   - Ensure tests fail without fix
   - Confirm tests pass with fix

8. Run full test suite:
   - Backend tests: `cd backend && npm test`
   - Frontend tests: `cd frontend && npm test`
   - Integration tests: `npm run test:integration`
   - E2E tests: `npm run test:e2e:basic`

9. Check test coverage:
   - Generate coverage report
   - Ensure adequate coverage
   - Identify untested code paths
   - Add tests for uncovered areas

10. Validate test quality:
    - Review test readability
    - Check test maintainability
    - Ensure tests are deterministic
    - Verify no flaky tests

11. Document test cases:
    - Add test documentation
    - Explain test scenarios
    - Document expected behavior
    - Note any special setup required

12. Commit test changes:
    - Stage test files
    - Create descriptive commit message
    - Reference issue number in commit

13. Create or update PR:
    - If no PR exists, create one
    - Push test changes
    - Link to the issue

14. Post test summary:
    - Comment on issue with test details
    - List all tests created
    - Include coverage metrics
    - Provide test execution results

15. Update labels:
    - Add "tests-added" label
    - Add "ready-for-review" if complete
    - Remove "needs-tests" if present

Test creation completed by ${agent_type} Agent ${agent_id}