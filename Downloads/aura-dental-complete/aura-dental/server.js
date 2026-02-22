// ============================================================
// AURA DENTAL CLINIC — Server
// Express + Socket.io + MySQL
// ============================================================

const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const mysql    = require('mysql2/promise');
const cors     = require('cors');
const path     = require('path');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Database ────────────────────────────────────────────────
const db = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'aura_dental',
  waitForConnections: true,
  connectionLimit: 10,
});

db.getConnection()
  .then(c => { console.log('✅ MySQL connected'); c.release(); })
  .catch(e => console.warn('⚠️  MySQL not connected:', e.message, '\n   Running in static-file mode.'));

// ── Socket.io ───────────────────────────────────────────────
io.on('connection', socket => {
  console.log('🔌 Client connected:', socket.id);

  // Doctor finalises prescription → tell reception instantly
  socket.on('sendPrescription', data => {
    io.emit('newPrescription', { ...data, time: new Date().toISOString() });
    console.log('📋 Prescription broadcast for:', data.patientName);
  });

  // Reception prints → confirm back
  socket.on('prescriptionPrinted', data => {
    io.emit('prescriptionPrinted', { ...data, time: new Date().toISOString() });
  });

  // Reception confirms payment
  socket.on('confirmPayment', data => {
    io.emit('paymentConfirmed', { ...data, time: new Date().toISOString() });
  });

  socket.on('disconnect', () => console.log('❌ Disconnected:', socket.id));
});

// ── HTTP fallbacks (for non-socket clients) ─────────────────
app.post('/api/send-prescription', (req, res) => {
  io.emit('newPrescription', { ...req.body, time: new Date().toISOString() });
  res.json({ success: true });
});

app.post('/api/prescription-printed', (req, res) => {
  io.emit('prescriptionPrinted', { ...req.body, time: new Date().toISOString() });
  res.json({ success: true });
});

// ── API Routes ──────────────────────────────────────────────
app.use('/api', require('./routes/patients'));
app.use('/api', require('./routes/visits'));
app.use('/api', require('./routes/queue'));
app.use('/api', require('./routes/reference'));

// ── Catch-all → serve SPA ───────────────────────────────────
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ── Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   🦷  AURA DENTAL CLINIC — LIVE         ║
║   🌐  http://localhost:${PORT}              ║
║   🔌  Socket.io real-time enabled       ║
╚══════════════════════════════════════════╝`);
});
