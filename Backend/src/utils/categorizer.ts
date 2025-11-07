import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function getCategoryPrompt(title: string): string {
  return `
  You are a text classification assistant. 
  Categorize the following article title into one of these categories:
  ["Technology", "Health", "News", "Business", "Sports", "Entertainment", "Fashion", "Science", "Education", "Productivity", "Lifestyle", "Food", "Photography", "Finance"].

  Title: "${title}"
  Respond with only the category name.`;
}

async function askOpenAI(prompt: string): Promise<string> {
  const response = await client.responses.create({
    model: "gpt-4.1-nano",
    input: prompt,
  });

  const text = response.output_text?.trim() ?? "";

  return text;
}

export async function categorizeArticle(title: string): Promise<string> {
  const prompt = getCategoryPrompt(title);
  const category = await askOpenAI(prompt);
  return category;
}

