# Cipher UI Design and Implementation Instructions

## 1. Product Overview

Design **Cipher** as a modern, practice-first cybersecurity learning and assessment platform for AP Cybersecurity students.

The application should not feel like a conventional lesson-delivery LMS. Its primary experience should revolve around:

-   Missions
    
-   Mission assignments
    
-   Student attempts
    
-   Submitted evidence
    
-   Safe technical simulations
    
-   Support behavior
    
-   AI-assisted formative learning
    
-   Rubric-based teacher assessment
    
-   Final grades and feedback
    
-   Section and skill analytics
    

The visual design should communicate:

-   Trust
    
-   Technical competence
    
-   Academic rigor
    
-   Safety
    
-   Clarity
    
-   Student progress
    
-   Teacher control
    

The interface should remain approachable for secondary-school students while still feeling professional enough for teachers and administrators.

----------

# 2. Required Technology Stack

## Frontend

Use:

-   **React**
    
-   **TypeScript**
    
-   **Tailwind CSS**
    
-   **Motion** for animation
    
-   **Font Awesome** for icons
    

Recommended supporting frontend technologies:

-   Next.js App Router, if the project retains its existing Next.js structure
    
-   React Context, Zustand, or another lightweight state-management solution
    
-   TanStack Query or a shared API client for server-state management
    
-   React Hook Form with Zod for complex forms
    
-   `@xyflow/react` for the conceptual network topology editor
    

## Backend

Use the existing FastAPI backend for:

-   Authentication
    
-   Mission data
    
-   Attempts
    
-   Draft evidence
    
-   Support events
    
-   Auto-check results
    
-   Teacher grading
    
-   AI tutor requests
    
-   Grade audit history
    

## Database

Use:

-   **PostgreSQL**
    

PostgreSQL should store:

-   Users and roles
    
-   Google identity links
    
-   Class sections
    
-   Section enrollment
    
-   AP units
    
-   AP skill categories
    
-   Missions
    
-   Rubrics
    
-   Mission assignments
    
-   Student attempts
    
-   Attempt evidence
    
-   Support timeline events
    
-   Auto-check results
    
-   Teacher grades
    
-   Grade audit events
    
-   AI tutor sessions
    
-   AI tutor messages
    

----------

# 3. Visual Design Direction

## 3.1 General Style

Use a clean SaaS dashboard aesthetic with:

-   White and very light gray page backgrounds
    
-   Deep navy navigation
    
-   Bright blue primary actions
    
-   Soft borders
    
-   Restrained shadows
    
-   Rounded cards
    
-   Generous spacing
    
-   Clear typography
    
-   Limited decorative effects
    

The visual hierarchy should prioritize:

1.  Current task
    
2.  Mission status
    
3.  Required action
    
4.  Progress
    
5.  Feedback
    
6.  Secondary analytics
    

Avoid:

-   Excessively dark content areas
    
-   Neon cyberpunk effects
    
-   Matrix-style backgrounds
    
-   Overuse of gradients
    
-   Dense technical decoration
    
-   Tiny text
    
-   Large amounts of instructional prose on dashboards
    
-   Excessive card nesting
    

The platform should feel like an educational productivity application, not a fictional hacking interface.

----------

# 4. Design Tokens

## 4.1 Color Palette

### Primary colors

-   Primary blue: `#0B63F6`
    
-   Primary hover: `#0754D5`
    
-   Primary light: `#EAF2FF`
    
-   Deep navy: `#071A33`
    
-   Sidebar navy: `#061B34`
    

### Neutral colors

-   Page background: `#F6F8FC`
    
-   Card background: `#FFFFFF`
    
-   Strong text: `#101828`
    
-   Standard text: `#344054`
    
-   Muted text: `#667085`
    
-   Subtle text: `#98A2B3`
    
-   Border: `#E4E7EC`
    
-   Light border: `#EEF1F5`
    

### Semantic colors

-   Success: `#16A34A`
    
-   Success background: `#EAF8EF`
    
-   Warning: `#F59E0B`
    
-   Warning background: `#FFF7E6`
    
-   Error: `#DC2626`
    
-   Error background: `#FEECEC`
    
-   Informational: `#2563EB`
    
-   Informational background: `#EAF2FF`
    
-   Purple support/AI: `#7C3AED`
    
-   Purple background: `#F2ECFF`
    

### AP unit accent colors

Use one identifiable accent per unit:

1.  Introduction to Security: green
    
