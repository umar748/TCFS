import { renderWithRouter } from '../../test/utils';
import Matches from './Matches';

describe('Matches', () => {
  it('renders', () => {
    renderWithRouter(<Matches />, { route: '/', path: '/' });
  });
});
