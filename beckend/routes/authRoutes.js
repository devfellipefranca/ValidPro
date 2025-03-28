const express = require('express');
const router = express.Router();
const { db } = require('../database/initDB');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (err) return res.status(500).json({ error: "Erro no servidor" });
    if (!user) return res.status(401).json({ error: "Credenciais inválidas" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Credenciais inválidas" });

    const token = jwt.sign(
      { userId: user.user_id, role: user.role, storeId: user.store_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, role: user.role });
  });
});

module.exports = router;