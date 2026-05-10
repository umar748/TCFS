import { renderWithRouter } from '../../test/utils';
import AdminVerifications from './AdminVerifications';

describe('AdminVerifications', () => {
  it('renders', () => {
    renderWithRouter(<AdminVerifications />, { route: '/', path: '/' });
  });
});
