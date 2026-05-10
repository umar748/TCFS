import { renderWithRouter } from '../../test/utils';
import Notifications from './Notifications';

describe('Notifications', () => {
  it('renders', () => {
    renderWithRouter(<Notifications />, { route: '/', path: '/' });
  });
});
