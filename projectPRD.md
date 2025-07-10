# Summer Hoops Scheduler PRD

## TL;DR

Organizing weekly pick-up basketball for a large group is chaotic: schedules change, spots must be swapped, and it’s tough to keep everyone coordinated. **Summer Hoops Scheduler** solves this by providing personalized, mobile-first visibility of each player’s sessions, plus seamless flows to swap or give up slots—with notifications and real-time updates. Built for a group of 16 basketball friends who rely on a shared Google Spreadsheet as the source of truth.

---

## Goals

### Business Goals
- Minimize admin time spent on scheduling and manual coordination by **75%**
- Ensure every player can reliably see their real-time play schedule across 6 weeks
- Enable **90%+** of swap and give-up requests to be completed without organizer intervention
- Foster smooth communication between players for spot management

### User Goals
- Instantly access a personalized view of my hours (when, which hour, with whom)
- Easily initiate or accept swaps/give-ups for my sessions
- Get notified (and confirm) when my slot changes
- Avoid missing a game due to confusion or overlooked changes

### Non-Goals
- Processing payments or managing financial transactions
- Tracking detailed basketball stats or performance analytics
- Supporting non-basketball events or multi-team scheduling

---

## User Stories

### Personas
- **Player** (anyone in the 16-person group)
- **Admin/Organizer** (person who oversees the main schedule and access)

#### Player
- As a Player, I want to log in and see only my assigned sessions, so that I always know when I'm playing.
- As a Player, I want to offer my session to the group if I can't make it, so I avoid leaving a team short-handed.
- As a Player, I want to propose a swap with another specific player, so we can coordinate based on our preferences.
- As a Player, I want to accept someone’s offered session, so I can play more if I want.
- As a Player, I want to receive notifications when my slot is swapped/given up/confirmed, so I never miss important changes.
- As a Player, I want to confirm when I’ve accepted an offered slot, to avoid accidental overlaps or overbooking.

#### Admin/Organizer
- As an Organizer, I want to see the overall schedule and recent swaps, so I can quickly resolve any issues.
- As an Organizer, I want to receive alerts about pending/unresolved swaps or give-ups, so I can help as needed.
- As an Organizer, I want to export or sync final attendance lists to the original spreadsheet.

---

## Functional Requirements

### Schedule Display (**Priority: High**)
- Personalized dashboard showing each player’s sessions by week, including date, hour, and current roster
- Ability to see detailed slot info (e.g., which players are in each hour)

### Joining/Leaving/Swapping Sessions (**Priority: High**)
- Offer up a slot for the group (give-up flow)
- Directly propose a swap to another available player
- Accept a given-up session from the open pool, with instant confirmation
- Track pending and completed swaps/give-ups for both offerer and taker

### Notifications (**Priority: Medium**)
Send email (and, if feasible, push) notifications for:
- Swap/give-up offered
- Swap/give-up accepted
- Schedule changes and confirmations

### Authentication & Access (**Priority: High**)
- Google Authentication (required for login/usage)
- Admin permissions to allow elevated schedule editing

### Admin Controls (**Priority: Nice-to-have**)
- “Fix” tool to override or adjust any assignment in case of error
- Export weekly schedule/attendance
- Activity log for troubleshooting

---

## User Experience

### Entry Point & First-Time User Experience
- Users receive an invite link and log in via Google Authentication, ensuring seamless onboarding
- First login presents a brief explainer—“See your schedule, swap/give up spots, and never miss your game!”
- No manual account creation or app download required; fully web-based with home screen install option

### Core Experience

#### Login
- Player logs in using Google; instantly recognized and authenticated
- On initial login, user is matched to their identity in the group roster
- Any issues with recognition are directed to organizer via clear, friendly message

#### Viewing Schedule
- Dashboard displays personalized weekly view:
  - Dates, times, assigned hours (first, second, both)
  - Remaining available slots for each session (for potential swaps)
  - Clean visual cues for upcoming/current week

#### Offering Up a Spot
- Player selects a specific slot, taps “Offer Up,” chooses to:
  - Give up to anyone (added to a “free” pool), or
  - Propose a swap (select another player/session)
- Player adds (optional) note or reason

#### Accepting a Swap/Give-Up
- Browsable list of open slots for each week
- Tap to “Claim” a given-up spot, or accept a swap request
- Confirmation modal appears: “Confirm—take Monday 1st Hour?”
- Upon confirmation, both parties receive notifications; schedule and spreadsheet reflect the change

#### Confirming Changes
- Both giver and taker see updated schedules in real time
- System logs changes and provides undo option within 10 minutes

#### Edge Cases
- If all slots in a session are full, users see a message and can join a waitlist
- Errors in sync (e.g., spreadsheet temporarily unavailable) prompt a retry, never lose requests
- If multiple users claim the same slot simultaneously, let the first complete; others see “already taken.”

