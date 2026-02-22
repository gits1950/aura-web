// patch6.js - Reception Dashboard with Calendar Grid as centerpiece
// Run: node patch6.js
const fs = require('fs');
const file = './public/index.html';
let c = fs.readFileSync(file, 'utf8');

const newDashboard = `function renderDashboard() {
  const app = document.getElementById('app');
  if (!app) return;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const pts = state.patients || [];
  const queue = state.doctorQueue || [];
  const bills = state.bills || [];
  const appointments = state.appointments || [];

  const todayPts = pts.filter(function(p){ return p.registeredDate && p.registeredDate.startsWith(todayStr); }).length;
  const todayRevenue = bills.filter(function(b){ return b.date && b.date.startsWith(todayStr); }).reduce(function(s,b){ return s + (parseFloat(b.totalAmount||b.total||0)); }, 0);
  const waiting = queue.filter(function(q){ return q.status === 'waiting'; }).length;

  app.innerHTML = renderSidebar('#dashboard') + \`
    <div class="main-content" style="padding:20px;background:#f8fafc;min-height:100vh;">

      <!-- TOP STATS -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
        <div style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:16px;border-radius:14px;text-align:center;">
          <div style="font-size:28px;font-weight:800;">\${todayPts}</div>
          <div style="font-size:12px;opacity:0.9;margin-top:2px;">Today's Patients</div>
        </div>
        <div style="background:linear-gradient(135deg,#f093fb,#f5576c);color:white;padding:16px;border-radius:14px;text-align:center;">
          <div style="font-size:28px;font-weight:800;">\${waiting}</div>
          <div style="font-size:12px;opacity:0.9;margin-top:2px;">Waiting</div>
        </div>
        <div style="background:linear-gradient(135deg,#4facfe,#00f2fe);color:white;padding:16px;border-radius:14px;text-align:center;">
          <div style="font-size:28px;font-weight:800;">₹\${todayRevenue.toLocaleString('en-IN')}</div>
          <div style="font-size:12px;opacity:0.9;margin-top:2px;">Today's Revenue</div>
        </div>
        <div style="background:linear-gradient(135deg,#43e97b,#38f9d7);color:white;padding:16px;border-radius:14px;text-align:center;">
          <div style="font-size:28px;font-weight:800;">\${pts.length}</div>
          <div style="font-size:12px;opacity:0.9;margin-top:2px;">Total Patients</div>
        </div>
      </div>

      <!-- MAIN LAYOUT: Calendar + Appointments -->
      <div style="display:grid;grid-template-columns:1fr 340px;gap:16px;">

        <!-- CALENDAR -->
        <div style="background:white;border-radius:16px;padding:20px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h3 style="margin:0;color:#1e293b;font-size:18px;font-weight:700;">📅 Appointment Calendar</h3>
            <div style="display:flex;gap:8px;align-items:center;">
              <select id="dash-cal-month" onchange="renderDashCalendar()" style="padding:6px 10px;border:2px solid #e2e8f0;border-radius:8px;font-size:13px;color:#1e293b;">
                <option value="0">January</option><option value="1">February</option><option value="2">March</option>
                <option value="3">April</option><option value="4">May</option><option value="5">June</option>
                <option value="6">July</option><option value="7">August</option><option value="8">September</option>
                <option value="9">October</option><option value="10">November</option><option value="11">December</option>
              </select>
              <select id="dash-cal-year" onchange="renderDashCalendar()" style="padding:6px 10px;border:2px solid #e2e8f0;border-radius:8px;font-size:13px;color:#1e293b;">
                \${[2024,2025,2026,2027,2028].map(function(y){ return '<option value="'+y+'"'+(y===today.getFullYear()?' selected':'')+'>'+y+'</option>'; }).join('')}
              </select>
              <button onclick="dashCalPrev()" style="padding:6px 12px;background:#f1f5f9;border:none;border-radius:8px;cursor:pointer;font-size:16px;">◀</button>
              <button onclick="dashCalNext()" style="padding:6px 12px;background:#f1f5f9;border:none;border-radius:8px;cursor:pointer;font-size:16px;">▶</button>
              <button onclick="dashCalToday()" style="padding:6px 14px;background:#667eea;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;">Today</button>
            </div>
          </div>
          <div id="dash-calendar-grid"></div>
        </div>

        <!-- RIGHT PANEL -->
        <div style="display:flex;flex-direction:column;gap:16px;">

          <!-- SELECTED DATE APPOINTMENTS -->
          <div style="background:white;border-radius:16px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06);flex:1;">
            <h4 id="dash-appt-title" style="margin:0 0 12px;color:#1e293b;font-size:15px;font-weight:700;">📋 Select a date</h4>
            <div id="dash-appt-list" style="max-height:300px;overflow-y:auto;">
              <p style="color:#94a3b8;font-size:13px;text-align:center;padding:20px 0;">Click any date on the calendar to view or book appointments</p>
            </div>
            <div id="dash-book-btn-area" style="margin-top:12px;"></div>
          </div>

          <!-- TODAY'S QUEUE -->
          <div style="background:white;border-radius:16px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
            <h4 style="margin:0 0 12px;color:#1e293b;font-size:15px;font-weight:700;">🚶 Today's Queue (\${waiting})</h4>
            <div style="max-height:200px;overflow-y:auto;">
              \${queue.filter(function(q){ return q.date===todayStr && q.status==='waiting'; }).length === 0
                ? '<p style="color:#94a3b8;font-size:13px;text-align:center;padding:12px 0;">No patients waiting</p>'
                : queue.filter(function(q){ return q.date===todayStr && q.status==='waiting'; }).map(function(q){
                    const pt = pts.find(function(p){ return p.id===q.patientId; });
                    return '<div style="padding:8px 12px;border-radius:8px;background:#f8fafc;margin-bottom:6px;font-size:13px;">' +
                      '<strong style="color:#1e293b;">' + (pt?pt.name:'Unknown') + '</strong>' +
                      '<span style="float:right;color:#667eea;">' + (q.time||'') + '</span>' +
                    '</div>';
                  }).join('')}
            </div>
          </div>

        </div>
      </div>
    </div>\`;

  // Set current month/year in dropdowns
  document.getElementById('dash-cal-month').value = today.getMonth();
  document.getElementById('dash-cal-year').value = today.getFullYear();
  renderDashCalendar();
}

// ---- DASHBOARD CALENDAR FUNCTIONS ----

function renderDashCalendar() {
  const monthSel = document.getElementById('dash-cal-month');
  const yearSel = document.getElementById('dash-cal-year');
  if (!monthSel || !yearSel) return;

  const month = parseInt(monthSel.value);
  const year = parseInt(yearSel.value);
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const appointments = state.appointments || [];
  const queue = state.doctorQueue || [];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let html = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">';

  // Day headers
  days.forEach(function(d) {
    html += '<div style="text-align:center;font-size:12px;font-weight:700;color:#64748b;padding:6px 0;">' + d + '</div>';
  });

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    html += '<div></div>';
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = year + '-' + String(month+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    const isToday = dateStr === todayStr;
    const appts = appointments.filter(function(a){ return a.date === dateStr; });
    const queuedToday = queue.filter(function(q){ return q.date === dateStr; }).length;
    const total = appts.length + queuedToday;
    const isPast = new Date(dateStr) < new Date(todayStr);

    let bg = 'white';
    let color = '#1e293b';
    let border = '1px solid #e2e8f0';
    if (isToday) { bg = '#667eea'; color = 'white'; border = '2px solid #667eea'; }
    else if (isPast) { bg = '#f8fafc'; color = '#94a3b8'; }
    else if (total > 0) { bg = '#ecfdf5'; border = '1px solid #86efac'; }

    html += '<div onclick="dashSelectDate(\'' + dateStr + '\')" style="' +
      'cursor:pointer;border-radius:10px;padding:8px 4px;text-align:center;' +
      'background:' + bg + ';color:' + color + ';border:' + border + ';' +
      'transition:all 0.15s;min-height:52px;position:relative;" ' +
      'onmouseover="if(this.style.background!==\'rgb(102, 126, 234)\')this.style.background=\'#f1f5f9\'" ' +
      'onmouseout="this.style.background=\'' + bg + '\'">' +
      '<div style="font-weight:700;font-size:15px;">' + d + '</div>' +
      (total > 0 ? '<div style="font-size:10px;margin-top:2px;background:' + (isToday?'rgba(255,255,255,0.3)':'#10b981') + ';color:' + (isToday?'white':'white') + ';border-radius:10px;padding:1px 4px;">' + total + ' appt</div>' : '') +
    '</div>';
  }

  html += '</div>';
  const grid = document.getElementById('dash-calendar-grid');
  if (grid) grid.innerHTML = html;
}

function dashSelectDate(dateStr) {
  const appointments = state.appointments || [];
  const queue = state.doctorQueue || [];
  const pts = state.patients || [];

  const appts = appointments.filter(function(a){ return a.date === dateStr; });
  const queueItems = queue.filter(function(q){ return q.date === dateStr; });
  const all = [
    ...appts.map(function(a){ const pt=pts.find(function(p){return p.id===a.patientId;}); return {name:pt?pt.name:'Unknown',time:a.time||'--:--',type:'Appointment',note:a.reason||''}; }),
    ...queueItems.map(function(q){ const pt=pts.find(function(p){return p.id===q.patientId;}); return {name:pt?pt.name:'Unknown',time:q.time||'--:--',type:'Walk-in',note:q.status||''}; })
  ];

  const parts = dateStr.split('-');
  const display = parts[2] + '/' + parts[1] + '/' + parts[0];
  const titleEl = document.getElementById('dash-appt-title');
  const listEl = document.getElementById('dash-appt-list');
  const btnEl = document.getElementById('dash-book-btn-area');
  if (!titleEl || !listEl) return;

  titleEl.textContent = '📋 ' + display + ' (' + all.length + ' appointments)';
  listEl.innerHTML = all.length === 0
    ? '<p style="color:#94a3b8;font-size:13px;text-align:center;padding:16px 0;">No appointments on this date</p>'
    : all.map(function(a){
        return '<div style="padding:10px 12px;border-radius:10px;background:#f8fafc;margin-bottom:8px;border-left:3px solid #667eea;">' +
          '<div style="font-weight:600;color:#1e293b;font-size:14px;">' + a.name + '</div>' +
          '<div style="color:#64748b;font-size:12px;margin-top:2px;">⏰ ' + a.time + ' | ' + a.type + (a.note ? ' | ' + a.note : '') + '</div>' +
        '</div>';
      }).join('');

  if (btnEl) {
    btnEl.innerHTML = '<button onclick="dashBookAppointment(\'' + dateStr + '\')" style="width:100%;padding:10px;background:#667eea;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:600;font-size:14px;">+ Book Appointment on ' + display + '</button>';
  }
}

function dashCalPrev() {
  const m = document.getElementById('dash-cal-month');
  const y = document.getElementById('dash-cal-year');
  if (!m||!y) return;
  let month = parseInt(m.value);
  let year = parseInt(y.value);
  month--;
  if (month < 0) { month = 11; year--; }
  m.value = month;
  y.value = year;
  renderDashCalendar();
}

function dashCalNext() {
  const m = document.getElementById('dash-cal-month');
  const y = document.getElementById('dash-cal-year');
  if (!m||!y) return;
  let month = parseInt(m.value);
  let year = parseInt(y.value);
  month++;
  if (month > 11) { month = 0; year++; }
  m.value = month;
  y.value = year;
  renderDashCalendar();
}

function dashCalToday() {
  const today = new Date();
  const m = document.getElementById('dash-cal-month');
  const y = document.getElementById('dash-cal-year');
  if (!m||!y) return;
  m.value = today.getMonth();
  y.value = today.getFullYear();
  renderDashCalendar();
}

function dashBookAppointment(dateStr) {
  const pts = state.patients || [];
  if (pts.length === 0) { alert('No patients registered yet. Please register a patient first via OPD Registration.'); return; }

  const overlay = document.createElement('div');
  overlay.id = 'book-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';

  const parts = dateStr.split('-');
  const display = parts[2] + '/' + parts[1] + '/' + parts[0];

  overlay.innerHTML = '<div style="background:white;border-radius:20px;padding:28px;width:420px;box-shadow:0 20px 60px rgba(0,0,0,0.3);">' +
    '<h3 style="margin:0 0 4px;color:#1e293b;">📅 Book Appointment</h3>' +
    '<p style="color:#64748b;margin:0 0 20px;font-size:14px;">Date: <strong>' + display + '</strong></p>' +
    '<div style="margin-bottom:14px;"><label style="font-size:13px;font-weight:600;color:#475569;display:block;margin-bottom:6px;">Patient</label>' +
    '<select id="book-patient" style="width:100%;padding:10px;border:2px solid #e2e8f0;border-radius:10px;font-size:14px;">' +
    '<option value="">-- Select Patient --</option>' +
    pts.map(function(p){ return '<option value="'+p.id+'">'+p.name+' ('+( p.phone||p.contact||'-')+')</option>'; }).join('') +
    '</select></div>' +
    '<div style="margin-bottom:14px;"><label style="font-size:13px;font-weight:600;color:#475569;display:block;margin-bottom:6px;">Time</label>' +
    '<input id="book-time" type="time" value="10:00" style="width:100%;padding:10px;border:2px solid #e2e8f0;border-radius:10px;font-size:14px;box-sizing:border-box;"></div>' +
    '<div style="margin-bottom:14px;"><label style="font-size:13px;font-weight:600;color:#475569;display:block;margin-bottom:6px;">Doctor</label>' +
    '<select id="book-doctor" style="width:100%;padding:10px;border:2px solid #e2e8f0;border-radius:10px;font-size:14px;">' +
    '<option value="">-- Select Doctor --</option>' +
    (state.doctors||[]).map(function(d){ return '<option value="'+d.id+'">Dr. '+d.name+'</option>'; }).join('') +
    '</select></div>' +
    '<div style="margin-bottom:20px;"><label style="font-size:13px;font-weight:600;color:#475569;display:block;margin-bottom:6px;">Reason / Notes</label>' +
    '<input id="book-reason" placeholder="e.g. Follow-up, Checkup, RCT sitting..." style="width:100%;padding:10px;border:2px solid #e2e8f0;border-radius:10px;font-size:14px;box-sizing:border-box;"></div>' +
    '<div style="display:flex;gap:10px;">' +
    '<button onclick="confirmBookAppointment(\'' + dateStr + '\')" style="flex:1;padding:12px;background:#667eea;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:600;font-size:15px;">✅ Book</button>' +
    '<button onclick="document.getElementById(\'book-overlay\').remove()" style="flex:1;padding:12px;background:#f1f5f9;border:none;border-radius:10px;cursor:pointer;color:#64748b;font-size:15px;">Cancel</button>' +
    '</div></div>';

  document.body.appendChild(overlay);
}

function confirmBookAppointment(dateStr) {
  const patientId = document.getElementById('book-patient').value;
  const time = document.getElementById('book-time').value;
  const doctorId = document.getElementById('book-doctor').value;
  const reason = document.getElementById('book-reason').value;

  if (!patientId) { alert('Please select a patient.'); return; }
  if (!time) { alert('Please select a time.'); return; }

  if (!state.appointments) state.appointments = [];
  state.appointments.push({
    id: Date.now(),
    patientId: parseInt(patientId),
    doctorId: doctorId ? parseInt(doctorId) : null,
    date: dateStr,
    time: time,
    reason: reason,
    status: 'scheduled',
    createdAt: new Date().toISOString()
  });

  DataStore.save('appointments', state.appointments);
  document.getElementById('book-overlay') && document.getElementById('book-overlay').remove();
  showNotification('✅ Appointment booked for ' + dateStr, 'success');
  renderDashCalendar();
  dashSelectDate(dateStr);
}`;

