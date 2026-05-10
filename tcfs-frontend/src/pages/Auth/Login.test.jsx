import { renderWithRouter } from '../../test/utils';
import Login from './Login';

describe('Login', () => {
  it('renders', () => {
    renderWithRouter(<Login />, { route: '/', path: '/' });
  });
});
