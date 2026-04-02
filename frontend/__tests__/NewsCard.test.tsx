import { render, screen } from '@testing-library/react';
import { NewsCard } from '@/components/EditorialComponents';
import { AuthProvider } from '@/contexts/AuthContext';
import { BookmarkProvider } from '@/contexts/BookmarkContext';

const article = {
  id: 1,
  title: 'Test Article',
  content: 'Test content',
  summary: 'Test summary',
  url: 'https://example.com',
  image_url: '/placeholder.jpg',
  category: 'Test',
  source: 'UnitTest',
  publish_date: new Date().toISOString(),
};

test('renders NewsCard with title', () => {
  render(
    <AuthProvider>
      <BookmarkProvider>
        <NewsCard article={article} />
      </BookmarkProvider>
    </AuthProvider>
  );
  expect(screen.getByText('Test Article')).toBeInTheDocument();
});
