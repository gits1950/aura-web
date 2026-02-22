const express = require('express');
const router  = express.Router();
const mysql   = require('mysql2/promise');

const db = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'aura_dental',
});

router.get('/doctors',    async (_, res) => {
  try { res.json((await db.execute('SELECT * FROM doctors'))[0]); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/treatments', async (_, res) => {
  try { res.json((await db.execute('SELECT * FROM treatments ORDER BY name'))[0]); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/medicines',  async (_, res) => {
  try { res.json((await db.execute('SELECT * FROM medicines ORDER BY name'))[0]); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Auth login
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [[user]] = await db.execute(
      'SELECT * FROM users WHERE username=? AND password=?', [username, password]
    );
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ id: user.id, username: user.username, name: user.name, role: user.role });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
