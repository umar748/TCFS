import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import SearchPage from './SearchPage';

vi.mock('../../socket', () => ({
  socket: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

const mockFetch = (data) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => data,
  });
};

describe('SearchPage edge cases', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockFetch({ users: [], items: [] });
  });

  it('shows empty state for companions when no filters are set', async () => {
    render(<SearchPage />);
    expect(await screen.findByText(/Use the filters to search companions/i)).toBeInTheDocument();
  });

  it('shows empty state for trips after switching tabs with no results', async () => {
    mockFetch({ items: [] });
    render(<SearchPage />);

    fireEvent.click(screen.getByText(/Find Trips/i));

    await waitFor(() => {
      expect(screen.getByText(/Use the filters to search trips/i)).toBeInTheDocument();
    });
  });

  it('shows no companions match message for a filtered search with zero results', async () => {
    mockFetch({ users: [] });
    render(<SearchPage />);

    const keyword = screen.getByPlaceholderText(/Search by interests/i);
    fireEvent.change(keyword, { target: { value: 'hiking' } });
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));

    await waitFor(() => {
      expect(screen.getByText(/No companions match your filters/i)).toBeInTheDocument();
    });
  });
});
