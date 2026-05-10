import { describe, it, expect, vi } from 'vitest';
import { mockRes } from './utils.js';
import Chat from '../models/Chat.js';
import { getChatMessages } from '../controllers/tripChatController.js';

describe('tripChatController', () => {
  it('getChatMessages returns 403 when chat not found', async () => {
    vi.spyOn(Chat, 'findById').mockResolvedValue(null);
    const req = { params: { chatId: 'c1' }, user: { userId: 'u1' } };
    const res = mockRes();
    await getChatMessages(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