2.  Securing Physical Spaces: blue
    
3.  Securing Networks: purple
    
4.  Securing Devices: orange
    
5.  Securing Applications and Data: teal
    

Unit colors should be secondary identifiers only. Do not use them as substitutes for text labels.

----------

## 4.2 Typography

Use a clean sans-serif typeface such as:

-   Inter
    
-   Geist
    
-   Manrope
    
-   Source Sans 3
    

Recommended hierarchy:

-   Page title: `text-2xl` to `text-3xl`, `font-semibold`
    
-   Section title: `text-lg` to `text-xl`, `font-semibold`
    
-   Card metric: `text-2xl` to `text-3xl`, `font-bold`
    
-   Body: `text-sm` to `text-base`
    
-   Labels: `text-sm`, `font-medium`
    
-   Metadata: `text-xs` to `text-sm`
    
-   Table headings: `text-xs`, uppercase optional, `font-semibold`
    

Use dark navy or charcoal for primary headings rather than pure black.

----------

## 4.3 Spacing

Use a consistent spacing system based on Tailwind’s scale.

Recommended standards:

-   Main page padding: `p-6` desktop, `p-4` tablet and mobile
    
-   Card padding: `p-5` or `p-6`
    
-   Compact card padding: `p-4`
    
-   Section gap: `gap-6`
    
-   Card grid gap: `gap-4`
    
-   Inline control gap: `gap-2` or `gap-3`
    
-   Major vertical spacing: `space-y-6`
    
-   Form spacing: `space-y-4`
    

----------

## 4.4 Borders and Shadows

Cards:

```text
rounded-xl or rounded-2xl
border border-slate-200
bg-white
shadow-sm

```

Elevated panels:

```text
rounded-2xl
border border-slate-200
bg-white
shadow-[0_12px_32px_rgba(15,23,42,0.08)]

```

Avoid heavy shadows. Use borders as the primary separation method.

----------

# 5. Responsive Application Shell

## 5.1 Desktop Layout

Use a fixed sidebar with a flexible main content region.

Recommended structure:

```text
Application Shell
├── Sidebar: 240–260 px
├── Main Content
│   ├── Optional top header
│   └── Page content
└── Optional right-side contextual panel

```

Suggested Tailwind layout:

```jsx
<div className="min-h-screen bg-slate-50">
  <Sidebar />
  <main className="ml-64 min-h-screen">
    <PageHeader />
    <PageContent />
  </main>
</div>

```

## 5.2 Tablet Layout

At medium widths:

-   Collapse sidebar labels
    
-   Show icons only
    
-   Reduce page padding
    
-   Change four-column metric rows to two columns
    
-   Keep important tables horizontally scrollable
    
-   Move contextual panels below main content when necessary
    

## 5.3 Mobile Layout

On mobile:

-   Replace fixed sidebar with a drawer
    
-   Add a compact top bar with logo, page title, and menu button
    
-   Use single-column cards
    
-   Convert tables into stacked rows where practical
    
-   Make primary actions full width
    
-   Use bottom sheets or full-screen panels for secondary tools
    
-   Keep all touch targets at least 44 pixels tall
    
-   Prevent horizontal page scrolling
    

----------

# 6. Navigation System

## 6.1 Student Sidebar

Organize student navigation into groups.

### Main

-   Dashboard
    
-   Missions
    
-   My Attempts
    
-   Support Timeline
    
-   AI Tutor
    

### Course

-   Units
    
-   Resources
    

### Account

-   Profile
    
-   Settings
    
-   Log out
    

Use Font Awesome icons:

-   Dashboard: `faHouse`
    
-   Missions: `faBullseye` or `faClipboardCheck`
    
-   Attempts: `faFileLines`
    
-   Support Timeline: `faClockRotateLeft`
    
-   AI Tutor: `faRobot`
    
-   Units: `faLayerGroup`
    
-   Resources: `faBookOpen`
    
-   Profile: `faUser`
    
-   Settings: `faGear`
    
-   Log out: `faArrowRightFromBracket`
    

The active item should use:

-   Bright blue background
    
-   White text and icon
    
-   Rounded-lg shape
    
-   Optional subtle inset highlight
    

Inactive items should use muted blue-gray text with a subtle hover background.

----------

## 6.2 Teacher Sidebar

Teacher navigation should prioritize assessment workflows.

### Main

-   Overview
    
-   Sections
    
-   Assignments
    
