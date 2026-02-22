const express = require('express');
const router  = express.Router();
const mysql   = require('mysql2/promise');

const db = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'aura_dental',
});

// POST create visit (doctor creates treatment plan)
router.post('/visits', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { patientId, doctorId, chiefComplaint, diagnosis, labTests,
            teeth, treatments, medicines, notes, totalCost } = req.body;

    const [r] = await conn.execute(
      `INSERT INTO visits
       (patientId,doctorId,visitDate,chiefComplaint,diagnosis,labTests,teeth,notes,totalCost,status,paymentStatus)
       VALUES (?,?,CURDATE(),?,?,?,?,?,?,'pending','pending')`,
      [patientId, doctorId, chiefComplaint, diagnosis,
       JSON.stringify(labTests||[]), JSON.stringify(teeth||[]), notes||'', totalCost||0]
    );
    const visitId = r.insertId;

    for (const t of (treatments||[])) {
      await conn.execute(
        'INSERT INTO visit_treatments (visitId,treatmentId,treatmentName,cost) VALUES (?,?,?,?)',
        [visitId, t.id, t.name, t.cost]
      );
    }
    for (const m of (medicines||[])) {
      await conn.execute(
        'INSERT INTO visit_medicines (visitId,medicineId,medicineName,dosage,frequency,duration) VALUES (?,?,?,?,?,?)',
        [visitId, m.id, m.name, m.dosage||'', m.frequency||'', m.duration||'']
      );
    }

    await conn.commit();
    res.json({ id: visitId });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
});

// PUT collect payment + assign chair
router.put('/visits/:id/payment', async (req, res) => {
  try {
    const { amountPaid, paymentMethod, chairAssigned } = req.body;
    await db.execute(
      `UPDATE visits SET amountPaid=?,paymentMethod=?,chairAssigned=?,
       paymentStatus='paid',status='in-treatment' WHERE id=?`,
      [amountPaid, paymentMethod||'Cash', chairAssigned, req.params.id]
    );
    if (chairAssigned) {
      const [[visit]] = await db.execute('SELECT * FROM patients p JOIN visits v ON p.id=v.patientId WHERE v.id=?', [req.params.id]);
      await db.execute(
        "UPDATE chairs SET status='occupied',patientName=?,startTime=NOW() WHERE id=?",
        [visit ? visit.name : '', chairAssigned]
      );
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update visit (doctor OPD review / further treatment)
router.put('/visits/:id/update', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { chiefComplaint, diagnosis, labTests, teeth, treatments, medicines, notes, totalCost } = req.body;

    await conn.execute(
      `UPDATE visits SET chiefComplaint=?,diagnosis=?,labTests=?,teeth=?,notes=?,totalCost=?,
       opdReviewedAt=NOW() WHERE id=?`,
      [chiefComplaint, diagnosis, JSON.stringify(labTests||[]), JSON.stringify(teeth||[]),
       notes||'', totalCost||0, req.params.id]
    );

    await conn.execute('DELETE FROM visit_treatments WHERE visitId=?', [req.params.id]);
    for (const t of (treatments||[])) {
      await conn.execute(
        'INSERT INTO visit_treatments (visitId,treatmentId,treatmentName,cost) VALUES (?,?,?,?)',
        [req.params.id, t.id, t.name, t.cost]
      );
    }

    await conn.execute('DELETE FROM visit_medicines WHERE visitId=?', [req.params.id]);
    for (const m of (medicines||[])) {
      await conn.execute(
        'INSERT INTO visit_medicines (visitId,medicineId,medicineName,dosage,frequency,duration) VALUES (?,?,?,?,?,?)',
        [req.params.id, m.id, m.name, m.dosage||'', m.frequency||'', m.duration||'']
      );
    }

    await conn.commit();
    res.json({ success: true });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
});

// PUT complete treatment + generate prescription
router.put('/visits/:id/complete', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { procedureDone, discount, discountReason, medicines } = req.body;
    const [[visit]] = await conn.execute('SELECT * FROM visits WHERE id=?', [req.params.id]);
    const finalAmount = (visit.totalCost || 0) - (discount || 0);

    await conn.execute(
      `UPDATE visits SET procedureDone=?,discount=?,discountReason=?,finalAmount=?,
       status='completed',prescriptionReady=1,completedAt=NOW() WHERE id=?`,
      [procedureDone, discount||0, discountReason||'', finalAmount, req.params.id]
    );

    // Update medicines if changed
    if (medicines) {
      await conn.execute('DELETE FROM visit_medicines WHERE visitId=?', [req.params.id]);
      for (const m of medicines) {
        await conn.execute(
          'INSERT INTO visit_medicines (visitId,medicineId,medicineName,dosage,frequency,duration) VALUES (?,?,?,?,?,?)',
          [req.params.id, m.id, m.name, m.dosage||'', m.frequency||'', m.duration||'']
        );
      }
    }

    // Free chair
    if (visit.chairAssigned) {
      await conn.execute(
        "UPDATE chairs SET status='available',patientName=NULL,startTime=NULL WHERE id=?",
        [visit.chairAssigned]
      );
    }

    await conn.commit();
    res.json({ success: true, finalAmount });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
});

// GET all in-treatment visits (for doctor's urgent panel)
router.get('/visits/in-treatment', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT v.*,p.name AS patientName,p.contact,p.age,p.gender,
              d.name AS doctorName
       FROM visits v
       JOIN patients p ON v.patientId=p.id
       JOIN doctors d ON v.doctorId=d.id
       WHERE v.status='in-treatment'
       ORDER BY v.visitDate DESC`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET single visit full details
router.get('/visits/:id', async (req, res) => {
  try {
    const [[visit]]    = await db.execute('SELECT * FROM visits WHERE id=?', [req.params.id]);
    if (!visit) return res.status(404).json({ error: 'Not found' });
    const [treatments] = await db.execute('SELECT * FROM visit_treatments WHERE visitId=?', [req.params.id]);
    const [medicines]  = await db.execute('SELECT * FROM visit_medicines  WHERE visitId=?', [req.params.id]);
    res.json({ ...visit, treatments, medicines });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET visits ready for prescription printing (reception)
router.get('/visits/pending-rx', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT v.*,p.name AS patientName,d.name AS doctorName
       FROM visits v
       JOIN patients p ON v.patientId=p.id
       JOIN doctors d ON v.doctorId=d.id
       WHERE v.prescriptionReady=1 AND (v.prescriptionPrinted IS NULL OR v.prescriptionPrinted=0)
       ORDER BY v.completedAt DESC`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT mark prescription printed
router.put('/visits/:id/rx-printed', async (req, res) => {
  try {
    await db.execute('UPDATE visits SET prescriptionPrinted=1,rxPrintedAt=NOW() WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [[rev]]   = await db.execute("SELECT COALESCE(SUM(amountPaid),0) AS today FROM visits WHERE DATE(visitDate)=CURDATE()");
    const [[total]] = await db.execute('SELECT COUNT(*) AS cnt FROM patients');
    const [[inTx]]  = await db.execute("SELECT COUNT(*) AS cnt FROM visits WHERE status='in-treatment'");
    const [[pendRx]]= await db.execute('SELECT COUNT(*) AS cnt FROM visits WHERE prescriptionReady=1 AND (prescriptionPrinted IS NULL OR prescriptionPrinted=0)');
    res.json({
      todayRevenue:      rev.today,
      totalPatients:     total.cnt,
      inTreatment:       inTx.cnt,
      pendingPrescriptions: pendRx.cnt,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
