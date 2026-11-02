# ?? REDDOT WORKSTATION OS • 5-MEMBER TEAM SETUP & SHARING GUIDE

Welcome to the **REDDOT Workstation OS & Enterprise Cloud Collaboration Platform**. This application connects your entire 5-member team in real-time across different Windows PCs, networks, and remote locations with live chat, tasks, member presence, meetings, and hardware aesthetic wallpapers.

---

## 🚀 How to Share with Your Team

Use the current Windows setup installer:

📦 `app\v3.12.0\REDDOT-Workstation-OS-Setup.exe`
- Installs the app and creates desktop and Start Menu shortcuts.
- This installer is unsigned, so Windows may show an unknown-publisher warning.
- Deploy the Firebase security rules before distributing the installer.

### Steps for Teammates (e.g., Pavithra):
1. **Send the File**: Share `REDDOT-Workstation-OS-Setup.exe` via Google Drive, OneDrive, USB pendrive, or chat.
2. **Launch & Sign In**: Double-click the file to open.
   - *No Node.js or complex setup required! It runs out of the box on Windows 10 & 11.*

---

## ?? How to Connect All 5 Team Members

### 1. Founder / Administrator Sign-In
- **Email**: jagadish2k2006@gmail.com
- **Role**: Founder / System Architect (RD-FOUNDER-001, Department: Hardware Architecture)
- Full admin permissions: Assign roles, create company-wide tasks, manage channels, and supervise presence telemetry.

### 2. Teammate Account Creation (Self-Service)
Only approved team email addresses can access the workspace. A new account must verify its email before it can read or change workspace data.

Each approved team member launches the app and clicks **Connect Cloud Workstation / Sign Up**:
1. Enter the exact email address already approved in the app and Firestore rules.
2. Enter their Full Name (e.g. Sarah Connor).
3. Choose their department (e.g. Firmware & Embedded, AI / ML Systems, Robotics & Controls).
4. (Optional) Select their Badge Photo.
5. Click **Create Official Profile & Connect**, then open the verification email.
6. After verifying the email, return to the app and sign in.

The member profile and online status appear to teammates after the verified user signs in. To authorize another teammate, update the approved-email checks in `wallpaper-ui/firebase-service.js` and `firestore.rules`, test the rules, and rebuild the installer.

Sign in to Firebase CLI with an authorized project administrator account:

```powershell
npx firebase-tools@14.12.0 login
```

After confirming the approved accounts can sign in, deploy the rules from the project folder with:

```powershell
npx firebase-tools@14.12.0 deploy --only firestore:rules,database --project reddot-workspace
```

---

## ?? Real-Time Teams Communication (Like Microsoft Teams & WhatsApp)

- **Public Channels**:
  - #general: Company-wide announcements, collaboration, and updates.
  - #announcements: Official executive notices and milestones.
  - #engineering: Hardware architecture, schematic reviews, firmware, and code discussions.
  - #projects: Active hardware prototyping deliverables and sprint tracking.
  - #watercooler: Casual team conversation and virtual break room.
- **1-on-1 Direct Messages (DMs)**:
  - Click on any colleague's name under **DIRECT MESSAGES** in the Chat tab (or click **?? Message** on their Directory card).
  - All messages sync instantly in real-time with full Firestore cloud backup.
- **Instant Video/Voice Meetings**:
  - Click **?? Meet** on any member card or **Start Meeting** in any chat to open an instant meeting room for the team.

---

## ?? Task Delegation & Progress Management

- **Admin Task Assignment**:
  - Navigate to **Tasks** tab &rarr; Enter Title, Priority, Deadline, and select the specific team member (or *Entire Team*).
  - Click **? Assign Task**.
- **Teammate Task View**:
  - Teammates can click the **My Tasks** filter chip to immediately see all tasks assigned to them.
  - Teammates can change status to **In Progress** or **Completed**, and add comments in the **Activity & Comments** modal.

---

## 🌐 Official GitHub Repository & Worldwide OTA Releases

- **GitHub Repository**: [https://github.com/reddotorg123/REDDOT_WORKSTATION](https://github.com/reddotorg123/REDDOT_WORKSTATION)
- **Latest Releases**: [https://github.com/reddotorg123/REDDOT_WORKSTATION/releases](https://github.com/reddotorg123/REDDOT_WORKSTATION/releases)
- **Worldwide OTA Channel**: Built-in Fastly CDN distribution for zero-latency team updates across the globe.
- **Direct Portable Download**: Teammates anywhere in the world can download the latest package directly from GitHub Releases (`REDDOT-Workstation-OS-Portable.zip`).
