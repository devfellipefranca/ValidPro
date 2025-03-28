const express = require('express');
const router = express.Router();
const { db } = require('../database/initDB');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware('admin'));

router.post('/stores', async (req, res) => {
  const { storeName, leaderUsername, leaderPassword } = req.body;

  if (!storeName || !leaderUsername || !leaderPassword) {
    return res.status(400).json({ error: 'Campos obrigatórios: storeName, leaderUsername, leaderPassword' });
  }

  try {
    db.run(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      [leaderUsername, bcrypt.hashSync(leaderPassword, 10), 'leader'],
      function (err) {
        if (err) return res.status(400).json({ error: err.message });

        const leaderId = this.lastID;
        db.run(
          "INSERT INTO stores (name, leader_id) VALUES (?, ?)",
          [storeName, leaderId],
          function (err) {
            if (err) return res.status(500).json({ error: 'Erro ao criar loja' });

            const storeId = this.lastID;
            db.run(
              "UPDATE users SET store_id = ? WHERE user_id = ?",
              [storeId, leaderId],
              (err) => {
                if (err) return res.status(500).json({ error: 'Erro ao vincular líder à loja' });
                db.run(
                  "INSERT INTO activity_log (activity_type, description, user_id) VALUES (?, ?, ?)",
                  ['store_create', `Criada nova loja: ${storeName}`, req.user.userId],
                  (err) => {
                    if (err) console.error('Erro ao registrar atividade:', err);
                  }
                );
                res.status(201).json({ message: 'Loja e líder criados com sucesso' });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Erro inesperado em /admin/stores:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.get('/stores', async (req, res) => {
  try {
    db.all(
      `SELECT s.store_id, s.name, s.created_at, u.username as leader 
       FROM stores s 
       LEFT JOIN users u ON s.leader_id = u.user_id`, // mantem aloja sem lider 
      [],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: 'Erro ao buscar lojas' });
        }
        res.json(rows);
      }
    );
  } catch (error) {
    console.error('Erro inesperado em /admin/stores:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.put('stores', async (req, res) => {
  const { storeId, storeName, leaderUsername, leaderPassword } = req.body;

  if (!storeId || !storeName || !leaderUsername || !leaderPassword) {
    return res.status(400).json({ error: 'Campos obrigatórios: storeId, storeName, leaderUsername, leaderPassword' });
  }

  try {
    db.serialize(() => {
      db.run(
        "UPDATE stores SET name = ? WHERE id = ?",
        [storeName, storeId],
        function (err) {
          if (err) return res.status(500).json({ error: 'Erro ao atualizar loja' });

          db.get(
            "SELECT leader_id FROM stores WHERE id = ?",
            [storeId],
            (err, row) => {
              if (err) return res.status(500).json({ error: 'Erro ao buscar líder da loja' });

              db.run(
                "UPDATE users SET username = ?, password = ? WHERE user_id = ?",
                [leaderUsername, bcrypt.hashSync(leaderPassword, 10), row.leader_id],
                function (err) {
                  if (err) return res.status(500).json({ error: 'Erro ao atualizar líder' });

                  db.run(
                    "INSERT INTO activity_log (activity_type, description, user_id) VALUES (?, ?, ?)",
                    ['store_update', `Atualizada loja: ${storeName}`, req.user.userId],
                    (err) => {
                      if (err) console.error('Erro ao registrar atividade:', err);
                    }
                  );
                  res.json({ message: 'Loja e líder atualizados com sucesso' });
                }
              );
            }
          );
        }
      );
    });
  } catch (error) {
    console.error('Erro inesperado em /admin/stores:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
})

router.delete('stores', async (req, res) => {
  const { storeId } = req.body;

  if (!storeId) {
    return res.status(400).json({ error: 'Campo obrigatório: storeId' });
  }

  try {
    db.serialize(() => {
      db.get(
        "SELECT name FROM stores WHERE id = ?",
        [storeId],
        (err, row) => {
          if (err) return res.status(500).json({ error: 'Erro ao buscar loja' });

          db.run(
            "DELETE FROM stores WHERE id = ?",
            [storeId],
            function (err) {
              if (err) return res.status(500).json({ error: 'Erro ao excluir loja' });

              db.run(
                "DELETE FROM users WHERE store_id = ?",
                [storeId],
                function (err) {
                  if (err) return res.status(500).json({ error: 'Erro ao excluir líder' });

                  db.run(
                    "INSERT INTO activity_log (activity_type, description, user_id) VALUES (?, ?, ?)",
                    ['store_delete', `Excluída loja: ${row.name}`, req.user.userId],
                    (err) => {
                      if (err) console.error('Erro ao registrar atividade:', err);
                    }
                  );
                  res.json({ message: 'Loja excluída com sucesso' });
                }
              );
            }
          );
        }
      );
    });
  } catch (error) {
    console.error('Erro inesperado em /admin/stores:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
})

module.exports = router;