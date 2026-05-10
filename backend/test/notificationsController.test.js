import { describe, it, expect } from 'vitest';
import { createMatchRequest } from '../controllers/notificationsController.js';
import { mockRes } from './utils.js';

describe('notificationsController', () => {
  it('createMatchRequest returns 400 when toUserId is missing', async () => {
    const req = { body: {}, user: { userId: 'u1' }, app: { get: () => null } };
    const res = mockRes();
    await createMatchRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
