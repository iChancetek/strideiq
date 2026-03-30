# Task List: StrideIQ Elite Tier - Performance & GPT-5.4 Upgrade

- [x] **Phase 1: Performance Optimization**
  - [x] Update `src/db/schema.ts` with database indexes for activities and fasting.
  - [x] Optimize `useActivities.ts` fetching with SWR-like caching or limit/pagination.
  - [x] Ensure "zero-wait" load for dashboard components.

- [x] **Phase 2: GPT-5.4 Universal Upgrade**
  - [x] Upgrade AI Coach (`/api/ai/coach`) to GPT-5.4.
  - [x] Upgrade Training Plan (`/api/training/generate`) to GPT-5.4.
  - [x] Upgrade AI Chat (`/api/chat`) to GPT-5.4.
  - [x] Upgrade Voice Command (`/api/ai/voice-command`) to GPT-5.4.
  - [x] Add GPT-5.4 insights for Leaderboards and Step consistency.
  - [x] Add post-session AI analysis for Meditation and Fasting.

- [x] **Phase 3: Universal Media Support**
  - [x] Integrate media capture in `ManualActivityModal.tsx`.
  - [x] Integrate media capture in `LogActivityForm.tsx`.
  - [x] Update `FastingTimer.tsx` to include media enrichment on completion.

- [x] **Phase 4: Elite Branding**
  - [x] Update landing page and dashboard copy (respecting "Intelligent Movement. Agentic Performance").
  - [x] Refine AI Coach personality for elite technical depth.

- [x] **Phase 5: Verification**
  - [x] Perform end-to-end check of media saving across all modes.
  - [x] Audit model generation response to confirm GPT-5.4 signatures.
  - [x] Verify instant load time on the dashboard history.
