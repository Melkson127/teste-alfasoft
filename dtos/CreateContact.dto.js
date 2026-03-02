import { z } from 'zod';

export const createContactSchema = z.object({
    name: z.string().min(1, { message: 'Nome é obrigatório' }),
    email: z.string().email({ message: 'E-mail inválido' }),
    phone: z.string().min(8, { message: 'Telefone inválido' }),
});
