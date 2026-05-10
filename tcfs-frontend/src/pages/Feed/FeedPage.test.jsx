import { renderWithRouter } from '../test/utils';
import FeedPage from './FeedPage';

describe('FeedPage', () => {
  it('renders', () => {
    renderWithRouter(<FeedPage />, { route: '/', path: '/' });
  });
});
