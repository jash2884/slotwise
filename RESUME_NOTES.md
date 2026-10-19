# Resume wording

Use these only after reviewing the code and being able to explain the implementation. Do not claim real users, latency improvements, business impact, or independent authorship without evidence.

**Slotwise — Mentor Scheduling Platform**

React, TypeScript, Vinext, Cloudflare Workers, D1/SQLite, Drizzle, Zod

- Built a full-stack scheduling application with mentor discovery, authenticated booking, availability management, timezone-aware display, and calendar export.
- Enforced conflict-free slot reservations with partial unique indexes and transactional audit events; verified a single successful reservation across 20 concurrent booking attempts.
- Implemented booking ownership checks, cancellation/rebooking, and idempotent request handling, backed by automated HTTP integration tests and a GitHub Actions workflow.

The concurrency figure is a local correctness test, not a production throughput claim. The workflow is provided in source; do not claim a hosted GitHub Actions run until this source has been pushed to GitHub and that run passes.

Before using a live link on your resume, verify that the site's access policy lets recruiters open it. A private deployment is a review link, not an unrestricted public demo.
