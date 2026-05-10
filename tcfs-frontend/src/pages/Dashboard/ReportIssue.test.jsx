import { renderWithRouter } from '../../test/utils';
import ReportIssue from './ReportIssue';

describe('ReportIssue', () => {
  it('renders', () => {
    renderWithRouter(<ReportIssue />, { route: '/', path: '/' });
  });
});
