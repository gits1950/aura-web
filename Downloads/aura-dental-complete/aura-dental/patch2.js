// Run this with: node patch2.js
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'public', 'index.html');
let c = fs.readFileSync(file, 'utf8');

// ============================================================
// REPLACE ALL STUB FUNCTIONS WITH REAL IMPLEMENTATIONS
// ============================================================

const newFunctions = `
// ================== WORKING PAGE FUNCTIONS ==================

function renderDashboard() {
  const app = document.getElementById('app');
  if (!app) return;
  const today = new Date().toISOString().split('T')[0];
  const pts = state.patients || [];
  const queue = state.doctorQueue || [];
  const chairs = state.chairs || [];
  const bills = state.bills || [];
  const todayPts = pts.filter(p => p.registeredDate && p.registeredDate.startsWith(today)).length;
  const todayBills = bills.filter(b => b.date && b.date.startsWith(today));
  const todayRevenue = todayBills.reduce((s, b) => s + (parseFloat(b.totalAmount) || 0), 0);
  const occupied = queue.filter(q => q.status === 'in-consultation' || q.status === 'waiting').length;

  app.innerHTML = renderSidebar('#dashboard') + \`
    <div class="main-content" style="padding:24px;">
      <h2 style="color:#1e293b;margin-bottom:24px;font-size:24px;font-weight:700;">📊 Dashboard</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:32px;">
        <div style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:24px;border-radius:16px;">
          <div style="font-size:36px;font-weight:700;">\${todayPts}</div>
          <div style="opacity:0.9;margin-top:4px;">Today's Patients</div>
        </div>
        <div style="background:linear-gradient(135deg,#f093fb,#f5576c);color:white;padding:24px;border-radius:16px;">
          <div style="font-size:36px;font-weight:700;">\${occupied}</div>
          <div style="opacity:0.9;margin-top:4px;">In Queue / Consulting</div>
        </div>
        <div style="background:linear-gradient(135deg,#4facfe,#00f2fe);color:white;padding:24px;border-radius:16px;">
          <div style="font-size:36px;font-weight:700;">₹\${todayRevenue.toLocaleString()}</div>
          <div style="opacity:0.9;margin-top:4px;">Today's Revenue</div>
        </div>
        <div style="background:linear-gradient(135deg,#43e97b,#38f9d7);color:white;padding:24px;border-radius:16px;">
          <div style="font-size:36px;font-weight:700;">\${pts.length}</div>
          <div style="opacity:0.9;margin-top:4px;">Total Patients</div>
        </div>
      </div>
      <div style="background:white;border-radius:16px;padding:24px;border:1px solid #e2e8f0;">
        <h3 style="margin-bottom:16px;color:#1e293b;">🦷 Chair Status</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;">
          \${(chairs.length ? chairs : [{id:1,name:'Chair 1'},{id:2,name:'Chair 2'},{id:3,name:'Chair 3'}]).map(ch => {
            const q = queue.find(q => q.chairId === ch.id && (q.status==='in-consultation'||q.status==='waiting'));
            const color = q ? '#ef4444' : '#10b981';
            const label = q ? 'Occupied' : 'Available';
            const patient = q ? (state.patients||[]).find(p=>p.id===q.patientId) : null;
            return \`<div style="padding:16px;border-radius:12px;border:2px solid \${color};text-align:center;">
              <div style="font-size:24px;">🪑</div>
              <div style="font-weight:600;color:#1e293b;">\${ch.name}</div>
              <div style="color:\${color};font-weight:600;font-size:13px;">\${label}</div>
              \${patient ? \`<div style="font-size:12px;color:#64748b;margin-top:4px;">\${patient.name}</div>\` : ''}
            </div>\`;
          }).join('')}
        </div>
      </div>
    </div>\`;
}

function renderPatients() {
  const app = document.getElementById('app');
  if (!app) return;
  const pts = state.patients || [];
  app.innerHTML = renderSidebar('#patients') + \`
    <div class="main-content" style="padding:24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
        <h2 style="color:#1e293b;font-size:24px;font-weight:700;">👥 Patients (\${pts.length})</h2>
        <input type="text" placeholder="🔍 Search patients..." onkeyup="filterPatientsList(this.value)"
          style="padding:10px 16px;border:2px solid #e2e8f0;border-radius:10px;font-size:14px;width:250px;">
      </div>
      <div id="patients-list">
        \${pts.length === 0 ? '<div style="text-align:center;padding:60px;color:#64748b;"><div style="font-size:48px;margin-bottom:16px;">👥</div><p>No patients registered yet.</p><p>Use OPD Registration to add patients.</p></div>' :
          pts.map(p => \`
          <div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:600;color:#1e293b;font-size:16px;">\${p.name}</div>
              <div style="color:#64748b;font-size:13px;margin-top:4px;">📞 \${p.phone||'-'} | Age: \${p.age||'-'} | \${p.gender||'-'}</div>
              \${p.registeredDate ? \`<div style="color:#94a3b8;font-size:12px;margin-top:2px;">Registered: \${p.registeredDate}</div>\` : ''}
            </div>
            <div style="color:#667eea;font-weight:600;font-size:13px;">ID: \${p.id||'-'}</div>
          </div>\`).join('')}
      </div>
    </div>\`;
}

function filterPatientsList(q) {
  const pts = (state.patients||[]).filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()) || (p.phone||'').includes(q));
  const el = document.getElementById('patients-list');
  if (!el) return;
  el.innerHTML = pts.length === 0 ? '<p style="color:#64748b;padding:20px;">No patients found.</p>' :
    pts.map(p => \`<div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:12px;">
      <div style="font-weight:600;color:#1e293b;">\${p.name}</div>
      <div style="color:#64748b;font-size:13px;">📞 \${p.phone||'-'} | Age: \${p.age||'-'}</div>
    </div>\`).join('');
}

function renderPrescriptionSection() {
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
}

function renderOnlineBooking() {
  const app = document.getElementById('app');
  if (!app) return;
  const bookings = state.bookingRequests || [];
  const pending = bookings.filter(b => b.status === 'pending');
  app.innerHTML = renderSidebar('#bookings') + \`
    <div class="main-content" style="padding:24px;">
      <h2 style="color:#1e293b;margin-bottom:24px;font-size:24px;font-weight:700;">📱 Online Bookings</h2>
      \${pending.length === 0 ? '<div style="text-align:center;padding:60px;color:#64748b;"><div style="font-size:48px;margin-bottom:16px;">📱</div><p>No pending booking requests.</p></div>' :
        pending.map(b => \`<div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:12px;">
          <div style="font-weight:600;color:#1e293b;">\${b.name||'Unknown'}</div>
          <div style="color:#64748b;font-size:13px;">📞 \${b.phone||'-'} | Date: \${b.date||'-'} | \${b.reason||'-'}</div>
        </div>\`).join('')}
    </div>\`;
}

function renderExpenses() {
  const app = document.getElementById('app');
  if (!app) return;
  const expenses = state.expenses || [];
  const total = expenses.reduce((s,e)=>s+(parseFloat(e.amount)||0),0);
  app.innerHTML = renderSidebar('#expenses') + \`
    <div class="main-content" style="padding:24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
        <h2 style="color:#1e293b;font-size:24px;font-weight:700;">💸 Expenses</h2>
        <div style="background:linear-gradient(135deg,#f093fb,#f5576c);color:white;padding:12px 24px;border-radius:12px;font-weight:700;">Total: ₹\${total.toLocaleString()}</div>
      </div>
      <button onclick="addExpenseForm()" style="margin-bottom:20px;padding:10px 20px;background:#667eea;color:white;border:none;border-radius:10px;cursor:pointer;font-size:14px;">+ Add Expense</button>
      <div id="expense-form" style="display:none;background:white;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:20px;">
        <input id="exp-category" placeholder="Category (e.g. Supplies)" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:10px;box-sizing:border-box;">
        <input id="exp-amount" type="number" placeholder="Amount (₹)" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:10px;box-sizing:border-box;">
        <input id="exp-note" placeholder="Note" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:10px;box-sizing:border-box;">
        <button onclick="saveExpense()" style="padding:10px 20px;background:#10b981;color:white;border:none;border-radius:8px;cursor:pointer;">Save</button>
      </div>
      \${expenses.length === 0 ? '<div style="text-align:center;padding:40px;color:#64748b;">No expenses recorded yet.</div>' :
        expenses.map(e=>\`<div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:10px;display:flex;justify-content:space-between;">
          <div><div style="font-weight:600;">\${e.category||'General'}</div><div style="color:#64748b;font-size:13px;">\${e.note||''} | \${e.date||''}</div></div>
          <div style="font-weight:700;color:#ef4444;">₹\${parseFloat(e.amount||0).toLocaleString()}</div>
        </div>\`).join('')}
    </div>\`;
}

function addExpenseForm() {
  const f = document.getElementById('expense-form');
  if (f) f.style.display = f.style.display === 'none' ? 'block' : 'none';
}

function saveExpense() {
  const cat = document.getElementById('exp-category').value;
  const amt = document.getElementById('exp-amount').value;
  const note = document.getElementById('exp-note').value;
  if (!cat || !amt) { alert('Please fill category and amount.'); return; }
  if (!state.expenses) state.expenses = [];
  state.expenses.push({ id: Date.now(), category: cat, amount: parseFloat(amt), note: note, date: new Date().toLocaleDateString() });
  DataStore.save('expenses', state.expenses);
  renderExpenses();
}

function renderReports() {
  const app = document.getElementById('app');
  if (!app) return;
  const pts = state.patients || [];
  const bills = state.bills || [];
  const expenses = state.expenses || [];
  const revenue = bills.reduce((s,b)=>s+(parseFloat(b.totalAmount)||0),0);
  const expTotal = expenses.reduce((s,e)=>s+(parseFloat(e.amount)||0),0);
  app.innerHTML = renderSidebar('#reports') + \`
    <div class="main-content" style="padding:24px;">
      <h2 style="color:#1e293b;margin-bottom:24px;font-size:24px;font-weight:700;">📈 Reports</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">
        <div style="background:white;border:1px solid #e2e8f0;border-radius:16px;padding:24px;text-align:center;">
          <div style="font-size:36px;font-weight:700;color:#667eea;">\${pts.length}</div>
          <div style="color:#64748b;margin-top:4px;">Total Patients</div>
        </div>
        <div style="background:white;border:1px solid #e2e8f0;border-radius:16px;padding:24px;text-align:center;">
          <div style="font-size:36px;font-weight:700;color:#10b981;">₹\${revenue.toLocaleString()}</div>
          <div style="color:#64748b;margin-top:4px;">Total Revenue</div>
        </div>
        <div style="background:white;border:1px solid #e2e8f0;border-radius:16px;padding:24px;text-align:center;">
          <div style="font-size:36px;font-weight:700;color:#ef4444;">₹\${expTotal.toLocaleString()}</div>
          <div style="color:#64748b;margin-top:4px;">Total Expenses</div>
        </div>
        <div style="background:white;border:1px solid #e2e8f0;border-radius:16px;padding:24px;text-align:center;">
          <div style="font-size:36px;font-weight:700;color:#f59e0b;">₹\${(revenue-expTotal).toLocaleString()}</div>
          <div style="color:#64748b;margin-top:4px;">Net Profit</div>
        </div>
      </div>
    </div>\`;
}

function renderPayroll() {
  const app = document.getElementById('app');
  if (!app) return;
  const staff = state.staff || [];
  app.innerHTML = renderSidebar('#payroll') + \`
    <div class="main-content" style="padding:24px;">
      <h2 style="color:#1e293b;margin-bottom:24px;font-size:24px;font-weight:700;">💼 Payroll</h2>
      \${staff.length === 0 ? '<div style="text-align:center;padding:60px;color:#64748b;"><div style="font-size:48px;margin-bottom:16px;">💼</div><p>No staff records. Add staff in Settings.</p></div>' :
        staff.map(s=>\`<div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:12px;display:flex;justify-content:space-between;">
          <div><div style="font-weight:600;">\${s.name}</div><div style="color:#64748b;font-size:13px;">\${s.role||'-'}</div></div>
          <div style="font-weight:700;color:#10b981;">₹\${(s.salary||0).toLocaleString()}/mo</div>
        </div>\`).join('')}
    </div>\`;
}

function renderMedicines() {
  const app = document.getElementById('app');
  if (!app) return;
  const meds = state.medicines || [];
  app.innerHTML = renderSidebar('#medicines') + \`
    <div class="main-content" style="padding:24px;">
      <h2 style="color:#1e293b;margin-bottom:24px;font-size:24px;font-weight:700;">💊 Medicines (\${meds.length})</h2>
      \${meds.length === 0 ? '<div style="text-align:center;padding:60px;color:#64748b;"><div style="font-size:48px;margin-bottom:16px;">💊</div><p>No medicines added yet.</p></div>' :
        meds.map(m=>\`<div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:10px;display:flex;justify-content:space-between;">
          <div><div style="font-weight:600;">\${m.name}</div><div style="color:#64748b;font-size:13px;">\${m.type||''} | \${m.dosage||''}</div></div>
          <div style="color:#667eea;font-size:13px;">Stock: \${m.stock||0}</div>
        </div>\`).join('')}
    </div>\`;
}

function renderSettings() {
  const app = document.getElementById('app');
  if (!app) return;
  const cfg = state.config || {};
  app.innerHTML = renderSidebar('#settings') + \`
    <div class="main-content" style="padding:24px;">
      <h2 style="color:#1e293b;margin-bottom:24px;font-size:24px;font-weight:700;">⚙️ Settings</h2>
      <div style="background:white;border:1px solid #e2e8f0;border-radius:16px;padding:24px;max-width:600px;">
        <h3 style="margin-bottom:16px;color:#1e293b;">Clinic Information</h3>
        <div style="margin-bottom:12px;"><label style="color:#64748b;font-size:13px;">Clinic Name</label>
          <input id="cfg-name" value="\${cfg.clinicName||'Aura Dental Care'}" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-top:4px;box-sizing:border-box;"></div>
        <div style="margin-bottom:12px;"><label style="color:#64748b;font-size:13px;">Phone</label>
          <input id="cfg-phone" value="\${cfg.clinicPhone||''}" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-top:4px;box-sizing:border-box;"></div>
        <div style="margin-bottom:12px;"><label style="color:#64748b;font-size:13px;">Address</label>
          <input id="cfg-addr" value="\${cfg.clinicAddress||''}" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-top:4px;box-sizing:border-box;"></div>
        <button onclick="saveSettings()" style="padding:12px 24px;background:#667eea;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:600;">Save Settings</button>
      </div>
    </div>\`;
}

function saveSettings() {
  if (!state.config) state.config = {};
  state.config.clinicName = document.getElementById('cfg-name').value;
  state.config.clinicPhone = document.getElementById('cfg-phone').value;
  state.config.clinicAddress = document.getElementById('cfg-addr').value;
  DataStore.save('config', state.config);
  alert('Settings saved!');
}
`;

// Remove old stub functions and replace with real ones
const stubStart = '// ================== STUB RENDER FUNCTIONS ==================';
const initMarker = '// ================== INIT FUNCTION ==================';

if (c.includes(stubStart)) {
    // Remove everything from stub start to init marker
    const startIdx = c.indexOf(stubStart);
    const endIdx = c.indexOf(initMarker);
    c = c.substring(0, startIdx) + newFunctions + '\n' + c.substring(endIdx);
    console.log('✅ Replaced stub functions with full implementations');
} else if (c.includes(initMarker)) {
    c = c.replace(initMarker, newFunctions + '\n' + initMarker);
    console.log('✅ Added full implementations before INIT');
} else {
    console.log('❌ Could not find insertion point!');
    process.exit(1);
}

fs.writeFileSync(file, c, 'utf8');
const lines = c.split('\n').length;
console.log(`✅ Done! Lines: ${lines}`);
console.log('Now restart your server: node server.js');
