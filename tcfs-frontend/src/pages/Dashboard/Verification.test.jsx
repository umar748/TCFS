import { renderWithRouter } from '../../test/utils';
import Verification from './Verification';

describe('Verification', () => {
  it('renders', () => {
    renderWithRouter(<Verification />, { route: '/', path: '/' });
  });
});
