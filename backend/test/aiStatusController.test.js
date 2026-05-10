import { describe, it, expect } from 'vitest';
import { aiStatus } from '../controllers/aiStatusController.js';
import { mockRes } from './utils.js';

describe('aiStatusController', () => {
  it('returns offline when no API keys are set', () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const res = mockRes();
    aiStatus({}, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ provider: 'offline', success: true }));
  });
});
