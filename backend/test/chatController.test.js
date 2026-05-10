import { describe, it, expect } from 'vitest';
import { handleChat } from '../controllers/chatController.js';
import { mockRes } from './utils.js';

describe('chatController', () => {
  it('handleChat returns message when input is empty', async () => {
    const req = { body: { message: '' } };
    const res = mockRes();
    await handleChat(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
