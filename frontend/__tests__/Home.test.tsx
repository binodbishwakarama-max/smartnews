import { render, screen } from '@testing-library/react';
import Home from '@/app/page';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { BookmarkProvider } from '@/contexts/BookmarkContext';

// Mock fetch globally

global.fetch = jest.fn((url) => {
  if (typeof url === 'string' && url.includes('/trending')) {
    return Promise.resolve({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve([]), // trending endpoint returns array
    });
  }
  return Promise.resolve({
    ok: true,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve({ articles: [] }),
  });
}) as jest.Mock;

test('renders homepage without crashing', async () => {
  const HomeComponent = await Home({ searchParams: Promise.resolve({ category: 'World' }) });
  render(
    <AuthProvider>
      <ThemeProvider>
        <BookmarkProvider>
          {HomeComponent}
        </BookmarkProvider>
      </ThemeProvider>
    </AuthProvider>
  );
  expect(screen.getByText('World')).toBeInTheDocument();
});
