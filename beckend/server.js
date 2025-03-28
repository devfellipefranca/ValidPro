require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db, initializeDatabase } = require('./database/initDB');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use('/auth', require('./routes/authRoutes'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/leader', require('./routes/leaderRoutes'));
app.use('/products', require('./routes/productRoutes'));
app.use('/stock', require('./routes/stockRoutes'));
app.use('/api', require('./routes/activityRoutes')); // Alterado de /activities para /api

// Inicialização
async function startServer() {
  try {
    await initializeDatabase();
    console.log('✔️ Banco de dados verificado');

    app.listen(3000, () => {
      console.log('🚀 Servidor rodando na porta 3000');
    });
  } catch (err) {
    console.error('❌ Falha crítica:', err.message);
    process.exit(1);
  }
}

startServer();