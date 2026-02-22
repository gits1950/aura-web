const express = require('express');
const router  = express.Router();
const mysql   = require('mysql2/promise');

const db = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'aura_dental',
});

// GET all patients
router.get('/patients', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM patients ORDER BY name ASC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET single patient
router.get('/patients/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM patients WHERE id=?', [req.params.id]);
    res.json(rows[0] || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create patient
router.post('/patients', async (req, res) => {
  try {
    const { name, age, gender, contact, email, address, medicalHistory } = req.body;
    const [r] = await db.execute(
      'INSERT INTO patients (name,age,gender,contact,email,address,medicalHistory) VALUES (?,?,?,?,?,?,?)',
      [name, age, gender, contact, email||'', address||'', JSON.stringify(medicalHistory||[])]
    );
    res.json({ id: r.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update patient
router.put('/patients/:id', async (req, res) => {
  try {
    const { name, age, gender, contact, email, address } = req.body;
    await db.execute(
      'UPDATE patients SET name=?,age=?,gender=?,contact=?,email=?,address=? WHERE id=?',
      [name, age, gender, contact, email||'', address||'', req.params.id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET patient visit history
router.get('/patients/:id/history', async (req, res) => {
  try {
    const [visits] = await db.execute(
      'SELECT v.*, GROUP_CONCAT(DISTINCT vt.treatmentName) as treatments, GROUP_CONCAT(DISTINCT vm.medicineName) as medicines ' +
      'FROM visits v ' +
      'LEFT JOIN visit_treatments vt ON v.id=vt.visitId ' +
      'LEFT JOIN visit_medicines vm ON v.id=vm.visitId ' +
      'WHERE v.patientId=? GROUP BY v.id ORDER BY v.visitDate DESC',
      [req.params.id]
    );
    res.json(visits);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
