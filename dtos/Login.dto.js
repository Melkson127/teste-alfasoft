import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email({ message: 'E-mail inválido' }),
    password: z.string()
        .min(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
        .regex(/[A-Z]/, { message: 'A senha deve conter pelo menos uma letra maiúscula' })
        .regex(/[0-9]/, { message: 'A senha deve conter pelo menos um número' })
        .regex(/[^A-Za-z0-9]/, { message: 'A senha deve conter pelo menos um caractere especial' }),
});
