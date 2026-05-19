const PRIVACY_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Privacy Policy — Kachingo</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:680px;margin:0 auto;padding:24px 20px;color:#1a1a1a;line-height:1.6}h1{font-size:1.6rem;margin-bottom:4px}h2{font-size:1.1rem;margin-top:2rem;margin-bottom:6px;color:#111}p{margin:0 0 1rem;color:#444}.meta{color:#888;font-size:.85rem;margin-bottom:2rem}a{color:#e84393}</style>
</head>
<body>
<h1>Privacy Policy</h1>
<p class="meta">Last updated: May 2025 &nbsp;·&nbsp; Kachingo (com.kachingo.app)</p>

<h2>1. Information We Collect</h2>
<p>We collect information you provide directly: your name and email address (via Google or Apple Sign-In) and profile preferences (currency, language). All financial data — transactions, budgets, and goals — is stored locally on your device and never uploaded to our servers.</p>

<h2>2. How We Use Your Information</h2>
<p>Your information is used solely to provide and improve Kachingo: to authenticate you, personalise your experience, and process your Pro subscription. We do not sell your data to third parties.</p>

<h2>3. Data Storage &amp; Security</h2>
<p>Account data is stored securely with Supabase. Authentication tokens are stored in your device's secure enclave via Expo SecureStore. Financial data (transactions, budgets, goals) is stored locally on your device only.</p>

<h2>4. Third-Party Services</h2>
<p>Kachingo uses the following third-party services, each operating under its own privacy policy:</p>
<ul>
<li><strong>Supabase</strong> — authentication and account storage</li>
<li><strong>RevenueCat</strong> — subscription management</li>
<li><strong>Mixpanel</strong> — anonymous usage analytics (consent required)</li>
<li><strong>Cloudflare</strong> — API proxy for AI features</li>
<li><strong>Anthropic</strong> — AI-powered receipt parsing</li>
</ul>

<h2>5. Analytics &amp; Tracking</h2>
<p>We use Mixpanel to collect anonymous usage statistics to improve the app. Analytics are only activated after you explicitly consent in-app. You may withdraw consent at any time from the Profile screen.</p>

<h2>6. Children's Privacy</h2>
<p>Kachingo is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided personal information, please contact us immediately.</p>

<h2>7. Data Deletion</h2>
<p>You may delete your local data at any time from Profile → Danger Zone → Clear All Data. To permanently delete your account from our servers, contact us at the address below.</p>

<h2>8. Changes to This Policy</h2>
<p>We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the date at the top of this page. Continued use of the app constitutes acceptance of the updated policy.</p>

<h2>9. Contact Us</h2>
<p>Questions about this Privacy Policy? Email us at <a href="mailto:support@kachingo.app">support@kachingo.app</a>.</p>
</body></html>`;

const TERMS_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Terms of Service — Kachingo</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:680px;margin:0 auto;padding:24px 20px;color:#1a1a1a;line-height:1.6}h1{font-size:1.6rem;margin-bottom:4px}h2{font-size:1.1rem;margin-top:2rem;margin-bottom:6px;color:#111}p{margin:0 0 1rem;color:#444}.meta{color:#888;font-size:.85rem;margin-bottom:2rem}a{color:#e84393}</style>
</head>
<body>
<h1>Terms of Service</h1>
<p class="meta">Last updated: May 2025 &nbsp;·&nbsp; Kachingo (com.kachingo.app)</p>

<h2>1. Acceptance of Terms</h2>
<p>By downloading, installing, or using Kachingo, you agree to be bound by these Terms of Service. If you do not agree, please do not use the app.</p>

<h2>2. Description of Service</h2>
<p>Kachingo is a personal finance management app that helps you track income and expenses, set budgets, manage savings goals, and scan receipts using AI. The free tier includes core features; the Pro tier unlocks additional capabilities.</p>

<h2>3. User Accounts</h2>
<p>You must create an account to use Kachingo. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must provide accurate, current information and keep it updated.</p>

<h2>4. Pro Subscription &amp; Billing</h2>
<p>Kachingo Pro is a paid subscription available monthly or annually, billed through the App Store or Google Play. Subscriptions automatically renew unless cancelled at least 24 hours before the renewal date. Manage or cancel your subscription in your device's app store settings.</p>

<h2>5. Prohibited Uses</h2>
<p>You may not use Kachingo to: violate any applicable law or regulation; attempt to reverse-engineer or modify the app; use automated tools to scrape or access the service; resell or redistribute the service; or transmit malicious code or content.</p>

<h2>6. Disclaimer of Warranties</h2>
<p>Kachingo is provided "as is" without warranties of any kind, express or implied. Financial information in the app is for personal tracking purposes only and does not constitute financial, tax, or investment advice. We do not guarantee the accuracy of AI-generated receipt data.</p>

<h2>7. Limitation of Liability</h2>
<p>To the maximum extent permitted by applicable law, Kachingo and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the app, including any financial decisions made based on data within the app.</p>

<h2>8. Contact</h2>
<p>Questions about these Terms? Email us at <a href="mailto:support@kachingo.app">support@kachingo.app</a>.</p>
</body></html>`;

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

    if (url.pathname === '/privacy-policy' || url.pathname === '/privacy') {
      return new Response(PRIVACY_HTML, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    if (url.pathname === '/terms-of-service' || url.pathname === '/terms') {
      return new Response(TERMS_HTML, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    return env.ASSETS.fetch(request);
  },
};
