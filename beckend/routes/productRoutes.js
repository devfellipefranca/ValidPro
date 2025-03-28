const upload = require('../middlewares/uploadMiddleware');
const express = require('express');
const router = express.Router();
const { db } = require('../database/initDB');
const authMiddleware = require('../middlewares/authMiddleware');
const productController = require('../controllers/productController');


// Rotas abertas (sem autenticação)
router.get('/', (req, res) => {
  db.all("SELECT * FROM products", (err, products) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(products);
  });
});

// Rotas protegidas
router.use(authMiddleware(['admin', 'promoter']));

// Cadastrar novo produto
router.post('/', (req, res) => {
  const { name, ean } = req.body;

  db.run(
    "INSERT INTO products (name, ean) VALUES (?, ?)",
    [name, ean],
    function (err) {
      if (err) {
        return res.status(400).json({ error: "EAN já cadastrado" });
      }
      db.run(
        `INSERT INTO activity_log (activity_type, description, user_id) VALUES (?, ?, ?)`,
        ['product', `Produto ${name} cadastrado`, req.user.userId],
        (err) => {
          if (err) console.error('Erro ao logar atividade :', err);
        }
      )
      res.status(201).json({
        product_id: this.lastID,
        message: "Produto cadastrado com sucesso"
      });
    }
  );
});
// importar lista de produtos do excel
router.post('/import', productController.importProducts);

// Busca por EAN
router.get('/search', (req, res) => {
  const { q } = req.query;

  db.all(
    `SELECT * FROM products 
     WHERE ean LIKE ? OR name LIKE ?`,
    [`%${q}%`, `%${q}%`],
    (err, products) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(products);
    }
  );
});

module.exports = router;