import '@testing-library/jest-dom';
import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
  localStorage.setItem('user', JSON.stringify({
    id: 'test-user',
    name: 'Test User',
    role: 'user',
    location: 'Test City',
    profilePicture: ''
  }));

  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({}),
  });

  global.setInterval = vi.fn(() => 0);
  global.clearInterval = vi.fn();

  if (!window.matchMedia) {
    window.matchMedia = () => ({
      matches: false,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});
