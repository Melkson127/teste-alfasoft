import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

export function generateToken(user) {
    const secret = process.env.JWT_SECRET;
    return jwt.sign({ id: user.id, name: user.name, email: user.email }, secret, { expiresIn: '1d' });

}