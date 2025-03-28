-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'leader', 'promoter', 'repositor')),
    store_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(store_id)
);

-- Tabela de Lojas
CREATE TABLE IF NOT EXISTS stores (
    store_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    leader_id INTEGER UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (leader_id) REFERENCES users(user_id)
);

-- Tabela de Produtos (Catálogo Global)
CREATE TABLE IF NOT EXISTS products (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    ean TEXT UNIQUE NOT NULL CHECK(LENGTH(ean) >= 8),
    category TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Estoque por Loja
CREATE TABLE IF NOT EXISTS store_stock (
    stock_id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    expiration_date DATE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity >= 0),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    UNIQUE (store_id, product_id) -- Evita duplicatas
);

-- Tabela de Histórico de Alterações
CREATE TABLE IF NOT EXISTS stock_history (
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
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_stock_store ON store_stock(store_id);
CREATE INDEX IF NOT EXISTS idx_stock_product ON store_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_expiration ON store_stock(expiration_date);
CREATE INDEX IF NOT EXISTS idx_history_stock ON stock_history(stock_id);

-- Gatilho para registrar alterações no estoque
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
        NEW.last_updated_by,
        OLD.quantity,
        NEW.quantity,
        OLD.expiration_date,
        NEW.expiration_date,
        'update'
    );
END;

-- Dados Iniciais (Opcional)
-- Admin padrão (senha: admin123)
INSERT OR IGNORE INTO users (username, password, role) 
VALUES (
    'admin',
    '$2a$10$xS3qXW3WvYXO6Kkl2T/YEuHuJ5KzSj7K1QXLqD7X4Tz7Nl2MqjJ0u', -- bcrypt hash
    'admin'
);

-- Loja exemplo
INSERT OR IGNORE INTO stores (name, address) 
VALUES ('Loja Matriz', 'Av. Principal, 1000');

-- Atualiza admin para ser líder da loja (opcional)
UPDATE users SET store_id = 1 WHERE user_id = 1;
UPDATE stores SET leader_id = 1 WHERE store_id = 1;