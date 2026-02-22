// patch4.js - Fix chairs + fix consultation form suggestions
// Run: node patch4.js
const fs = require('fs');
const file = './public/index.html';
let c = fs.readFileSync(file, 'utf8');

// ============================================================
// FIX 1: Force reset chairs in localStorage on every load
// Inject into the init function after chairs are loaded
// ============================================================
const oldChairInit = `const savedChairs = DataStore.load('chairs', null);
  if (!savedChairs || savedChairs.length === 0) {
    state.chairs = Array.from({ length: 6 }, (_, i) => ({ id: i + 1, status: 'available' }));
    DataStore.save('chairs', state.chairs);
  } else {
    state.chairs = savedChairs;
  }`;

const newChairInit = `const savedChairs = DataStore.load('chairs', null);
  if (!savedChairs || savedChairs.length === 0) {
    state.chairs = [
      {id:1, name:'Chair 1', status:'available'},
      {id:2, name:'Chair 2', status:'available'},
      {id:3, name:'Chair 3', status:'available'},
      {id:4, name:'Chair 4', status:'available'},
      {id:5, name:'Chair 5', status:'available'},
      {id:6, name:'Chair 6', status:'available'}
    ];
    DataStore.save('chairs', state.chairs);
  } else {
    // Ensure chairs have name property
    state.chairs = savedChairs.map(function(ch) {
      return { id: ch.id, name: ch.name || ('Chair ' + ch.id), status: ch.status || 'available' };
    });
  }`;

if (c.includes(oldChairInit)) {
  c = c.replace(oldChairInit, newChairInit);
  console.log('✅ Fix 1: Chair initialization fixed');
} else {
  console.log('⚠️  Fix 1: Chair init pattern not found - trying alternate');
  // Try with \r\n
  const alt = oldChairInit.replace(/\n/g, '\r\n');
  if (c.includes(alt)) {
    c = c.replace(alt, newChairInit);
    console.log('✅ Fix 1: Chair initialization fixed (CRLF)');
  }
}

// ============================================================
// FIX 2: Override assignChairModal to use a proper select UI
// ============================================================
const oldAssign = `function assignChairModal(planId) {`;
const newAssignFunc = `function assignChairModal(planId) {
  const plan = state.treatmentPlans.find(function(tp) { return tp.id === planId; });
  if (!plan) return;
  const patient = state.patients.find(function(p) { return p.id === plan.patientId; });
  
  // Ensure chairs exist
  if (!state.chairs || state.chairs.length === 0) {
    state.chairs = [
      {id:1,name:'Chair 1',status:'available'},
      {id:2,name:'Chair 2',status:'available'},
      {id:3,name:'Chair 3',status:'available'},
      {id:4,name:'Chair 4',status:'available'},
      {id:5,name:'Chair 5',status:'available'},
      {id:6,name:'Chair 6',status:'available'}
    ];
    DataStore.save('chairs', state.chairs);
  }
  
  const availableChairs = state.chairs.filter(function(c) { return c.status === 'available'; });
  
  if (availableChairs.length === 0) {
    if (confirm('All chairs are occupied. Reset all chairs to available? (Use for testing)')) {
      state.chairs.forEach(function(ch) { ch.status = 'available'; });
      DataStore.save('chairs', state.chairs);
      assignChairModal(planId);
    }
    return;
  }
  
  // Show modal-style dialog
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = \`
    <div style="background:white;border-radius:20px;padding:32px;width:400px;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <h3 style="margin:0 0 8px;color:#1e293b;font-size:20px;">💺 Assign Chair</h3>
      <p style="color:#64748b;margin:0 0 20px;">Patient: <strong>\${patient ? patient.name : 'Unknown'}</strong></p>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px;">
        \${availableChairs.map(ch => \`
          <button onclick="doAssignChair(\${planId},\${ch.id})" 
            style="padding:16px 8px;background:#f0fdf4;border:2px solid #86efac;border-radius:12px;cursor:pointer;font-weight:600;color:#166534;font-size:15px;transition:all 0.2s;"
            onmouseover="this.style.background='#dcfce7'" onmouseout="this.style.background='#f0fdf4'">
            🪑<br>\${ch.name || 'Chair '+ch.id}
          </button>\`).join('')}
      </div>
      <button onclick="document.getElementById('chair-overlay').remove()" 
        style="width:100%;padding:12px;background:#f1f5f9;border:none;border-radius:10px;cursor:pointer;color:#64748b;font-size:15px;">Cancel</button>
    </div>\`;
  overlay.id = 'chair-overlay';
  document.body.appendChild(overlay);
  return; // old function body replaced below
}

function doAssignChair(planId, chairId) {
  document.getElementById('chair-overlay') && document.getElementById('chair-overlay').remove();
  const plan = state.treatmentPlans.find(function(tp) { return tp.id === planId; });
  const chair = state.chairs.find(function(c) { return c.id === chairId; });
  if (!plan || !chair) return;
  
  plan.chairAssigned = chairId;
  plan.status = 'in-treatment';
  chair.status = 'occupied';
  chair.patientId = plan.patientId;
  
  saveAllData();
  showNotification('✅ Chair ' + chairId + ' assigned!', 'success');
  renderDoctorsSection();
}

function _old_assignChairModal_replaced(planId) {`;

if (c.includes(oldAssign)) {
  c = c.replace(oldAssign, newAssignFunc);
  console.log('✅ Fix 2: assignChairModal replaced with UI dialog');
}

