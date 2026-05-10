import { renderWithRouter } from '../../test/utils';
import Landing from './Landing';

describe('Landing', () => {
  it('renders', () => {
    renderWithRouter(<Landing />, { route: '/', path: '/' });
  });
});
