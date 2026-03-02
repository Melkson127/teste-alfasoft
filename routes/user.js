import express from 'express';
import { Op } from 'sequelize';
import { authGuard } from '../middleware/authGuard.js';
import { createUserSchema } from '../dtos/CreateUser.dto.js';
import User from '../models/user.js';
import { errorResponse } from '../utils/functions.js';
import * as bcrypt from 'bcrypt';
import { generateToken } from '../services/auth.service.js';
const router = express.Router();

// Buscar usuário por ID
router.get('/:id', authGuard, async (req, res) => {
    const id = req.params.id;
    if (!id || isNaN(id)) {
        return res.status(400).json(errorResponse('Parâmetros inválidos', ['id']));
    }
    try {
        const user = await User.findByPk(id, { attributes: { exclude: ['password'] } });
        if (!user) {
            return res.status(404).json(errorResponse('Usuário não encontrado', ['id']));
        }
        res.json(user);
    } catch (err) {
        res.status(500).json(errorResponse('Erro ao buscar usuário', []));
    }
});

// Listar todos os usuários com paginação e busca
router.get('/', authGuard, async (req, res) => {
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
        const { count, rows } = await User.findAndCountAll({
            where,
            limit,
            offset,
            order: [['id', 'ASC']],
            attributes: { exclude: ['password'] }
        });
        res.json({
            users: rows,
            total: count,
            page,
            totalPages: Math.ceil(count / limit)
        });
    } catch (err) {
        res.status(500).json(errorResponse('Erro ao listar usuários'));
    }
});

// Criar usuário
router.post('/', async (req, res) => {
    const result = createUserSchema.safeParse(req.body);
    if (!result.success)
        return res.status(400).json({ errors: result.error.issues });

    const userData = result.data;
    try {
        userData.password = await bcrypt.hash(userData.password, 10)
        const user = await User.create(userData);
        const token = generateToken(user);
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.environment === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 1 dia
        });
        res.setHeader('Authorization', `Bearer ${token}`);
        res.status(201).json({
            message: 'Usuário criado com sucesso',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        res.status(500).json(errorResponse('Erro ao criar usuário'));
    }
});

// Atualizar usuário
router.put('/:id', authGuard, async (req, res) => {
    const id = req.params.id;
    if (!id || isNaN(id)) {
        return res.status(400).json(errorResponse('Parâmetros inválidos', ['id']));
    }
    if (id != req.user.id)
        return res.status(401).json(errorResponse('Usuario não autorizado'));

    const result = createUserSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ errors: result.error.issues });
    }
    const userData = result.data;

    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json(errorResponse('Usuário não encontrado', ['id']));
        }
        userData.password = await bcrypt.hash(userData.password, 10)
        await user.update(userData);
        res.json({
            message: 'Usuário atualizado com sucesso',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        res.status(500).json(errorResponse('Erro ao atualizar usuário'));
    }
});

// Deletar usuário
router.delete('/:id', authGuard, async (req, res) => {
    const id = req.params.id;
    if (!id || isNaN(id)) {
        return res.status(400).json(errorResponse('Parâmetros inválidos'));
    }
    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json(errorResponse('Usuário não encontrado'));
        }
        await user.destroy();
        res.status(204).send();
    } catch (err) {
        res.status(500).json(errorResponse('Erro ao deletar usuário'));
    }
});

export default router;