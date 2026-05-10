import { describe, it, expect } from 'vitest';
import { register, login } from '../controllers/authController.js';
import { mockRes } from './utils.js';

describe('authController', () => {
  it('register returns 400 when required fields are missing', async () => {
    const req = { body: { email: '', password: '' } };
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('login returns 400 when required fields are missing', async () => {
    const req = { body: { email: '', password: '' } };
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
