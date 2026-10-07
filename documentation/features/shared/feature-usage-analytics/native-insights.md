# Native PostHog insight setup

Use the browser events below to configure native Product Analytics insights in
the PostHog UI. This is setup guidance only: no insight is saved or verified by
this implementation. Use separate PostHog projects and project tokens for
staging and production. Enable collection only after the target project has its
**Discard IP data** setting configured.

All workflow events include `workflow`; occurrence events include the opaque
`workflow_id`. Where authentication is resolved, events carry event-time
`establishment_id` and `role`. These event properties describe the context when
the observation happened. They do not follow later person-profile changes.
People become connected across anonymous onboarding and a resolved account
through PostHog's identify linkage. Do not compare raw `distinct_id` values as
though they were a stable person key.

## Activation funnel

Create a person funnel with these steps in order:

1. `onboarding_started`
2. `onboarding_registration_completed`
3. `email_confirmation_completed`
4. `feature_visited` filtered to `feature` equals `products`
5. `workflow_completed` filtered to `workflow` equals `product_creation`

Use unique merged people and a seven-day conversion window. Allow unrelated
events between steps. This shows a person's first qualifying product completion
after confirmation; it is not attempt-level conversion. Local workflow IDs help
inspect a known same-browser attempt, but the native person funnel does not
require matching IDs between steps. Do not describe the result as a per-attempt
funnel or infer cross-device confirmation linkage.

## Workflow conversion and friction

For `product_creation`, `stock_entry`, `stock_write_off`, and `production`, inspect
`workflow_started` against `workflow_completed`, filtered to the same `workflow`.
Match the same `workflow_id` when interpreting an individual occurrence. Native
event inspection can show that pairing; independent aggregate counts are not a
matched-attempt conversion rate.

Review friction separately by event family:

- `workflow_validation_failed`, broken down by `fields`;
- `workflow_blocked`, broken down by `phase`, `failure_code`, and `fields`;
- `workflow_failed`, broken down by `phase`, `failure_code`, and optional
  `status_class`.

Use the event-time `establishment_id` and `role` breakdowns where helpful. These
events are observations of browser outcomes, not authoritative transaction or
stock-history records.

## Completion time

Create trends for numeric `duration_ms` on
`onboarding_registration_completed`, `email_confirmation_completed` when the
browser has safe timing continuity, and `workflow_completed`. Select the mean
statistic initially and label the chosen statistic in the insight description.
Unknown durations are omitted. The activation funnel's elapsed conversion time
is different from one workflow's elapsed completion time.

## Weekly feature adoption

Trend unique identified people with `feature_visited`, split by `feature` and,
when supported, event-time `establishment_id` and `role`. Configure the project
timezone as `America/Sao_Paulo` and the week to start on Monday. Report the count
of observed people; it is not a percentage of every licensed establishment
member.

## Feature return

Use recurring retention with `feature_visited` as both the initial and return
event, holding the same `feature` constant. Create a separate insight per feature
if the native UI cannot hold that property constant. Set the return period to
Week, choose strict calendar intervals (`strict_calendar_dates`), and use
retention **On** the interval rather than cumulative **On or after**. Week 1 is
the next calendar week relative to the cohort's first interval. This measures a
next-calendar-week return, not a rolling seven-day return or multiple uses in
one week.

## Workflow return

Use recurring retention with `workflow_completed` as the initial and return
event, holding one operational `workflow` constant. Use separate insights for
`product_creation`, `stock_entry`, `stock_write_off`, and `production` so one
workflow cannot satisfy another workflow's return. Keep the same project
timezone, Monday week start, Week period, strict calendar intervals, and **On**
return mode. Onboarding activation is a one-time funnel, not an operational
repeat-use cohort.

The insight's displayed lookback range is separate from its fixed conversion or
retention interval. Choose a useful lookback for the question being reviewed;
do not interpret a shorter display range as changing the seven-day funnel or
calendar-week retention definition.

## Limits

Collection can be delayed or blocked, creating gaps. Cross-device confirmation
may have no local start or duration, and this browser-only implementation cannot
link it to the original browser without backend support. A successful browser
response is observational evidence, not an authoritative transaction count.
Instrumentation is future-only and has no historical backfill. Next-week return
requires time-spanning observations or controlled staging fixtures; opening an
empty retention insight does not prove that return behavior occurred.
