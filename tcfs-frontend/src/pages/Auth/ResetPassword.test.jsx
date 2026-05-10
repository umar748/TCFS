import { renderWithRouter } from '../../test/utils';
import ResetPassword from './ResetPassword';

describe('ResetPassword', () => {
  it('renders', () => {
    renderWithRouter(<ResetPassword />, { route: '/', path: '/' });
  });
});
