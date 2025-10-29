# Git Workflow and Contribution Guidelines

## Table of Contents
1. [Overview](#overview)
2. [Branch Strategy](#branch-strategy)
3. [Commit Message Standards](#commit-message-standards)
4. [Pull Request Process](#pull-request-process)
5. [Code Review Guidelines](#code-review-guidelines)
6. [Common Git Workflows](#common-git-workflows)
7. [Merge Strategies](#merge-strategies)
8. [Version Tagging](#version-tagging)
9. [Hotfix Procedures](#hotfix-procedures)
10. [Git Best Practices](#git-best-practices)
11. [Common Git Commands](#common-git-commands)
12. [Troubleshooting](#troubleshooting)

---

## Overview

This document defines the Git workflow and contribution guidelines for the CD Home Improvements project. Following these guidelines ensures:

- **Code Quality**: Consistent standards and review processes
- **Traceability**: Clear commit history and change tracking
- **Collaboration**: Streamlined teamwork and conflict resolution
- **Stability**: Protected production code with proper testing
- **Rollback Capability**: Easy identification and reversion of changes

### Repository Structure

```
cd-construction/
├── main              # Production-ready code
├── develop           # Integration branch for features
├── staging           # Pre-production testing
├── feature/*         # Feature development branches
├── bugfix/*          # Bug fix branches
├── hotfix/*          # Emergency production fixes
└── release/*         # Release preparation branches
```

---

## Branch Strategy

### Branch Types

#### 1. Main Branches (Long-Lived)

**`main`** - Production Branch
- **Purpose**: Production-ready code only
- **Protection**: Protected, requires PR + reviews
- **Deployment**: Auto-deploys to Vercel production
- **Never**: Direct commits allowed

**`develop`** - Development Branch
- **Purpose**: Integration branch for completed features
- **Protection**: Protected, requires PR
- **Deployment**: Auto-deploys to Vercel preview
- **Never**: Incomplete features merged

**`staging`** - Staging Branch
- **Purpose**: Pre-production testing and QA
- **Protection**: Protected, requires PR
- **Deployment**: Deploys to staging environment
- **Use Case**: Final testing before production release

#### 2. Supporting Branches (Short-Lived)

**`feature/*`** - Feature Branches
```bash
# Naming convention:
feature/ISSUE-brief-description

# Examples:
feature/123-add-payment-processing
feature/456-implement-lead-forms
feature/789-update-dashboard-ui
```

**Purpose**: Develop new features or enhancements
**Created from**: `develop`
**Merged into**: `develop`
**Naming**: `feature/[issue-number]-[brief-description]`
**Lifetime**: Days to weeks

**`bugfix/*`** - Bug Fix Branches
```bash
# Naming convention:
bugfix/ISSUE-brief-description

# Examples:
bugfix/234-fix-email-validation
bugfix/567-resolve-database-timeout
bugfix/890-correct-payment-calculation
```

**Purpose**: Fix non-critical bugs
**Created from**: `develop` (or `staging` if bug found in staging)
**Merged into**: `develop` or `staging`
**Naming**: `bugfix/[issue-number]-[brief-description]`
**Lifetime**: Hours to days

**`hotfix/*`** - Hotfix Branches
```bash
# Naming convention:
hotfix/VERSION-brief-description

# Examples:
hotfix/1.2.3-fix-payment-crash
hotfix/1.3.1-security-patch
hotfix/2.0.1-critical-database-fix
```

**Purpose**: Emergency fixes for production
**Created from**: `main`
**Merged into**: `main` AND `develop` (to keep in sync)
**Naming**: `hotfix/[version]-[brief-description]`
**Lifetime**: Hours
**Note**: Creates new version tag

**`release/*`** - Release Branches
```bash
# Naming convention:
release/VERSION

# Examples:
release/1.2.0
release/1.3.0
release/2.0.0
```

**Purpose**: Prepare for production release (final testing, version bumps, changelog)
**Created from**: `develop`
**Merged into**: `main` AND `develop`
**Naming**: `release/[version]`
**Lifetime**: Days
**Note**: Creates version tag after merge to main

### Branch Protection Rules

Configure in GitHub → Settings → Branches:

**`main` Branch Protection:**
```yaml
✅ Require pull request reviews before merging
   - Required approving reviews: 2
   - Dismiss stale reviews when new commits are pushed
   - Require review from Code Owners

✅ Require status checks to pass before merging
   - Require branches to be up to date
   - Status checks required:
     - tests (npm test)
     - build (npm run build)
     - lint (npm run lint)
     - type-check (npm run type-check)

✅ Require conversation resolution before merging

✅ Require signed commits

✅ Require linear history (no merge commits)

✅ Do not allow bypassing the above settings

🚫 Do not allow force pushes
🚫 Do not allow deletions
```

**`develop` Branch Protection:**
```yaml
✅ Require pull request reviews before merging
   - Required approving reviews: 1

✅ Require status checks to pass before merging
   - Status checks required:
     - tests (npm test)
     - build (npm run build)
     - lint (npm run lint)

✅ Require conversation resolution before merging

🚫 Do not allow force pushes
```

---

## Commit Message Standards

### Conventional Commits Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Commit Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(leads): add email validation to lead form` |
| `fix` | Bug fix | `fix(payments): resolve Stripe webhook timeout` |
| `docs` | Documentation only | `docs(readme): update setup instructions` |
| `style` | Code style changes (formatting, semicolons, etc.) | `style(components): format with prettier` |
| `refactor` | Code refactoring without feature changes | `refactor(api): simplify lead submission logic` |
| `perf` | Performance improvements | `perf(database): add index to leads table` |
| `test` | Adding or updating tests | `test(leads): add unit tests for validation` |
| `build` | Build system or dependency changes | `build(deps): upgrade Next.js to 14.0.0` |
| `ci` | CI/CD configuration changes | `ci(github): add automated testing workflow` |
| `chore` | Maintenance tasks | `chore(deps): update dependencies` |
| `revert` | Revert previous commit | `revert: feat(leads): add email validation` |

#### Commit Scopes (Optional but Recommended)

Scope indicates which part of the codebase is affected:

**Frontend:**
- `leads` - Lead forms and management
- `dashboard` - Dashboard components
- `auth` - Authentication
- `ui` - UI components
- `pages` - Page components

**Backend:**
- `api` - API routes
- `webhooks` - Webhook handlers
- `database` - Database schema/queries
- `emails` - Email templates/sending
- `sms` - SMS notifications

**Infrastructure:**
- `docker` - Docker configuration
- `deployment` - Deployment scripts
- `monitoring` - Monitoring/logging
- `security` - Security configurations

#### Good Commit Messages

```bash
# ✅ Good: Clear, concise, follows convention
feat(leads): add email validation to lead submission form

Add client-side and server-side validation for email addresses
in the lead submission form. Uses regex pattern to validate
email format and displays user-friendly error messages.

Closes #123

# ✅ Good: Bug fix with issue reference
fix(payments): resolve Stripe webhook signature verification

Stripe webhook was failing due to incorrect signature verification.
Updated to use raw body buffer instead of parsed JSON.

Fixes #234

# ✅ Good: Breaking change indicated
feat(api)!: update lead API response format

BREAKING CHANGE: Lead API now returns `lead_id` instead of `id`.
Update all API clients to use the new field name.

# ✅ Good: Multiple changes in commit body
refactor(database): optimize lead queries

- Add composite index on (status, created_at)
- Use connection pooling for better performance
- Implement query result caching for dashboard
- Reduce N+1 queries in lead list endpoint

Performance improvement: Dashboard load time reduced from 800ms to 200ms.
```

#### Bad Commit Messages

```bash
# ❌ Bad: Vague, no context
Update files

# ❌ Bad: No type or scope
Added validation

# ❌ Bad: Too long subject line (should be < 72 chars)
feat(leads): add comprehensive email validation with multiple regex patterns and error handling for various edge cases

# ❌ Bad: No capitalization, no punctuation
fix bug in payment processing

# ❌ Bad: Mixing multiple unrelated changes
feat: add email validation, fix payment bug, update README, refactor dashboard

# ❌ Bad: Implementation details in subject (should be in body)
fix(api): change line 45 from parseInt to Number for lead_id conversion
```

### Commit Message Template

Set up a commit message template to enforce standards:

```bash
# Create template file
cat > ~/.gitmessage << 'EOF'
# <type>(<scope>): <subject> (max 72 chars)
# |<----  Using a Maximum Of 72 Characters  ---->|

# <body> - Explain what and why vs. how (wrap at 72 chars)
# |<----   Using a Maximum Of 72 Characters   ---->|

# <footer> - Reference issues, breaking changes, etc.
# Example: Closes #123, Fixes #456, BREAKING CHANGE: ...

# --- COMMIT TYPES ---
# feat:     New feature
# fix:      Bug fix
# docs:     Documentation only changes
# style:    Code style changes (formatting, etc.)
# refactor: Code refactoring
# perf:     Performance improvements
# test:     Adding or updating tests
# build:    Build system or dependency changes
# ci:       CI/CD changes
# chore:    Maintenance tasks
# revert:   Revert previous commit
#
# --- SCOPES (examples) ---
# leads, dashboard, auth, api, webhooks, database, emails, etc.
#
# --- GUIDELINES ---
# - Use imperative mood ("add" not "added" or "adds")
# - Capitalize first letter of subject
# - No period at end of subject
# - Separate subject from body with blank line
# - Wrap body at 72 characters
# - Use body to explain what and why (not how)
# - Reference issues in footer
EOF

# Configure Git to use template
git config --global commit.template ~/.gitmessage

# Now when you run `git commit`, the template will appear
git commit
```

### Enforcing Commit Standards with Commitlint

```bash
# Install commitlint
npm install --save-dev @commitlint/cli @commitlint/config-conventional

# Create configuration
cat > commitlint.config.js << 'EOF'
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 72],
  },
};
EOF

# Install Husky for Git hooks
npm install --save-dev husky

# Initialize Husky
npx husky init

# Add commit-msg hook
cat > .husky/commit-msg << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit $1
EOF

chmod +x .husky/commit-msg

# Now commitlint will validate commit messages automatically
git commit -m "invalid message" # ❌ Will fail
git commit -m "feat(leads): add email validation" # ✅ Will pass
```

---

## Pull Request Process

### Creating a Pull Request

#### 1. Before Creating PR

```bash
# Ensure your branch is up to date
git checkout develop
git pull origin develop

git checkout feature/123-add-payment-processing
git merge develop
# Or rebase: git rebase develop

# Run tests and lint
npm test
npm run lint
npm run type-check
npm run build

# Commit any fixes
git add .
git commit -m "test: fix failing tests"

# Push to origin
git push origin feature/123-add-payment-processing
```

#### 2. Create PR on GitHub

**Title Format:**
```
<type>(<scope>): <brief description> (#issue-number)

Examples:
feat(payments): implement Stripe payment processing (#123)
fix(leads): resolve email validation bug (#234)
docs(readme): update deployment instructions (#345)
```

**PR Description Template:**

```markdown
## Description
Brief summary of changes (2-3 sentences).

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Related Issues
Closes #123
Relates to #456

## Changes Made
- Added payment processing with Stripe API
- Implemented webhook handler for payment events
- Created payment confirmation email template
- Added payment status to invoice database schema

## Testing
### Tested Scenarios:
- [x] Successful payment processing
- [x] Failed payment handling
- [x] Webhook signature verification
- [x] Payment confirmation email sending
- [x] Database transaction rollback on error

### Test Coverage:
- Unit tests: 95%
- Integration tests: 85%

## Screenshots (if applicable)
![Payment form](https://example.com/screenshot.png)

## Checklist
- [x] My code follows the project's code style
- [x] I have performed a self-review of my own code
- [x] I have commented my code, particularly in hard-to-understand areas
- [x] I have made corresponding changes to the documentation
- [x] My changes generate no new warnings
- [x] I have added tests that prove my fix is effective or that my feature works
- [x] New and existing unit tests pass locally with my changes
- [x] Any dependent changes have been merged and published

## Deployment Notes
- [ ] Requires database migration
- [ ] Requires environment variable changes (.env update)
- [ ] Requires external service configuration (Stripe webhook URL)
- [ ] Breaking changes (list below)

**Environment Variables Required:**
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Additional Context
Add any other context about the PR here.
```

#### 3. PR Labels

Apply appropriate labels:

| Label | Description |
|-------|-------------|
| `feature` | New feature |
| `bugfix` | Bug fix |
| `hotfix` | Critical production fix |
| `documentation` | Documentation changes |
| `enhancement` | Improvement to existing feature |
| `breaking-change` | Breaking API or behavior change |
| `needs-review` | Ready for code review |
| `needs-testing` | Requires additional testing |
| `work-in-progress` | Not ready for review |
| `dependencies` | Dependency updates |

### Pull Request Review Process

#### Reviewer Responsibilities

**1. Code Quality Review:**
- [ ] Code follows project style guidelines
- [ ] Functions/variables have clear, descriptive names
- [ ] Code is DRY (Don't Repeat Yourself)
- [ ] No commented-out code or debug statements
- [ ] Proper error handling and validation
- [ ] No security vulnerabilities (SQL injection, XSS, etc.)

**2. Functionality Review:**
- [ ] Code does what the PR description claims
- [ ] No unintended side effects or regressions
- [ ] Edge cases are handled
- [ ] Error messages are user-friendly

**3. Testing Review:**
- [ ] Tests are comprehensive and meaningful
- [ ] Tests pass locally and in CI
- [ ] Test coverage meets requirements (>80%)
- [ ] No flaky or brittle tests

**4. Documentation Review:**
- [ ] Code is adequately commented
- [ ] API changes are documented
- [ ] README/docs are updated if needed
- [ ] Breaking changes are clearly documented

**5. Performance Review:**
- [ ] No obvious performance bottlenecks
- [ ] Database queries are optimized
- [ ] Large files/dependencies are justified
- [ ] Caching is used where appropriate

#### Review Comments

**Use Constructive Language:**

```markdown
# ❌ Bad: Demanding, no explanation
This is wrong. Fix it.

# ✅ Good: Constructive, with reasoning
Consider using `Array.filter()` instead of a for-loop here for better readability
and to avoid side effects. Example:
```typescript
const activeLeads = leads.filter(lead => lead.status === 'active');
```

# ❌ Bad: Vague
This doesn't look right.

# ✅ Good: Specific issue identified
The error handling here doesn't catch network errors. Consider adding a
catch block to handle `fetch` failures:
```typescript
try {
  const response = await fetch(url);
} catch (error) {
  if (error instanceof TypeError) {
    // Network error
  }
}
```

# ❌ Bad: Personal preference without justification
I don't like this approach.

# ✅ Good: Preference with reasoning
Using a switch statement here would improve readability and make it easier
to add new status types in the future:
```typescript
switch (lead.status) {
  case 'new':
    return handleNewLead(lead);
  case 'in_progress':
    return handleInProgressLead(lead);
  default:
    return handleUnknownStatus(lead);
}
```
```

**Review Comment Types:**

```markdown
# Request Changes (blocking)
**[MUST FIX]** This introduces a SQL injection vulnerability. Use parameterized
queries instead:
```sql
-- ❌ Vulnerable
SELECT * FROM leads WHERE email = '${email}'

-- ✅ Safe
SELECT * FROM leads WHERE email = $1
```

# Suggestion (non-blocking)
**[SUGGESTION]** Consider extracting this logic into a separate function for
better testability and reusability.

# Nitpick (non-blocking)
**[NIT]** Typo: "occured" should be "occurred"

# Question
**[QUESTION]** What happens if the Stripe API call fails here? Should we retry?

# Approval with comment
**[LGTM]** Great work! The error handling is comprehensive and the tests are thorough.
Just one minor suggestion about the logging format (see inline comment).
```

#### Responding to Review Comments

**As PR Author:**

```markdown
# Acknowledge and fix
✅ Good catch! Fixed in commit abc1234.

# Explain reasoning
I chose this approach because... However, I'm open to changing it if you feel
strongly about the alternative.

# Ask for clarification
Could you elaborate on what you mean by "better error handling"? Are you
referring to the network error case or validation errors?

# Disagree respectfully
I understand your concern, but I think the current approach is better because...
What do you think?
```

### Merging Pull Requests

#### Merge Criteria

PR can be merged when:
- [x] All required reviews approved (2 for `main`, 1 for `develop`)
- [x] All CI checks pass (tests, lint, build, type-check)
- [x] All conversations resolved
- [x] Branch is up-to-date with target branch
- [x] No merge conflicts
- [x] Documentation updated (if applicable)

#### Merge Methods

**1. Squash and Merge (Preferred for `main`)**
```bash
# Combines all commits into single commit on target branch
# Best for: Feature branches with many small commits

# Result:
# Before merge: 15 commits in feature branch
# After merge: 1 commit in main with clean message

# Pros:
# - Clean, linear history
# - Easy to revert entire feature
# - No "fix typo" or "WIP" commits in history

# Cons:
# - Loses individual commit history
# - Can make debugging harder

# Usage:
# GitHub UI: Select "Squash and merge"
# Edit commit message to be descriptive
```

**2. Rebase and Merge (Preferred for `develop`)**
```bash
# Replays commits from feature branch onto target branch
# Best for: Small PRs with well-structured commits

# Result:
# Before merge: 5 clean commits in feature branch
# After merge: 5 commits in develop (rebased)

# Pros:
# - Linear history
# - Preserves individual commits
# - No merge commits

# Cons:
# - Rewrites commit history (SHAs change)
# - Can be confusing for beginners

# Usage:
# GitHub UI: Select "Rebase and merge"
```

**3. Create Merge Commit (Avoid unless necessary)**
```bash
# Creates explicit merge commit
# Best for: Release branches, large team collaboration

# Result:
# Creates merge commit linking branches

# Pros:
# - Preserves branch history
# - Easy to see where branches were merged
# - Safe (doesn't rewrite history)

# Cons:
# - Cluttered history with merge commits
# - Harder to follow linear history

# Usage:
# GitHub UI: Select "Create a merge commit"
```

**Recommended Strategy:**
- `feature/*` → `develop`: **Squash and merge**
- `bugfix/*` → `develop`: **Squash and merge**
- `develop` → `staging`: **Rebase and merge**
- `staging` → `main`: **Create merge commit** (for clear release history)
- `hotfix/*` → `main`: **Squash and merge**
- `release/*` → `main`: **Create merge commit**

---

## Code Review Guidelines

### What to Look For

#### 1. Security Issues

```typescript
// ❌ Security Issue: SQL Injection
const query = `SELECT * FROM leads WHERE email = '${email}'`;

// ✅ Fixed: Parameterized query
const { data } = await supabase
  .from('leads')
  .select('*')
  .eq('email', email);

// ❌ Security Issue: XSS vulnerability
const html = `<div>${userInput}</div>`;

// ✅ Fixed: Sanitized input
import DOMPurify from 'dompurify';
const html = `<div>${DOMPurify.sanitize(userInput)}</div>`;

// ❌ Security Issue: Exposed secrets
const apiKey = 'sk_live_abc123'; // Hardcoded

// ✅ Fixed: Environment variable
const apiKey = process.env.STRIPE_SECRET_KEY;
```

#### 2. Performance Issues

```typescript
// ❌ Performance Issue: N+1 query problem
for (const lead of leads) {
  const client = await supabase
    .from('clients')
    .select('*')
    .eq('client_id', lead.client_id)
    .single();
  // Processing...
}

// ✅ Fixed: Single query with join
const { data: leads } = await supabase
  .from('leads')
  .select(`
    *,
    client:clients(*)
  `);

// ❌ Performance Issue: Unnecessary re-renders
function LeadList({ leads }: Props) {
  const filtered = leads.filter(lead => lead.status === 'active');
  return <>{filtered.map(...)}</>;
}

// ✅ Fixed: Memoized filtering
function LeadList({ leads }: Props) {
  const filtered = useMemo(
    () => leads.filter(lead => lead.status === 'active'),
    [leads]
  );
  return <>{filtered.map(...)}</>;
}

// ❌ Performance Issue: Large bundle size
import _ from 'lodash'; // Imports entire library (70KB)

// ✅ Fixed: Import only needed functions
import debounce from 'lodash/debounce'; // Imports only 2KB
```

#### 3. Error Handling

```typescript
// ❌ Poor Error Handling: Silent failure
try {
  await sendEmail(params);
} catch (error) {
  // Silent failure - user doesn't know email failed
}

// ✅ Good Error Handling: User feedback + logging
try {
  await sendEmail(params);
} catch (error) {
  console.error('Failed to send email:', error);
  Sentry.captureException(error);
  return { error: 'Failed to send email. Please try again.' };
}

// ❌ Poor Error Handling: Generic error message
catch (error) {
  throw new Error('Something went wrong');
}

// ✅ Good Error Handling: Specific error message
catch (error) {
  if (error.code === 'PGRST116') {
    throw new Error('Lead not found');
  } else if (error.code === 'PGRST301') {
    throw new Error('Database connection failed');
  } else {
    throw new Error('Failed to fetch lead');
  }
}
```

#### 4. Code Duplication

```typescript
// ❌ Code Duplication
function validateLeadEmail(email: string) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validateClientEmail(email: string) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// ✅ DRY Principle: Extract common logic
function validateEmail(email: string) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Use in both places
const isValidLeadEmail = validateEmail(lead.email);
const isValidClientEmail = validateEmail(client.email);
```

#### 5. Type Safety

```typescript
// ❌ Weak Typing: Any type
function processLead(data: any) {
  return data.email; // No type safety
}

// ✅ Strong Typing: Proper types
interface Lead {
  lead_id: string;
  email: string;
  status: 'new' | 'in_progress' | 'converted' | 'lost';
  created_at: string;
}

function processLead(data: Lead) {
  return data.email; // Type-safe
}

// ❌ Weak Typing: Optional chaining overuse
const email = lead?.client?.email?.toLowerCase();

// ✅ Strong Typing: Proper null checks
if (!lead || !lead.client || !lead.client.email) {
  throw new Error('Invalid lead data');
}
const email = lead.client.email.toLowerCase();
```

### Review Checklist

**Use this checklist for every code review:**

```markdown
## Security
- [ ] No hardcoded secrets or API keys
- [ ] User input is validated and sanitized
- [ ] SQL queries use parameterization (no string concatenation)
- [ ] Authentication/authorization checks are present
- [ ] Sensitive data is not logged
- [ ] CORS is configured correctly
- [ ] Rate limiting is implemented for public endpoints

## Performance
- [ ] No N+1 query problems
- [ ] Database queries are optimized (indexes, projections)
- [ ] Large computations are memoized or cached
- [ ] Images are optimized and lazy-loaded
- [ ] Bundle size is reasonable (<500KB gzipped)
- [ ] No memory leaks (event listeners cleaned up)

## Error Handling
- [ ] All async operations have try-catch blocks
- [ ] Error messages are user-friendly
- [ ] Errors are logged appropriately
- [ ] Critical errors trigger alerts
- [ ] Graceful degradation for non-critical failures

## Testing
- [ ] Unit tests cover core logic (>80% coverage)
- [ ] Integration tests for API endpoints
- [ ] Edge cases are tested
- [ ] Tests are not flaky
- [ ] Test names clearly describe what's being tested

## Code Quality
- [ ] Code follows style guide (Prettier, ESLint)
- [ ] Functions are small and focused (< 50 lines)
- [ ] Variable names are descriptive
- [ ] No code duplication (DRY principle)
- [ ] Comments explain "why" not "what"
- [ ] Complex logic is documented
- [ ] No commented-out code

## Type Safety
- [ ] All functions have type annotations
- [ ] No use of `any` type (use `unknown` if necessary)
- [ ] Proper null/undefined checks
- [ ] Types are imported from central location

## Documentation
- [ ] README updated if needed
- [ ] API documentation updated
- [ ] Environment variables documented
- [ ] Migration guide for breaking changes

## Accessibility (if UI changes)
- [ ] Semantic HTML elements used
- [ ] ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Sufficient color contrast

## Mobile Responsiveness (if UI changes)
- [ ] Looks good on mobile (375px width)
- [ ] Touch targets are large enough (44x44px min)
- [ ] No horizontal scrolling
```

---

## Common Git Workflows

### Workflow 1: Developing a New Feature

```bash
# 1. Start from develop branch
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/123-add-payment-processing

# 3. Work on feature (make commits)
git add src/app/api/payments/route.ts
git commit -m "feat(payments): add Stripe payment endpoint"

git add src/lib/stripe.ts
git commit -m "feat(payments): add Stripe client initialization"

git add tests/payments.test.ts
git commit -m "test(payments): add unit tests for payment processing"

# 4. Keep branch up-to-date with develop (do this regularly)
git checkout develop
git pull origin develop
git checkout feature/123-add-payment-processing
git rebase develop
# Fix any conflicts if they arise
git rebase --continue

# 5. Push to remote
git push origin feature/123-add-payment-processing

# 6. Create Pull Request on GitHub
# (See "Pull Request Process" section)

# 7. Make changes based on review feedback
git add src/app/api/payments/route.ts
git commit -m "fix(payments): improve error handling per review"
git push origin feature/123-add-payment-processing

# 8. After PR approval, squash and merge via GitHub UI

# 9. Clean up local branches
git checkout develop
git pull origin develop
git branch -d feature/123-add-payment-processing
```

### Workflow 2: Fixing a Bug

```bash
# 1. Create bugfix branch from develop
git checkout develop
git pull origin develop
git checkout -b bugfix/234-fix-email-validation

# 2. Fix the bug
git add src/components/LeadForm.tsx
git commit -m "fix(leads): correct email validation regex

Previous regex was incorrectly rejecting valid emails with subdomains.
Updated to RFC 5322 compliant pattern.

Fixes #234"

# 3. Add test to prevent regression
git add tests/lead-form.test.ts
git commit -m "test(leads): add test for email validation with subdomains"

# 4. Push and create PR
git push origin bugfix/234-fix-email-validation

# (Create PR on GitHub)

# 5. After merge, clean up
git checkout develop
git pull origin develop
git branch -d bugfix/234-fix-email-validation
```

### Workflow 3: Emergency Hotfix

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/1.2.3-fix-payment-crash

# 2. Make the fix
git add src/app/api/payments/route.ts
git commit -m "fix(payments): prevent crash when Stripe API is unavailable

Added try-catch block and fallback error handling to prevent
server crash when Stripe API times out.

Fixes #999 (CRITICAL)"

# 3. Test thoroughly (this is production!)
npm test
npm run build

# 4. Push and create PR to main
git push origin hotfix/1.2.3-fix-payment-crash

# (Create PR to main on GitHub with "hotfix" label)

# 5. After merge to main, also merge to develop
git checkout develop
git pull origin develop
git merge main
git push origin develop

# 6. Clean up
git branch -d hotfix/1.2.3-fix-payment-crash
```

### Workflow 4: Preparing a Release

```bash
# 1. Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/1.3.0

# 2. Update version numbers
npm version 1.3.0 --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore(release): bump version to 1.3.0"

# 3. Update CHANGELOG
git add CHANGELOG.md
git commit -m "docs(changelog): add changes for v1.3.0"

# 4. Final testing on staging
git push origin release/1.3.0
# Deploy to staging and test

# 5. Fix any last-minute bugs
git add src/bug-fix.ts
git commit -m "fix(release): last-minute bug fix"

# 6. Merge to main (via PR)
# (Create PR from release/1.3.0 to main)

# 7. After merge to main, create tag
git checkout main
git pull origin main
git tag -a v1.3.0 -m "Release v1.3.0"
git push origin v1.3.0

# 8. Merge back to develop
git checkout develop
git merge main
git push origin develop

# 9. Clean up
git branch -d release/1.3.0
```

### Workflow 5: Rebasing vs Merging

**When to Rebase:**
```bash
# Use rebase to keep feature branch up-to-date with develop
# This creates a clean, linear history

git checkout feature/123-my-feature
git rebase develop

# Benefits:
# - Linear history
# - No merge commits
# - Easier to understand

# Use when:
# - Updating feature branch with latest develop changes
# - Before creating PR (to ensure no conflicts)
# - Working on personal branches
```

**When to Merge:**
```bash
# Use merge for integrating completed work
# This preserves branch history

git checkout develop
git merge --no-ff feature/123-my-feature

# Benefits:
# - Preserves branch history
# - Shows where branches were merged
# - Safer (doesn't rewrite history)

# Use when:
# - Merging feature into develop
# - Merging release into main
# - Working with shared branches
```

---

## Merge Strategies

### Strategy 1: Squash and Merge

**When**: Feature branches with multiple commits

```bash
# Before squash (feature branch):
a1b2c3d feat(payments): add Stripe integration
e4f5g6h fix: typo in comment
h7i8j9k wip: still working on webhook
k0l1m2n feat(payments): complete webhook handler
n3o4p5q test: add payment tests
q6r7s8t docs: update payment docs

# After squash (in main):
t9u0v1w feat(payments): add Stripe payment processing (#123)
```

**Advantages:**
- Clean, concise history
- Easy to revert entire feature
- No "WIP" or "fix typo" commits in main

**Disadvantages:**
- Loses granular commit history
- Harder to debug individual changes

### Strategy 2: Rebase and Merge

**When**: Clean, well-structured commits in feature branch

```bash
# Before rebase:
develop:      A---B---C
                   \
feature:            D---E---F

# After rebase:
develop:      A---B---C---D'---E'---F'

# History is linear, feature commits replayed on top of develop
```

**Advantages:**
- Linear history (easy to follow)
- Preserves individual commits
- No merge commits

**Disadvantages:**
- Rewrites history (commits get new SHAs)
- Can be confusing if not familiar with rebase

### Strategy 3: Merge Commit

**When**: Release branches, important milestones

```bash
# Before merge:
main:         A---B---C
                   \
release:            D---E---F

# After merge:
main:         A---B---C-------M
                   \         /
release:            D---E---F

# Merge commit M explicitly shows where release was merged
```

**Advantages:**
- Preserves complete history
- Easy to see branch integration points
- Safe (doesn't rewrite history)

**Disadvantages:**
- Cluttered history with merge commits
- Can be harder to follow

---

## Version Tagging

### Semantic Versioning

We follow [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

```
Version: 1.2.3
         │ │ │
         │ │ └─ PATCH: Bug fixes (backward compatible)
         │ └─── MINOR: New features (backward compatible)
         └───── MAJOR: Breaking changes (not backward compatible)
```

**Examples:**
- `1.0.0` → `1.0.1`: Bug fix (patch)
- `1.0.1` → `1.1.0`: New feature (minor)
- `1.1.0` → `2.0.0`: Breaking change (major)

### Creating Tags

```bash
# After merging release to main

# 1. Checkout main and pull latest
git checkout main
git pull origin main

# 2. Create annotated tag (preferred)
git tag -a v1.3.0 -m "Release v1.3.0

## Features
- Add Stripe payment processing
- Implement lead email validation
- Add invoice PDF generation

## Bug Fixes
- Fix database timeout issue
- Resolve email sending failures

## Breaking Changes
- None
"

# 3. Push tag to remote
git push origin v1.3.0

# 4. Create GitHub Release (optional but recommended)
# Go to: https://github.com/YOUR_ORG/cd-construction/releases/new
# Select tag: v1.3.0
# Release title: Version 1.3.0
# Description: (copy from tag message)
```

### Automated Versioning with npm

```bash
# Patch release (1.0.0 → 1.0.1)
npm version patch -m "chore(release): %s"

# Minor release (1.0.1 → 1.1.0)
npm version minor -m "chore(release): %s"

# Major release (1.1.0 → 2.0.0)
npm version major -m "chore(release): %s"

# This will:
# 1. Update package.json version
# 2. Create git commit
# 3. Create git tag
# 4. You still need to push: git push --follow-tags
```

### Tag Naming Convention

| Tag Format | Description | Example |
|------------|-------------|---------|
| `v1.2.3` | Stable release | `v1.3.0` |
| `v1.2.3-rc.1` | Release candidate | `v1.3.0-rc.1` |
| `v1.2.3-beta.1` | Beta release | `v1.3.0-beta.1` |
| `v1.2.3-alpha.1` | Alpha release | `v1.3.0-alpha.1` |

---

## Hotfix Procedures

### When to Create a Hotfix

Create a hotfix when:
- **Critical Bug**: Production system is down or severely impacted
- **Security Vulnerability**: Security flaw discovered in production
- **Data Integrity**: Risk of data corruption or loss
- **User-Blocking Issue**: Users cannot perform critical actions

**Do NOT create hotfix for:**
- Minor bugs (use regular bugfix branch)
- Feature requests (use feature branch)
- Performance improvements (use regular development cycle)

### Hotfix Workflow

```bash
# 1. Verify production issue
# - Reproduce the bug
# - Confirm it's in production (main branch)
# - Assess impact and urgency

# 2. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/1.2.3-fix-payment-crash

# 3. Make the fix (keep changes minimal!)
# Only fix the immediate issue, don't refactor or add features
git add src/app/api/payments/route.ts
git commit -m "fix(payments): prevent crash when Stripe API is unavailable"

# 4. Test thoroughly
npm test
npm run build
# Manual testing in staging environment

# 5. Create PR to main (requires 1-2 approvers)
git push origin hotfix/1.2.3-fix-payment-crash

# PR title: "🚨 HOTFIX: Fix payment crash when Stripe unavailable (#999)"
# PR description: Clearly explain the issue and fix

# 6. After approval, merge to main
# Use "Squash and merge"

# 7. Create tag for hotfix version
git checkout main
git pull origin main
git tag -a v1.2.3 -m "Hotfix v1.2.3: Fix payment crash"
git push origin v1.2.3

# 8. Deploy to production immediately
# (Auto-deployment or manual deploy)

# 9. Merge hotfix to develop (to keep in sync)
git checkout develop
git pull origin develop
git merge main
git push origin develop

# 10. Monitor production for 1-2 hours
# Check error rates, performance metrics, user reports

# 11. Document incident
# Add to postmortem doc with:
# - What happened
# - Root cause
# - How it was fixed
# - How to prevent in future

# 12. Clean up
git branch -d hotfix/1.2.3-fix-payment-crash
git push origin --delete hotfix/1.2.3-fix-payment-crash
```

### Hotfix Checklist

```markdown
## Pre-Hotfix
- [ ] Confirm issue is in production (main branch)
- [ ] Assess impact (how many users affected?)
- [ ] Verify no existing fix in develop/staging
- [ ] Notify team in Slack/Discord

## During Hotfix
- [ ] Create hotfix branch from main
- [ ] Make minimal changes (fix only the immediate issue)
- [ ] Add test to prevent regression
- [ ] Test fix locally
- [ ] Test fix in staging (if time permits)
- [ ] Create PR with "hotfix" label
- [ ] Get fast-track approval (1-2 reviewers)
- [ ] Merge to main
- [ ] Create version tag
- [ ] Deploy to production

## Post-Hotfix
- [ ] Monitor production for 1-2 hours
- [ ] Merge to develop branch
- [ ] Update changelog
- [ ] Document incident in postmortem
- [ ] Schedule fix for root cause (if applicable)
- [ ] Clean up hotfix branch
```

---

## Git Best Practices

### Commit Frequently

```bash
# ❌ Bad: One massive commit
git add .
git commit -m "feat: implement entire payment system"
# (Changed 50 files, 2000+ lines)

# ✅ Good: Logical, incremental commits
git add src/lib/stripe.ts
git commit -m "feat(payments): add Stripe client initialization"

git add src/app/api/payments/route.ts
git commit -m "feat(payments): add payment processing endpoint"

git add src/components/PaymentForm.tsx
git commit -m "feat(payments): add payment form component"

git add tests/payments.test.ts
git commit -m "test(payments): add unit tests for payment processing"
```

### Keep Commits Focused

```bash
# ❌ Bad: Multiple unrelated changes
git add src/payments.ts src/emails.ts src/dashboard.tsx README.md
git commit -m "feat: various improvements"

# ✅ Good: One logical change per commit
git add src/payments.ts
git commit -m "feat(payments): add payment validation"

git add src/emails.ts
git commit -m "feat(emails): add payment confirmation template"

git add src/dashboard.tsx
git commit -m "feat(dashboard): add payment history widget"

git add README.md
git commit -m "docs: update setup instructions"
```

### Pull Before Push

```bash
# Always pull latest changes before pushing
git pull origin develop
git push origin feature/123-my-feature

# Or use rebase to avoid merge commits
git pull --rebase origin develop
git push origin feature/123-my-feature
```

### Use .gitignore Properly

```bash
# .gitignore for Next.js project
# See https://github.com/vercel/next.js/blob/canary/.gitignore

# Dependencies
/node_modules
/.pnp
.pnp.js

# Testing
/coverage
*.lcov

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
```

### Never Commit Secrets

```bash
# ❌ NEVER commit these files:
# .env
# .env.local
# .env.production
# config/secrets.json
# credentials.json

# If you accidentally committed secrets:

# 1. Remove from commit
git rm --cached .env
git commit -m "chore: remove .env from git"

# 2. Add to .gitignore
echo ".env" >> .gitignore
git add .gitignore
git commit -m "chore: add .env to .gitignore"

# 3. IMPORTANT: Rotate the exposed secrets immediately!
# The secret is now in git history, so you MUST change it

# 4. (Optional) Remove from git history completely
# WARNING: This rewrites history - coordinate with team first
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Then force push (dangerous!)
git push origin --force --all
```

### Use Git Hooks for Quality

We use Husky to enforce quality checks before commits:

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run linter
npm run lint

# Run type checker
npm run type-check

# Format code
npm run format

# If any of these fail, commit is aborted
```

```bash
# .husky/pre-push
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run all tests before push
npm test

# Run build to ensure it compiles
npm run build

# If tests or build fail, push is aborted
```

---

## Common Git Commands

### Daily Git Commands

```bash
# Clone repository
git clone git@github.com:YOUR_ORG/cd-construction.git

# Check current branch and status
git status
git branch

# Create new branch
git checkout -b feature/123-my-feature

# Switch branches
git checkout develop
git checkout main

# Pull latest changes
git pull origin develop

# Stage changes
git add src/file.ts                   # Stage specific file
git add src/                          # Stage directory
git add .                             # Stage all changes
git add -p                            # Stage interactively (review each change)

# Commit changes
git commit -m "feat: add feature"     # Simple commit
git commit                            # Opens editor for detailed message

# Push changes
git push origin feature/123-my-feature

# Push with upstream tracking
git push -u origin feature/123-my-feature

# View commit history
git log                               # Full log
git log --oneline                     # Compact log
git log --graph --all                 # Visual graph of branches
git log --author="John Doe"           # Commits by author
git log --since="2 weeks ago"         # Commits from timeframe
git log --grep="payment"              # Search commits by message

# View changes
git diff                              # Unstaged changes
git diff --staged                     # Staged changes
git diff develop...feature/123        # Compare branches
git diff HEAD~1 HEAD                  # Compare with previous commit

# View file history
git log -p src/file.ts                # File history with diffs
git blame src/file.ts                 # Line-by-line authorship
```

### Branch Management

```bash
# List branches
git branch                            # Local branches
git branch -r                         # Remote branches
git branch -a                         # All branches

# Create branch
git branch feature/123-my-feature     # Create (but don't switch)
git checkout -b feature/123-my-feature # Create and switch

# Rename branch
git branch -m old-name new-name       # Rename local branch
git push origin :old-name new-name    # Update remote

# Delete branch
git branch -d feature/123             # Delete local (safe - prevents if unmerged)
git branch -D feature/123             # Delete local (force)
git push origin --delete feature/123  # Delete remote

# Track remote branch
git branch --set-upstream-to=origin/develop develop
```

### Undoing Changes

```bash
# Discard unstaged changes
git checkout -- src/file.ts           # Discard changes in file
git checkout -- .                     # Discard all changes

# Unstage changes (keep changes in working directory)
git reset HEAD src/file.ts            # Unstage specific file
git reset HEAD                        # Unstage all

# Undo last commit (keep changes)
git reset --soft HEAD~1               # Undo commit, keep changes staged
git reset HEAD~1                      # Undo commit, keep changes unstaged
git reset --hard HEAD~1               # Undo commit, discard changes (dangerous!)

# Revert commit (creates new commit that undoes changes)
git revert abc123                     # Revert specific commit
git revert HEAD                       # Revert last commit

# Amend last commit
git commit --amend -m "Updated message" # Change commit message
git commit --amend --no-edit          # Add changes to last commit

# Discard all local changes and reset to remote
git fetch origin
git reset --hard origin/develop       # Reset to remote develop (dangerous!)
```

### Merging and Rebasing

```bash
# Merge branch
git checkout develop
git merge feature/123-my-feature      # Merge feature into develop
git merge --no-ff feature/123         # Force merge commit (preserves branch history)

# Abort merge (if conflicts)
git merge --abort

# Rebase branch
git checkout feature/123-my-feature
git rebase develop                    # Replay commits on top of develop

# Interactive rebase (squash, reorder, edit commits)
git rebase -i HEAD~5                  # Rebase last 5 commits
git rebase -i develop                 # Rebase all commits since develop

# Continue/abort rebase
git rebase --continue                 # After resolving conflicts
git rebase --abort                    # Cancel rebase

# Resolve conflicts
# 1. Edit conflicted files manually
# 2. Stage resolved files: git add src/file.ts
# 3. Continue merge/rebase: git merge --continue or git rebase --continue
```

### Stashing Changes

```bash
# Stash uncommitted changes
git stash                             # Stash all changes
git stash save "WIP: payment feature" # Stash with message

# List stashes
git stash list

# Apply stash
git stash apply                       # Apply most recent stash (keep stash)
git stash apply stash@{1}             # Apply specific stash
git stash pop                         # Apply and remove most recent stash

# View stash contents
git stash show                        # Summary
git stash show -p                     # Full diff

# Delete stash
git stash drop stash@{1}              # Delete specific stash
git stash clear                       # Delete all stashes
```

### Tagging

```bash
# Create tag
git tag v1.0.0                        # Lightweight tag
git tag -a v1.0.0 -m "Release v1.0.0" # Annotated tag (recommended)

# List tags
git tag                               # All tags
git tag -l "v1.*"                     # Filter tags

# View tag details
git show v1.0.0

# Push tags
git push origin v1.0.0                # Push specific tag
git push origin --tags                # Push all tags

# Delete tag
git tag -d v1.0.0                     # Delete local tag
git push origin :refs/tags/v1.0.0     # Delete remote tag

# Checkout tag
git checkout v1.0.0                   # Checkout specific version (detached HEAD)
```

---

## Troubleshooting

### Problem: Merge Conflicts

```bash
# Scenario: Merge conflict when pulling/merging

$ git pull origin develop
Auto-merging src/app/api/leads/route.ts
CONFLICT (content): Merge conflict in src/app/api/leads/route.ts
Automatic merge failed; fix conflicts and then commit the result.

# Solution:

# 1. Open conflicted file
# Conflict markers look like:
<<<<<<< HEAD (Current Change)
const status = 'new';
=======
const status = 'pending';
>>>>>>> feature/123 (Incoming Change)

# 2. Edit file to resolve conflict
# Remove conflict markers and choose correct code:
const status = 'new';  # Or 'pending', or combine both

# 3. Stage resolved file
git add src/app/api/leads/route.ts

# 4. Complete merge
git commit -m "fix: resolve merge conflict in leads API"

# Or abort merge
git merge --abort
```

### Problem: Accidentally Committed to Wrong Branch

```bash
# Scenario: You committed to main instead of feature branch

# Solution:

# 1. Create feature branch (with your commits)
git branch feature/123-my-commits

# 2. Reset main to before your commits
git reset --hard origin/main

# 3. Switch to feature branch
git checkout feature/123-my-commits

# Your commits are now on the correct branch!
```

### Problem: Need to Undo Last Commit

```bash
# Scenario: Last commit has a mistake

# Solution 1: Keep changes, undo commit
git reset --soft HEAD~1
# Edit files
git add .
git commit -m "Fixed commit message"

# Solution 2: Amend last commit
git add forgotten-file.ts
git commit --amend --no-edit

# Solution 3: Revert commit (creates new commit)
git revert HEAD
```

### Problem: Pushed to Wrong Branch

```bash
# Scenario: Pushed commits to develop instead of feature branch

# Solution (if no one else has pulled):

# 1. Delete remote commits
git push origin develop --force-with-lease

# 2. Create correct branch
git checkout -b feature/123-my-feature
git push origin feature/123-my-feature

# WARNING: Only do this if no one else has pulled the bad commits!
```

### Problem: Large File Committed by Mistake

```bash
# Scenario: Accidentally committed large file (video, database dump, etc.)

# Solution:

# 1. Remove from current commit
git rm --cached large-file.mp4
git commit --amend -C HEAD

# 2. Add to .gitignore
echo "large-file.mp4" >> .gitignore
git add .gitignore
git commit -m "chore: add large-file.mp4 to .gitignore"

# 3. If already pushed, remove from history
# (Use BFG Repo-Cleaner - easier than git-filter-branch)
java -jar bfg.jar --delete-files large-file.mp4 cd-construction
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

### Problem: Detached HEAD State

```bash
# Scenario: You checked out a commit directly

$ git checkout abc123
Note: switching to 'abc123'.
You are in 'detached HEAD' state...

# Solution 1: Create branch from current state
git checkout -b new-branch-name

# Solution 2: Go back to branch
git checkout develop
```

### Problem: Rebase Gone Wrong

```bash
# Scenario: Rebase created conflicts or unwanted changes

# Solution: Abort rebase
git rebase --abort

# This will return you to the state before rebase started

# If you've already completed the rebase:
git reflog  # Find commit SHA before rebase
git reset --hard abc123  # Reset to that commit
```

---

## Summary Checklist

### Before Starting Work
- [ ] Pull latest changes from develop
- [ ] Create feature/bugfix branch with proper naming
- [ ] Understand the issue/feature requirements

### While Working
- [ ] Make small, focused commits
- [ ] Write clear commit messages (Conventional Commits format)
- [ ] Keep branch up-to-date with develop (rebase regularly)
- [ ] Write/update tests for your changes
- [ ] Update documentation if needed

### Before Creating PR
- [ ] Rebase on latest develop
- [ ] Run tests locally (npm test)
- [ ] Run linter (npm run lint)
- [ ] Run type checker (npm run type-check)
- [ ] Build succeeds (npm run build)
- [ ] Self-review your changes

### During Code Review
- [ ] Respond to feedback constructively
- [ ] Make requested changes promptly
- [ ] Resolve all conversations
- [ ] Re-request review after changes

### After Merge
- [ ] Delete feature branch (local and remote)
- [ ] Pull latest develop
- [ ] Verify deployment succeeded
- [ ] Close related issues

---

**Remember**: Good Git practices lead to:
- ✅ Clean, understandable history
- ✅ Easy debugging and rollback
- ✅ Smooth collaboration
- ✅ Faster code reviews
- ✅ Higher code quality

**When in doubt**: Ask the team! It's better to ask than to make a mistake that affects everyone.
