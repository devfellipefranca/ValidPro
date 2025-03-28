const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('⚙️  Executando setup do banco de dados...');

const db = new sqlite3.Database(path.join(__dirname, '../database/database.db'));

fs.readFile(path.join(__dirname, '../database/schema.sql'), 'utf8', (err, schema) => {
  if (err) {
    console.error('❌ Erro ao ler schema:', err);
    process.exit(1);
  }

  db.exec(schema, (execErr) => {
    if (execErr) {
      console.error('❌ Erro ao executar schema:', execErr);
    } else {
      console.log('✔️ Schema executado com sucesso!');
      // Dados iniciais (opcional)
      db.run(`
        INSERT INTO stores (name, address) 
        VALUES ('Loja Matriz', 'Av. Principal, 1000')
      `, (insertErr) => {
        if (insertErr) console.error('Erro ao inserir loja:', insertErr);
      });
    }
    db.close();
  });
});