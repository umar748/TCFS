import { describe, it, expect, vi } from 'vitest';
import { mockRes } from './utils.js';
import User from '../models/User.js';
import { updateProfile } from '../controllers/userController.js';

describe('userController', () => {
  it('updateProfile returns 404 when user not found', async () => {
    vi.spyOn(User, 'findById').mockResolvedValue(null);
    const req = { user: { userId: 'u1' }, body: {} };
    const res = mockRes();
    await updateProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

