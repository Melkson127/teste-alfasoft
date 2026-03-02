import express from 'express';
import dotenv from 'dotenv';
import contactsRouter from './routes/contacts.js';
import usersRouter from './routes/user.js';
import sequelize, { testConnection } from './db/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/contact', contactsRouter);
app.use('/user', usersRouter);

app.get('/', (req, res) => {
    res.send('API de Contatos está rodando!');
});

app.listen(PORT, async () => {
    await testConnection();
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});