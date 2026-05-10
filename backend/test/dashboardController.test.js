import { describe, it, expect, vi } from 'vitest';
import { mockRes } from './utils.js';
import User from '../models/User.js';
import { getDashboardData } from '../controllers/dashboardController.js';

describe('dashboardController', () => {
  it('getDashboardData returns 404 when user not found', async () => {
    vi.spyOn(User, 'findById').mockResolvedValue(null);
    const req = { params: { userId: 'u1' } };
    const res = mockRes();
    await getDashboardData(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

