import { renderWithRouter } from '../../test/utils';
import Safety from './Safety';

describe('Safety', () => {
  it('renders', () => {
    renderWithRouter(<Safety />, { route: '/', path: '/' });
  });
});
