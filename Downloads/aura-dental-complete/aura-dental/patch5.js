// patch5.js - Fix Print Bills & Rx section
// Run: node patch5.js
const fs = require('fs');
const file = './public/index.html';
let c = fs.readFileSync(file, 'utf8');

// Replace the stub renderPrescriptionSection with a full working version
const oldStub = `function renderPrescriptionSection() {
  const app = document.getElementById('app'); if (!app) return;
  app.innerHTML = renderSidebar('#prescription-section') + '<div class="main-content"><div style="padding:40px;text-align:center"><h2>🖨️ Print Bills & Rx</h2><p>Pending items appear here.</p></div></div>';
}`;

// Also try the multi-line version from patch2
const oldStub2 = `function renderPrescriptionSection() {
  const app = document.getElementById('app');
  if (!app) return;
  const bills = (state.bills||[]).filter(b => !b.prescriptionPrinted);
  app.innerHTML = renderSidebar('#prescription-section') + \`
    <div class="main-content" style="padding:24px;">
      <h2 style="color:#1e293b;margin-bottom:24px;font-size:24px;font-weight:700;">🖨️ Print Bills & Rx</h2>
      \${bills.length === 0 ? '<div style="text-align:center;padding:60px;color:#64748b;"><div style="font-size:48px;margin-bottom:16px;">🖨️</div><p>No pending bills to print.</p></div>' :
        bills.map(b => {
          const pt = (state.patients||[]).find(p=>p.id===b.patientId);
          return \`<div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:600;color:#1e293b;">\${pt?pt.name:'Unknown'}</div>
              <div style="color:#64748b;font-size:13px;">Amount: ₹\${b.totalAmount||0} | Date: \${b.date||'-'}</div>
            </div>
            <button onclick="window.print()" style="padding:8px 16px;background:#667eea;color:white;border:none;border-radius:8px;cursor:pointer;">Print</button>
          </div>\`;
        }).join('')}
    </div>\`;
}`;

