import { renderWithRouter } from '../../test/utils';
import Register from './Register';

describe('Register', () => {
  it('renders', () => {
    renderWithRouter(<Register />, { route: '/', path: '/' });
  });
});
