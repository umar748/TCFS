import { renderWithRouter } from '../../test/utils';
import DashboardRouter from './DashboardRouter';

describe('DashboardRouter', () => {
  it('renders', () => {
    renderWithRouter(<DashboardRouter />, { route: '/dashboard', path: '/dashboard' });
  });
});
