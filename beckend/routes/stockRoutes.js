const express = require('express');
const router = express.Router();
const { db } = require('../database/initDB');
const authMiddleware = require('../middlewares/authMiddleware');

// Middleware para pegar o ID da loja do usuário logado
const getStoreId = (req, res, next) => {
  if (req.user.role === 'admin') return next();
  
  db.get(
    "SELECT store_id FROM users WHERE user_id = ?",
    [req.user.userId],
    (err, row) => {
      if (err || !row) return res.status(403).json({ error: "Acesso negado" });
      req.storeId = row.store_id;
      next();
    }
  );
};

router.use(authMiddleware(['admin', 'leader', 'promoter', 'repositor']));
router.use(getStoreId);

// Adicionar/Atualizar estoque
router.post('/', (req, res) => {
  const { product_id, expiration_date, quantity } = req.body;
  const store_id = req.storeId || req.body.store_id;

  if (!product_id || !expiration_date || !quantity || !store_id) {
    return res.status(400).json({ error: 'Campos obrigatórios: product_id, expiration_date, quantity, store_id' });
  }

  // Verificar se o produto existe antes de atualizar o estoque
  db.get("SELECT name FROM products WHERE product_id = ?", [product_id], (err, product) => {
    if (err) {
      console.error('Erro ao verificar produto:', err);
      return res.status(500).json({ error: 'Erro ao verificar produto' });
    }
    if (!product) {
      return res.status(400).json({ error: `Produto com ID ${product_id} não encontrado` });
    }

    db.run(
      `INSERT INTO store_stock (store_id, product_id, expiration_date, quantity)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(store_id, product_id) 
       DO UPDATE SET expiration_date = excluded.expiration_date, quantity = excluded.quantity`,
      [store_id, product_id, expiration_date, quantity],
      function(err) {
        if (err) return res.status(400).json({ error: err.message });

        // Registrar a atividade com o nome do produto (ou fallback)
        const description = `Adicionado/atualizado ${quantity} unidades de ${product.name || 'Produto Desconhecido'} na loja ${store_id}`;
        db.run(
          "INSERT INTO activity_log (activity_type, description, user_id) VALUES (?, ?, ?)",
          ['stock_update', description, req.user.userId],
          (err) => {
            if (err) console.error('Erro ao registrar atividade:', err);
          }
        );

        res.json({ message: "Estoque atualizado" });
      }
    );
  });
});

// Listar estoque (com filtros)
router.get('/', (req, res) => {
  const { start_date, end_date, min_quantity, max_quantity } = req.query;
  let query = `
    SELECT p.name, p.ean, s.expiration_date, s.quantity 
    FROM store_stock s
    JOIN products p ON s.product_id = p.product_id
    WHERE s.store_id = ?
  `;
  const params = [req.storeId];

  if (start_date) {
    query += " AND s.expiration_date >= ?";
    params.push(start_date);
  }
  if (end_date) {
    query += " AND s.expiration_date <= ?";
    params.push(end_date);
  }
  if (min_quantity) {
    query += " AND s.quantity >= ?";
    params.push(min_quantity);
  }
  if (max_quantity) {
    query += " AND s.quantity <= ?";
    params.push(max_quantity);
  }

  db.all(query, params, (err, stock) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const today = new Date().toISOString().split('T')[0];
    const result = stock.map(item => ({
      ...item,
      days_remaining: Math.floor(
        (new Date(item.expiration_date) - new Date(today)) / (1000 * 60 * 60 * 24)
      )
    }));

    res.json(result);
  });
});

module.exports = router;