import { renderWithRouter } from '../../test/utils';
import EditProfile from './EditProfile';

describe('EditProfile', () => {
  it('renders', () => {
    renderWithRouter(<EditProfile />, { route: '/', path: '/' });
  });
});
