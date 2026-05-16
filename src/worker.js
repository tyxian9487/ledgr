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

async function handleScanReceipt(request, env) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: 'ANTHROPIC_API_KEY is not configured' }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }

  const { base64, mediaType } = body;
  if (!base64 || !mediaType) {
    return jsonResponse({ error: 'Missing base64 or mediaType' }, 400);
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

  const data = await anthropicRes.json();

  if (!anthropicRes.ok) {
    const message = data?.error?.message || `Anthropic API error ${anthropicRes.status}`;
    return jsonResponse({ error: message }, 502);
  }

  const text = data?.content?.[0]?.text ?? '';
  let parsed;
  try {
    parsed = JSON.parse(text.trim());
  } catch {
    // Try to extract JSON from the response if it contains extra text
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return jsonResponse({ error: 'Could not parse receipt data' }, 422);
    }
    parsed = JSON.parse(match[0]);
  }

  return jsonResponse(parsed, 200);
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/scan-receipt' && request.method === 'POST') {
      return handleScanReceipt(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
