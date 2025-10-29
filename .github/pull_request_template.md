## Description

<!-- Provide a clear and concise description of what this PR does -->

### Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Database migration (changes to database schema or RLS policies)
- [ ] Documentation update
- [ ] Configuration change (environment variables, CI/CD, etc.)
- [ ] Refactoring (no functional changes)

### Related Issues

<!-- Link to related issues using #issue-number -->

Closes #

## Changes Made

<!-- List the specific changes made in this PR -->

-
-
-

## Testing

### Testing Performed

<!-- Describe the tests you ran and how to reproduce them -->

- [ ] Tested locally with `npm run dev`
- [ ] Tested database migrations with `supabase db push`
- [ ] Tested build process with `npm run build`
- [ ] Tested type checking with `npm run type-check`
- [ ] Tested linting with `npm run lint`

### Test Instructions

<!-- Provide step-by-step instructions for reviewers to test your changes -->

1.
2.
3.

### Expected Behavior

<!-- Describe what should happen after your changes -->

## Database Changes

<!-- If this PR includes database migrations, describe them here -->

- [ ] No database changes
- [ ] New migration added: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
- [ ] RLS policies updated
- [ ] Seed data updated

**Migration Description:**

## API Changes

<!-- If this PR adds or modifies API endpoints, document them here -->

- [ ] No API changes
- [ ] New endpoints added
- [ ] Existing endpoints modified
- [ ] Breaking API changes

**Endpoint Changes:**

## Environment Variables

<!-- If this PR requires new or modified environment variables -->

- [ ] No environment variable changes
- [ ] New variables added (documented in README)
- [ ] Existing variables modified

**New Variables:**

## Screenshots

<!-- If applicable, add screenshots to help explain your changes -->

## Checklist

### Code Quality

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings or errors
- [ ] I have removed any console.log statements and debug code

### Testing

- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

### Documentation

- [ ] I have updated the documentation accordingly
- [ ] I have added/updated code comments where necessary
- [ ] I have updated the README if needed

### Database

- [ ] Database migrations are backwards compatible
- [ ] RLS policies have been reviewed for security
- [ ] Seed data has been updated if schema changed
- [ ] Migration has been tested on a clean database

### Security

- [ ] No sensitive data (API keys, passwords, tokens) in code
- [ ] All environment variables use proper secrets management (Doppler)
- [ ] Authentication and authorization properly implemented
- [ ] Input validation and sanitization in place
- [ ] SQL injection risks mitigated

### Deployment

- [ ] Changes are backwards compatible with production
- [ ] Required environment variables are documented
- [ ] Database migration plan is documented
- [ ] Rollback strategy is clear

## Deployment Notes

<!-- Any special instructions for deploying this PR -->

## Rollback Plan

<!-- How to rollback these changes if something goes wrong -->

## Additional Context

<!-- Add any other context about the PR here -->
