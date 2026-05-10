import { renderWithRouter } from '../../test/utils';
import AdminAnnouncements from './AdminAnnouncements';

describe('AdminAnnouncements', () => {
  it('renders', () => {
    renderWithRouter(<AdminAnnouncements />, { route: '/', path: '/' });
  });
});
