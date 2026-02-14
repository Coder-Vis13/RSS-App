import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();
import { CategoryModel } from '../models/category.model';
import { query } from '../config/db';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const USE_AI_CATEGORY = process.env.USE_AI_CATEGORY === 'false';

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
    const response = await client.responses.create({
      model: 'gpt-4.1-nano',
      input: prompt,
    });

    const text = response.output_text?.trim() ?? '';
    return text;
  } catch (error) {
    console.error('Error calling OpenAI: ', error);
    return '';
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
    console.log('AI category generation disabled — skipping API call');
    categoryString = 'Uncategorized';
  }

  // Parse and sanitize categories
  const categories = categoryString
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  if (categories.length === 0) {
    categories.push('Uncategorized');
  }

  // Save categories (handled in your model)
  for (const categoryName of categories) {
    const categoryId = await CategoryModel.category(categoryName);
    await CategoryModel.linkItemCategory(itemId, categoryId);
  }

  await query(`UPDATE item SET is_categorized = true WHERE item_id = $1`, [itemId]);

  console.log(`Categories added for item ${itemId}:`, categories);
}
