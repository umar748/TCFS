import { renderWithRouter } from '../../test/utils';
import User from './User';

describe('User', () => {
  it('renders', () => {
    renderWithRouter(<User />, { route: '/', path: '/' });
  });
});
