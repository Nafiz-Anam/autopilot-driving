import { z } from 'zod';

const appLogin = {
  body: z.object({
    email: z.string().email({ message: 'Invalid email format' }),
    password: z.string().min(1, { message: 'Password is required' }),
  }),
};

export default {
  appLogin,
};