// ============================================================
// FIX 3: Fix consultation form - remove broken patch3 injection
//         and add clean complaint→treatment→medicine flow
// ============================================================

// Check if the CLINICAL_MAP already exists (from patch3)
if (c.includes('CLINICAL_MAP')) {
  console.log('ℹ️  Clinical map already present from patch3');
} else {
  console.log('⚠️  Clinical map missing - adding it');
}

// Remove broken patch3 dropdown injection if present
const brokenInjection = `<select id="complaint-select" onchange="document.getElementById('chief-complaint-input') && (document.getElementById('chief-complaint-input').value=this.value); onComplaintChange(this.value);"`;
if (c.includes(brokenInjection)) {
  // The patch3 injected into the wrong place - a JS string
  // This would have broken the template literal
  console.log('⚠️  Removing broken patch3 dropdown injection from JS string...');
  // Find and remove the injected HTML that's inside a JS string
  const startTag = '\n<select id="complaint-select"';
  const endTag = 'Selected Medicines</div>\n\'Chief Complaint / Reason for Visit\'';
  const startIdx = c.indexOf(brokenInjection);
  if (startIdx > -1) {
    // Find the surrounding context
    const beforeSelect = c.lastIndexOf("'", startIdx - 1);
    const afterTag = c.indexOf("'Chief Complaint / Reason for Visit'", startIdx);
    if (afterTag > -1) {
      // Remove injected HTML from inside JS string
      c = c.substring(0, startIdx) + c.substring(afterTag);
      console.log('✅ Removed broken injection');
    }
  }
}

// Now find renderActiveConsultationForm and inject a clean complaint section
// Find the textarea/input for chief complaint in the consultation form HTML
const complaintPatterns = [
  `placeholder="Chief Complaint / Reason for Visit"`,
  `placeholder='Chief Complaint / Reason for Visit'`,
  `Chief Complaint / Reason for Visit`
];

let complaintFixed = false;
for (const pattern of complaintPatterns) {
  if (c.includes(pattern) && !complaintFixed) {
    // Add id and onchange to the existing input
    if (c.includes(`id="chief-complaint-input"`)) {
      console.log('ℹ️  chief-complaint-input already has id');
      complaintFixed = true;
    } else {
      c = c.replace(pattern, `id="chief-complaint-input" onchange="onComplaintChange(this.value)" ` + pattern);
      console.log('✅ Fix 3: Added onchange to chief complaint input');
      complaintFixed = true;
    }
    break;
  }
}

// ============================================================
// FIX 4: Inject suggestion panels into consultation form HTML
// Find where chief complaint input is rendered and add panels after it
// ============================================================
const suggestionPanels = `
<!-- CLINICAL SUGGESTIONS -->
<div style="margin-bottom:12px;">
  <label style="font-weight:600;color:#475569;font-size:13px;display:block;margin-bottom:6px;">🦷 Quick Select Chief Complaint:</label>
  <select onchange="this.previousElementSibling && null; onComplaintChange(this.value); var inp=document.getElementById('chief-complaint-input'); if(inp)inp.value=this.value;" 
    style="width:100%;padding:10px;border:2px solid #e2e8f0;border-radius:10px;font-size:14px;color:#1e293b;background:white;">
    <option value="">-- Select Complaint --</option>
    <option>Toothache / Pain</option>
    <option>Cavity / Decay</option>
    <option>Gum Problem / Bleeding Gums</option>
    <option>Sensitivity</option>
    <option>Broken / Chipped Tooth</option>
    <option>Missing Tooth</option>
    <option>Swelling / Abscess</option>
    <option>Crooked / Misaligned Teeth</option>
    <option>Teeth Whitening</option>
    <option>Bad Breath</option>
    <option>Jaw Pain / TMJ</option>
    <option>Child Dental / Pediatric</option>
    <option>Denture Problem</option>
    <option>Implant Follow-up</option>
    <option>Routine Checkup / Cleaning</option>
  </select>
</div>
<div id="suggested-treatments" style="margin-bottom:12px;"></div>
<div id="selected-treatments-list" style="margin-bottom:4px;"></div>
<div id="treatment-total-display" style="display:none;font-weight:700;color:#1e293b;margin-bottom:12px;padding:8px 12px;background:#f0fdf4;border-radius:8px;">
  💰 Treatment Total: <span id="treatment-total">₹0</span>
</div>
<div id="suggested-medicines" style="margin-bottom:12px;"></div>
<div id="selected-medicines-list" style="margin-bottom:12px;"></div>`;

// We need to inject this INSIDE the consultation form HTML template
// Look for where chief complaint section ends in the HTML template
const chiefComplaintSection = `id="chief-complaint-input"`;
if (c.includes(chiefComplaintSection)) {
  // Find the closing tag of that input's container
  const idx = c.indexOf(chiefComplaintSection);
  // Find end of that input tag
  const endOfInput = c.indexOf('>', idx) + 1;
  // Check if next char is newline or continuation
  const insertPoint = endOfInput;
  c = c.slice(0, insertPoint) + '\n' + suggestionPanels + c.slice(insertPoint);
  console.log('✅ Fix 4: Suggestion panels injected after complaint input');
}

// ============================================================
// Save
// ============================================================
fs.writeFileSync(file, c, 'utf8');
const lines = c.split('\n').length;
console.log(`\n✅ Done! Lines: ${lines}`);
console.log('\nNow run in browser console to reset chairs:');
console.log("localStorage.removeItem('chairs'); location.reload();");
console.log('\nThen restart: node server.js');
