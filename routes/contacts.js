import express from 'express';
import { authGuard } from '../middleware/authGuard.js';
import { errorResponse } from '../utils/functions.js';
import Contact from '../models/contact.js';
import { createContactSchema } from '../dtos/CreateContact.dto.js';
import multer from 'multer';
import path from 'path';
import { Op } from 'sequelize';

const contactsRouter = express.Router();

// Configuração do multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.resolve('uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage });

contactsRouter.get('/', authGuard, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const search = (req.query.search || '').trim().slice(0, 50);
    const where = search
        ? {
            [Op.or]: [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ]
        }
        : {};
    const offset = (page - 1) * limit;
    try {
        const { count, rows } = await Contact.findAndCountAll({
            where,
            limit,
            offset,
            order: [['id', 'ASC']],
        });
        res.json({
            contacts: rows,
            total: count,
            page,
            totalPages: Math.ceil(count / limit)
        });
    } catch (err) {
        res.status(500).json(errorResponse('Erro ao listar contatos'));
    }
});

// Detalhes de um contato
contactsRouter.get('/:id', authGuard, async (req, res) => {
    const id = req.params.id;
    if (!id || isNaN(id)) {
        return res.status(400).json(errorResponse('Parâmetros inválidos', ['id']));
    }
    try {
        const contact = await Contact.findByPk(id);
        if (!contact) {
            return res.status(404).json(errorResponse('Contato não encontrado', ['id']));
        }
        res.json(contact);
    } catch (err) {
        res.status(500).json(errorResponse('Erro ao buscar contato'));
    }
});

// Criar novo contato (com upload de imagem)
contactsRouter.post('/', authGuard, upload.single('picture'), async (req, res) => {
    const result = createContactSchema.safeParse(req.body);
    if (!result.success) {
        const errors = result.error.issues.map(issue => ({
            message: issue.message,
            path: issue.path
        }));
        return res.status(400).json({ errors, status: 400 });
    }
    const { name, email, phone } = result.data;
    const picture = req.file ? `/uploads/${req.file.filename}` : undefined;
    try {
        const contact = await Contact.create({ name, email, phone, picture });
        res.status(201).json({ message: 'Contato criado com sucesso', contact });
    } catch (err) {
        res.status(500).json(errorResponse('Erro ao criar contato'));
    }
});

// Editar contato existente (com upload de imagem)
contactsRouter.put('/:id', authGuard, upload.single('picture'), async (req, res) => {
    const id = req.params.id;
    if (!id || isNaN(id)) {
        return res.status(400).json(errorResponse('Parâmetros inválidos', ['id']));
    }
    const result = createContactSchema.safeParse(req.body);
    if (!result.success) {
        const errors = result.error.issues.map(issue => ({
            message: issue.message,
            path: issue.path
        }));
        return res.status(400).json({ errors, status: 400 });
    }
    const { name, email, phone } = result.data;
    const picture = req.file ? `/uploads/${req.file.filename}` : req.body.picture;
    try {
        const contact = await Contact.findByPk(id);
        if (!contact) {
            return res.status(404).json(errorResponse('Contato não encontrado', ['id']));
        }
        await contact.update({ name, email, phone, picture });
        res.json({ message: 'Contato atualizado com sucesso', contact });
    } catch (err) {
        res.status(500).json(errorResponse('Erro ao atualizar contato'));
    }
});

// Deletar contato
contactsRouter.delete('/:id', authGuard, async (req, res) => {
    const id = req.params.id;
    if (!id || isNaN(id)) {
        return res.status(400).json(errorResponse('Parâmetros inválidos', ['id']));
    }
    try {
        const contact = await Contact.findByPk(id);
        if (!contact) {
            return res.status(404).json(errorResponse('Contato não encontrado', ['id']));
        }
        await contact.destroy();
        res.status(204).send();
    } catch (err) {
        res.status(500).json(errorResponse('Erro ao deletar contato'));
    }
});

export default contactsRouter;
