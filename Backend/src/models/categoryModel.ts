import { query } from "../config/db";

export const CategoryModel = {
  //create a category if it doesn't exist and return its ID
  async category(name: string): Promise<number> {
    try {
      const result = await query(
        `INSERT INTO category (name)
        VALUES ($1)
        ON CONFLICT (name)
        DO UPDATE SET name = EXCLUDED.name
        RETURNING category_id;`, [name]
      );

      return result.rows[0].category_id;
    } catch (err) {
      console.error("Error in finding or creating category:", err);
      throw err;
    }
  },

  // Link an item to a category (avoid duplicate links)
  async linkItemCategory(itemId: number, categoryId: number): Promise<void> {
    try {
      await query(
        `INSERT INTO item_category (item_id, category_id)
        VALUES ($1, $2)
        ON CONFLICT (item_id, category_id) DO NOTHING;`, [itemId, categoryId]
      );
    } catch (err) {
      console.error("Error in linking category to item:", err);
      throw err;
    }
  },

  // Optional helper: get all categories for an item
  async getCategoriesForItem(itemId: number): Promise<string[]> {
    const result = await query(
      `SELECT c.name
      FROM category c
      INNER JOIN item_category ic ON ic.category_id = c.category_id
      WHERE ic.item_id = $1;`, [itemId]
    );
    return result.rows.map((r) => r.name);
  },
};
