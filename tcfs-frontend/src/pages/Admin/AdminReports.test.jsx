import { renderWithRouter } from '../../test/utils';
import AdminReports from './AdminReports';

describe('AdminReports', () => {
  it('renders', () => {
    renderWithRouter(<AdminReports />, { route: '/', path: '/' });
  });
});
