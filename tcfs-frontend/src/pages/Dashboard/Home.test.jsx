import { renderWithRouter } from '../../test/utils';
import Home from './Home';

describe('Home', () => {
  it('renders', () => {
    renderWithRouter(<Home />, { route: '/', path: '/' });
  });
});
