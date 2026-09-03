# REDDOT Enterprise Workspace: Privacy Policy & Zero-Surveillance Disclosure

**Effective Date:** August 26, 2026  
**Applicable Organization:** `reddot`

---

## 1. Zero-Surveillance Core Guarantee

REDDOT is designed strictly for **work coordination, transparent goal alignment, and team communication** for small, high-trust engineering and product organizations.

We uphold an absolute zero-surveillance design philosophy:

- ❌ **NO Keystroke Logging:** We do not capture, record, or count keystrokes.
- ❌ **NO Screenshots / Screen Capture:** We do not take background screenshots or window captures.
- ❌ **NO Clipboard Capture:** We do not inspect or read clipboard data.
- ❌ **NO Browser or URL Tracking:** We do not track websites visited or application usage outside REDDOT.
- ❌ **NO Camera / Mic Surveillance:** We do not activate cameras or microphones without explicit user interaction in a designated meeting.
- ❌ **NO Hidden Productivity Scoring:** We do not generate algorithmic productivity or activity scores based on surveillance.

---

## 2. Information We Collect and Store

All stored data is organization-scoped (`organizations/reddot/`) and managed using secure Google Cloud Firebase infrastructure:

1. **Authentication Data:**
   - Email address, display name, and hashed credentials managed by **Firebase Authentication**.
2. **Tasks & Work Goals:**
   - Task title, description, priority, due date, status, assignee, and comments created in **Cloud Firestore**.
3. **Communication:**
   - Messages sent to public team channels (`#general`, `#announcements`, `#engineering`) and direct messages.
4. **Transparent Presence:**
   - Real-time online/away/offline state based on active desktop focus and Windows lock state.
   - App build version and optional system uptime to help resolve IT issues.

---

## 3. Data Access & Role Permissions

Access to organization data is strictly enforced at the database level by **Firestore Security Rules**:

- **Owners:** Can manage organization settings, invite members, assign roles, and view workspace audit logs.
- **Admins:** Can create and assign tasks, invite members, and view team presence.
- **Employees:** Can view directory, collaborate in team channels and DMs, update assigned task progress, and log personal shift hours.

---

## 4. Data Retention & Deletion

- Workspace data is retained for as long as the organization remains active.
- Employees may request account deletion or profile updates through their organization Administrator or Owner.
- Audit logs are immutable records maintained for administrative transparency.
