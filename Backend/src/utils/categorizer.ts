import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();
import { CategoryModel } from '../models/category.model';
import { query } from '../config/db';
import pLimit from 'p-limit';


const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const ALLOWED_CATEGORIES = [
  "Technology", "Health", "News", "Business", "Sports", "Entertainment",
  "Fashion", "Science", "Education", "Productivity", "Lifestyle", "Food",
  "Photography", "Finance", "Career", "Spirituality", "Culture",
  "Real Estate", "Environment", "Politics",
] as const;

const USE_AI_CATEGORY = process.env.USE_AI_CATEGORY === 'true';

function getCategoryPrompt(title: string, description?: string): string {
  const context =
    description && description.length > 0 ? `\nDescription: "${description.slice(0, 300)}"` : '';

  return `
  You are a fast text classifier. 
  Assign this article to one or more categories from the fixed list below.
  Valid categories:
  ["Technology", "Health", "News", "Business", "Sports", "Entertainment", "Fashion", "Science", "Education", "Productivity", "Lifestyle", "Food", "Photography", "Finance", "Career", "Spirituality", "Culture", "Real Estate", "Environment", "Politics"]
  Rules:
  - You must pick at least one category.
  - Choose all that apply (comma-separated).
  - Respond with category names only, comma-separated. No extra words or punctuation.

  Title: "${title}"
  Description: ${context}
  Respond with only the category name(s), comma-separated, no explanations.
  `;
}

async function askOpenAI(prompt: string): Promise<string> {
  try {
    const response = await client.chat.completions.create({
  model: "gpt-4.1-nano",
  temperature: 0,
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "article_categories",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          categories: {
            type: "array",
            minItems: 1,
            maxItems: 3,
            items: { type: "string", enum: [...ALLOWED_CATEGORIES] },
          },
        },
        required: ["categories"],
      },
    },
  },
  messages: [
    { role: "system", content: "Classify the article using only allowed categories." },
    { role: "user", content: prompt },
  ],
});

const parsed = JSON.parse(response.choices[0].message.content || "{}");
return (parsed.categories || []).join(", ");
  }catch (error) {
    console.error("OpenAI categorization failed:", error);
    return "General";
  }
}

export async function categorizeItem(
  itemId: number,
  title: string | null,
  description: string | null
): Promise<void> {
  if (!title || title.trim().length === 0) {
    console.log(`Skipping categorization for item ${itemId}: no title`);
    return;
  }

  //Skip already categorized
  const check = await query(`SELECT is_categorized FROM item WHERE item_id = $1`, [itemId]);
  if (check.rows[0]?.is_categorized) {
    console.log(`Item ${itemId} already categorized — skipping`);
    return;
  }

  let categoryString = '';

  if (USE_AI_CATEGORY) {
    const prompt = getCategoryPrompt(title, description ?? '');
    categoryString = await askOpenAI(prompt);
  } else {
  console.log('AI category generation disabled — marking item as categorized');

  await query(
    `UPDATE item
     SET is_categorized = true
     WHERE item_id = $1 AND is_categorized = false`,
    [itemId]
  );

  return;
}

  // Parse and sanitize categories
  const categories = sanitizeCategories(categoryString);

  // Save categories (handled in your model)
  for (const categoryName of categories) {
    const categoryId = await CategoryModel.category(categoryName);
    await CategoryModel.linkItemCategory(itemId, categoryId);
  }

  await query(
    `UPDATE item SET is_categorized = true WHERE item_id = $1 AND is_categorized = false`,
    [itemId]
  );

  console.log(`Categories added for item ${itemId}:`, categories);
}



const categorizeLimit = pLimit(5);
const categorizeQueue = new Set<number>();

export function enqueueCategorization(itemIds: number[]) {
  for (const itemId of itemIds) {
    if (categorizeQueue.has(itemId)) continue;
    categorizeQueue.add(itemId);
    categorizeLimit(async () => {
      try {
        const row = await query(
          `SELECT item_id, title, description FROM item WHERE item_id = $1 AND is_categorized = false`,
          [itemId]
        );
        const item = row.rows[0];
        if (!item) return;
        await categorizeItem(item.item_id, item.title, item.description);
      } finally {
        categorizeQueue.delete(itemId);
      }
    });
  }
}

function mapToAllowedCategory(raw: string): string | null {
  const normalized = raw.trim().toLowerCase();
  const exact = ALLOWED_CATEGORIES.find(c => c.toLowerCase() === normalized);
  if (exact) return exact;

  const aliases: Record<string, string> = {
    tech: "Technology",
    "real estate": "Real Estate",
  };
  return aliases[normalized] ?? null;
}

function sanitizeCategories(raw: string): string[] {
  const mapped = raw
    .split(",")
    .map(mapToAllowedCategory)
    .filter((c): c is string => Boolean(c));

  return mapped.length ? [...new Set(mapped)] : ["News"];
}