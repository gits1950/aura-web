// patch7.js - Add QR codes to bills and prescriptions
// Run: node patch7.js
const fs = require('fs');
const file = './public/index.html';
let c = fs.readFileSync(file, 'utf8');

// ============================================================
// We inject QR generation using the free QR API (no library needed)
// UPI QR: links to UPI payment
// Booking QR: links to a booking form or WhatsApp
// ============================================================

const qrHelper = `
// ================== QR CODE HELPERS ==================
function getUPIQRUrl(amount, patientName, billNo) {
  const cfg = state.config || {};
  const upiId = cfg.upiId || 'auradental@upi';
  const clinicName = (cfg.clinicName || 'Aura Dental Care').replace(/\s/g, '%20');
  const note = ('Bill%20' + billNo).replace(/\s/g,'%20');
  const upiString = 'upi://pay?pa=' + upiId + '&pn=' + clinicName + '&am=' + amount + '&tn=' + note + '&cu=INR';
  return 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(upiString);
}

function getBookingQRUrl() {
  const cfg = state.config || {};
  const phone = (cfg.clinicPhone || '').replace(/[^0-9]/g,'');
  const clinicName = cfg.clinicName || 'Aura Dental Care';
  // WhatsApp booking link
  const msg = 'Hello%20' + clinicName.replace(/\s/g,'%20') + '%2C%20I%20would%20like%20to%20book%20an%20appointment.';
  const waLink = phone ? 'https://wa.me/91' + phone.slice(-10) + '?text=' + msg : 'https://wa.me/?text=' + msg;
  return 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=' + encodeURIComponent(waLink);
}

function getUPIQRHtml(amount, patientName, billNo) {
  const cfg = state.config || {};
  const upiId = cfg.upiId || 'auradental@upi';
  return '<div style="text-align:center;padding:12px;border:2px solid #667eea;border-radius:12px;background:#f5f3ff;">' +
    '<div style="font-size:12px;font-weight:700;color:#7c3aed;margin-bottom:6px;">📱 Pay Online (UPI)</div>' +
    '<img src="' + getUPIQRUrl(amount, patientName, billNo) + '" style="width:120px;height:120px;" alt="UPI QR">' +
    '<div style="font-size:11px;color:#64748b;margin-top:6px;">UPI ID: <strong>' + upiId + '</strong></div>' +
    '<div style="font-size:11px;color:#64748b;">Amount: <strong>₹' + Number(amount).toLocaleString('en-IN') + '</strong></div>' +
  '</div>';
}

function getBookingQRHtml() {
  return '<div style="text-align:center;padding:12px;border:2px solid #10b981;border-radius:12px;background:#ecfdf5;">' +
    '<div style="font-size:12px;font-weight:700;color:#065f46;margin-bottom:6px;">📅 Book Next Appointment</div>' +
    '<img src="' + getBookingQRUrl() + '" style="width:120px;height:120px;" alt="Booking QR">' +
    '<div style="font-size:11px;color:#64748b;margin-top:6px;">Scan to book via WhatsApp</div>' +
  '</div>';
}
`;

if (!c.includes('getUPIQRUrl')) {
  const marker = '// ================== INIT FUNCTION ==================';
  c = c.replace(marker, qrHelper + '\n' + marker);
  console.log('✅ QR helper functions added');
} else {
  console.log('ℹ️  QR helpers already present');
}

// ============================================================
// Now patch printFullBill to include QR codes
// ============================================================
const oldBillQRSection = `'<div class="footer">' +
    '<div><p style="font-size:13px;color:#64748b;">Payment Mode: ' + (item.paymentMethod || 'Cash') + '</p>' +
    '<p style="font-size:13px;color:#10b981;font-weight:600;">Status: PAID ✓</p></div>' +
    '<div class="sign-box">Receptionist Signature</div></div>' +`;

