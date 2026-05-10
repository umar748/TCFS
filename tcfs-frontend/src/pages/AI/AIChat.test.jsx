import { renderWithRouter } from '../test/utils';
import AIChat from './AIChat';

describe('AIChat', () => {
  it('renders', () => {
    renderWithRouter(<AIChat />, { route: '/', path: '/' });
  });
});
