import { renderWithRouter } from '../../test/utils';
import CreateTrip from './CreateTrip';

describe('CreateTrip', () => {
  it('renders', () => {
    renderWithRouter(<CreateTrip />, { route: '/', path: '/' });
  });
});
