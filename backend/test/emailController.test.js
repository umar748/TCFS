import { describe, it, expect } from 'vitest';
import { sendVerificationEmail } from '../controllers/emailController.js';
import { mockRes } from './utils.js';

describe('emailController', () => {
  it('sendVerificationEmail returns 400 when email missing', async () => {
    const req = { body: {} };
    const res = mockRes();
    await sendVerificationEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