-   Gradebook
    
-   Attempts
    
-   Students
    
-   Reports
    

### Account

-   Settings
    
-   Log out
    

Recommended Font Awesome icons:

-   Overview: `faChartPie`
    
-   Sections: `faUsersRectangle`
    
-   Assignments: `faClipboardList`
    
-   Gradebook: `faTableList`
    
-   Attempts: `faFileCircleCheck`
    
-   Students: `faUsers`
    
-   Reports: `faChartLine`
    

----------

# 7. Student Dashboard

## 7.1 Purpose

The student dashboard should answer:

-   What do I need to work on?
    
-   What is currently in progress?
    
-   How am I performing?
    
-   Which AP units and skills need attention?
    
-   Which missions have been returned?
    
-   How much support have I used?
    

Do not center the dashboard on lessons completed.

----------

## 7.2 Header

Include:

-   Greeting: “Welcome back, Alex!”
    
-   Supporting line: “Keep practicing. Every attempt makes you stronger.”
    
-   Current section selector
    
-   Optional notification button
    
-   Optional profile menu
    

The section selector should show:

-   Section name
    
-   Class period
    
-   Dropdown chevron
    
-   Small group or classroom icon
    

----------

## 7.3 Summary Metrics

Display four cards:

1.  Current streak
    
2.  Missions completed
    
3.  Average score
    
4.  Support used
    

Each metric card should contain:

-   Font Awesome icon
    
-   Short label
    
-   Large numeric value
    
-   Small contextual explanation
    
-   Optional mini progress bar
    

Examples:

-   Current Streak: `7 days`
    
-   Missions Completed: `12 of 28 assigned`
    
-   Average Score: `84%`
    
-   Support Used: `3 times this week`
    

Cards should remain visually simple and equal in height.

----------

## 7.4 AP Unit Progress

Show five unit cards in a horizontal row or responsive grid.

Each card should include:

-   Unit number
    
-   Unit title
    
-   Unit icon
    
-   Completion percentage
    
-   Thin progress bar
    
-   Unit-specific accent color
    

Example card:

```text
3
Securing Networks
40%
[progress bar]

```

Clicking a unit should open the unit mission list, not a lesson list.

----------

## 7.5 Recent Assignments

Use a compact table or list.

Columns:

-   Mission
    
-   Unit
    
-   Status
    
-   Due date
    
-   Action
    

Possible statuses:

-   Not Started
    
-   In Progress
    
-   Draft Saved
    
-   Submitted
    
-   Needs Review
    
-   Graded
    
-   Returned
    

Status badges must use both color and text.

Recommended status colors:

-   Not Started: gray
    
-   In Progress: blue
    
-   Draft Saved: amber
    
-   Submitted: purple
    
-   Needs Review: orange
    
-   Graded: green
    
-   Returned: teal
    

Primary row action:

-   Start
    
-   Continue
    
-   View Submission
    
-   View Feedback
    

----------

## 7.6 Progress Analytics

Include one compact chart showing:

-   Practice time
    
-   Missions attempted
    
-   Best score
    
-   Daily or weekly progress
    

Keep charts simple and readable.

Recommended chart design:

-   Thin blue line
    
-   Light blue area fill
    
-   Minimal grid lines
    
-   Clearly labeled axes
    
-   Tooltip on hover
    

----------

# 8. Mission Catalog

## 8.1 Page Structure

The mission catalog should include:

-   Page title
    
-   Search
    
-   Unit filters
    
-   Skill filters
    
-   Status filters
    
-   Mission type filters
    
-   Sort control
    
-   Mission cards or compact list
    

Suggested header:

```text
Missions
Practice AP Cybersecurity skills through real-world scenarios.

```

----------

## 8.2 Filters

Filters should support:

-   AP unit
    
-   Skill:
    
    -   Analyze Risk
        
    -   Mitigate Risk
        
    -   Detect Attacks
        
    -   Collaborate
        
-   Mission type
    
-   Difficulty
    
-   Assignment status
    
-   Due date
    
-   Completion state
    

Use accessible buttons, dropdowns, or filter chips.

----------

## 8.3 Mission Card

Each mission card should contain:

-   Mission title
    
-   Unit
    
-   Mission type
    
-   Difficulty
    
-   Skill tags
    
-   Short summary
    
-   Estimated duration
    
-   Due date
    
-   Status
    
-   Primary action
    

Example:

