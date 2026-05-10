import { renderWithRouter } from '../../test/utils';
import Trips from './Trips';

describe('Trips', () => {
  it('renders', () => {
    renderWithRouter(<Trips />, { route: '/', path: '/' });
  });
});
