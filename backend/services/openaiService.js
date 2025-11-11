// backend/services/openaiService.js
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

// Azure OpenAI configuration
const client = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION },
  defaultHeaders: {
    'api-key': process.env.AZURE_OPENAI_API_KEY,
  },
});

export async function extractExpenseData(text) {
  const prompt = `
  You are an expense extraction assistant.
  Extract vendor, category, amount, date, and payment method as JSON.
  Input: ${text}
  Output format:
  {
    "vendor": "...",
    "category": "...",
    "amount": ...,
    "date": "...",
    "payment_method": "..."
  }`;

  const res = await client.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME, // Use deployment name for Azure
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
  });

  return res.choices[0].message.content;
}