```text
Network Segmentation: Firewall Rules

Unit 3 · Securing Networks
Interactive Network Simulation
Intermediate · 35 minutes

Skills:
Mitigate Risk
Detect Attacks

Configure firewall rules to isolate student, staff,
and server networks while preserving required services.

Due Jul 25
[Continue Mission]

```

Avoid displaying large amounts of scenario detail in the catalog.

----------

# 9. Mission Workspace

## 9.1 Core Layout

The mission workspace is the most important student screen.

Use a three-part layout:

```text
Left column:
- Mission steps
- Support signals
- Support timeline

Center:
- Main activity renderer

Right or top-right:
- Due date
- Attempt progress
- Submission action
- Optional rubric or AI panel

```

Recommended desktop grid:

```text
220 px | flexible main area | 280–340 px optional context

```

A simpler two-column layout is acceptable when the mission renderer requires more width.

----------

## 9.2 Mission Header

Include:

-   Breadcrumbs
    
-   Mission title
    
-   Unit badge
    
-   Mission type badge
    
-   Short summary
    
-   Due date
    
-   Attempt progress
    
-   Submit Attempt button
    
-   Overflow actions
    

The submit button should remain visually prominent.

Do not enable submission until required evidence is present.

----------

## 9.3 Mission Steps

Display the mission workflow as a vertical checklist.

Example:

1.  Read Scenario
    
2.  Build Topology
    
3.  Configure Rules
    
4.  Test Traffic
    
5.  Write Explanation
    

States:

-   Completed
    
-   Current
    
-   Available
    
-   Locked
    
-   Error
    

Use icons and text labels. The current step should use a blue highlighted background.

----------

## 9.4 Draft Status

The workspace should continuously communicate save state.

Possible labels:

-   Saving…
    
-   Saved
    
-   Save failed
    
-   Offline draft
    
-   Unsaved changes
    

Display the save indicator near the evidence editor or bottom action bar.

Draft failure must not remove the student’s visible work.

----------

# 10. Support Signal Control

## 10.1 Supported Signals

The attempt should begin in **Independent** mode.

Provide four support options:

-   Independent
    
-   AI
    
-   Teacher
    
-   Others
    

The mockup may use student-friendly wording such as:

-   I’m Confident
    
-   I’m Struggling
    
-   I’m Stuck
    
-   Off Task
    

However, the stored system categories should remain clearly mapped to the approved support signals.

A recommended interface is:

```text
Support Mode
[Independent]
[AI]
[Teacher]
[Others]

```

Each selection should:

-   Update active state
    
-   Record the old signal
    
-   Record the new signal
    
-   Record the time
    
-   Optionally request a short note
    

----------

## 10.2 Visual Treatment

Suggested colors:

-   Independent: green
    
-   AI: purple
    
-   Teacher: blue
    
-   Others: orange
    

Do not present support use as a penalty.

Use neutral language such as:

-   “Record the support you are using.”
    
-   “Support information helps you and your teacher reflect on your process.”
    

----------

## 10.3 Support Timeline

Show:

-   Timestamp
    
-   Signal
    
-   Change direction
    
-   Optional note
    
-   Source, when automatically logged
    

Example:

```text
9:20 AM — Independent
9:36 AM — AI
Asked for help understanding firewall rule order
9:48 AM — Teacher

```

Provide a “View full timeline” action when the compact list exceeds available space.

----------

# 11. AI Tutor Panel

## 11.1 Position

Use one of these patterns:

-   Right-side collapsible panel
    
-   Slide-over drawer
    
-   Bottom sheet on mobile
    
-   Dedicated tab inside the mission workspace
    

The AI tutor must not obstruct the primary activity.

----------

## 11.2 Panel Content

Include:

-   AI Tutor heading
    
-   Assessment-mode notice
    
-   Chat history
    
-   Suggested prompts
    
-   Text input
    
-   Send button
    
-   Clear unavailable state
    

Suggested notice:

```text
Cipher AI can explain concepts and give hints.
It will not write your final submission.

```

Suggested prompt chips:

-   Explain this concept
    
-   Help me interpret the evidence
    
-   Ask me a guiding question
    
-   Review my reasoning
    
-   What should I check next?
    

Use Font Awesome icons such as:

-   `faRobot`
    
-   `faWandMagicSparkles`
    
-   `faPaperPlane`
    
-   `faCircleInfo`
    

----------

## 11.3 Direct-Answer Refusal UI

When a student asks for the final answer:

