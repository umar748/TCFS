import { renderWithRouter } from '../../test/utils';
import RequestsPage from './RequestsPage';

describe('RequestsPage', () => {
  it('renders', () => {
    renderWithRouter(<RequestsPage />, { route: '/', path: '/' });
  });
});
