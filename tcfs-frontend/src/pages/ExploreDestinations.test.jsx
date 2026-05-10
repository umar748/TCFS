import { renderWithRouter } from '../test/utils';
import ExploreDestinations from './ExploreDestinations';

describe('ExploreDestinations', () => {
  it('renders', () => {
    renderWithRouter(<ExploreDestinations />, { route: '/', path: '/' });
  });
});