const newBillQRSection = `'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin:24px 0;align-items:start;">' +
    '<div><p style="font-size:13px;color:#64748b;">Payment Mode: ' + (item.paymentMethod || 'Cash') + '</p>' +
    '<p style="font-size:13px;color:#10b981;font-weight:600;">Status: PAID ✓</p></div>' +
    '<div style="text-align:center;padding:10px;border:2px solid #7c3aed;border-radius:12px;">' +
      '<div style="font-size:11px;font-weight:700;color:#7c3aed;margin-bottom:4px;">📱 Pay via UPI</div>' +
      '<img src="' + getUPIQRUrl(total, patient.name, 'BILL-'+String(itemId).slice(-6)) + '" style="width:110px;height:110px;">' +
      '<div style="font-size:10px;color:#64748b;margin-top:4px;">' + ((state.config&&state.config.upiId)||'Set UPI in Settings') + '</div>' +
    '</div>' +
    '<div style="text-align:center;padding:10px;border:2px solid #10b981;border-radius:12px;">' +
      '<div style="font-size:11px;font-weight:700;color:#065f46;margin-bottom:4px;">📅 Book Next Visit</div>' +
      '<img src="' + getBookingQRUrl() + '" style="width:110px;height:110px;">' +
      '<div style="font-size:10px;color:#64748b;margin-top:4px;">Scan to book via WhatsApp</div>' +
    '</div>' +
    '</div>' +
    '<div class="footer">' +
    '<div></div>' +
    '<div class="sign-box">Receptionist Signature</div></div>' +`;

if (c.includes(oldBillQRSection)) {
  c = c.replace(oldBillQRSection, newBillQRSection);
  console.log('✅ QR codes added to Bill print');
} else {
  console.log('⚠️  Bill QR section not found - trying alternate match');
  // Try partial match
  if (c.includes("'<div class=\"footer\">' +")) {
    c = c.replace(
      "'<div class=\"footer\">' +\n    '<div><p style=\"font-size:13px;color:#64748b;\">Payment Mode: ' + (item.paymentMethod || 'Cash') + '</p>' +",
      "'<div style=\"display:grid;grid-template-columns:1fr 140px 140px;gap:16px;margin:20px 0;align-items:start;\">' +\n    '<div><p style=\"font-size:13px;color:#64748b;\">Payment Mode: ' + (item.paymentMethod || 'Cash') + '</p>' +\n    '<p style=\"font-size:13px;color:#10b981;font-weight:600;\">Status: PAID ✓</p></div>' +\n    '<div style=\"text-align:center;padding:8px;border:2px solid #7c3aed;border-radius:10px;\"><div style=\"font-size:11px;font-weight:700;color:#7c3aed;margin-bottom:4px;\">📱 Pay via UPI</div><img src=\"' + getUPIQRUrl(total, patient.name, 'BILL-'+String(itemId).slice(-6)) + '\" style=\"width:100px;height:100px;\"><div style=\"font-size:10px;color:#64748b;margin-top:3px;\">' + ((state.config&&state.config.upiId)||'auradental@upi') + '</div></div>' +\n    '<div style=\"text-align:center;padding:8px;border:2px solid #10b981;border-radius:10px;\"><div style=\"font-size:11px;font-weight:700;color:#065f46;margin-bottom:4px;\">📅 Book Again</div><img src=\"' + getBookingQRUrl() + '\" style=\"width:100px;height:100px;\"><div style=\"font-size:10px;color:#64748b;margin-top:3px;\">Scan for WhatsApp</div></div>' +\n    '</div>' +\n    '<div class=\"footer\">' +\n    '<div><p style=\"font-size:13px;color:#64748b;\">Payment Mode: ' + (item.paymentMethod || 'Cash') + '</p>' +"
    );
    console.log('✅ Alternate bill QR patch applied');
  }
}

// ============================================================
// Patch printRxOnly to include booking QR
// ============================================================
const oldRxSign = `'<div class="sign"><div class="sign-line">Dr. ' + (doctor ? doctor.name : 'Doctor') + '<br><span style="color:#64748b;font-size:12px;">' + (doctor && doctor.specialty ? doctor.specialty : 'Dental Surgeon') + '</span></div></div>' +`;

const newRxSign = `'<div style="display:grid;grid-template-columns:1fr 130px;gap:16px;margin-top:24px;align-items:end;">' +
    '<div class="sign"><div class="sign-line">Dr. ' + (doctor ? doctor.name : 'Doctor') + '<br><span style="color:#64748b;font-size:12px;">' + (doctor && doctor.specialty ? doctor.specialty : 'Dental Surgeon') + '</span></div></div>' +
    '<div style="text-align:center;padding:8px;border:2px solid #10b981;border-radius:10px;background:#ecfdf5;">' +
      '<div style="font-size:10px;font-weight:700;color:#065f46;margin-bottom:3px;">📅 Book Next Visit</div>' +
      '<img src="' + getBookingQRUrl() + '" style="width:100px;height:100px;">' +
      '<div style="font-size:10px;color:#64748b;margin-top:3px;">Scan to book via WhatsApp</div>' +
    '</div>' +
    '</div>' +`;

