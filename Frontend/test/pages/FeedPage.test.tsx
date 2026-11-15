import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BlocklistProvider } from '../../src/context/blocklistContext';
import FeedPage from '../../src/pages/FeedPage';
import {
  getItemsByCategory,
  saveItem,
  userFeedItems,
} from '../../src/services/user.service';

vi.mock('../../src/auth', () => ({
  DEMO_BLOCKLIST_STORAGE_KEY: 'readarchive-demo-blocklist',
  getAuthUserId: () => 17,
  isDemoMode: () => false,
}));

vi.mock('../../src/services/user.service', () => ({
  userFeedItems: vi.fn(),
  markItemRead: vi.fn(),
  saveItem: vi.fn(),
  markUserFeedItemsRead: vi.fn(),
  getItemsByCategory: vi.fn(),
}));

vi.mock('../../src/hooks/usePolling', () => ({ usePolling: vi.fn() }));
vi.mock('../../src/hooks/useCategorizationPolling', () => ({
  useCategorizationPolling: vi.fn(),
}));

const articles = [
  {
    item_id: 1,
    title: 'Technology article',
    link: 'https://articles.test/technology',
    description: 'Technology description',
    pub_date: '2025-01-02T00:00:00.000Z',
    source_name: 'Test source',
    is_save: false,
    feed_type: 'rss' as const,
    categories: [{ name: 'Technology', color: '#123456' }],
  },
  {
    item_id: 2,
    title: 'Science article',
    link: 'https://articles.test/science',
    description: 'Science description',
    pub_date: '2025-01-01T00:00:00.000Z',
    source_name: 'Test source',
    is_save: false,
    feed_type: 'rss' as const,
    categories: [{ name: 'Science', color: '#654321' }],
  },
];

function renderFeedPage() {
  return render(
    <BlocklistProvider>
      <FeedPage />
    </BlocklistProvider>,
  );
}

describe('FeedPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.mocked(userFeedItems).mockReset();
    vi.mocked(getItemsByCategory).mockReset();
    vi.mocked(saveItem).mockReset();
    vi.mocked(userFeedItems).mockResolvedValue(articles);
    vi.mocked(getItemsByCategory).mockResolvedValue([]);
    vi.mocked(saveItem).mockResolvedValue(undefined);
  });

  it('shows loading and then displays the feed items', async () => {
    let resolveFeed!: (items: typeof articles) => void;
    vi.mocked(userFeedItems).mockReturnValue(
      new Promise((resolve) => {
        resolveFeed = resolve;
      }),
    );

    renderFeedPage();

    expect(screen.getByText('Loading feed...')).toBeInTheDocument();
    resolveFeed(articles);

    expect(await screen.findByText('Technology article')).toBeInTheDocument();
    expect(screen.getByText('Science article')).toBeInTheDocument();
  });

  it('shows the empty-feed message when the service returns no articles', async () => {
    vi.mocked(userFeedItems).mockResolvedValue([]);

    renderFeedPage();

    expect(await screen.findByText('No articles items found.')).toBeInTheDocument();
  });

  it('filters by category and keeps all category choices available', async () => {
    vi.mocked(getItemsByCategory).mockResolvedValue([articles[0]]);
    const user = userEvent.setup();

    renderFeedPage();

    await screen.findByText('Science article');
    await user.click(screen.getByRole('button', { name: 'Category' }));
    await user.click(screen.getByRole('menuitem', { name: 'Technology' }));

    expect(await screen.findByText('Technology article')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Science article')).not.toBeInTheDocument());
    expect(getItemsByCategory).toHaveBeenCalledWith(17, 'Technology', 'all');

    await user.click(screen.getByRole('button', { name: 'Category' }));
    expect(screen.getByRole('menuitem', { name: 'Technology' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Science' })).toBeInTheDocument();
  });

  it('toggles the bookmark and calls the save service with the new state', async () => {
    const user = userEvent.setup();
    renderFeedPage();

    const articleLink = await screen.findByRole('link', { name: 'Technology article' });
    const articleRow = articleLink.closest('div.py-6');
    expect(articleRow).not.toBeNull();
    const bookmarkButton = within(articleRow as HTMLElement).getByRole('button');
    const bookmarkIcon = bookmarkButton.querySelector('svg');

    expect(bookmarkIcon).toHaveClass('text-gray-400');
    await user.click(bookmarkButton);
    await waitFor(() => expect(saveItem).toHaveBeenLastCalledWith(17, 1, true));
    expect(bookmarkIcon).toHaveClass('fill-[var(--accent)]');

    await user.click(bookmarkButton);
    await waitFor(() => expect(saveItem).toHaveBeenLastCalledWith(17, 1, false));
    expect(bookmarkIcon).toHaveClass('text-gray-400');
  });

  it('hides articles whose title or description contains a blocked word', async () => {
    localStorage.setItem('blocklist', JSON.stringify(['rocket']));
    vi.mocked(userFeedItems).mockResolvedValue([
      { ...articles[0], title: 'Rocket launch update' },
      { ...articles[1], description: 'A story about rockets' },
      { ...articles[0], item_id: 3, title: 'Gardening update' },
    ]);

    renderFeedPage();

    expect(await screen.findByText('Gardening update')).toBeInTheDocument();
    expect(screen.queryByText('Rocket launch update')).not.toBeInTheDocument();
    expect(screen.queryByText('Science article')).not.toBeInTheDocument();
  });
});
