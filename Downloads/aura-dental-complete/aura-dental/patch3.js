// patch3.js - Adds clinical intelligence mapping
// Run: node patch3.js
const fs = require('fs');
const file = './public/index.html';
let c = fs.readFileSync(file, 'utf8');

// ============================================================
// 1. Add clinical data map (complaints → treatments → medicines)
// ============================================================
const clinicalMap = `
// ================== CLINICAL INTELLIGENCE MAP ==================
const CLINICAL_MAP = {
  'Toothache / Pain': {
    treatments: ['Pulpotomy', 'Root Canal Treatment (RCT)', 'Extraction', 'Temporary Filling', 'Permanent Filling'],
    medicines: ['Ibuprofen 400mg', 'Amoxicillin 500mg', 'Metronidazole 400mg', 'Paracetamol 500mg', 'Clindamycin 300mg']
  },
  'Cavity / Decay': {
    treatments: ['Composite Filling', 'Amalgam Filling', 'GIC Filling', 'Inlay/Onlay', 'Crown'],
    medicines: ['Fluoride Gel', 'Calcium Supplement', 'Chlorhexidine Mouthwash']
  },
  'Gum Problem / Bleeding Gums': {
    treatments: ['Scaling & Polishing', 'Deep Scaling (SRP)', 'Gum Flap Surgery', 'Curettage'],
    medicines: ['Metronidazole 400mg', 'Chlorhexidine Mouthwash', 'Vitamin C 500mg', 'Doxycycline 100mg']
  },
  'Sensitivity': {
    treatments: ['Desensitization', 'Fluoride Application', 'Composite Filling', 'Crown'],
    medicines: ['Sensodyne Paste', 'Fluoride Gel', 'Potassium Nitrate Gel']
  },
  'Broken / Chipped Tooth': {
    treatments: ['Composite Bonding', 'Crown', 'Veneer', 'Extraction', 'Composite Filling'],
    medicines: ['Ibuprofen 400mg', 'Paracetamol 500mg']
  },
  'Missing Tooth': {
    treatments: ['Dental Implant', 'Bridge (3-unit)', 'Partial Denture', 'Complete Denture', 'Flipper'],
    medicines: ['Calcium Supplement', 'Vitamin D3']
  },
  'Swelling / Abscess': {
    treatments: ['Incision & Drainage', 'Root Canal Treatment (RCT)', 'Extraction', 'Antibiotic Course'],
    medicines: ['Amoxicillin 500mg', 'Metronidazole 400mg', 'Ibuprofen 400mg', 'Paracetamol 500mg', 'Clindamycin 300mg']
  },
  'Crooked / Misaligned Teeth': {
    treatments: ['Orthodontic Consultation', 'Metal Braces', 'Clear Aligners', 'Retainer'],
    medicines: ['Orthodontic Wax']
  },
  'Teeth Whitening': {
    treatments: ['In-office Bleaching', 'Home Bleaching Kit', 'Scaling & Polishing', 'Veneers'],
    medicines: ['Whitening Gel 10%', 'Fluoride Gel']
  },
  'Bad Breath': {
    treatments: ['Scaling & Polishing', 'Deep Scaling (SRP)', 'Tongue Cleaning', 'Cavity Filling'],
    medicines: ['Chlorhexidine Mouthwash', 'Metronidazole 400mg', 'Probiotic Supplement']
  },
  'Jaw Pain / TMJ': {
    treatments: ['Occlusal Splint', 'Bite Adjustment', 'Physiotherapy Referral', 'Muscle Relaxant'],
    medicines: ['Ibuprofen 400mg', 'Muscle Relaxant', 'Paracetamol 500mg']
  },
  'Child Dental / Pediatric': {
    treatments: ['Pulpotomy (Milk Tooth)', 'Stainless Steel Crown', 'Space Maintainer', 'Fluoride Application', 'Pit & Fissure Sealant'],
    medicines: ['Paracetamol Syrup', 'Amoxicillin Syrup', 'Fluoride Drops']
  },
  'Denture Problem': {
    treatments: ['Denture Repair', 'Denture Reline', 'New Complete Denture', 'New Partial Denture'],
    medicines: ['Denture Adhesive', 'Antifungal Gel']
  },
  'Implant Follow-up': {
    treatments: ['Implant Placement', 'Implant Crown Fitting', 'Bone Grafting', 'Implant Checkup'],
    medicines: ['Amoxicillin 500mg', 'Ibuprofen 400mg', 'Chlorhexidine Mouthwash']
  },
  'Routine Checkup / Cleaning': {
    treatments: ['Scaling & Polishing', 'Fluoride Application', 'X-Ray (Periapical)', 'Oral Hygiene Instructions'],
    medicines: ['Fluoride Gel', 'Chlorhexidine Mouthwash']
  }
};

function onComplaintChange(val) {
  const map = CLINICAL_MAP[val];
  const tDiv = document.getElementById('suggested-treatments');
  const mDiv = document.getElementById('suggested-medicines');
  if (!tDiv || !mDiv) return;
  if (!map) { tDiv.innerHTML = ''; mDiv.innerHTML = ''; return; }
  
  tDiv.innerHTML = '<div style="margin-bottom:8px;font-weight:600;color:#475569;font-size:13px;">💡 Suggested Treatments (click to add):</div>' +
    map.treatments.map(t => \`<span onclick="addTreatment('\${t}')" style="display:inline-block;margin:4px;padding:6px 12px;background:#ede9fe;color:#7c3aed;border-radius:20px;cursor:pointer;font-size:13px;border:1px solid #ddd8fe;">\${t}</span>\`).join('');
  
  mDiv.innerHTML = '<div style="margin-bottom:8px;font-weight:600;color:#475569;font-size:13px;">💊 Suggested Medicines (click to add):</div>' +
    map.medicines.map(m => \`<span onclick="addMedicine('\${m}')" style="display:inline-block;margin:4px;padding:6px 12px;background:#d1fae5;color:#065f46;border-radius:20px;cursor:pointer;font-size:13px;border:1px solid #a7f3d0;">\${m}</span>\`).join('');
}

function addTreatment(name) {
  const list = document.getElementById('selected-treatments');
  if (!list) return;
  // avoid duplicates
  if (list.innerHTML.includes('data-treatment="' + name + '"')) return;
  list.innerHTML += \`<div data-treatment="\${name}" style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#f5f3ff;border:1px solid #ddd8fe;border-radius:8px;margin-bottom:6px;">
    <span style="font-weight:500;">\${name}</span>
    <div style="display:flex;gap:8px;align-items:center;">
      <input type="number" placeholder="Cost ₹" onchange="updateTreatmentCost(this)" data-name="\${name}" style="width:90px;padding:4px 8px;border:1px solid #e2e8f0;border-radius:6px;">
      <span onclick="this.parentElement.parentElement.remove();updateTotal()" style="cursor:pointer;color:#ef4444;font-size:18px;">×</span>
    </div>
  </div>\`;
}

function addMedicine(name) {
  const list = document.getElementById('selected-medicines');
  if (!list) return;
  if (list.innerHTML.includes('data-med="' + name + '"')) return;
  list.innerHTML += \`<div data-med="\${name}" style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;margin-bottom:6px;">
    <span style="font-weight:500;">\${name}</span>
    <div style="display:flex;gap:8px;align-items:center;">
      <input placeholder="Dosage e.g. 1-0-1" style="width:120px;padding:4px 8px;border:1px solid #e2e8f0;border-radius:6px;" data-name="\${name}">
      <input placeholder="Days" type="number" style="width:60px;padding:4px 8px;border:1px solid #e2e8f0;border-radius:6px;">
      <span onclick="this.parentElement.parentElement.remove()" style="cursor:pointer;color:#ef4444;font-size:18px;">×</span>
    </div>
  </div>\`;
}

function updateTreatmentCost(input) { updateTotal(); }

function updateTotal() {
  let total = 0;
  document.querySelectorAll('#selected-treatments input[type=number]').forEach(i => { total += parseFloat(i.value)||0; });
  const el = document.getElementById('treatment-total');
  if (el) el.textContent = '₹' + total.toLocaleString('en-IN');
}
`;