if (c.includes(oldRxSign)) {
  c = c.replace(oldRxSign, newRxSign);
  console.log('✅ Booking QR added to Prescription print');
} else {
  console.log('⚠️  Prescription sign section not found');
}

// ============================================================
// Add UPI ID field to Settings
// ============================================================
const oldSaveSettings = `function saveSettings() {
  if (!state.config) state.config = {};
  state.config.clinicName = document.getElementById('cfg-name').value;
  state.config.clinicPhone = document.getElementById('cfg-phone').value;
  state.config.clinicAddress = document.getElementById('cfg-addr').value;
  DataStore.save('config', state.config);
  alert('Settings saved!');
}`;

const newSaveSettings = `function saveSettings() {
  if (!state.config) state.config = {};
  state.config.clinicName = document.getElementById('cfg-name').value;
  state.config.clinicPhone = document.getElementById('cfg-phone').value;
  state.config.clinicAddress = document.getElementById('cfg-addr').value;
  state.config.upiId = document.getElementById('cfg-upi') ? document.getElementById('cfg-upi').value : (state.config.upiId||'');
  state.config.whatsapp = document.getElementById('cfg-wa') ? document.getElementById('cfg-wa').value : (state.config.whatsapp||'');
  DataStore.save('config', state.config);
  showNotification('✅ Settings saved!', 'success');
}`;

if (c.includes(oldSaveSettings)) {
  c = c.replace(oldSaveSettings, newSaveSettings);
  console.log('✅ saveSettings updated with UPI and WhatsApp fields');
}

// Patch renderSettings to add UPI and WhatsApp fields
const oldSettingsField = `'<div style="margin-bottom:12px;"><label style="color:#64748b;font-size:13px;">Address</label>' +
          '<input id="cfg-addr" value="\${cfg.clinicAddress||\'\'}" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-top:4px;box-sizing:border-box;"></div>' +
        '<button onclick="saveSettings()" style="padding:12px 24px;background:#667eea;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:600;">Save Settings</button>`;

const newSettingsField = `'<div style="margin-bottom:12px;"><label style="color:#64748b;font-size:13px;">Address</label>' +
          '<input id="cfg-addr" value="\${cfg.clinicAddress||\'\'}" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-top:4px;box-sizing:border-box;"></div>' +
        '<div style="border-top:2px solid #e2e8f0;margin:20px 0;padding-top:16px;">' +
        '<h4 style="margin:0 0 12px;color:#7c3aed;">📱 Online Payments & Booking</h4>' +
        '<div style="margin-bottom:12px;"><label style="color:#64748b;font-size:13px;">UPI ID (for payment QR on bills)</label>' +
          '<input id="cfg-upi" value="\${cfg.upiId||\'\'}" placeholder="e.g. auradental@paytm" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-top:4px;box-sizing:border-box;"></div>' +
        '<div style="margin-bottom:12px;"><label style="color:#64748b;font-size:13px;">WhatsApp Number (for booking QR on prescriptions)</label>' +
          '<input id="cfg-wa" value="\${cfg.whatsapp||cfg.clinicPhone||\'\'}" placeholder="e.g. 9876543210" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-top:4px;box-sizing:border-box;"></div>' +
        '</div>' +
        '<button onclick="saveSettings()" style="padding:12px 24px;background:#667eea;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:600;">Save Settings</button>`;

if (c.includes(oldSettingsField)) {
  c = c.replace(oldSettingsField, newSettingsField);
  console.log('✅ Settings page updated with UPI ID and WhatsApp fields');
} else {
  console.log('⚠️  Settings field pattern not found');
}

// Also update getBookingQRUrl to use cfg.whatsapp if set
const oldQRFunc = `const phone = (cfg.clinicPhone || '').replace(/[^0-9]/g,'');`;
const newQRFunc = `const phone = ((cfg.whatsapp || cfg.clinicPhone) || '').replace(/[^0-9]/g,'');`;
if (c.includes(oldQRFunc)) {
  c = c.replace(oldQRFunc, newQRFunc);
  console.log('✅ WhatsApp booking QR uses whatsapp number from settings');
}

fs.writeFileSync(file, c, 'utf8');
console.log('\n✅ Done! Lines: ' + c.split('\n').length);
console.log('\nIMPORTANT: After restarting, go to Settings and fill in:');
console.log('  - UPI ID (e.g. yourname@paytm or yourname@gpay)');
console.log('  - WhatsApp number (10 digits)');
console.log('These will appear as QR codes on every bill and prescription.\n');
console.log('Restart: node server.js');
