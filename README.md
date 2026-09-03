# ⚡ REDDOT Enterprise Workspace & Live Wallpaper OS

A secure, internet-connected employee workspace application for small organizations (4–10 people) built with **Electron**, **Vanilla HTML/CSS/JavaScript**, **Firebase Authentication**, **Cloud Firestore**, and **Firebase Realtime Database**.

---

## 🏗️ Architecture & Features

- **Identity & Authentication**: Firebase Authentication (Email/Password) with individual accounts, password resets, and session recovery.
- **Organization Scope**: Strict multi-tenant isolation under `organizations/reddot/`.
- **Role Hierarchy**:
  - `owner`: Full workspace authority, role assignment, audit logs.
  - `admin`: Task creation & assignment, member invitations, team presence.
  - `employee`: Assigned task management, team chat channels & direct messages, shift logging.
- **Tasks Center**: Real-time Firestore task board with priority badges, deadlines, status transitions (`ASSIGNED` ➔ `REACHED` ➔ `ACCOMPLISHED`), and activity comments.
- **Team Communication**: Team channels (`#general`, `#announcements`, `#engineering`) and 1-on-1 direct messages with native desktop notifications.
- **Real-Time Presence**: Minimal, transparent device presence (`online`, `away`, `offline`) via Realtime Database and Electron `powerMonitor`.
- **Zero-Surveillance Guarantee**: Absolute commitment against keylogging, screenshots, camera spying, or secret productivity metrics.

---

## 🔥 Firebase Console Setup Guide (Step-by-Step)

Follow these steps to connect your own free Firebase project:

### 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project**, enter a name (e.g. `reddot-workspace`), and click **Continue**.

### 2. Enable Authentication
1. In the left sidebar, navigate to **Build ➔ Authentication**.
2. Click **Get Started**, select **Email/Password**, and enable **Email/Password**. Click **Save**.

### 3. Create Cloud Firestore Database
1. Navigate to **Build ➔ Firestore Database**.
2. Click **Create Database**, select a server location near your team (e.g. `nam5 (us-central)` or `asia-south1`), and start in **Production Mode**.
3. In the **Rules** tab, paste the contents of [`firestore.rules`](firestore.rules) and click **Publish**.

### 4. Create Realtime Database (for Presence)
1. Navigate to **Build ➔ Realtime Database**.
2. Click **Create Database**, choose your region, and select **Start in locked mode**.
3. In the **Rules** tab, paste the contents of [`database.rules.json`](database.rules.json) and click **Publish**.

### 5. Register Web App & Copy Credentials
1. Click the **Project Settings** (gear icon) ➔ **General**.
2. Under *Your apps*, click the **Web (</>)** icon.
3. Name the app `REDDOT Desktop App` and click **Register App**.
4. Copy the `firebaseConfig` object and paste it into [`wallpaper-ui/firebase-config.js`](wallpaper-ui/firebase-config.js) or paste it in the **Settings** tab inside the running desktop app.

---

## 🎮 How to Run & Build

### Running Locally:
1. Double-click [`start-wallpaper-app.bat`](start-wallpaper-app.bat) or run:
   ```bash
   npm start
   ```
2. The application will launch as a seamless desktop background wallpaper with full interactive access via the Command Center (`Space` key).

### Packaging Standalone Windows `.exe`:
Double-click [`build-windows-exe.bat`](build-windows-exe.bat) or run:
```bash
npm run dist
```
The compiled NSIS installer and portable `.exe` will be generated in the `release/` directory.

---

## 🔒 Security & Privacy

Read our full zero-surveillance disclosure and data retention policy in [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md).