-   Show a polite refusal
    
-   Explain the boundary
    
-   Offer a guiding question or hint
    
-   Do not use alarming error styling
    

Use a purple or blue informational callout rather than a red error alert.

----------

# 12. Interactive Network Simulator

## 12.1 Workspace Structure

The network simulator should contain:

-   Topology canvas
    
-   Firewall-rule table
    
-   Traffic-test panel
    
-   Explanation editor
    
-   Mission instructions
    
-   Auto-check results
    

Tabs may include:

-   Topology
    
-   Firewall Rules
    
-   Traffic Tests
    
-   Evidence
    

----------

## 12.2 Topology Canvas

Use `@xyflow/react`.

Supported node types:

-   Internet
    
-   Router
    
-   Firewall
    
-   Network segment
    
-   Host
    
-   Server
    
-   Student subnet
    
-   Staff subnet
    
-   Admin subnet
    

Node visual design:

-   White or lightly tinted card
    
-   Rounded corners
    
-   Clear icon
    
-   Node name
    
-   IP range or subnet
    
-   Connection handles
    
-   Selected blue border
    
-   Invalid red border
    

Canvas controls:

-   Add node
    
-   Connect nodes
    
-   Delete
    
-   Zoom
    
-   Fit view
    
-   Reset
    
-   Undo and redo, if practical
    

Use Font Awesome icons:

-   Internet: `faGlobe`
    
-   Router: `faRoute`
    
-   Firewall: `faShieldHalved`
    
-   Host: `faDesktop`
    
-   Server: `faServer`
    
-   Network: `faNetworkWired`
    

----------

## 12.3 Firewall Rule Editor

Display rules in a table.

Columns:

-   Order
    
-   Action
    
-   Source
    
-   Destination
    
-   Service
    
-   Port
    
-   Edit
    
-   Delete
    

Actions:

-   Allow
    
-   Deny
    

Use clear semantic badges:

-   Allow: green
    
-   Deny: red
    

Permit drag-and-drop reordering because firewall rules may be evaluated from top to bottom.

Include an “Add Rule” button.

----------

## 12.4 Traffic Test Panel

Each test should show:

-   Source
    
-   Destination
    
-   Service
    
-   Expected outcome
    
-   Actual outcome
    
-   Pass or fail state
    
-   Explanation when failed
    

Example:

```text
Students → Servers, HTTP
Expected: Allowed
Actual: Allowed
Passed

```

Do not rely only on green and red. Include icons and text.

----------

## 12.5 Evidence Notes

Provide a text area titled:

-   Explanation
    
-   Security Rationale
    
-   Why this configuration works
    

Save the explanation with topology and rule evidence.

----------

# 13. Safe Bash Simulator

## 13.1 General Design

Create a terminal-inspired interface without making it look like a real host shell.

Use:

-   Dark navy terminal surface
    
-   Monospace font
    
-   Clear prompt
    
-   Command history
    
-   Safe simulator label
    
-   Virtual filesystem indicator
    

Display a notice:

```text
Safe Practice Environment
Commands run only in a simulated filesystem.

```

----------

## 13.2 Layout

Recommended layout:

```text
Mission instructions | Terminal
                     | Virtual filesystem preview
                     | Evidence explanation

```

The terminal should include:

-   Prompt
    
-   Input line
    
-   Command output
    
-   Parse errors
    
-   Command history navigation
    
-   Clear terminal action
    
-   Reset simulation action
    

----------

## 13.3 Supported Command Feedback

For supported commands:

-   Show normal output
    
-   Update transcript
    
-   Update virtual filesystem state
    
-   Autosave evidence
    

For unsupported commands:

```text
This command is not available in the Cipher simulator.
Try one of the supported commands: ls, cd, cat, grep…

```

Do not display host-level errors.

----------

## 13.4 Teacher Evidence View

Teachers should see:

-   Full transcript
    
-   Final filesystem state
    
-   Auto-check result
    
-   Student explanation
    
-   Relevant rubric criteria
    

----------

# 14. Teacher Overview

## 14.1 Purpose

The teacher dashboard should prioritize:

-   Section health
    
-   Missions requiring review
    
-   Recent submissions
    
-   Assignment status
    
-   Skill performance
    
-   Support behavior
    
-   Grading workload
    

----------

## 14.2 Summary Cards

Recommended cards:

-   Active sections
    
-   Missions assigned
    
-   Attempts awaiting review
    
-   Returned this week
    
