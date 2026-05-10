import { renderWithRouter } from '../../test/utils';
import AdminDestinations from './AdminDestinations';

describe('AdminDestinations', () => {
  it('renders', () => {
    renderWithRouter(<AdminDestinations />, { route: '/', path: '/' });
  });
});
