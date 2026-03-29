# Xyloquent Branch OS

## Training Manual

**Version 1.0 | March 2026**
**Franchise & Multi-Branch Operations Platform**

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [User Roles & Access Levels](#3-user-roles--access-levels)
4. [Scenario: A Day at Xyloquent Corp](#4-scenario-a-day-at-xyloquent-corp)
5. [Module Guide: HQ Dashboard](#5-module-guide-hq-dashboard)
6. [Module Guide: Branch Registry](#6-module-guide-branch-registry)
7. [Module Guide: Audit Management](#7-module-guide-audit-management)
8. [Module Guide: Issue Tracking](#8-module-guide-issue-tracking)
9. [Module Guide: Escalation Engine](#9-module-guide-escalation-engine)
10. [Module Guide: Promo Execution Checks](#10-module-guide-promo-execution-checks)
11. [Module Guide: Stock Requests](#11-module-guide-stock-requests)
12. [Module Guide: SOP Library](#12-module-guide-sop-library)
13. [Role-Based Dashboard Walkthroughs](#13-role-based-dashboard-walkthroughs)
14. [API Reference](#14-api-reference)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Introduction

### What is Xyloquent Branch OS?

Xyloquent Branch OS is a centralized operating layer for franchise and multi-branch organizations. It helps headquarters teams standardize audits, enforce SOPs, route issues through deterministic escalation workflows, validate promo execution, and maintain chain-wide visibility from a single control surface.

### Who is it for?

| Role | Why They Use It |
|------|----------------|
| HQ Operations Director | Monitor compliance, risk, and intervention priorities across all branches |
| Franchise Operations Manager | Review audits, issues, escalations, and branch performance |
| Regional Manager | Validate submissions and follow up on corrective actions in their region |
| Area Manager | Oversee branches in their area with compliance tracking |
| Branch Manager | Submit audits, handle issues, request stock, confirm promos |
| Field Auditor | Run audits, record findings, capture branch evidence |
| Executive Viewer | Review dashboards and operating trends without changing records |

### Key Principles

1. **Operational truth first** - The system is the source of truth for audits, issues, approvals, and escalations
2. **Deterministic workflow backbone** - State changes are rules-based, permission-controlled, and fully auditable
3. **Evidence-based governance** - Key records are backed by notes, timestamps, and user attribution
4. **Scale through hierarchy** - Supports HQ, region, area, and branch without changing operating logic

---

## 2. Getting Started

### Logging In

1. Open your browser and navigate to the Xyloquent Branch OS URL
2. You will see the **Welcome back** login screen
3. Enter your **email address** and **password**
4. Click **Sign in**

**Demo Accounts:** Click the "Demo accounts" section below the login form to see all available test accounts. Click any account to auto-fill the credentials. All demo accounts use the password: `demo`

| Demo Account | Role | Scope |
|-------------|------|-------|
| sandra.chen@xyloquent.com | HQ Operations Director | Global access |
| marcus.williams@xyloquent.com | Franchise Operations Manager | Network-wide |
| david.park@xyloquent.com | Regional Manager | North Region |
| priya.sharma@xyloquent.com | Regional Manager | South Region |
| emma.torres@xyloquent.com | Area Manager | NYC Area |
| james.okonkwo@xyloquent.com | Area Manager | Boston Metro |
| carlos.rivera@xyloquent.com | Branch Manager | Downtown Flagship |
| leo.fernandez@xyloquent.com | Branch Manager | Times Square North |
| rachel.kim@xyloquent.com | Branch Manager | Lexington Ave |
| aisha.patel@xyloquent.com | Field Auditor | Assigned audits |
| nathan.brooks@xyloquent.com | Field Auditor | All audits |
| olivia.grant@xyloquent.com | Executive Viewer | Read-only global |

### Security Notes

- Passwords are encrypted with bcrypt hashing
- Sessions are stored in secure, httpOnly cookies
- Login is rate-limited: 5 failed attempts per email within 15 minutes triggers a lockout
- All API endpoints require authentication

### Navigating the Interface

After login, you will see:

- **Top Navigation Bar** - Shows your role, notification bell, settings gear, and avatar with logout dropdown
- **Left Sidebar** - Navigation links to all 8 modules plus a "New Audit" quick action button
- **Main Content Area** - Your role-appropriate dashboard or module page

**Logging Out:** Click your avatar (initials circle) in the top-right corner, then click **Sign out** from the dropdown menu.

---

## 3. User Roles & Access Levels

### Permission Matrix

| Permission | HQ Director | Franchise Mgr | Regional Mgr | Area Mgr | Branch Mgr | Field Auditor | Executive Viewer |
|-----------|:-----------:|:-------------:|:------------:|:--------:|:----------:|:-------------:|:----------------:|
| View all data | Global | Global | Region only | Area only | Branch only | Assigned only | Global |
| Create records | Yes | Yes | Yes | Yes | Yes | Yes | No |
| Update records | Yes | Yes | Yes | Yes | No | No | No |
| Delete records | Yes | Yes | Yes | Yes | No | No | No |
| Action buttons visible | Yes | Yes | Yes | Yes | Yes | Yes | No |

### Data Scoping (What You Can See)

**HQ Director, Franchise Manager, Executive Viewer:** See all branches, audits, issues, and operations across the entire network.

**Regional Manager:** See only branches, audits, issues, and operations within your assigned region. For example, David Park (North Region) sees the 7 branches in NYC Area and Boston Metro.

**Area Manager:** See only branches, audits, issues, and operations within your assigned area. For example, Emma Torres (NYC Area) sees only the branches in Manhattan.

**Branch Manager:** See only your assigned branch's data. Carlos Rivera sees only "Downtown Flagship" - its audits, issues, stock requests, and promo checks.

**Field Auditor:** See only audits assigned to you and issues raised from those audits.

### Automatic Dashboard Routing

When you log in, the system automatically redirects you to the dashboard that matches your role:

| Role | Dashboard URL | What You See |
|------|-------------|-------------|
| HQ Director | `/` | Global Operations Command |
| Franchise Manager | `/` | Global Operations Command |
| Executive Viewer | `/` | Global Operations Command (read-only) |
| Regional Manager | `/dashboard/regional` | Regional Performance Dashboard |
| Area Manager | `/dashboard/area` | Area Performance Dashboard |
| Branch Manager | `/dashboard/branch` | Branch Operations Dashboard |
| Field Auditor | `/dashboard/auditor` | My Audit Queue |

---

## 4. Scenario: A Day at Xyloquent Corp

*This scenario walks through a realistic day of operations demonstrating all platform features across multiple roles.*

### 8:00 AM - Sandra Chen (HQ Director) Reviews the Morning Dashboard

Sandra logs in with `sandra.chen@xyloquent.com` and sees the **Global Operations Command** dashboard.

**What she sees:**
- **Compliance Score: 90.5%** - The network-wide average across all 20 active branches
- **Active Audits: 14** - Total audits in the system, with 1 pending review
- **Open Issues: 12** - Issues requiring attention across the network
- **Escalated Items: 02** - Items requiring immediate HQ intervention

**She checks the Regional Performance chart** and notices the North Region at 96%, South at 91%, East at 94%, and West at 89%. West needs attention.

**She scrolls to Priority Escalations** and sees:
- BR-0042 Westfield: Health & Safety issue, 72h overdue
- BR-0018 Lakewood: Financial Audit issue, 48h overdue
- BR-0031 Riverside: Equipment Failure, 24h active

**She reads the Xyloquent AI recommendation:** "West region shows a 6% compliance dip driven by 3 branches missing H&S checks this week. Recommend deploying a field auditor to BR-0042 within 24 hours."

**She checks the Network Health heatmap** - most branches are green (optimal), a few blue (warning), and 2 red (critical) pulsing squares.

**Action taken:** Sandra clicks **Intervene** on the BR-0042 Westfield escalation to initiate HQ response.

---

### 8:30 AM - David Park (Regional Manager, North Region) Checks His Region

David logs in with `david.park@xyloquent.com` and is automatically routed to `/dashboard/regional`.

**What he sees:**
- **North Region** header with 7 branches
- **Regional Compliance Score: 88.9%**
- **Active Audits: 1** in progress across his region
- **Open Issues: 4** requiring attention

**He reviews the Branches in Region table:**

| Branch | Area | Manager | Status | Compliance | Last Audit |
|--------|------|---------|--------|------------|------------|
| Downtown Flagship | NYC Area | Rachel Kim | ACTIVE | 96.5% | Mar 15, 2026 |
| Lexington Ave | Boston Metro | Carlos Rivera | ACTIVE | 94.8% | Mar 12, 2026 |
| Harvard Square | Boston Metro | Rachel Kim | ACTIVE | 92.1% | Mar 1, 2026 |
| Times Square North | NYC Area | Carlos Rivera | ACTIVE | 91.2% | Mar 10, 2026 |
| SoHo Boutique | NYC Area | Leo Fernandez | ACTIVE | 88% | Feb 28, 2026 |
| Fenway Park Place | Boston Metro | Carlos Rivera | ACTIVE | 87.5% | Feb 20, 2026 |
| Chelsea Market Hub | NYC Area | Rachel Kim | MAINTENANCE | 72.3% | Jan 20, 2026 |

**He notices Chelsea Market Hub** at 72.3% compliance with MAINTENANCE status. He scrolls to Regional Issues and sees:
- **CRITICAL:** Expired fire suppression system certification at Chelsea Market Hub
- **CRITICAL:** Emergency lighting failure at Chelsea Market Hub
- **MEDIUM:** Staff training certificates expired at Fenway Park Place
- **LOW:** Shift handoff procedure delays at Times Square North

**Action taken:** David navigates to **Issue Management** to review the Chelsea Market Hub fire suppression issue in detail.

---

### 9:00 AM - David Reviews Issues in Detail

David clicks **Issue Management** in the sidebar and sees the full Issue Tracking page.

**Left panel: Issue Feed**
Issues are sorted by severity with color-coded left borders:
- Red border = CRITICAL
- Orange border = HIGH
- Blue border = MEDIUM
- Green border = LOW

Each issue card shows the title, branch name, time since creation, and overdue status.

**Center panel: Issue Detail**
David clicks on "Expired fire suppression system certification" and sees:
- **ID:** BP-77402
- **Severity:** CRITICAL
- **Origin Audit:** Weekly Safety Compliance #402
- **Accountability:** Assigned to Rachel Kim (Branch Manager)
- **Corrective Action Plan:** Technicians dispatched for sensor recalibration. Interim stabilization initiated.
- **Visual Evidence:** Attached photos of the issue

**Right panel: Escalation Rules**
The system shows which escalation rules are triggered:
- SLA Breach: TRIGGERED (response time exceeded 4-hour window)
- Safety Hazard: TRIGGERED (potential risk identified)
- Repeat Failure: Not triggered (no prior failures in 90-day window)

**AI Triage Assistant** suggests: "Detected pattern suggests a fire suppression certification lapse. Escalating to Priority 1. Suggested Owner: Engineering Services Unit. Confidence: 92%."

**Action taken:** David clicks **Verify & Close Issue** after confirming the corrective action is underway.

---

### 9:30 AM - Emma Torres (Area Manager, NYC Area) Reviews Her Area

Emma logs in with `emma.torres@xyloquent.com` and is routed to `/dashboard/area`.

**What she sees:**
- **NYC Area** header showing parent region (North Region)
- **Area Compliance Score** across her branches
- **Active Audits and Open Issues** counts
- Branch table showing only NYC Area branches
- Issues list filtered to her area

**She clicks Branch Registry** in the sidebar and sees a table of all branches, but only her NYC Area branches are highlighted with detailed information. The right panel shows the selected branch's details including operating hours, manager contact, active issues, and audit history timeline.

**Action taken:** Emma reviews the audit history for Downtown Flagship and notes the compliance improvement trend.

---

### 10:00 AM - Aisha Patel (Field Auditor) Starts Her Audit Day

Aisha logs in with `aisha.patel@xyloquent.com` and is routed to `/dashboard/auditor`.

**What she sees: "My Audit Queue"**
- **Assigned Audits:** Total count of audits assigned to her
- **Completed This Month:** Count of audits she's completed
- **Average Score:** Her average audit score

**Audit list grouped by status:**
- **Pending:** Audits she needs to complete
- **Under Review:** Audits she submitted that are being reviewed
- **Returned:** Audits sent back for corrections
- **Completed:** Recently approved audits

**Issues from My Audits** panel shows issues that were raised from findings in her audit submissions.

**Action taken:** Aisha clicks on a pending audit to begin her site inspection.

---

### 10:30 AM - Aisha Schedules a New Audit

Aisha clicks the **+ New Audit** button in the sidebar and is taken to `/audits/new`.

**The Schedule New Audit form includes:**
1. **Branch Location** - Dropdown to select the branch (shows only branches relevant to her)
2. **Audit Template** - Choose from: Safety Compliance, Standard Review, or Inventory Hygiene
3. **Assign Auditor** - Select the auditor (herself or another team member)
4. **Scheduled Date** - Date picker for when the audit should occur
5. **Notes** - Optional special instructions

Aisha selects Downtown Flagship, Safety Compliance template, assigns herself, picks tomorrow's date, and clicks **Schedule Audit**.

---

### 11:00 AM - Carlos Rivera (Branch Manager) Manages His Branch

Carlos logs in with `carlos.rivera@xyloquent.com` and is routed to `/dashboard/branch`.

**What he sees: Downtown Flagship Dashboard**
- **Branch Header:** "Downtown Flagship" with code NYC-001, full address, ACTIVE status badge, "Branch Manager" role badge
- **Branch Compliance Score: 96.5%** displayed prominently with last audit date
- **Progress bar** showing compliance percentage

**Recent Audits section:**
A table showing the last audits for his branch:

| Audit | Auditor | Status | Score | Date |
|-------|---------|--------|-------|------|
| Safety Compliance / Safety | Aisha Patel | APPROVED | 96.5% | Mar 14 |

**Open Issues section:**
Shows "No open issues for this branch. Great work!" with a green checkmark (or lists any open issues with severity badges).

**Stock Requests section:**
Shows recent stock requests with status badges (FULFILLED, PENDING, etc.)

**Promo Check Status section:**
Shows promotional compliance checks:
- "Spring Collection Launch" - CONFIRMED, completed Mar 23

---

### 11:30 AM - Carlos Submits a Stock Request

Carlos navigates to **Stock Requests** in the sidebar.

**The Stock Requests page shows a table with:**

| Branch | Requested By | Items | Status | Date | Action |
|--------|-------------|-------|--------|------|--------|
| Lexington Ave | Elena Rodriguez | Office Supplies, Cleaning Materials | PENDING | Mar 28 | Approve / Reject |
| Chelsea Market Hub | Marcus Chen | POS Paper Rolls, Receipt Printer Ink | APPROVED | Mar 27 | View Details |
| Downtown Flagship | James Smith | Safety Equipment, Fire Extinguisher | FULFILLED | Mar 25 | View Details |

Carlos clicks **+ New Request** to submit a request for his branch:
- Branch: Downtown Flagship (pre-selected)
- Items: Cleaning supplies, paper towels
- Notes: "Running low on floor cleaning supplies"

---

### 12:00 PM - Sandra Reviews Promo Execution

Sandra (HQ Director) navigates to **Promo Checks**.

**The Promo Execution page shows campaign cards:**

**Summer Safety First** - Active
- Due: Apr 5, 2026
- 42 branches total
- Completion: 90% (38 confirmed, 1 failed, 3 pending)
- Progress bar with green (confirmed), red (failed), gray (pending) segments

**Q1 Inventory Blitz** - Completed
- 42/42 branches confirmed
- 100% completion

**Spring Menu Rollout** - Active
- 29 confirmed, 2 failed, 11 pending
- 69% completion

Sandra can see at a glance which campaigns are on track and which branches are falling behind.

---

### 1:00 PM - Sandra Checks the Escalation Engine

Sandra navigates to **Escalation Engine**.

**SLA Configuration display:**
- Critical Response: 4 Hours
- High Priority Response: 12 Hours
- Standard Response: 48 Hours

**Active Escalation Queue:**

| Branch | Issue | Level | Duration | Assigned To | Action |
|--------|-------|-------|----------|-------------|--------|
| Downtown Seattle #04 | Health Protocol Violation | Level 3 (dots: red red red) | 48 Hours | Regional Director | Intervene |
| Miami Beach #12 | Major Inventory Deficit | Level 2 (dots: red red gray) | 24 Hours | Area Manager | Intervene |
| Boston Hub #02 | Unresolved SOP Gap | Level 1 (dots: red gray gray) | 72 Hours | Operations Lead | Intervene |

The escalation level indicator shows filled red dots for current level and gray dots for remaining levels. Higher levels indicate more severe escalation paths.

---

### 2:00 PM - Sandra Reviews the Audit Pipeline

Sandra navigates to **Audit Management**.

**Stats Row (3 KPI cards):**
- Audits in Progress: 12 (+2 from last week)
- Pending Review: 8 (High Priority)
- Completed Audits: 154 (98% Compliance)

**Audit Queue table:**

| Branch | Auditor | Status | Score | Date |
|--------|---------|--------|-------|------|
| Downtown Flagship (Store #402, Q3 Safety) | James Smith | Under Review (amber) | 82% | Oct 24 |
| Northside Plaza (Store #115, Compliance) | Laura Reyes | Submitted (blue) | 96% | Today |
| South Metro Hub (Store #208, Inventory) | Mark Klein | Returned (red) | 64% | Oct 22 |
| East Ridge Mall (Store #301, Weekly Check) | Ana Martin | Approved (green) | 100% | Oct 21 |

**Audit Detail Preview (right panel):**
Selecting "Northside Plaza" shows:
- Live Preview with Audit Score: 96 (Excellent)
- Critical Evidence: Image thumbnails with hover-to-zoom
- Failed Items: "Safety Exit Obstruction - Secondary exit in stockroom blocked by pallet"
- Assigned Reviewer: Sarah Jenkins
- Action buttons: **Approve Audit** | **Request Edit**

**Audit Lifecycle States:**
```
DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED -> CLOSED
                                   -> RETURNED -> SUBMITTED (resubmit)
```

---

### 3:00 PM - Olivia Grant (Executive Viewer) Reviews Operations

Olivia logs in with `olivia.grant@xyloquent.com` and sees the Global Operations Command dashboard (same as HQ Director view).

**Key difference:** All action buttons are hidden. She cannot:
- Click "Intervene" on escalations
- Click "Review Suggested Action" on AI recommendations
- See the "New Audit" button
- Create, update, or delete any records

If she attempts to access an API write endpoint, she receives a **403 Forbidden** response with `{ error: "Forbidden", code: "FORBIDDEN" }`.

Olivia can view all dashboards, drill into any module page, and review all data across the network for executive reporting purposes.

---

### 4:00 PM - Sandra Reviews the SOP Library

Sandra navigates to **SOP Library**.

**AI Q&A Widget (top banner):**
A dark gradient panel with the Xyloquent AI assistant. "Ask questions about any SOP document. Answers are grounded exclusively on governed source content."

**SOP Document Grid (6 cards):**

| Document | Version | Category | Sections | Status |
|----------|---------|----------|----------|--------|
| Food Safety & Hygiene Standards | v4.2 | Safety | 12 | Current |
| Customer Service Protocol | v3.1 | Operations | 8 | Current |
| Inventory Management Guide | v2.5 | Inventory | 15 | Current |
| Emergency Response Procedures | v5.0 | Safety | 6 | Current |
| Visual Merchandising Standards | v1.8 | Brand | 10 | Under Review |
| Cash Handling & POS Operations | v3.3 | Finance | 9 | Current |

Each card shows:
- Category badge with color (Safety=red, Operations=blue, Inventory=amber, Brand=purple, Finance=green)
- Document title with hover highlight
- Section count and last update date
- Current/Under Review status
- Click to view full SOP details

---

### 5:00 PM - End of Day Summary

Sandra returns to the HQ Dashboard and reviews the **Operations Feed:**

| Icon | Event | Time |
|------|-------|------|
| check_circle | Audit #A-1042 approved - BR-0011 Downtown passed compliance review | 3 min ago |
| warning | Escalation triggered - BR-0042 Westfield, H&S violation 72h overdue | 18 min ago |
| inventory | Stock request fulfilled - BR-0007 Oakmont received shipment #SR-338 | 42 min ago |
| person_add | Auditor dispatched - Field auditor assigned to North region sweep | 1h ago |
| trending_up | Compliance score updated - East region climbed to 94% (+2 pts) | 2h ago |

---

## 5. Module Guide: HQ Dashboard

### Overview
The Global Operations Command is the nerve center for HQ-level users. It provides a single view of the entire franchise network.

### Components

**KPI Cards (4 columns):**
- Compliance Score: Network-wide average with trend indicator
- Active Audits: Total count with pending badge
- Open Issues: Current open count with improvement indicator
- Escalated Items: Items requiring immediate HQ intervention

**Regional Performance Chart:**
- Bar chart comparing 4 regions
- Blue bars = Compliance rate
- Green bars = Issue resolution rate
- Shows percentage values below each region

**Xyloquent AI Widget:**
- Gradient card with AI-generated insight
- Provides specific, data-driven recommendations
- "Review Suggested Action" button for follow-up

**Priority Escalations Table:**
- Shows the most urgent items across the network
- Columns: Branch, Issue Type (color-coded badge), Duration, Action
- "Intervene" buttons for direct HQ response

**Network Health Heatmap:**
- 6x4 grid representing all branches
- Green = Optimal, Blue = Warning, Red = Critical (pulsing)
- Quick visual scan of network health

**Operations Feed:**
- Chronological list of recent operational events
- Material icons for event types
- Relative timestamps

---

## 6. Module Guide: Branch Registry

### Accessing
Click **Branch Registry** in the sidebar or top navigation.

### Features
- **Breadcrumb navigation:** North America > Northeast > NYC Area
- **Branch table** with sortable columns
- **Branch detail panel** (right side) showing:
  - Gradient header with store icon
  - Branch name, address, operating hours
  - Manager contact email
  - Active issues with severity badges
  - Audit history timeline with pass/fail indicators
- **Filter and Export** buttons for data management

### Branch Status Types
| Status | Meaning | Badge Color |
|--------|---------|-------------|
| ACTIVE | Operating normally | Green |
| MAINTENANCE | Undergoing repairs or renovation | Amber/Red |
| INACTIVE | Temporarily or permanently closed | Gray |

---

## 7. Module Guide: Audit Management

### Accessing
Click **Audit Management** in the sidebar or "Audits" in the top navigation.

### Audit Workflow
```
DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED -> CLOSED
                                   |
                                   -> RETURNED -> SUBMITTED (resubmit cycle)
```

**State transition rules (enforced by the system):**
- DRAFT can only move to SUBMITTED
- SUBMITTED can move to UNDER_REVIEW or RETURNED
- UNDER_REVIEW can move to APPROVED or RETURNED
- RETURNED can only move back to SUBMITTED
- APPROVED can only move to CLOSED
- CLOSED cannot transition further

### Audit Templates
| Template | Category | Use Case |
|----------|----------|----------|
| Safety Compliance | Safety | Health, fire, structural safety inspections |
| Standard Review | Operations | General operational compliance review |
| Inventory Hygiene | Inventory | Stock management and storage conditions |

### Creating a New Audit
1. Click **+ New Audit** in the sidebar or **New Audit Schedule** on the audits page
2. Select the **Branch Location**
3. Choose the **Audit Template**
4. Assign an **Auditor**
5. Set the **Scheduled Date**
6. Add optional **Notes**
7. Click **Schedule Audit**

---

## 8. Module Guide: Issue Tracking

### Accessing
Click **Issue Management** in the sidebar or "Issues" in the top navigation.

### Issue Severity Levels

| Severity | Color | Response SLA | Example |
|----------|-------|-------------|---------|
| CRITICAL | Red | 4 hours | Cold storage temperature deviation, fire suppression failure |
| HIGH | Orange | 12 hours | Unsecured inventory dock, emergency lighting failure |
| MEDIUM | Blue | 48 hours | SOP manual outdated, staff training expired |
| LOW | Green | 1 week | Signage damage, minor cosmetic issues |

### Issue Lifecycle
```
OPEN -> IN_PROGRESS -> UNDER_REVIEW -> RESOLVED -> CLOSED
```

### Issue Detail View
- **Issue ID** (e.g., BP-77402)
- **Title and description**
- **Origin Audit** (linked to the audit that found it)
- **Accountability** (assigned owner with avatar)
- **Corrective Action Plan** with evidence requirements
- **Visual Evidence** (photo attachments)
- **Verify & Close Issue** action button

---

## 9. Module Guide: Escalation Engine

### Accessing
Click **Escalation Engine** in the sidebar or "Escalations" in the top navigation.

### SLA Tiers
| Tier | Response Time | Trigger |
|------|-------------|---------|
| Critical | 4 Hours | Safety hazards, regulatory violations |
| High Priority | 12 Hours | Operational disruptions, significant non-compliance |
| Standard | 48 Hours | Routine issues, minor findings |

### Escalation Levels
Issues escalate through levels based on severity and age:
- **Level 1:** Area Manager notification
- **Level 2:** Regional Manager intervention
- **Level 3:** HQ Director direct action

Each escalation is wrapped in a database transaction to prevent race conditions (no duplicate levels).

### Escalation Rules
Three deterministic rules determine when escalation triggers:
1. **SLA Breach** - Response time exceeded the allowed window
2. **Safety Hazard** - Potential biological, physical, or structural risk
3. **Repeat Failure** - Same issue type occurred within 90-day window

---

## 10. Module Guide: Promo Execution Checks

### Accessing
Click **Promo Checks** in the sidebar.

### Campaign Tracking
Each campaign card displays:
- Campaign name and status (Active/Completed)
- Due date
- Branch count and completion percentage
- Stacked progress bar: Green (Confirmed) | Red (Failed) | Gray (Pending)
- Breakdown counts for each status

### Promo Check Statuses
| Status | Meaning |
|--------|---------|
| PENDING | Branch has not yet confirmed execution |
| CONFIRMED | Branch confirmed promo was executed correctly |
| FAILED | Branch failed to execute or executed incorrectly |

---

## 11. Module Guide: Stock Requests

### Accessing
Click **Stock Requests** in the sidebar.

### Request Workflow
```
PENDING -> APPROVED -> FULFILLED
        |
        -> REJECTED
```

### Features
- Table view with branch, requester, items, status, and date
- **PENDING** requests show Approve/Reject action buttons
- Other statuses show "View Details" link
- Items stored as structured data (names, quantities)

---

## 12. Module Guide: SOP Library

### Accessing
Click **SOP Library** in the sidebar.

### Features
- **AI Q&A Assistant:** Ask questions about SOPs and get grounded answers from governed source content
- **Document Grid:** Browse all SOPs by category
- **Categories:** Safety, Operations, Inventory, Brand, Finance
- **Version Control:** Each SOP has a version number
- **Status:** Current (green) or Under Review (amber)
- **Upload SOP** button for adding new documents

---

## 13. Role-Based Dashboard Walkthroughs

### HQ Director Dashboard (Sandra Chen)

**URL:** `/` (automatic)
**Sees:** Everything. Full global view with all KPIs, all regions, all escalations, AI recommendations, network heatmap, operations feed. All action buttons visible.

---

### Regional Manager Dashboard (David Park - North Region)

**URL:** `/dashboard/regional` (automatic redirect)
**Sees:**
- "North Region" header with branch count (7 branches)
- Regional Compliance Score (average of region's branches)
- Active Audits and Open Issues (region-scoped counts)
- Branch table showing ONLY North Region branches with compliance scores
- Regional Issues sorted by severity
- Cannot see South, East, or West region data

---

### Area Manager Dashboard (Emma Torres - NYC Area)

**URL:** `/dashboard/area` (automatic redirect)
**Sees:**
- "NYC Area" header with parent region name
- Area Compliance Score (average of area's branches)
- Active Audits and Open Issues (area-scoped)
- Branch table showing ONLY NYC Area branches
- Area issues list
- Cannot see Boston Metro, Miami Metro, or other area data

---

### Branch Manager Dashboard (Carlos Rivera - Downtown Flagship)

**URL:** `/dashboard/branch` (automatic redirect)
**Sees:**
- "Downtown Flagship" header with address and status
- Branch Compliance Score: 96.5% (large prominent display)
- Recent Audits for this branch only
- Open Issues for this branch only
- Stock Requests for this branch only
- Promo Check Status for this branch only
- Cannot see any other branch's data

---

### Field Auditor Dashboard (Aisha Patel)

**URL:** `/dashboard/auditor` (automatic redirect)
**Sees:**
- "My Audit Queue" with assigned audits count
- Completed This Month and Average Score KPIs
- Audit list grouped by status (Pending, Under Review, Returned, Completed)
- Issues raised from audits she conducted
- Cannot see audits assigned to other auditors

---

### Executive Viewer Dashboard (Olivia Grant)

**URL:** `/` (same global dashboard, read-only)
**Sees:** Same data as HQ Director
**Cannot do:** Any write operations. No "Intervene" buttons, no "New Audit" button, no approve/reject actions. API returns 403 Forbidden on any write attempt.

---

## 14. API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email and password |
| POST | `/api/auth/logout` | Logout and clear session |
| GET | `/api/auth/me` | Get current user info |

### Branches

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/branches` | List branches (role-scoped) |
| POST | `/api/branches` | Create branch |
| GET | `/api/branches/[id]` | Get branch details |
| PATCH | `/api/branches/[id]` | Update branch |
| DELETE | `/api/branches/[id]` | Delete branch (fails if has child records) |

**Query Parameters:** `status`, `region`, `search`, `take` (max 100), `skip`

### Audits

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audits` | List audits (role-scoped) |
| POST | `/api/audits` | Create audit |
| GET | `/api/audits/[id]` | Get audit details |
| PATCH | `/api/audits/[id]` | Update audit (enforces state machine) |

**Query Parameters:** `status`, `branchId`, `take`, `skip`

### Issues

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/issues` | List issues (role-scoped) |
| POST | `/api/issues` | Create issue |
| GET | `/api/issues/[id]` | Get issue details |
| PATCH | `/api/issues/[id]` | Update issue |

**Query Parameters:** `severity`, `status`, `branchId`, `take`, `skip`

### Escalations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/escalations` | List escalations (role-scoped) |
| POST | `/api/escalations` | Create escalation (auto-increments level) |

**Query Parameters:** `active` (boolean), `take`, `skip`

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get role-scoped dashboard metrics |

### Stock Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stock-requests` | List stock requests (role-scoped) |
| POST | `/api/stock-requests` | Create stock request |

### Promo Checks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/promo-checks` | List promo checks (role-scoped) |
| POST | `/api/promo-checks` | Create promo check |

### Error Responses

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (missing/invalid fields) |
| 401 | Unauthorized (no session) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not found |
| 409 | Conflict (duplicate or foreign key constraint) |
| 429 | Rate limited (too many login attempts) |
| 500 | Server error |

---

## 15. Troubleshooting

### "Database Connection Error" banner
**Cause:** The application cannot reach the PostgreSQL database.
**Solution:** Verify the database container is running: `docker compose ps`

### Login fails with "Invalid email or password"
**Cause:** Incorrect credentials.
**Solution:** All demo accounts use password `demo`. Check email spelling.

### "Too many login attempts" (429 error)
**Cause:** 5+ failed login attempts within 15 minutes.
**Solution:** Wait 15 minutes for the lockout to expire, then try again.

### "Access Denied" page
**Cause:** You are trying to access a dashboard not designed for your role.
**Solution:** Use the sidebar navigation to go to your role-appropriate dashboard, or let the system redirect you by visiting the home page.

### "Forbidden" (403) on API calls
**Cause:** Your role does not have permission for the requested action.
**Solution:** Executive Viewers cannot perform write operations. Branch Managers and Field Auditors cannot update or delete records.

### Pages show zero data
**Cause:** Database may need to be seeded.
**Solution:** Run `npx tsx prisma/seed.ts` to populate demo data.

### Icons showing as text (e.g., "dashboard" instead of icon)
**Cause:** Google Fonts Material Symbols not loaded yet.
**Solution:** Wait for font to load or refresh the page. This is a temporary font-loading delay.

---

## Appendix: Organizational Hierarchy

```
Xyloquent Corp
├── North Region
│   ├── NYC Area
│   │   ├── Downtown Flagship (NYC-001)
│   │   ├── Times Square North (NYC-002)
│   │   ├── SoHo Boutique (NYC-003)
│   │   └── Chelsea Market Hub (NYC-004)
│   └── Boston Metro
│       ├── Lexington Ave (BOS-001)
│       ├── Fenway Park Place (BOS-002)
│       └── Harvard Square (BOS-003)
├── South Region
│   ├── Miami Metro
│   │   ├── Brickell Center (MIA-001)
│   │   ├── Wynwood Arts (MIA-002)
│   │   └── Coral Gables (MIA-003)
│   └── Atlanta Area
│       ├── Midtown Tower (ATL-001)
│       ├── Buckhead Plaza (ATL-002)
│       └── Decatur Square (ATL-003)
├── East Region
│   ├── DC Metro
│   │   ├── Georgetown Hub (DC-001)
│   │   ├── Capitol Hill (DC-002)
│   │   └── Dupont Circle (DC-003)
│   └── Philly Metro
│       ├── Rittenhouse (PHL-001)
│       └── University City (PHL-002)
└── West Region
    ├── SF Bay Area
    │   ├── Union Square (SF-001)
    │   ├── Mission District (SF-002)
    │   └── Palo Alto (SF-003)
    └── LA Metro
        ├── Santa Monica (LA-001)
        └── Hollywood Blvd (LA-002)
```

---

**End of Training Manual**

*Xyloquent Branch OS*
*Franchise Operations Platform | Powered by Next.js, PostgreSQL, and Docker*
