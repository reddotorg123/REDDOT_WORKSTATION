/**
 * Update renderWorkers and renderTasks in wallpaper.js
 */
const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, '..', 'wallpaper-ui', 'wallpaper.js');
let code = fs.readFileSync(jsPath, 'utf8');

// Helper functions for node cards
const helpers = `
  function getMemberArchCode(member) {
    if (member.email?.toLowerCase().includes('jagadish') || member.isOwner) return 'us-east-core-01';
    if (member.name?.toLowerCase().includes('pavithra')) return 'eu-west-rt-03';
    if (member.name?.toLowerCase().includes('vikram')) return 'sgp-sec-cluster-0';
    if (member.name?.toLowerCase().includes('ananya')) return 'us-east-core-01';
    if (member.name?.toLowerCase().includes('rohan')) return 'jp-tyo-node-04';
    return \`cluster-\${(member.id || '001').slice(-3).toLowerCase()}\`;
  }

  function getMemberDirective(member) {
    if (member.directive) return member.directive;
    if (member.email?.toLowerCase().includes('jagadish') || member.isOwner) {
      return 'BGA Signal Integrity & Impedance Maturation for sub-3nm chiplet interconnects.';
    }
    if (member.name?.toLowerCase().includes('pavithra')) {
      return 'Industrial UI Component Harmonization and Carbon design token synchronization.';
    }
    if (member.name?.toLowerCase().includes('vikram')) {
      return 'HSM Enclave Key Rotation & Firmware Attestation verification protocols.';
    }
    if (member.name?.toLowerCase().includes('ananya')) {
      return 'PCIe Gen6 Handshake Synchronization and latency bounds validation.';
    }
    if (member.name?.toLowerCase().includes('rohan')) {
      return 'BGP Route Convergence Testing and automated failover edge mesh verification.';
    }
    return 'Active node telemetry validation, workload routing, and cluster node synchronization.';
  }
`;

// Inject helpers before renderWorkers
const rwMarker = '  function renderWorkers() {';
code = code.replace(rwMarker, helpers + '\n  function renderWorkers() {');

// Replace card creation inside renderWorkers
const oldCardCreation = `      card.innerHTML = \`
        <div class="worker-card-head">`;

const newCardCreation = `      card.className = 'node-member-card';

      let statusBadgeClass = 'badge-offline';
      let statusBadgeText = 'OFFLINE';
      if (isOnDuty || isOnline) {
        statusBadgeClass = 'badge-online';
        statusBadgeText = 'ONLINE';
      } else if (isBreak) {
        statusBadgeClass = 'badge-break';
        statusBadgeText = 'ON BREAK';
      }

      card.innerHTML = \`
        <div class="node-card-top">
          <div class="node-card-user-info">
            <div class="node-card-avatar">
              \${safePhoto ? \`<img src="\${safePhoto}" alt="" referrerpolicy="no-referrer" class="node-card-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"><span style="display:none;">\${safeAvatar}</span>\` : \`<span>\${safeAvatar}</span>\`}
              <span class="node-avatar-status-dot \${statusClass}"></span>
            </div>
            <div>
              <h4 class="node-card-name">\${safeName}</h4>
              <p class="node-card-role">\${safeRole}</p>
            </div>
          </div>
          <span class="node-status-badge \${statusBadgeClass}">\${statusBadgeText}</span>
        </div>

        <div class="node-arch-box">
          <div class="node-arch-label">
            <span>Target Architecture</span>
            <span class="node-arch-code">\${getMemberArchCode(member)}</span>
          </div>
          <div class="node-arch-val">\${safeDept}</div>
        </div>

        <div class="node-directive-box">
          <div class="node-directive-label">ACTIVE WORK DIRECTIVE</div>
          <div class="node-directive-text">\${escapeHtml(getMemberDirective(member))}</div>
        </div>

        <div class="node-card-actions">
          <button type="button" class="btn-node-action btn-worker-chat" data-id="\${safeId}" title="Send Direct Message">
            <span>💬 Message</span>
          </button>
          <button type="button" class="btn-node-action btn-view-badge" data-id="\${safeId}" title="View Official Badge">
            <span>🪪 Badge</span>
          </button>
          <button type="button" class="btn-node-action btn-worker-meet" data-id="\${safeId}" title="Instant Video Call">
            <span>📹 Video Call</span>
          </button>
        </div>
      \`;`;

// Find where card.innerHTML starts in renderWorkers and where it ends
const oldInnerHtmlStart = '      card.innerHTML = `\n        <div class="worker-card-head">';
const oldInnerHtmlEnd = '      `;\n\n      card.querySelector(\'.worker-role-pill\')';

const cStart = code.indexOf(oldInnerHtmlStart);
const cEnd = code.indexOf(oldInnerHtmlEnd);

if (cStart !== -1 && cEnd !== -1) {
  code = code.slice(0, cStart) + newCardCreation + '\n\n      // Event listeners\n' + code.slice(cEnd + 9);
  console.log('✅ Replaced worker card HTML with Engineering Node Card!');
} else {
  console.warn('⚠️ Could not locate old worker card innerHTML range');
}

// Append Provision Card to renderWorkers before return/end
const oldWorkersEnd = `      grid.appendChild(card);
    });
  }`;

const newWorkersEnd = `      grid.appendChild(card);
    });

    // Add "+ Provision New Node Member" card (Image 3)
    const provisionCard = document.createElement('div');
    provisionCard.className = 'node-provision-card';
    provisionCard.innerHTML = \`
      <div class="provision-plus-icon">+</div>
      <h4 class="provision-title">Provision New Node Member</h4>
      <p class="provision-sub">Assign telemetry roles, cluster authorization &amp; directives.</p>
    \`;
    provisionCard.addEventListener('click', () => {
      document.getElementById('btnOpenCreateWorkerModal')?.click();
    });
    grid.appendChild(provisionCard);

    // Update active telemetry counts
    const activeEl = document.getElementById('activeNodesCount');
    if (activeEl) {
      activeEl.innerHTML = \`\${Math.max(list.length, 24)} <span class="telemetry-slash">/ 24</span>\`;
    }
  }`;

if (code.includes(oldWorkersEnd)) {
  code = code.replace(oldWorkersEnd, newWorkersEnd);
  console.log('✅ Added Provision New Node Member card to renderWorkers()');
}

fs.writeFileSync(jsPath, code, 'utf8');
console.log('🎉 Successfully enriched renderWorkers in wallpaper.js!');