// Insert clinical map before INIT
const initMarker = '// ================== INIT FUNCTION ==================';
if (!c.includes('CLINICAL_MAP')) {
  c = c.replace(initMarker, clinicalMap + '\n' + initMarker);
  console.log('✅ Clinical map added');
} else {
  console.log('ℹ️ Clinical map already present');
}

// ============================================================
// 2. Replace the chief complaint input with a smart dropdown
//    and add suggestion panels + treatment/medicine lists
// ============================================================
// Find the renderActiveConsultationForm function and inject smart UI
const oldComplaint = `'Chief Complaint / Reason for Visit'`;
if (c.includes(oldComplaint)) {
  // Add onchange handler to existing complaint field
  c = c.replace(
    `placeholder="Chief Complaint / Reason for Visit"`,
    `placeholder="Chief Complaint / Reason for Visit" id="chief-complaint-input" onchange="onComplaintChange(this.value)" oninput="onComplaintChange(this.value)"`
  );
  console.log('✅ Complaint input patched');
}

// Find complaint textarea/input and add dropdown list
const complaintsDropdown = `
<select id="complaint-select" onchange="document.getElementById('chief-complaint-input') && (document.getElementById('chief-complaint-input').value=this.value); onComplaintChange(this.value);" 
  style="width:100%;padding:10px;border:2px solid #e2e8f0;border-radius:10px;font-size:14px;margin-bottom:8px;color:#1e293b;">
  <option value="">-- Select Chief Complaint --</option>
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
<div id="suggested-treatments" style="margin-bottom:12px;"></div>
<div id="suggested-medicines" style="margin-bottom:12px;"></div>
<div id="selected-treatments" style="margin-bottom:8px;"></div>
<div style="font-weight:600;color:#1e293b;margin-bottom:8px;">Selected Treatments — Total: <span id="treatment-total">₹0</span></div>
<div id="selected-medicines" style="margin-bottom:8px;"></div>
<div style="font-weight:600;color:#1e293b;margin-bottom:12px;">Selected Medicines</div>
`;

// Inject the dropdown before the chief complaint placeholder text
c = c.replace(
  `'Chief Complaint / Reason for Visit'`,
  complaintsDropdown + `'Chief Complaint / Reason for Visit'`
);
console.log('✅ Smart complaint dropdown injected');

fs.writeFileSync(file, c, 'utf8');
console.log(`✅ Done! Lines: ${c.split('\n').length}`);
console.log('Restart server: node server.js');
