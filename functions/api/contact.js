const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://anchorvalley.us',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const NOTION_API_VERSION = '2022-06-28';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function sendBrevoEmail(apiKey, payload) {
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('Brevo email error:', res.status, text);
    }
  } catch (err) {
    console.error('Brevo email exception:', err);
  }
}

function notificationEmail(name, email, phone, company, subject, message) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;background:#f4f4f4;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
  <div style="background:#060644;padding:20px 30px">
    <h1 style="color:#ffffff;margin:0;font-size:20px">New Contact Form Submission</h1>
  </div>
  <div style="padding:30px">
    <table style="width:100%;border-collapse:collapse;font-size:15px;color:#333">
      <tr><td style="padding:8px 0;font-weight:bold;width:100px;vertical-align:top">Name</td><td style="padding:8px 0">${escapeHtml(name)}</td></tr>
      <tr><td style="padding:8px 0;font-weight:bold;vertical-align:top">Email</td><td style="padding:8px 0"><a href="mailto:${escapeHtml(email)}" style="color:#2563eb">${escapeHtml(email)}</a></td></tr>
      <tr><td style="padding:8px 0;font-weight:bold;vertical-align:top">Phone</td><td style="padding:8px 0">${escapeHtml(phone || 'N/A')}</td></tr>
      <tr><td style="padding:8px 0;font-weight:bold;vertical-align:top">Company</td><td style="padding:8px 0">${escapeHtml(company || 'N/A')}</td></tr>
      <tr><td style="padding:8px 0;font-weight:bold;vertical-align:top">Subject</td><td style="padding:8px 0">${escapeHtml(subject || 'N/A')}</td></tr>
      <tr><td style="padding:8px 0;font-weight:bold;vertical-align:top">Message</td><td style="padding:8px 0;line-height:1.6">${escapeHtml(message)}</td></tr>
    </table>
    <div style="margin-top:24px;text-align:center">
      <a href="https://www.notion.so/" style="background:#d76424;color:#ffffff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px">View in Notion</a>
    </div>
  </div>
</div>
</body></html>`;
}

function confirmationEmail(name) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Outfit',Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#060644;padding:30px;text-align:center;border-radius:12px 12px 0 0">
    <h1 style="color:#ffffff;margin:0;font-size:24px;letter-spacing:2px">ANCHOR VALLEY</h1>
  </div>
  <div style="background:#ffffff;padding:40px 30px;border-radius:0 0 12px 12px">
    <h1 style="color:#060644;font-size:24px;margin:0 0 20px">Thanks for reaching out!</h1>
    <p style="color:#2c3e50;font-size:16px;line-height:1.7;margin:0 0 16px">
      Hey ${escapeHtml(name)},
    </p>
    <p style="color:#2c3e50;font-size:16px;line-height:1.7;margin:0 0 16px">
      I received your message and will get back to you as soon as I can, typically within 24 hours.
    </p>
    <p style="color:#2c3e50;font-size:16px;line-height:1.7;margin:0 0 24px">
      In the meantime, feel free to explore what we offer:
    </p>
    <div style="text-align:center;margin:0 0 24px">
      <a href="https://anchorvalley.us/services" style="background:#d76424;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block">Explore Our Services</a>
    </div>
    <p style="color:#2c3e50;font-size:16px;line-height:1.7;margin:0 0 8px">
      Best regards,
    </p>
    <p style="color:#060644;font-size:16px;font-weight:700;margin:0">
      James Ruff
    </p>
    <p style="color:#d76424;font-size:14px;margin:4px 0 0">
      Founder, Anchor Valley
    </p>
  </div>
  <div style="text-align:center;padding:20px;color:#999;font-size:12px">
    <p>&copy; 2026 Anchor Valley &middot; <a href="https://anchorvalley.us" style="color:#999">anchorvalley.us</a></p>
  </div>
</div>
</body></html>`;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { name, email, phone, company, subject, message } = await request.json();

    if (!name || !email || !message) {
      return jsonResponse({ error: 'Name, email, and message are required.' }, 400);
    }

    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.NOTION_API_KEY}`,
        'Notion-Version': NOTION_API_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: env.NOTION_CONTACT_DB_ID || '2dccde14-915c-81b7-b97c-d138b87d038c' },
        properties: {
          Name: { title: [{ text: { content: name } }] },
          Email: { rich_text: [{ text: { content: email } }] },
          Subject: { rich_text: [{ text: { content: subject || '' } }] },
          Message: { rich_text: [{ text: { content: `${company ? 'Company: ' + company + ' | ' : ''}${phone ? 'Phone: ' + phone + ' | ' : ''}${message}`.slice(0, 2000) } }] },
          Source: { select: { name: 'Anchor Valley' } },
        },
      }),
    });

    if (!notionRes.ok) {
      const err = await notionRes.json();
      console.error('Notion API error:', JSON.stringify(err));
      return jsonResponse({ error: 'Failed to save message. Please try again.' }, 502);
    }

    const emailPromises = [];

    if (env.BREVO_API_KEY) {
      emailPromises.push(
        sendBrevoEmail(env.BREVO_API_KEY, {
          sender: { name: 'Anchor Valley', email: 'james@anchorvalley.us' },
          to: [{ email: 'james@anchorvalley.us', name: 'James Ruff' }],
          subject: `New Contact: ${name} — ${subject || 'No Subject'}`,
          htmlContent: notificationEmail(name, email, phone, company, subject, message),
        })
      );

      emailPromises.push(
        sendBrevoEmail(env.BREVO_API_KEY, {
          sender: { name: 'Anchor Valley', email: 'james@anchorvalley.us' },
          to: [{ email, name }],
          subject: 'We received your message — Anchor Valley',
          htmlContent: confirmationEmail(name),
        })
      );

      context.waitUntil(Promise.all(emailPromises).catch(err => console.error('Email send error:', err)));
    }

    return jsonResponse({ success: true, message: 'Message received!' });
  } catch (err) {
    console.error('Contact form error:', err);
    return jsonResponse({ error: 'Something went wrong. Please try again.' }, 500);
  }
}
