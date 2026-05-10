import { renderWithRouter } from '../../test/utils';
import AdminDestinationDetail from './AdminDestinationDetail';

describe('AdminDestinationDetail', () => {
  it('renders', () => {
    renderWithRouter(<AdminDestinationDetail />, { route: '/dashboard/admin/destinations/test', path: '/dashboard/admin/destinations/:name' });
  });
});