-   Average section score
    
-   Students needing attention
    

Use restrained charting and clear actions.

----------

## 14.3 Review Queue

Show a prioritized list with:

-   Student
    
-   Mission
    
-   Section
    
-   Submitted time
    
-   Auto-check status
    
-   Support summary
    
-   Review status
    
-   Open Review action
    

Filters:

-   Section
    
-   Unit
    
-   AP skill
    
-   Mission
    
-   Status
    
-   Submission date
    

----------

# 15. Teacher Sections Page

## 15.1 Sections Table

Columns:

-   Section name
    
-   Students
    
-   Missions assigned
    
-   Average score
    
-   Last activity
    
-   Actions
    

Actions:

-   View section
    
-   Assign mission
    
-   Manage students
    
-   Archive
    
-   Open analytics
    

Include a prominent “New Section” button.

----------

## 15.2 Recent Activity

Show concise activity such as:

-   Mission assigned
    
-   Students submitted
    
-   Teacher finalized grades
    
-   Student joined section
    
-   Mission returned
    

Avoid displaying every draft save or support switch in the general feed.

----------

# 16. Assignment Workflow

Use a step-based drawer or modal.

Steps:

1.  Select mission
    
2.  Select one or more sections
    
3.  Set due date
    
4.  Configure attempt options
    
5.  Review and assign
    

Configuration options may include:

-   Allow multiple submissions
    
-   Enable AI tutor
    
-   Display rubric before submission
    
-   Require support reflection
    
-   Assessment mode
    
-   Late submission policy
    

The source materials do not finalize every assignment policy. Controls for unresolved policies should therefore be configurable or omitted until backend rules are established.

----------

# 17. Teacher Gradebook

## 17.1 Filters

Include:

-   Section
    
-   Unit
    
-   Skill
    
-   Mission
    
-   Attempt status
    
-   Grade state
    

Provide export as a secondary action.

----------

## 17.2 Table Structure

Possible columns:

-   Student
    
-   Analyze Risk
    
-   Mitigate Risk
    
-   Detect Attacks
    
-   Collaborate
    
-   Average score
    
-   Review state
    

Use light cell tinting for score bands:

-   90–100: green
    
-   80–89: pale green
    
-   70–79: amber
    
-   Below 70: pale red
    

Every cell must include a numeric value.

Do not rely solely on color.

----------

## 17.3 Table Interaction

Allow:

-   Sticky student column
    
-   Sort by any score
    
-   Open student detail
    
-   Open attempt detail
    
-   Filter by missing work
    
-   Filter by needs review
    
-   Horizontal scrolling on smaller screens
    

----------

# 18. Teacher Attempt Review

## 18.1 Header

Show:

-   Student name
    
-   Section
    
-   Mission
    
-   Unit
    
-   Submitted date and time
    
-   Review status
    
-   Previous and next attempt controls
    

----------

## 18.2 Evidence Tabs

Recommended tabs:

-   Student Evidence
    
-   Support Timeline
    
-   Auto-Check Results
    
-   AI Metadata
    
-   Rubric
    
-   Grade History
    

Do not make full AI conversation review the default view.

----------

## 18.3 Student Evidence

Render evidence according to mission type:

-   Written response
    
-   Case evidence
    
-   Log excerpt
    
-   Bash transcript
    
-   Filesystem state
    
-   Network topology
    
-   Firewall rules
    
-   Traffic outcomes
    
-   Reflection
    

Technical evidence should preserve formatting.

Use monospace blocks for:

-   Logs
    
-   Commands
    
-   Firewall definitions
    
-   File permissions
    
-   Structured output
    

----------

## 18.4 Rubric and Grade Controls

The grading panel should remain visible while reviewing evidence.

Include:

-   Auto-check score
    
-   Final score
    
-   Maximum score
    
-   Rubric criteria
    
-   Points per criterion
    
-   Teacher comment
    
-   Return to student
    
-   Save draft grade
    
-   Save and finalize
    

The final teacher score is authoritative.

When overriding an auto-check result:

-   Require a reason
    
-   Show the original score
    
-   Show the new score
    
-   Record an audit event
    
-   Display a confirmation dialog
    

----------

# 19. Grade Audit History

Display grade changes as a chronological timeline.

Each entry should show:

-   Date and time
    
-   Teacher or admin
    
-   Previous value
    
-   New value
    
-   Reason
    
-   Finalization state
    

Use a compact timeline rather than a dense database-style table.

