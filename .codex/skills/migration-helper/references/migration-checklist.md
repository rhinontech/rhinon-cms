# Migration Checklist

Use this checklist as a base and trim anything that does not apply.

## 1. Discovery

- Define the migration scope in one sentence.
- Record the source system, target system, and compatibility window.
- Name the owner and the final approver.
- Identify blockers, external dependencies, and freeze windows.
- Decide whether the migration is offline, rolling, dual-write, or feature-flagged.

## 2. Data and State

- List the data that must move, be transformed, or be re-derived.
- Record the source of truth during the migration window.
- Define backfill strategy, idempotency expectations, and integrity checks.
- Capture any required schema changes and order them safely.

## 3. Application Changes

- List code paths that must support both old and new systems.
- Identify temporary adapters, shims, or compatibility layers.
- Define feature flags, guardrails, and fallback behavior.
- Confirm logging, metrics, and alerts cover both pre-cutover and post-cutover states.

## 4. Cutover Plan

- Pick the cutover trigger and exact success criteria.
- Define the command sequence or deployment order.
- State who watches logs, metrics, and user-facing flows during cutover.
- Document communication steps before, during, and after the switch.

## 5. Validation

- Verify health checks, critical user flows, and data integrity.
- Compare key counts, checksums, or representative records.
- Confirm dashboards, alerts, and background jobs are healthy.
- Record how long validation should run before declaring success.

## 6. Rollback

- State the rollback trigger conditions.
- Define the rollback command sequence.
- Clarify whether rollback is lossless, partial, or requires manual cleanup.
- Document any side effects that remain after rollback.

## 7. Closeout

- Remove temporary compatibility code.
- Archive migration artifacts and final status.
- Capture follow-up cleanup tasks and lessons learned.
