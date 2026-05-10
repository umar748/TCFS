import { renderWithRouter } from '../../test/utils';
import ForgotPassword from './ForgotPassword';

describe('ForgotPassword', () => {
  it('renders', () => {
    renderWithRouter(<ForgotPassword />, { route: '/', path: '/' });
  });
});