----------

# 20. Authentication Screens

## 20.1 Login Page

Retain the previously established Cipher login direction:

-   Split layout on desktop
    
-   Cybersecurity illustration on the left
    
-   Login form on the right
    
-   Cipher logo
    
-   Email/password login
    
-   Google login
    
-   Clear domain restriction messaging
    

Google sign-in should communicate:

```text
Use your baisedu.org school account.

```

For rejected accounts:

```text
Cipher is currently available only to verified baisedu.org accounts.

```

Do not reveal raw token or authentication errors.

----------

# 21. Empty, Loading, and Error States

## 21.1 Empty States

Every major screen should have a useful empty state.

Examples:

### No missions assigned

```text
No missions assigned yet.
Your teacher’s assignments will appear here.

```

### No review queue

```text
You’re all caught up.
There are no submitted attempts waiting for review.

```

### No support events

```text
No support changes recorded.
This attempt is currently marked Independent.

```

Include one relevant icon and one clear next action.

----------

## 21.2 Loading States

Use skeletons for:

-   Dashboard metrics
    
-   Mission cards
    
-   Tables
    
-   Attempt evidence
    
-   Charts
    

Use spinners only for short, direct actions such as:

-   Submit
    
-   Save grade
    
-   Run test
    
-   Send AI message
    

----------

## 21.3 Error States

Errors should explain:

-   What failed
    
-   Whether work is safe
    
-   What action the user can take
    

Example:

```text
The auto-check could not run.
Your draft is saved, and you can still submit your attempt.
[Try Again]

```

Do not use generic messages such as “Something went wrong” when a more specific explanation is available.

----------

# 22. Motion and Animation

Use **Motion** sparingly to improve orientation and feedback.

Recommended animations:

-   Page content fade and slight upward movement
    
-   Sidebar active-state transition
    
-   Card hover elevation
    
-   Drawer and modal entrance
    
-   Tab underline transition
    
-   Toast entrance and exit
    
-   Progress-bar animation
    
-   Support-signal selection
    
-   Mission-step completion
    
-   Network-node selection
    
-   AI panel expansion
    
-   Accordion expansion
    

Suggested page transition:

```jsx
<motion.main
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.22, ease: "easeOut" }}
>
  {children}
</motion.main>

```

Recommended duration range:

-   Microinteraction: 120–180 ms
    
-   Page or panel transition: 180–280 ms
    
-   Complex layout transition: no more than 350 ms
    

Respect `prefers-reduced-motion`.

Avoid:

-   Continuous glowing
    
-   Bouncing controls
    
-   Long entrance sequences
    
-   Animated backgrounds
    
-   Decorative particle effects
    
-   Motion that delays access to content
    

----------

# 23. Font Awesome Icon Guidelines

Use `@fortawesome/react-fontawesome`.

Example setup:

```tsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faBullseye,
  faRobot,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

```

Guidelines:

-   Use one icon style consistently
    
-   Use solid icons for primary navigation and actions
    
-   Use regular icons only when the distinction is intentional
    
-   Keep common navigation icons around 16–18 pixels
    
-   Keep card icons around 18–22 pixels
    
-   Do not use icons without accompanying labels for unfamiliar actions
    
-   Add accessible labels to icon-only buttons
    
-   Mark decorative icons with `aria-hidden="true"`
    

Example:

```tsx
<button aria-label="Open notifications">
  <FontAwesomeIcon icon={faBell} aria-hidden="true" />
</button>

```

----------

# 24. Component Architecture

Recommended shared components:

```text
components/
├── layout/
│   ├── AppShell
│   ├── StudentSidebar
│   ├── TeacherSidebar
│   ├── MobileNavigation
│   └── PageHeader
├── ui/
│   ├── Button
│   ├── IconButton
│   ├── Card
│   ├── Badge
│   ├── ProgressBar
│   ├── Tabs
│   ├── Modal
│   ├── Drawer
│   ├── Dropdown
│   ├── Select
│   ├── Tooltip
│   ├── Toast
│   ├── EmptyState
│   ├── Skeleton
│   └── DataTable
├── missions/
│   ├── MissionCard
│   ├── MissionFilters
│   ├── MissionSteps
│   ├── MissionHeader
│   ├── MissionStatusBadge
│   └── AttemptProgress
├── support/
│   ├── SupportSignalControl
│   ├── SupportTimeline
│   └── SupportSummary
├── grading/
│   ├── RubricView
│   ├── TeacherGradeControls
│   ├── AutoCheckResult
│   └── GradeAuditTimeline
├── simulators/
│   ├── BashSimulator
│   ├── NetworkSimulator
│   ├── FirewallRuleEditor
│   └── TrafficTestPanel
└── ai/
    ├── AITutorPanel
    ├── AIMessage
    ├── SuggestedPrompts
    └── AIUnavailableState

```

