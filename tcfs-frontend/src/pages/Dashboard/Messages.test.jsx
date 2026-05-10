import { renderWithRouter } from '../../test/utils';
import Messages from './Messages';

describe('Messages', () => {
  it('renders', () => {
    renderWithRouter(<Messages />, { route: '/', path: '/' });
  });
});
