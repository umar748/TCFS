import { renderWithRouter } from '../../test/utils';
import AdminTrips from './AdminTrips';

describe('AdminTrips', () => {
  it('renders', () => {
    renderWithRouter(<AdminTrips />, { route: '/', path: '/' });
  });
});
