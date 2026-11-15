import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { BlocklistProvider } from '../../src/context/blocklistContext';
import {
  allSavedItems,
  getSavedItemsByCategory,
} from '../../src/services/user.service';
import SavedPage from '../../src/pages/SavedPage';

vi.mock('../../src/auth', () => ({
  DEMO_BLOCKLIST_STORAGE_KEY: 'readarchive-demo-blocklist',
  getAuthUserId: () => 17,
  isDemoMode: () => false,
}));

vi.mock('../../src/services/user.service', () => ({
  allSavedItems: vi.fn(),
  getSavedItemsByCategory: vi.fn(),
  markItemRead: vi.fn(),
}));

const savedArticle = {
  item_id: 4,
  title: 'Saved example article',
  link: 'https://articles.test/saved',
  description: 'A saved article for this test.',
  pub_date: '2025-02-01T00:00:00.000Z',
  source_name: 'Test source',
  feed_type: 'rss' as const,
  categories: [{ name: 'Technology', color: '#123456' }],
};

function renderSavedPage() {
  return render(
    <BlocklistProvider>
      <SavedPage />
    </BlocklistProvider>,
  );
}

describe('SavedPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.mocked(allSavedItems).mockReset();
    vi.mocked(getSavedItemsByCategory).mockReset();
    vi.mocked(allSavedItems).mockResolvedValue([savedArticle]);
    vi.mocked(getSavedItemsByCategory).mockResolvedValue([]);
  });

  it('shows loading text while saved items are being fetched', () => {
    vi.mocked(allSavedItems).mockReturnValue(new Promise(() => {}));

    renderSavedPage();

    expect(screen.getByText('Loading saved items...')).toBeInTheDocument();
  });

  it('displays returned saved articles', async () => {
    renderSavedPage();

    expect(await screen.findByText('Saved example article')).toBeInTheDocument();
    expect(screen.getByText('A saved article for this test.')).toBeInTheDocument();
    expect(allSavedItems).toHaveBeenCalledWith(17, 'all');
  });

  it('shows the empty-saved-items message when no saved items are returned', async () => {
    vi.mocked(allSavedItems).mockResolvedValue([]);

    renderSavedPage();

    expect(
      await screen.findByText(/Found something worth keeping\? Save it to build your personal library right here/),
    ).toBeInTheDocument();
  });
});
