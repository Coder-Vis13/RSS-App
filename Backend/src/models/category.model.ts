import pool, { query } from '../config/db';

export type SaveItemCategoriesResult = 'saved' | 'already-categorized' | 'missing-item';

export const CategoryModel = {
  async saveItemCategories(
    itemId: number,
    categories: string[]
  ): Promise<SaveItemCategoriesResult> {
    if (categories.length === 0) {
      throw new Error('Cannot mark an item categorized without valid categories');
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const item = await client.query<{ is_categorized: boolean }>(
        `SELECT is_categorized
         FROM item
         WHERE item_id = $1
         FOR UPDATE`,
        [itemId]
      );

      if (!item.rows[0]) {
        await client.query('COMMIT');
        return 'missing-item';
      }

      if (item.rows[0].is_categorized) {
        await client.query('COMMIT');
        return 'already-categorized';
      }

      // Replace any partial links from an earlier failed categorization attempt.
      await client.query('DELETE FROM item_category WHERE item_id = $1', [itemId]);

      for (const name of categories) {
        const category = await client.query<{ category_id: number }>(
          `INSERT INTO category (name)
           VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING category_id`,
          [name]
        );

        await client.query(
          `INSERT INTO item_category (item_id, category_id)
           VALUES ($1, $2)
           ON CONFLICT (item_id, category_id) DO NOTHING`,
          [itemId, category.rows[0].category_id]
        );
      }

      const updated = await client.query(
        `UPDATE item
         SET is_categorized = true
         WHERE item_id = $1 AND is_categorized = false
         RETURNING item_id`,
        [itemId]
      );

      if (!updated.rowCount) {
        throw new Error(`Could not mark item ${itemId} as categorized`);
      }

      await client.query('COMMIT');
      return 'saved';
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async category(name: string): Promise<number> {
    try {
      const result = await query(
        `INSERT INTO category (name)
        VALUES ($1)
        ON CONFLICT (name)
        DO UPDATE SET name = EXCLUDED.name
        RETURNING category_id;`,
        [name]
      );

      return result.rows[0].category_id;
    } catch (err) {
      console.error('Error in finding or creating category:', err);
      throw err;
    }
  },

  // Link an item to a category (avoid duplicate links)
  async linkItemCategory(itemId: number, categoryId: number): Promise<void> {
    try {
      await query(
        `INSERT INTO item_category (item_id, category_id)
        VALUES ($1, $2)
        ON CONFLICT (item_id, category_id) DO NOTHING;`,
        [itemId, categoryId]
      );
    } catch (err) {
      console.error('Error in linking category to item:', err);
      throw err;
    }
  },

  // get all categories for an item
  async getCategoriesForItem(itemId: number): Promise<string[]> {
    const result = await query(
      `SELECT c.name
      FROM category c
      INNER JOIN item_category ic ON ic.category_id = c.category_id
      WHERE ic.item_id = $1;`,
      [itemId]
    );
    return result.rows.map((r) => r.name);
  },
};
