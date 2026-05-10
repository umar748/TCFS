import { renderWithRouter } from '../../test/utils';
import AdminUsers from './AdminUsers';

describe('AdminUsers', () => {
  it('renders', () => {
    renderWithRouter(<AdminUsers />, { route: '/', path: '/' });
  });
});
