---
name: Database Migration
about: Propose a database schema change
title: '[DB] '
labels: database, migration
assignees: ''
---

## Migration Overview

<!-- Brief description of the database change -->

## Reason for Change

<!-- Why is this migration needed? What problem does it solve? -->

## Schema Changes

### Tables

**New Tables:**
<!-- List any new tables to be created -->

```sql
-- Example:
CREATE TABLE new_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);
```

**Modified Tables:**
<!-- List tables being modified (add/drop columns, constraints, etc.) -->

- Table: `table_name`
  - [ ] Add column: `column_name type`
  - [ ] Drop column: `column_name`
  - [ ] Modify column: `column_name` (from `old_type` to `new_type`)
  - [ ] Add constraint: description
  - [ ] Drop constraint: constraint_name

**Dropped Tables:**
<!-- List tables to be dropped (use with extreme caution) -->

- [ ] `table_name` - Reason:

### Indexes

**New Indexes:**
```sql
CREATE INDEX idx_name ON table_name(column);
```

**Dropped Indexes:**
```sql
DROP INDEX idx_name;
```

### RLS Policies

**New Policies:**
```sql
CREATE POLICY "policy_name"
  ON table_name
  FOR operation
  TO role
  USING (condition);
```

**Modified Policies:**
- Policy: `policy_name` on `table_name`
  - Change description

**Dropped Policies:**
- [ ] `policy_name` on `table_name` - Reason:

## Data Migration

**Is data migration required?**
- [ ] No data migration needed
- [ ] Data transformation required
- [ ] Data backfill required

**Migration Strategy:**
<!-- If yes, describe how existing data will be migrated -->

```sql
-- Example data migration
UPDATE table_name SET new_column = old_column WHERE condition;
```

## Breaking Changes

**Is this a breaking change?**
- [ ] No, fully backwards compatible
- [ ] Yes, requires application changes
- [ ] Yes, requires API version bump

**Impact:**
<!-- Describe what will break and what needs to be updated -->

- [ ] API routes need updates
- [ ] Frontend components need updates
- [ ] External integrations affected
- [ ] Mobile app affected (future)

## Rollback Plan

**Can this migration be rolled back?**
- [ ] Yes, easily reversible
- [ ] Partially (some data may be lost)
- [ ] No, requires careful planning

**Rollback Steps:**
```sql
-- SQL to rollback this migration
```

## Testing Plan

### Local Testing

- [ ] Test migration on clean local database
- [ ] Test rollback on local database
- [ ] Verify RLS policies work correctly
- [ ] Test with seed data
- [ ] Verify no performance degradation

### Staging Testing

- [ ] Apply to staging environment
- [ ] Verify data integrity
- [ ] Test API endpoints
- [ ] Performance testing
- [ ] Load testing (if significant change)

## Deployment Plan

**Deployment Steps:**

1. [ ] Backup production database
2. [ ] Apply migration to staging
3. [ ] Smoke test staging
4. [ ] Schedule production maintenance window
5. [ ] Apply migration to production
6. [ ] Verify production functionality
7. [ ] Monitor logs and metrics

**Downtime Required:**
- [ ] No downtime expected
- [ ] Brief downtime (< 5 minutes)
- [ ] Planned maintenance window needed (duration: ___)

**Deployment Schedule:**
<!-- When should this be deployed? -->

## Dependencies

**Requires:**
<!-- List any dependencies -->

- [ ] Application code changes (PR #)
- [ ] Environment variable changes
- [ ] External service updates
- [ ] Other migrations (issue #)

**Blocks:**
<!-- List what this blocks -->

- Issue #
- Feature:

## Security Considerations

- [ ] No sensitive data exposed
- [ ] RLS policies properly configured
- [ ] No SQL injection risks
- [ ] Proper column permissions
- [ ] Audit logging maintained

## Performance Impact

**Expected Impact:**
- [ ] No performance impact
- [ ] Improved performance
- [ ] Potential performance degradation

**Index Analysis:**
<!-- Will indexes handle expected query load? -->

**Row Estimates:**
- Current rows: ~X
- Expected growth: Y/month

## Code Generation

**TypeScript types need regeneration?**
- [ ] Yes, run `supabase gen types typescript`
- [ ] No, schema structure unchanged

## Validation Checklist

- [ ] Migration file named correctly: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
- [ ] Migration includes proper comments
- [ ] All foreign keys have proper constraints
- [ ] All tables have RLS enabled
- [ ] All policies tested and documented
- [ ] Seed data updated if needed
- [ ] Migration tested on clean database
- [ ] Rollback plan documented and tested
- [ ] No sensitive data in migration file
- [ ] Performance impact analyzed

## Additional Context

<!-- Any other relevant information -->

## Migration SQL

<!-- Paste the actual migration SQL here for review -->

```sql
-- Paste migration SQL
```
