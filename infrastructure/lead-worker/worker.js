const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...headers
    }
  });

const parseAllowedOrigins = (value) =>
  new Set(
    String(value || 'https://ahmadrastibarzoki.ir')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
  );

const corsHeaders = (origin, allowedOrigins) => {
  if (!origin || !allowedOrigins.has(origin)) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    'vary': 'Origin'
  };
};

const toBase64Utf8 = (text) => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const safeText = (value, max) => String(value ?? '').trim().slice(0, max);
const validEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 160;

export default {
  async fetch(request, env) {
    const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS);
    const origin = request.headers.get('origin') || '';
    const cors = corsHeaders(origin, allowedOrigins);

    if (request.method === 'OPTIONS') {
      if (!allowedOrigins.has(origin)) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, cors);
    }

    if (!allowedOrigins.has(origin)) {
      return json({ error: 'Origin not allowed' }, 403);
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return json({ error: 'Expected application/json' }, 415, cors);
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 20000) {
      return json({ error: 'Payload too large' }, 413, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400, cors);
    }

    // Honeypot: silently accept bot submissions without storing them.
    if (safeText(body.company_url, 200)) {
      return json({ ok: true, leadId: 'received' }, 201, cors);
    }

    const lead = {
      id: crypto.randomUUID(),
      submitted_at: new Date().toISOString(),
      source: 'website_services_form',
      language: body.language === 'fa' ? 'fa' : 'en',
      name: safeText(body.name, 100),
      email: safeText(body.email, 160).toLowerCase(),
      organization: safeText(body.organization, 160),
      service: safeText(body.service, 80),
      stage: safeText(body.stage, 80),
      timeline: safeText(body.timeline, 80),
      message: safeText(body.message, 3000),
      page_path: safeText(body.page_path, 200),
      consent: body.consent === 'yes'
    };

    if (
      lead.name.length < 2 ||
      !validEmail(lead.email) ||
      !lead.service ||
      !lead.stage ||
      !lead.timeline ||
      lead.message.length < 30 ||
      !lead.consent
    ) {
      return json({ error: 'Please complete all required fields.' }, 400, cors);
    }

    if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPO) {
      console.error('GitHub storage is not configured.');
      return json({ error: 'Submission storage is not configured.' }, 503, cors);
    }

    const timestamp = lead.submitted_at.replace(/[:.]/g, '-');
    const [year, month, day] = lead.submitted_at.slice(0, 10).split('-');
    const filePath = `leads/${year}/${month}/${day}/${timestamp}_${lead.id}.json`;

    const apiUrl =
      `https://api.github.com/repos/${encodeURIComponent(env.GITHUB_OWNER)}` +
      `/${encodeURIComponent(env.GITHUB_REPO)}/contents/${filePath}`;

    const githubResponse = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'accept': 'application/vnd.github+json',
        'content-type': 'application/json',
        'user-agent': 'ahmad-rasti-website-lead-worker',
        'x-github-api-version': '2022-11-28'
      },
      body: JSON.stringify({
        message: `Add website lead ${lead.id}`,
        content: toBase64Utf8(JSON.stringify(lead, null, 2) + '\n'),
        branch: env.GITHUB_BRANCH || 'main'
      })
    });

    if (!githubResponse.ok) {
      const detail = await githubResponse.text();
      console.error('GitHub storage error', githubResponse.status, detail);
      return json({ error: 'Could not store the inquiry.' }, 502, cors);
    }

    return json({ ok: true, leadId: lead.id }, 201, cors);
  }
};
