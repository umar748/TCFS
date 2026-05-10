import { renderWithRouter } from '../../test/utils';
import AdminSettings from './AdminSettings';

describe('AdminSettings', () => {
  it('renders', () => {
    renderWithRouter(<AdminSettings />, { route: '/', path: '/' });
  });
});
