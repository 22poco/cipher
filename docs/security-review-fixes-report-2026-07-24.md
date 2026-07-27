# Security Review Fixes Report

Date: 2026-07-24

## Scope

This report documents the fix pass for the assessment and SSO review findings
identified in the current AP Cybersecurity practice foundation diff. The scope
is limited to backend authorization, assessment integrity, public payload
sanitization, support-signal provenance, and Google SSO runtime dependency
support.

## Implemented Fixes

| Review finding | Resolution | Code path |
| --- | --- | --- |
| Network auto-check trusted `traffic_tests[*].expected` from student draft evidence. | Network scoring now reads only student firewall rules from attempt evidence and reads traffic tests plus expected outcomes from mission `activity_json`. | `backend/services/autocheck.py` |
| Mission detail returned raw multiple-choice activity with `answer_index`. | A shared `public_activity` serializer strips `answer_index` before mission activity is returned to student-facing routes. | `backend/services/serializers.py`, `backend/routers/missions.py`, `backend/routers/attempts.py` |
| Student-supplied `assignment_id` was accepted without checking mission and section ownership. | Attempt start now resolves supplied and default assignment ids through active section enrollment and mission matching. Unauthorized supplied ids return `403`. | `backend/routers/attempts.py` |
| Draft writes could mutate submitted, reviewed, graded, or returned attempts. | Draft save, submit, and student auto-check now require an editable attempt status: `assigned`, `started`, or `draft_saved`. Locked attempts return `409`. | `backend/routers/attempts.py` |
| Student support event endpoint trusted client-supplied `source`. | The student route now always stores support events with `source="student"`. | `backend/routers/attempts.py` |
| Google ID token verification used RS256 without declaring PyJWT crypto support. | The root backend dependency file now declares `PyJWT[crypto]`. | `requirements.txt` |

## Definition Of Done

The review fix pass is done when all of the following are true:

1. Assessment scoring does not rely on student-controlled answer keys or
   expected network outcomes.
2. Student-facing mission and attempt activity payloads do not expose
   multiple-choice `answer_index` values.
3. A supplied assignment id must match the requested mission and one of the
   student's active class sections before an attempt can be created.
4. Student evidence cannot be changed after the attempt leaves the editable
   statuses: `assigned`, `started`, or `draft_saved`.
5. Student support timeline events cannot impersonate `system`, `teacher`, or
   other server-owned sources.
6. A clean backend install includes the dependency support required to verify
   Google RS256 ID tokens.
7. Backend Python files compile successfully after the changes.
8. A direct evaluator check confirms that tampering with draft
   `traffic_tests[*].expected` does not change network scoring.

## Verification

Completed checks:

```text
python -m py_compile backend/services/serializers.py backend/routers/missions.py backend/routers/attempts.py backend/services/autocheck.py backend/services/google_oauth.py backend/routers/auth.py
python -c "... evaluate_network tamper check and public_activity answer-key check ..."
python -m compileall -q backend
```

Observed results:

- Backend compilation completed without errors.
- The direct network tamper check returned `0/1` when the student draft claimed
  an allowed expected outcome but the mission-owned expectation was blocked.
- The direct public activity check returned a multiple-choice question payload
  without `answer_index`.

## Remaining Risk

No backend test suite is currently present in the repository, so these fixes are
verified by compilation plus targeted direct checks rather than regression
tests. The next hardening pass should add API tests for assignment authorization,
locked-attempt writes, sanitized mission payloads, support event source
provenance, and network auto-check tamper resistance.
