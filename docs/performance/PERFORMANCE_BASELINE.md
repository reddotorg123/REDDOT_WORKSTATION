# REDDOT Workstation — Performance Baseline & Targets

**Date**: November 2026  
**Environment**: Windows 11 Desktop, Electron 34, React 19  

---

## 1. Measured Baseline vs. Target SLA

| Metric | Measured Baseline (Pre-Upgrade) | Target Production SLA | Optimization Mechanism |
|---|---|---|---|
| **Cold Startup Time** | 4.8s – 6.2s | < 3.0s | Code-splitting, deferred non-critical IPC, lazy loading heavy modals |
| **Warm Startup Time** | 2.5s – 3.2s | < 1.5s | Pre-cached bundle assets, local IndexedDB state hydration |
| **Screen Navigation** | 180ms – 320ms | < 100ms | Eliminated redundant cloud fetch on screen switch; memoized view components |
| **Punch Confirmation** | 850ms – 1.4s (network bound) | < 100ms (p95) | Local-first write: punch acknowledged instantly, synced asynchronously via outbox |
| **Firestore Daily Reads** | Spike > 50,000 / day (limit hit) | < 5,000 / day | Daily windowing, single snapshot listener, client-side disk caching |
| **Taskbar App Polling CPU** | N/A (Orphaned / Unconnected) | < 1% CPU utilization | 30s throttling on `tasklist` execution with smart delta diffing |
| **Idle Memory Footprint** | 240 MB – 380 MB | < 180 MB | Pruned detached DOM nodes, eliminated duplicate Firebase client instances |

---

## 2. Profiling Methodology

1. **Startup Measurement**: `performance.now()` markers injected from `main.js` (`app.on('ready')`) to React root mount (`main.jsx` -> `App.jsx` `componentDidMount`).
2. **IPC Roundtrip Latency**: Measured using `console.time('ipc-tasklist')` across 50 consecutive runs.
3. **Database Read/Write Timers**: Instrumented inside `databaseBridge.js` and `firebaseBridge.js`.

