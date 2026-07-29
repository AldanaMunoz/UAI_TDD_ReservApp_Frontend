import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  resolveApiAssetUrl: (url?: string) => url,
}));

test('muestra el login cuando no existe una sesion', () => {
  localStorage.clear();
  render(<App />);
  expect(screen.getByRole('heading', { name: /iniciar sesi/i })).toBeInTheDocument();
});
