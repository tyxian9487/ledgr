import { defineConfig, loadEnv, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'

const SYSTEM_PROMPT = `You are a receipt and invoice parser. Extract transaction details from the provided image.

Return ONLY a valid JSON object with no extra text, explanation, or markdown. Use exactly this structure:
{
  "type": "expense" or "income",
  "amount": <number, the total amount paid>,
  "category": <one of the category IDs listed below>,
  "description": <short merchant name or item description, max 40 chars>
}

Expense category IDs (pick the closest match):
food, transport, shopping, entertainment, health, housing, utilities, education, travel, personal, subscriptions, insurance, savings, investment, others

Income category IDs:
salary, freelance, business, gift, other_income

Rules:
- amount must be a plain number (e.g. 42.50), never a string
- If the image is not a receipt or invoice, still return a best-effort guess with type "expense" and category "others"
- description should be concise: merchant name or item (e.g. "Starbucks", "Grocery run", "Uber ride")`;

function scanReceiptPlugin(apiKey: string): Plugin {
  return {
    name: 'scan-receipt-api',
    configureServer(server) {
      server.middlewares.use(
        '/api/scan-receipt',
        async (req: IncomingMessage, res: ServerResponse) => {
          res.setHeader('Content-Type', 'application/json');

          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          if (!apiKey) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY is not set in .env' }));
            return;
          }

          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(Buffer.from(chunk as ArrayBuffer));
          let body: { base64?: string; mediaType?: string };
          try {
            body = JSON.parse(Buffer.concat(chunks).toString());
          } catch {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid JSON body' }));
            return;
          }

          const { base64, mediaType } = body;
          if (!base64 || !mediaType) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing base64 or mediaType' }));
            return;
          }

          const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              model: 'claude-opus-4-7',
              max_tokens: 512,
              system: [
                {
                  type: 'text',
                  text: SYSTEM_PROMPT,
                  cache_control: { type: 'ephemeral' },
                },
              ],
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'image',
                      source: { type: 'base64', media_type: mediaType, data: base64 },
                    },
                    {
                      type: 'text',
                      text: 'Extract the transaction details from this receipt and return JSON only.',
                    },
                  ],
                },
              ],
            }),
          });

          const data = await anthropicRes.json() as {
            content?: Array<{ text: string }>;
            error?: { message: string };
          };

          if (!anthropicRes.ok) {
            res.statusCode = 502;
            res.end(JSON.stringify({ error: data.error?.message ?? `Anthropic API error ${anthropicRes.status}` }));
            return;
          }

          const text = data.content?.[0]?.text ?? '';
          let parsed: unknown;
          try {
            parsed = JSON.parse(text.trim());
          } catch {
            const match = text.match(/\{[\s\S]*\}/);
            if (!match) {
              res.statusCode = 422;
              res.end(JSON.stringify({ error: 'Could not parse receipt data from response' }));
              return;
            }
            try {
              parsed = JSON.parse(match[0]);
            } catch {
              res.statusCode = 422;
              res.end(JSON.stringify({ error: 'Malformed JSON in Claude response' }));
              return;
            }
          }

          res.end(JSON.stringify(parsed));
        }
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), scanReceiptPlugin(env.ANTHROPIC_API_KEY ?? '')],
    base: '/',
    server: {
      host: '0.0.0.0',
      port: 5000,
      allowedHosts: true,
    },
  };
});
