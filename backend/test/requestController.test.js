import { describe, it, expect, vi } from 'vitest';
import { mockRes } from './utils.js';
import Trip from '../models/Trip.js';
import { sendJoinRequest } from '../controllers/requestController.js';

describe('requestController', () => {
  it('sendJoinRequest returns 404 when trip is missing', async () => {
    vi.spyOn(Trip, 'findById').mockResolvedValue(null);
    const req = {
      body: { trip_id: 't1', message: 'hi' },
      user: { userId: 'u1', name: 'User' },
      app: { get: () => null },
    };
    const res = mockRes();
    await sendJoinRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

