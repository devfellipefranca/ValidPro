const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database(
  path.join(__dirname, 'database.db'),
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
);

async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabela de Usuários
      db.run(`CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'leader', 'promoter', 'repositor')),
        store_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(store_id)
      )`, (err) => {
        if (err) console.error('Erro ao criar tabela users:', err);
        else console.log('✔️ Tabela users criada com sucesso');
      });

      // Tabela de Lojas
      db.run(`CREATE TABLE IF NOT EXISTS stores (
        store_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        leader_id INTEGER UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (leader_id) REFERENCES users(user_id)
      )`, (err) => {
        if (err) console.error('Erro ao criar tabela stores:', err);
        else console.log('✔️ Tabela stores criada com sucesso');
      });

      // Tabela de Produtos
      db.run(`CREATE TABLE IF NOT EXISTS products (
        product_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        ean TEXT UNIQUE NOT NULL CHECK(LENGTH(ean) >= 8),
        category TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) console.error('Erro ao criar tabela de produtos:', err);
        else console.log('✔️ Tabela de produtos criada com sucesso');
      });

      // Tabela de Estoque
      db.run(`CREATE TABLE IF NOT EXISTS store_stock (
        stock_id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        expiration_date DATE NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity >= 0),
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
        UNIQUE (store_id, product_id)
      )`, (err) => {
        if (err) console.error('Erro ao criar tabela store_stock:', err);
        else console.log('✔️ Tabela store_stock criada com sucesso');
      });

      // Tabela de Histórico de Estoque
      db.run(`CREATE TABLE IF NOT EXISTS stock_history (
        history_id INTEGER PRIMARY KEY AUTOINCREMENT,
        stock_id INTEGER NOT NULL,
        changed_by INTEGER NOT NULL,
        old_quantity INTEGER,
        new_quantity INTEGER,
        old_expiration DATE,
        new_expiration DATE,
        change_type TEXT CHECK(change_type IN ('insert', 'update', 'delete')),
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (stock_id) REFERENCES store_stock(stock_id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by) REFERENCES users(user_id)
      )`, (err) => {
        if (err) console.error('Erro ao criar tabela stock_history:', err);
        else console.log('✔️ Tabela stock_history criada com sucesso');
      });
      db.run(`CREATE TABLE IF NOT EXISTS activity_log (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        activity_type TEXT NOT NULL CHECK(activity_type IN ('store_create', 'user_create', 'product_create', 'stock_update')),
        description TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )`, (err) => {
        if (err) console.error('Erro ao criar tabela activity_log:', err);
        else console.log('✔️ Tabela activity_log criada com sucesso');
      });

      // Índices e Trigger
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_stock_store ON store_stock(store_id);
        CREATE INDEX IF NOT EXISTS idx_stock_product ON store_stock(product_id);
        CREATE INDEX IF NOT EXISTS idx_stock_expiration ON store_stock(expiration_date);
        CREATE INDEX IF NOT EXISTS idx_history_stock ON stock_history(stock_id);
      `, (err) => {
        if (err) console.error('Erro ao criar índices:', err);
        else console.log('✔️ Índices criados com sucesso');
      });

      db.run(`
        CREATE TRIGGER IF NOT EXISTS trg_stock_update
        AFTER UPDATE ON store_stock
        FOR EACH ROW
        BEGIN
          INSERT INTO stock_history (
            stock_id, 
            changed_by,
            old_quantity, 
            new_quantity,
            old_expiration,
            new_expiration,
            change_type
          ) VALUES (
            OLD.stock_id,
            1, -- Substituir por um user_id válido ou adicionar coluna last_updated_by em store_stock
            OLD.quantity,
            NEW.quantity,
            OLD.expiration_date,
            NEW.expiration_date,
            'update'
          );
        END;
      `, (err) => {
        if (err) console.error('Erro ao criar trigger:', err);
        else console.log('✔️ Trigger trg_stock_update criado com sucesso');
      });

      // Inserção do admin padrão
      bcrypt.hash('admin123', 10, (err, hashedPassword) => {
        if (err) return reject(err);
        db.run(
          `INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`,
          ['admin', hashedPassword, 'admin'],
          function (err) {
            if (err) {
              console.error('Erro ao inserir admin:', err);
              reject(err);
            } else if (this.changes > 0) {
              console.log('👤 Usuário admin criado');
            } else {
              console.log('ℹ️ Usuário admin já existia');
            }
            resolve();
          }
        );
      });
    });
  });
}

module.exports = { db, initializeDatabase };