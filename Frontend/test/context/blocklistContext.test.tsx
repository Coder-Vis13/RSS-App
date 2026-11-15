import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  BlocklistProvider,
  useBlocklist,
} from '../../src/context/blocklistContext';
import { DEMO_BLOCKLIST_STORAGE_KEY } from '../../src/auth';

function BlocklistTestConsumer() {
  const { blocklist, addWord, removeWord } = useBlocklist();

  return (
    <div>
      <ul aria-label="Blocked words">
        {blocklist.map((word) => (
          <li key={word}>
            <span>{word}</span>
            <button onClick={() => removeWord(word)}>Remove {word}</button>
          </li>
        ))}
      </ul>
      <button onClick={() => addWord('  NewWord  ')}>Add word</button>
    </div>
  );
}

function renderBlocklist() {
  return render(
    <BlocklistProvider>
      <BlocklistTestConsumer />
    </BlocklistProvider>,
  );
}

describe('BlocklistProvider', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('loads, adds, and removes words using the regular user storage key', async () => {
    localStorage.setItem('blocklist', JSON.stringify(['existing']));
    const user = userEvent.setup();
    renderBlocklist();

    expect(screen.getByText('existing')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add word' }));

    expect(await screen.findByText('newword')).toBeInTheDocument();
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem('blocklist') ?? '[]')).toEqual([
        'existing',
        'newword',
      ]);
    });

    await user.click(screen.getByRole('button', { name: 'Remove existing' }));
    expect(screen.queryByText('existing')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem('blocklist') ?? '[]')).toEqual([
        'newword',
      ]);
    });
  });

  it('uses demo storage and does not change a regular user blocklist', async () => {
    localStorage.setItem('blocklist', JSON.stringify(['real-user-word']));
    localStorage.setItem(DEMO_BLOCKLIST_STORAGE_KEY, JSON.stringify(['demo-word']));
    sessionStorage.setItem('readarchive-demo-mode', 'true');
    const user = userEvent.setup();

    renderBlocklist();

    expect(screen.getByText('demo-word')).toBeInTheDocument();
    expect(screen.queryByText('real-user-word')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add word' }));

    expect(await screen.findByText('newword')).toBeInTheDocument();
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(DEMO_BLOCKLIST_STORAGE_KEY) ?? '[]')).toEqual([
        'demo-word',
        'newword',
      ]);
    });
    expect(localStorage.getItem('blocklist')).toBe(JSON.stringify(['real-user-word']));
  });
});
