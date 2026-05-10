import { renderWithRouter } from '../../test/utils';
import Settings from './Settings';

describe('Settings', () => {
  it('renders', () => {
    renderWithRouter(<Settings />, { route: '/', path: '/' });
  });
});
