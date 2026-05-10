import { describe, it, expect, vi } from 'vitest';
import { mockRes } from './utils.js';
import User from '../models/User.js';
import { getStats } from '../controllers/adminController.js';

describe('adminController', () => {
  it('getStats returns 500 when counting fails', async () => {
    vi.spyOn(User, 'countDocuments').mockRejectedValue(new Error('fail'));
    const req = {};
    const res = mockRes();
    await getStats(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

