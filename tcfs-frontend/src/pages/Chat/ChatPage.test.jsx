import { renderWithRouter } from '../test/utils';
import ChatPage from './ChatPage';

describe('ChatPage', () => {
  it('renders', () => {
    renderWithRouter(<ChatPage />, { route: '/', path: '/' });
  });
});
