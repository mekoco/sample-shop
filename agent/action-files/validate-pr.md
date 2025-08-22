I'll validate GitHub PR #${issue_number} for merging as a ${agent_type} agent (ID: ${agent_id}) following these steps:

1. Fetch complete PR information:
   - Run `gh pr view ${issue_number} --json title,body,commits,files,reviews,comments,mergeable,mergeStateStatus`
   - Check merge conflict status
   - Verify all required reviews are approved

2. Checkout and update the PR branch:
   - Run `gh pr checkout ${issue_number}`
   - Fetch latest master: `git fetch origin master`
   - Rebase onto master: `git rebase origin/master`
   - Resolve any conflicts if present

3. Verify CI/CD status:
   - Check all GitHub Actions workflows pass
   - Review any failed checks
   - Ensure build artifacts are generated correctly

4. Run comprehensive test suite:
   - Backend unit tests: `cd backend && npm test`
   - Backend integration tests: `cd backend && npm run test:integration`
   - Frontend tests: `cd frontend && npm test`
   - Ensure 100% test pass rate

5. Perform security checks:
   - Run security audit: `npm audit`
   - Check for exposed secrets or credentials
   - Verify no sensitive data in commits

6. Run code quality checks:
   - Execute `npm run lint` - must pass with no errors
   - Execute `npm run typecheck` - must have no type errors
   - Check code coverage meets minimum threshold

7. Build and test production artifacts:
   - Build production: `npm run build:prod`
   - Test production build locally
   - Verify build size is reasonable

8. Test with Docker containers:
   - Full build: `docker compose build`
   - Start services: `docker compose up -d`
   - Run full e2e test suite: `cd frontend && npm run test:e2e:full`
   - Check container health and logs

9. Validate database migrations (if any):
   - Review migration scripts
   - Test rollback procedures
   - Ensure backward compatibility

10. Check documentation updates:
    - Verify README updates if needed
    - Check API documentation is current
    - Ensure changelog is updated

11. Performance validation:
    - Check for performance regressions
    - Verify memory usage is acceptable
    - Ensure response times meet SLAs

12. Final merge readiness check:
    - All tests must pass
    - No merge conflicts
    - All reviews approved
    - CI/CD green
    - No security issues

13. Determine validation outcome:
    - PASS: Ready for merge to master
    - FAIL: Issues need to be addressed

14. Post validation result:
    - Update PR with validation status
    - Add detailed validation report as comment
    - Update labels to reflect merge readiness

15. If validation passes:
    - Mark PR as ready-to-merge
    - Notify team of successful validation

16. If validation fails:
    - Document all issues found
    - Request fixes from PR author
    - Mark as needs-dev for fixes

Validation completed by ${agent_type} Agent ${agent_id}