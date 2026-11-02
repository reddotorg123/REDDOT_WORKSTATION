# REDDOT Workstation — Target Architecture (Local-First Modular Monolith)

**Status**: Approved Architecture Blueprint  
**Objective**: Enterprise reliability, zero-cost cloud footprint, sub-100ms local interactions.  

---

## 1. Architectural Philosophy: Local-First with Distributed Sync

```text
REDDOT WORKSTATION TARGET SYSTEM
|
+-- PRESENTATION LAYER (Strictly Unchanged UI/UX)
|   +-- React 19 UI (Dashboard, Attendance, Tasks, Team, Messages, Files, Terminal)
|   +-- Virtualized Large Lists (Messages, Task items, Punch audit logs)
|   +-- Minimal rerender hooks & Memoized selectors
|
+-- APPLICATION LAYER
|   +-- AttendanceEngine (Productive calculation = Active - Idle - Breaks)
|   +-- ProcessMonitorService (Polls local tasklist every 30s)
|   +-- SignalingCoordinator (Free Jitsi P2P voice/video call rooms)
|   +-- BackgroundTaskCoordinator (Queues, priorities, exponential backoff)
|
+-- LOCAL DATA ENGINE (Zero-Latency Persistent Store)
|   +-- Structured JSON / SQLite local repository
|   +-- Persistent Outbox (`sync_outbox` queue with status: pending, synced, failed)
|   +-- Indexed fast lookups for offline navigation
|
+-- SYNCHRONIZATION ENGINE
|   +-- Conflict Resolution (Append-only punches, versioned tasks)
|   +-- Cloud Read Throttling (Day-windowed queries, cached snapshot hashes)
|   +-- IndexedDB persistent cache enabled on Firebase client
|
+-- CLOUD ENGINE ($0 Infrastructure Tier)
|   +-- Cloud Firestore (Batched updates, scoped channel messages)
|   +-- Firebase Auth (Email/password + OAuth verification)
|   +-- Google Drive API / Cloud Storage (Private enterprise vault)
|
+-- ELECTRON NATIVE LAYER
    +-- Hardened IPC Bridge (Whitelisted channels & parameter sanitization)
    +-- Native powerMonitor hook (System idle time detection)
    +-- Sandboxed process execution for Terminal
```

---

## 2. Layer Separation & Component Responsibilities

### 2.1. Local Data Engine & Persistent Outbox
- **Primary Read/Write Path**: All user actions (punches, task status toggles, chat messages) immediately commit to local storage in under 50ms.
- **Outbox Pattern**: Changes are queued to `sync_outbox`. When network connectivity is established, the Background Task Coordinator flushes pending items to Cloud Firestore with idempotency keys.
- **Zero Loss Guarantee**: If an employee closes the workstation or shuts down their PC immediately after clocking out, the record is safely written to disk and synced automatically upon next launch.

### 2.2. Productive vs. Idle Time Measurement
- Shift hours are strictly calculated using hardware activity:
  - `Total Login Time = ClockOut Timestamp - ClockIn Timestamp`
  - `System Idle Time = Cumulative sum of periods where powerMonitor.getSystemIdleTime() > 300s`
  - `Productive Time = Total Login Time - (Break Durations + System Idle Time)`
- This prevents manual manipulation or false overtime claims while ensuring 100% accurate attendance metrics.

### 2.3. Zero-Cost Infrastructure Rules ($0/month)
- **Firestore Reads**: Never query full historical logs on application startup. Only query the current user's monthly slice and today's active team presence.
- **Presence & App Status**: Throttle heartbeat writes to once every 60 seconds. A team of 20 employees will produce under 10,000 document writes/day (well within Firebase's 20,000 free daily writes).
- **Video & Voice Calls**: Route all signaling through temporary Firestore documents that auto-expire, connecting peers to free, encrypted Jitsi Meet instances (`meet.jit.si`) without dedicated media servers.

