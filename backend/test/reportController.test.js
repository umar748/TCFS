import { describe, it, expect } from 'vitest';
import { createReport } from '../controllers/reportController.js';
import { mockRes } from './utils.js';

describe('reportController', () => {
  it('createReport returns 400 when fields are missing', async () => {
    const req = { body: { subject: '', description: '' }, user: { userId: 'u1' } };
    const res = mockRes();
    await createReport(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