#### Advanced Features & Edge Cases
- Undo/rollback for accidental swaps within a short grace period
- Admin “override” for last-minute emergencies or technical issues

#### UI/UX Highlights
- Responsive mobile-first layouts, touch-friendly controls
- Color-blind safe palette for visual schedule distinctions
- Large tap targets and text for use in gyms/with gloves
- Accessibility: all flows screen-reader navigable
- Strict minimalism—no clutter, focused on quickly answering “when am I playing?”

---

## Narrative

> It’s the third week of Summer Hoops, and James is having trouble remembering which hour he’s playing tonight—was it the first, second, or both? He pulls out his phone, logs into Summer Hoops Scheduler, and instantly sees his personalized schedule—second hour, alongside his friends Mike, Ayo, and Ben.
>
> Suddenly, James finds out he can’t make the game. In two taps, he offers up his spot to the group. Within minutes, Mike claims the slot using a notification he receives—everyone’s schedule updates in real time. No frantic group texts, no messy manual updates, and no worry that someone gets left out or teams are uneven.
>
> With Summer Hoops Scheduler, everyone always knows where they stand. The group runs more smoothly, last-minute scramble is replaced by effortless coordination, and playing basketball is fun again, not frustratingly complicated.

---

## Success Metrics

### User-Centric Metrics
- **Active Users:** % of players logging in each week (target: 90%+)
- **Session Awareness:** <10% of players express “uncertainty about my upcoming slot”
- **Self-Serve Slot Changes:** 80% of swap/give-up transactions completed without organizer intervention

### Business Metrics
- **Organizer Time Saved:** Measured reduction in hours spent on manual coordination (target: 75% reduction)
- **Failed/Forgotten Sessions:** Fewer than 1 “no show due to confusion” per season

### Technical Metrics
- **Sheet Sync Success:** >99% sync reliability with Google Sheet (no dropped/failed updates)
- **Notification Delivery:** 98%+ notification deliverability & “read” rate

### Tracking Plan
- Logins per week
- Schedule view per user per week
- Offer up slot (initiated/completed)
- Swap requested (initiated/completed)
- Give-up claimed by another user
- Notification sent (by type)
- Schedule sync success/failure and retry logs

---

## Technical Considerations

### Technical Needs
- **Frontend:** Mobile-first (responsive web app), simple personalized dashboard, no installation required
- **Backend:** Server logic to handle schedule queries, swap/give-up logic, and notification triggers
- **Auth:** Google OAuth for all user login and matching
- **Data Layer:** Read/write integration with Google Sheets (API), ensuring updates visible in both app and sheet

### Integration Points
- **Google Sheets:** Single sheet as main data source; update/read with real-time sync
- **Email Provider:** Transactional email service for notifications (e.g., SendGrid, Mailgun—or Google directly)
- (Optional) Push notifications if user allows

### Data Storage & Privacy
- Store only essential data: schedule, user email for login/notifications, action logs for 6-week season
- No personal data beyond basketball usage; auto-delete after season if possible
- Users see only their data and slots; admin has broader access

### Scalability & Performance
- Designed for 16–20 simultaneous users; low-latency updates, graceful handling of Google API rate limits
- Handles ~100 daily actions with quick read/write cycles

### Potential Challenges
- Google Sheets API: latency, consistency, and potential downtime
- Concurrency: racing swaps or conflicting edits—need transaction-like resolution (“first confirmed wins”)
- Email deliverability: handling bounces, spam filtering
- Data privacy: ensure access limited to group, minimize risk if accounts are re-used

---

## Milestones & Sequencing

### Project Estimate
**Medium Project:** 6 weeks (lean, 1–2 devs + product/design support)

### Team Size & Composition
- 1 full-stack developer
- 1 product/design lead (can be the organizer)
- Occasional organizer spot-checks and player feedback

### Suggested Phases

1. **Setup & Authentication (Week 1)**
   - Deliverables: Google Auth login, user matching to roster, blank schedule view
   - Dependencies: Google Auth setup, sample data from spreadsheet
2. **Schedule Integration (Week 2)**
   - Deliverables: Connect to Google Sheet, personalized dashboard display for all users
   - Dependencies: Google Sheets API credentials
3. **User Dashboard & Core Flows (Weeks 3–4)**
   - Deliverables: Give-up/offer slot flow, swap initiation, swap acceptance, live schedule updates
   - Dependencies: Working backend logic, user feedback
4. **Notifications (Week 5)**
   - Deliverables: Email notifications on swap/give-up events, admin notifications for flagged events
   - Dependencies: Email service integration
5. **Testing & Refinement (Week 6)**
   - Deliverables: End-to-end test with full group, bug fixes, performance tweaks, usability polish
   - Dependencies: Real user testing, organizer review

### Post-MVP / Nice-to-have
- Admin controls, undo/rollback
- Attendance logs/export

