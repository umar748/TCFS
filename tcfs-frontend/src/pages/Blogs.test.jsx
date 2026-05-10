import { renderWithRouter } from '../test/utils';
import Blogs from './Blogs';

describe('Blogs', () => {
  it('renders', () => {
    renderWithRouter(<Blogs />, { route: '/', path: '/' });
  });
});
