import { describe, expect, it } from 'vitest';
import {
  validateCategorizationBatchResponse,
  type CategorizationBatchItem,
} from '../../src/utils/categorizer';

const submittedItems: CategorizationBatchItem[] = [
  { item_id: 101, title: 'Article one', description: 'Description one' },
  { item_id: 102, title: 'Article two', description: 'Description two' },
  { item_id: 103, title: 'Article three', description: null },
];

describe('validateCategorizationBatchResponse', () => {
  it('sanitizes valid categories and associates them with the submitted item IDs', () => {
    const result = validateCategorizationBatchResponse(
      JSON.stringify({
        items: [
          { item_id: 101, categories: ['business', 'Technology', 'Business'] },
          { item_id: 102, categories: ['Science'] },
          { item_id: 103, categories: ['Health'] },
        ],
      }),
      submittedItems
    );

    expect(result.categoriesByItemId).toEqual(
      new Map([
        [101, ['Business', 'Technology']],
        [102, ['Science']],
        [103, ['Health']],
      ])
    );
    expect(result.failedItemIds).toEqual([]);
  });

  it('leaves missing and duplicate results failed while keeping other valid results', () => {
    const result = validateCategorizationBatchResponse(
      JSON.stringify({
        items: [
          { item_id: 101, categories: ['Business'] },
          { item_id: 102, categories: ['Science'] },
          { item_id: 102, categories: ['Technology'] },
        ],
      }),
      submittedItems
    );

    expect(result.categoriesByItemId).toEqual(new Map([[101, ['Business']]]));
    expect(result.failedItemIds).toEqual([102, 103]);
  });

  it('ignores IDs outside the submitted batch and leaves omitted submitted IDs failed', () => {
    const result = validateCategorizationBatchResponse(
      JSON.stringify({
        items: [
          { item_id: 101, categories: ['Business'] },
          { item_id: 999, categories: ['News'] },
        ],
      }),
      submittedItems
    );

    expect(result.categoriesByItemId).toEqual(new Map([[101, ['Business']]]));
    expect(result.failedItemIds).toEqual([102, 103]);
  });

  it('fails all submitted items for malformed JSON', () => {
    const result = validateCategorizationBatchResponse('{invalid json', submittedItems);

    expect(result.categoriesByItemId.size).toBe(0);
    expect(result.failedItemIds).toEqual([101, 102, 103]);
  });

  it('leaves an item failed when its categories contain no allowed value', () => {
    const result = validateCategorizationBatchResponse(
      JSON.stringify({
        items: [
          { item_id: 101, categories: ['made up category'] },
          { item_id: 102, categories: ['Science'] },
          { item_id: 103, categories: [] },
        ],
      }),
      submittedItems
    );

    expect(result.categoriesByItemId).toEqual(new Map([[102, ['Science']]]));
    expect(result.failedItemIds).toEqual([101, 103]);
  });

  it('rejects duplicate IDs in the submitted batch', () => {
    expect(() =>
      validateCategorizationBatchResponse(
        JSON.stringify({ items: [] }),
        [submittedItems[0], submittedItems[0]]
      )
    ).toThrow('duplicate submitted item IDs');
  });
});
