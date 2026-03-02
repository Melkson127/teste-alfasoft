import express from 'express';
import User from '../models/user.js';
import { loginSchema } from '../dtos/Login.dto.js';
import { errorResponse } from '../utils/functions.js';
import { generateToken } from '../services/auth.service.js';


const router = express.Router();

router.post('/login', async (req, res) => {
    let result = loginSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ errors: result.error.issues });
    }
    let data = result.data;
    try {
        let user = await User.findOne({
            where: {
                email: data.email
            }
        });
        if (!user)
            return res.status(404).json(errorResponse('Usuário não encontrado', ['email']));

        let passwordCompare = await bcrypt.compare(data.password, user.password);
        if (!passwordCompare)
            return res.status(401).json(errorResponse('Usuário não autorizado', ['email', 'password']));

        const token = generateToken(user);
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.environment === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 1 dia
        });
        res.setHeader('Authorization', `Bearer ${token}`);
        res.json({
            message: 'Login realizado com sucesso',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        return res.status(500).json(errorResponse('Erro interno ao autenticar'));
    }
});

export default router;