import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';

// Testar imports das rotas
console.log('Importando rotas...');
import authRoutes from './routes/auth.js';
console.log('✅ authRoutes OK');
import chatRoutes from './routes/chat.js';
console.log('✅ chatRoutes OK');

const app = express();
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

app.listen(3000, () => {
  console.log('✅ Servidor rodando!');
});