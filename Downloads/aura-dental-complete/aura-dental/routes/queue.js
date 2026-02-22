const express = require('express');
const router  = express.Router();
const mysql   = require('mysql2/promise');

const db = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'aura_dental',
});

// GET today's queue
router.get('/queue', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT q.*,p.name,p.contact,p.age,p.gender
       FROM doctor_queue q JOIN patients p ON q.patientId=p.id
       WHERE DATE(q.createdAt)=CURDATE()
       ORDER BY q.createdAt ASC`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST add patient to queue
router.post('/queue', async (req, res) => {
  try {
    const { patientId, time, consultationFee } = req.body;
    const [r] = await db.execute(
      "INSERT INTO doctor_queue (patientId,time,consultationFee,status) VALUES (?,?,?,'waiting')",
      [patientId, time, consultationFee||0]
    );
    res.json({ id: r.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update queue status
router.put('/queue/:id', async (req, res) => {
  try {
    await db.execute('UPDATE doctor_queue SET status=? WHERE id=?', [req.body.status, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET all chairs
router.get('/chairs', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM chairs ORDER BY id ASC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
