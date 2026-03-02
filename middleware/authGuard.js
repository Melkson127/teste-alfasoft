import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/functions.js';

export function authGuard(req, res, next) {
    let token;
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } else {
        const authHeader = req.headers['authorization'];
        token = authHeader && authHeader.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json(errorResponse('Token não fornecido'));
    }

    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET não definido nas variáveis de ambiente');
        }
        const user = jwt.verify(token, secret);
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json(errorResponse('Token inválido ou expirado'));
    }
}
