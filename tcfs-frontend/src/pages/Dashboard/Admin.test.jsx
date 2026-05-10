import { renderWithRouter } from '../../test/utils';
import Admin from './Admin';

describe('Admin', () => {
  it('renders', () => {
    renderWithRouter(<Admin />, { route: '/', path: '/' });
  });
});