const newFunc = `function renderPrescriptionSection() {
  const app = document.getElementById('app');
  if (!app) return;

  // Gather all bills from treatmentPlans + bills
  const treatmentBills = (state.treatmentPlans || []).filter(function(tp) {
    return tp.status === 'completed' || tp.status === 'paid';
  });
  const directBills = state.bills || [];

  const allItems = [
    ...treatmentBills.map(function(tp) {
      const pt = (state.patients||[]).find(function(p){ return p.id === tp.patientId; });
      const dr = (state.doctors||[]).find(function(d){ return d.id === tp.doctorId; });
      return {
        id: tp.id,
        type: 'treatment',
        patientName: pt ? pt.name : 'Unknown',
        patientAge: pt ? pt.age : '-',
        patientPhone: pt ? (pt.phone || pt.contact || '-') : '-',
        doctorName: dr ? dr.name : 'Unknown',
        date: tp.date || tp.createdAt || new Date().toLocaleDateString(),
        complaint: tp.chiefComplaint || '-',
        treatments: tp.treatments || [],
        medicines: tp.medicines || [],
        total: tp.totalCost || 0,
        printed: tp.billPrinted
      };
    }),
    ...directBills.map(function(b) {
      const pt = (state.patients||[]).find(function(p){ return p.id === b.patientId; });
      const dr = (state.doctors||[]).find(function(d){ return d.id === b.doctorId; });
      return {
        id: b.id,
        type: 'bill',
        patientName: pt ? pt.name : 'Unknown',
        patientAge: pt ? pt.age : '-',
        patientPhone: pt ? (pt.phone || pt.contact || '-') : '-',
        doctorName: dr ? dr.name : 'Unknown',
        date: b.date || new Date().toLocaleDateString(),
        complaint: b.chiefComplaint || '-',
        treatments: b.treatments || [],
        medicines: b.medicines || [],
        total: b.totalAmount || b.total || 0,
        printed: b.prescriptionPrinted
      };
    })
  ];

  const itemsHTML = allItems.length === 0
    ? '<div style="text-align:center;padding:60px;color:#64748b;"><div style="font-size:60px;margin-bottom:16px;">🖨️</div><p style="font-size:16px;">No bills or prescriptions found.</p><p style="font-size:13px;margin-top:8px;">Complete a consultation first, then bills will appear here.</p></div>'
    : allItems.map(function(item) {
        const hasMeds = item.medicines && item.medicines.length > 0;
        const hasTreatments = item.treatments && item.treatments.length > 0;
        return '<div style="background:white;border:1px solid #e2e8f0;border-radius:16px;padding:20px;margin-bottom:16px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">' +
            '<div>' +
              '<div style="font-weight:700;font-size:17px;color:#1e293b;">' + item.patientName + '</div>' +
              '<div style="color:#64748b;font-size:13px;margin-top:4px;">📅 ' + item.date + ' | 👨‍⚕️ Dr. ' + item.doctorName + '</div>' +
              '<div style="color:#64748b;font-size:13px;">Chief Complaint: ' + item.complaint + '</div>' +
            '</div>' +
            '<div style="font-weight:700;font-size:18px;color:#10b981;">₹' + Number(item.total).toLocaleString('en-IN') + '</div>' +
          '</div>' +
          (hasTreatments ? '<div style="margin-bottom:8px;"><span style="font-size:12px;font-weight:600;color:#7c3aed;">TREATMENTS: </span>' +
            item.treatments.map(function(t){ return '<span style="background:#ede9fe;color:#7c3aed;padding:2px 8px;border-radius:12px;font-size:12px;margin-right:4px;">' + (t.name||t) + '</span>'; }).join('') + '</div>' : '') +
          (hasMeds ? '<div style="margin-bottom:12px;"><span style="font-size:12px;font-weight:600;color:#059669;">MEDICINES: </span>' +
            item.medicines.map(function(m){ return '<span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:12px;font-size:12px;margin-right:4px;">' + (m.name||m) + '</span>'; }).join('') + '</div>' : '') +
          '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
            '<button onclick="printFullBill(' + JSON.stringify(item.id) + ',\'' + item.type + '\')" style="padding:10px 20px;background:#667eea;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:600;font-size:14px;">🖨️ Print Bill</button>' +
            (hasMeds ? '<button onclick="printRxOnly(' + JSON.stringify(item.id) + ',\'' + item.type + '\')" style="padding:10px 20px;background:#10b981;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:600;font-size:14px;">💊 Print Prescription</button>' : '') +
          '</div>' +
        '</div>';
      }).join('');

  app.innerHTML = renderSidebar('#prescription-section') + '<div class="main-content" style="padding:24px;">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">' +
      '<h2 style="color:#1e293b;font-size:24px;font-weight:700;">🖨️ Print Bills & Rx</h2>' +
      '<span style="background:#667eea;color:white;padding:6px 16px;border-radius:20px;font-size:14px;">' + allItems.length + ' records</span>' +
    '</div>' +
    itemsHTML +
  '</div>';
}

function printFullBill(itemId, type) {
  let item, patient, doctor;
  if (type === 'treatment') {
    item = (state.treatmentPlans||[]).find(function(tp){ return tp.id === itemId; });
  } else {
    item = (state.bills||[]).find(function(b){ return b.id === itemId; });
  }
  if (!item) { alert('Bill not found!'); return; }
  patient = (state.patients||[]).find(function(p){ return p.id === item.patientId; });
  doctor = (state.doctors||[]).find(function(d){ return d.id === item.doctorId; });
  if (!patient) { alert('Patient not found!'); return; }

  const treatments = item.treatments || [];
  const total = item.totalCost || item.totalAmount || item.total || 0;
  const clinicName = (state.config && state.config.clinicName) || 'Aura Dental Care';
  const clinicPhone = (state.config && state.config.clinicPhone) || '+91-XXXXXXXXXX';
  const clinicAddr = (state.config && state.config.clinicAddress) || 'Raipur, Chhattisgarh';

  const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Bill - ' + patient.name + '</title>' +
    '<style>@media print{@page{size:A4;margin:15mm}body{margin:0}}' +
    'body{font-family:Arial,sans-serif;padding:30px;max-width:800px;margin:0 auto;color:#1e293b}' +
    '.header{text-align:center;border-bottom:3px solid #667eea;padding-bottom:20px;margin-bottom:24px}' +
    '.header h1{color:#667eea;margin:0;font-size:32px;font-weight:900}.header p{margin:4px 0;color:#64748b;font-size:14px}' +
    '.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;background:#f8fafc;padding:16px;border-radius:8px;margin-bottom:20px}' +
    '.info-item{font-size:14px}.info-item strong{color:#475569}' +
    'table{width:100%;border-collapse:collapse;margin-bottom:20px}' +
    'th{background:#667eea;color:white;padding:10px;text-align:left;font-size:14px}' +
    'td{padding:10px;border-bottom:1px solid #e2e8f0;font-size:14px}' +
    '.total-row{background:#f0fdf4;font-weight:700;font-size:16px}' +
    '.footer{margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:20px;padding-top:20px;border-top:2px solid #e2e8f0}' +
    '.sign-box{text-align:center;border-top:1px solid #000;padding-top:8px;margin-top:40px;font-size:13px}' +
    '</style></head><body>' +
    '<div class="header"><h1>🦷 ' + clinicName.toUpperCase() + '</h1>' +
    '<p>' + clinicAddr + ' | Tel: ' + clinicPhone + '</p>' +
    '<p style="font-size:18px;font-weight:700;color:#667eea;margin-top:8px;">TREATMENT BILL</p></div>' +
    '<div class="info-grid">' +
    '<div class="info-item"><strong>Patient:</strong> ' + patient.name + '</div>' +
    '<div class="info-item"><strong>Bill No:</strong> BILL-' + String(itemId).slice(-6) + '</div>' +
    '<div class="info-item"><strong>Age/Gender:</strong> ' + (patient.age||'-') + ' / ' + (patient.gender||'-') + '</div>' +
    '<div class="info-item"><strong>Date:</strong> ' + (item.date || new Date().toLocaleDateString()) + '</div>' +
    '<div class="info-item"><strong>Phone:</strong> ' + (patient.phone || patient.contact || '-') + '</div>' +
    '<div class="info-item"><strong>Doctor:</strong> Dr. ' + (doctor ? doctor.name : 'N/A') + '</div>' +
    '</div>' +
    '<table><thead><tr><th>#</th><th>Treatment / Procedure</th><th>Tooth</th><th style="text-align:right">Amount (₹)</th></tr></thead><tbody>' +
    (treatments.length > 0 ? treatments.map(function(t, i) {
      return '<tr><td>' + (i+1) + '</td><td>' + (t.name||t) + '</td><td>' + (t.tooth||'-') + '</td><td style="text-align:right">₹' + Number(t.cost||0).toLocaleString('en-IN') + '</td></tr>';
    }).join('') : '<tr><td colspan="4" style="text-align:center;color:#64748b;">Consultation</td></tr>') +
    '</tbody><tfoot><tr class="total-row"><td colspan="3" style="text-align:right;padding-right:16px;">TOTAL AMOUNT</td><td style="text-align:right">₹' + Number(total).toLocaleString('en-IN') + '</td></tr></tfoot></table>' +
    '<div class="footer">' +
    '<div><p style="font-size:13px;color:#64748b;">Payment Mode: ' + (item.paymentMethod || 'Cash') + '</p>' +
    '<p style="font-size:13px;color:#10b981;font-weight:600;">Status: PAID ✓</p></div>' +
    '<div class="sign-box">Receptionist Signature</div></div>' +
    '<p style="text-align:center;margin-top:24px;color:#64748b;font-size:13px;">Thank you for choosing ' + clinicName + ' 🦷</p>' +
    '<script>window.onload=function(){setTimeout(function(){window.print()},500)}<\\/script>' +
    '</body></html>';

  const w = window.open('', '_blank', 'width=850,height=950');
  w.document.write(html);
  w.document.close();
}

function printRxOnly(itemId, type) {
  let item, patient, doctor;
  if (type === 'treatment') {
    item = (state.treatmentPlans||[]).find(function(tp){ return tp.id === itemId; });
  } else {
    item = (state.bills||[]).find(function(b){ return b.id === itemId; });
  }
  if (!item) { alert('Record not found!'); return; }
  patient = (state.patients||[]).find(function(p){ return p.id === item.patientId; });
  doctor = (state.doctors||[]).find(function(d){ return d.id === item.doctorId; });
  if (!patient) { alert('Patient not found!'); return; }

  const medicines = item.medicines || [];
  if (medicines.length === 0) { alert('No medicines prescribed for this patient!'); return; }

  const clinicName = (state.config && state.config.clinicName) || 'Aura Dental Care';
  const clinicPhone = (state.config && state.config.clinicPhone) || '+91-XXXXXXXXXX';
  const clinicAddr = (state.config && state.config.clinicAddress) || 'Raipur, Chhattisgarh';

  const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Prescription - ' + patient.name + '</title>' +
    '<style>@media print{@page{size:A5;margin:12mm}body{margin:0}}' +
    'body{font-family:Arial,sans-serif;padding:24px;max-width:600px;margin:0 auto}' +
    '.header{text-align:center;border-bottom:3px solid #667eea;padding-bottom:16px;margin-bottom:20px}' +
    '.header h1{color:#667eea;margin:0;font-size:26px}.header p{margin:3px 0;color:#64748b;font-size:13px}' +
    '.patient-box{background:#f8fafc;padding:12px;border-radius:8px;margin-bottom:16px;font-size:13px}' +
    '.patient-box p{margin:3px 0}' +
    '.rx{font-size:42px;color:#667eea;font-family:serif;margin:12px 0}' +
    '.med{border-left:4px solid #667eea;padding:10px 14px;margin:10px 0;background:#fafafa;border-radius:0 8px 8px 0}' +
    '.med-name{font-size:16px;font-weight:700;color:#1e293b}' +
    '.med-detail{font-size:13px;color:#64748b;margin-top:3px}' +
    '.sign{margin-top:40px;text-align:right}' +
    '.sign-line{border-top:1px solid #000;width:180px;margin-left:auto;padding-top:6px;font-size:13px}' +
    '</style></head><body>' +
    '<div class="header"><h1>🦷 ' + clinicName + '</h1>' +
    '<p>' + clinicAddr + ' | ' + clinicPhone + '</p>' +
    (doctor ? '<p style="font-weight:700;color:#667eea;">Dr. ' + doctor.name + (doctor.specialty ? ' — ' + doctor.specialty : '') + '</p>' : '') +
    '</div>' +
    '<div class="patient-box">' +
    '<p><strong>Patient:</strong> ' + patient.name + ' | <strong>Age:</strong> ' + (patient.age||'-') + ' | <strong>Gender:</strong> ' + (patient.gender||'-') + '</p>' +
    '<p><strong>Date:</strong> ' + (item.date || new Date().toLocaleDateString()) + ' | <strong>Complaint:</strong> ' + (item.chiefComplaint || '-') + '</p>' +
    '</div>' +
    '<div class="rx">℞</div>' +
    medicines.map(function(m, i) {
      return '<div class="med"><div class="med-name">' + (i+1) + '. ' + (m.name||m) + '</div>' +
        '<div class="med-detail">Dosage: ' + (m.dosage||m.frequency||'-') + ' | Duration: ' + (m.duration||m.days||'-') + '</div></div>';
    }).join('') +
    (item.notes ? '<div style="background:#fef3c7;padding:12px;border-radius:8px;margin-top:16px;border-left:4px solid #f59e0b;font-size:13px;"><strong>Advice:</strong> ' + item.notes + '</div>' : '') +
    '<div class="sign"><div class="sign-line">Dr. ' + (doctor ? doctor.name : 'Doctor') + '<br><span style="color:#64748b;font-size:12px;">' + (doctor && doctor.specialty ? doctor.specialty : 'Dental Surgeon') + '</span></div></div>' +
    '<script>window.onload=function(){setTimeout(function(){window.print()},500)}<\\/script>' +
    '</body></html>';

  const w = window.open('', '_blank', 'width=650,height=800');
  w.document.write(html);
  w.document.close();
}`;

// Replace the old stub
let replaced = false;
if (c.includes(oldStub)) {
  c = c.replace(oldStub, newFunc);
  replaced = true;
  console.log('✅ Replaced stub version 1');
} else if (c.includes(oldStub2)) {
  c = c.replace(oldStub2, newFunc);
  replaced = true;
  console.log('✅ Replaced stub version 2');
} else {
  // Try to find and replace any renderPrescriptionSection
  const regex = /function renderPrescriptionSection\(\)\s*\{[\s\S]*?\n\}/;
  if (regex.test(c)) {
    c = c.replace(regex, newFunc);
    replaced = true;
    console.log('✅ Replaced renderPrescriptionSection via regex');
  }
}

if (!replaced) {
  // Just append after CLINICAL_MAP or before INIT
  const marker = '// ================== INIT FUNCTION ==================';
  c = c.replace(marker, newFunc + '\n\n' + marker);
  console.log('✅ Appended renderPrescriptionSection');
}

fs.writeFileSync(file, c, 'utf8');
console.log(`✅ Done! Lines: ${c.split('\n').length}`);
console.log('Restart: node server.js');
