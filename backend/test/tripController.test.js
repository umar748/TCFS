import { describe, it, expect } from 'vitest';
import { createTrip } from '../controllers/tripController.js';
import { mockRes } from './utils.js';

describe('tripController', () => {
  it('createTrip returns 400 when fields are missing', async () => {
    const req = { body: { destination: '' }, user: { userId: 'u1' }, app: { get: () => null } };
    const res = mockRes();
    await createTrip(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
