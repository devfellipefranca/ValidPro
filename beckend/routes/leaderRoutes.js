const express = require('express');
const router = express.Router();
const { db } = require('../database/initDB');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware('leader'));

// Criar usuários para a loja
router.post('/users', (req, res) => {
  const { username, password, role } = req.body;
  const storeId = req.user.storeId; // Obtido do token JWT

  db.run(
    "INSERT INTO users (username, password, role, store_id) VALUES (?, ?, ?, ?)",
    [username, bcrypt.hashSync(password, 10), role, storeId],
    (err) => {
      if (err) return res.status(400).json({ error: err.message });
      res.status(201).json({ message: 'Usuário criado com sucesso' });
    }
  );
});

module.exports = router;