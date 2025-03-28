const express = require('express');
const router = express.Router();
const { db } = require('../database/initDB');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware(['admin', 'leader', 'promoter', 'repositor']));

router.get('/', (req, res) => {
  db.all(`
    SELECT al.description, u.username, al.created_at
    FROM activity_log al
    JOIN users u ON al.user_id = u.user_id
    ORDER BY al.created_at DESC
    LIMIT 10
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;