// Replace existing renderDashboard
const regex = /function renderDashboard\(\) \{[\s\S]*?^}/m;

// Try different approach - find function start and end
const startMarker = 'function renderDashboard()';
if (c.includes(startMarker)) {
  const startIdx = c.indexOf(startMarker);
  // Find the matching closing brace
  let depth = 0;
  let endIdx = startIdx;
  let inFunc = false;
  for (let i = startIdx; i < c.length; i++) {
    if (c[i] === '{') { depth++; inFunc = true; }
    else if (c[i] === '}') { depth--; }
    if (inFunc && depth === 0) { endIdx = i + 1; break; }
  }
  c = c.slice(0, startIdx) + newDashboard + c.slice(endIdx);
  console.log('✅ renderDashboard replaced with calendar-centered version');
} else {
  const marker = '// ================== INIT FUNCTION ==================';
  c = c.replace(marker, newDashboard + '\n\n' + marker);
  console.log('✅ renderDashboard added');
}

// Also load appointments into state on init
if (!c.includes("state.appointments = DataStore.load('appointments'")) ) {
  const loadMarker = "state.doctorQueue = DataStore.load('doctorQueue', []);";
  if (c.includes(loadMarker)) {
    c = c.replace(loadMarker, loadMarker + "\n  state.appointments = DataStore.load('appointments', []);");
    console.log('✅ appointments added to state loading');
  }
}

fs.writeFileSync(file, c, 'utf8');
console.log('✅ Done! Lines: ' + c.split('\n').length);
console.log('Restart: node server.js');