----------

# 25. Tailwind Component Patterns

## Primary button

```tsx
<button
  className="
    inline-flex h-11 items-center justify-center gap-2
    rounded-lg bg-blue-600 px-4
    text-sm font-semibold text-white
    shadow-sm transition
    hover:bg-blue-700
    focus:outline-none focus:ring-4 focus:ring-blue-100
    disabled:cursor-not-allowed disabled:opacity-50
  "
>
  Submit Attempt
</button>

```

## Secondary button

```tsx
<button
  className="
    inline-flex h-11 items-center justify-center gap-2
    rounded-lg border border-slate-300 bg-white px-4
    text-sm font-semibold text-slate-700
    transition hover:bg-slate-50
    focus:outline-none focus:ring-4 focus:ring-slate-100
  "
>
  Save Draft
</button>

```

## Standard card

```tsx
<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  {children}
</section>

```

## Status badge

```tsx
<span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
  In Progress
</span>

```

----------

# 26. Database-to-UI Mapping

## PostgreSQL entity mapping

### `class_sections`

Displayed in:

-   Section selector
    
-   Teacher section list
    
-   Assignment workflow
    
-   Gradebook filters
    

### `missions`

Displayed in:

-   Mission catalog
    
-   Student dashboard
    
-   Assignment workflow
    
-   Mission workspace
    
-   Teacher reports
    

### `mission_attempts`

Displayed in:

-   My Attempts
    
-   Review queue
    
-   Mission progress
    
-   Attempt review
    
-   Student feedback history
    

### `attempt_evidence`

Displayed in:

-   Mission workspace
    
-   Teacher evidence tabs
    
-   Auto-check details
    
-   Returned submission view
    

### `support_events`

Displayed in:

-   Student support timeline
    
-   Teacher attempt summary
    
-   Section support analytics
    

### `auto_check_results`

Displayed in:

-   Student submission status
    
-   Teacher attempt review
    
-   Grade panel
    
-   Simulator feedback
    

### `grades`

Displayed in:

-   Student returned mission
    
-   Gradebook
    
-   Teacher attempt review
    
-   Reports
    

### `grade_audit_events`

Displayed in:

-   Grade history tab
    
-   Administrative audit views
    

### `ai_tutor_sessions` and `ai_tutor_messages`

Displayed in:

-   AI tutor panel
    
-   AI-use metadata
    
-   Optional administrative review
    

AI records should remain visually and structurally distinct from student final evidence.

----------

# 27. Accessibility Requirements

Meet WCAG-oriented accessibility practices.

Required:

-   Semantic landmarks
    
-   Keyboard-accessible navigation
    
-   Visible focus states
    
-   Input labels
    
-   Error associations
    
-   Sufficient contrast
    
-   Descriptive button labels
    
-   Accessible tables
    
-   Screen-reader text for icon-only controls
    
-   Reduced-motion support
    
-   No color-only state communication
    
-   Logical tab order
    
-   Accessible modal focus trapping
    
-   Form error summaries for long forms
    

For simulator canvases, provide:

-   Keyboard-selectable nodes where feasible
    
-   Text-based topology summary
    
-   Non-canvas rule editor
    
-   Accessible traffic-test results
    
-   A fallback structured representation of the network
    

----------

# 28. Final Experience Principles

The finished application should consistently follow these principles:

1.  **Missions are the primary learning unit.**

2.  **Student evidence is more important than passive completion.**
    
3.  **Current actions must be immediately visible.**
    
4.  **Support use is reflective evidence, not punishment.**
    
5.  **AI remains formative and clearly bounded.**
    
6.  **Teachers retain authority over final grades.**
    
7.  **Technical simulations must feel authentic but remain safe.**
    
8.  **The interface should expose complexity progressively.**
    
9.  **Students should never lose work silently.**
    
10.  **Every status should have a clear next action.**
    
11.  **AP units and skill categories should remain visible throughout the experience.**
    
12.  **The UI should feel calm, structured, and trustworthy rather than theatrical.**
