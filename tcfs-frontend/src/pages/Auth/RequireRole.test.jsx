import { renderWithRouter } from '../../test/utils';
import RequireRole from './RequireRole';

describe('RequireRole', () => {
  it('renders children when role matches', () => {
    localStorage.setItem('user', JSON.stringify({ id: 'u1', role: 'user' }));
    renderWithRouter(
      <RequireRole role="user">
        <div>Allowed</div>
      </RequireRole>,
      { route: '/secure', path: '/secure' }
    );
  });
});

