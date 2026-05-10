import { renderWithRouter } from '../../test/utils';
import AdminDashboard from './AdminDashboard';

describe('AdminDashboard', () => {
  it('renders', () => {
    renderWithRouter(<AdminDashboard />, { route: '/dashboard/admin', path: '/dashboard/admin' });
  });
});
