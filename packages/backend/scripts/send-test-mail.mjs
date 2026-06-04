/**
 * Skickar ett nyhetsbrevsutkast som testmail via Gmail SMTP.
 *
 * Förutsättningar:
 *   1. Backend måste vara igång (npm run dev) – skriptet hämtar och renderar därifrån.
 *   2. Lägg dina Gmail-uppgifter i packages/backend/.env:
 *        GMAIL_USER=dinadress@gmail.com
 *        GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx   (16-teckens app-lösenord, ej ditt vanliga)
 *        MAIL_TO=dinadress@gmail.com           (valfritt – default = GMAIL_USER)
 *
 * Användning:
 *   node packages/backend/scripts/send-test-mail.mjs                 # första proffs-utkastet
 *   node packages/backend/scripts/send-test-mail.mjs "Ny layout"     # via titel
 *   node packages/backend/scripts/send-test-mail.mjs <newsletter-id> # via id
 */
import { config } from 'dotenv';
import nodemailer from 'nodemailer';
import sharp from 'sharp';

config({ path: new URL('../.env', import.meta.url) });

const BACKEND = process.env.PUBLIC_URL || 'http://localhost:3001';
const GMAIL_USER = process.env.GMAIL_USER;
const APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
const MAIL_TO = process.env.MAIL_TO || GMAIL_USER;
const selector = process.argv[2]; // titel eller id (valfritt)

function fail(msg) {
  console.error('\n✗ ' + msg + '\n');
  process.exit(1);
}

if (!GMAIL_USER || !APP_PASSWORD) {
  fail(
    'GMAIL_USER och GMAIL_APP_PASSWORD måste finnas i packages/backend/.env.\n' +
      '  App-lösenord skapas på https://myaccount.google.com/apppasswords (kräver 2-stegsverifiering).'
  );
}

/**
 * Hämtar varje uppladdad bild, konverterar till PNG och bäddar in den som
 * CID-bilaga. Ersätter src med cid:... så att bilderna visas i mailklienter
 * (Outlook stöder varken localhost-URL:er eller WebP).
 */
async function embedImages(html) {
  const srcs = [...html.matchAll(/src="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((u) => /\/uploads\//.test(u));
  const unique = [...new Set(srcs)];

  const attachments = [];
  let idx = 0;
  for (const src of unique) {
    const absolute = src.startsWith('http') ? src : `${BACKEND}${src.startsWith('/') ? '' : '/'}${src}`;
    try {
      const res = await fetch(absolute);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const input = Buffer.from(await res.arrayBuffer());
      const png = await sharp(input).png().toBuffer();
      const cid = `img${idx}@byggnytt`;
      attachments.push({ filename: `bild${idx}.png`, content: png, cid, contentType: 'image/png' });
      // Ersätt alla förekomster av denna src
      html = html.split(`"${src}"`).join(`"cid:${cid}"`);
      idx++;
    } catch (err) {
      console.warn(`  ⚠ Kunde inte bädda in ${absolute}: ${err.message}`);
    }
  }
  return { html, attachments };
}

async function main() {
  // 1. Hämta nyhetsbrevet
  let list;
  try {
    const res = await fetch(`${BACKEND}/api/newsletters`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    list = await res.json();
  } catch (err) {
    fail(`Kunde inte nå backend på ${BACKEND} (är "npm run dev" igång?): ${err.message}`);
  }

  let target;
  if (selector) {
    target =
      list.find((n) => n.id === selector) ||
      list.find((n) => (n.title || '').toLowerCase() === selector.toLowerCase()) ||
      list.find((n) => (n.title || '').toLowerCase().includes(selector.toLowerCase()));
    if (!target) fail(`Hittade inget nyhetsbrev som matchar "${selector}".`);
  } else {
    target = list.find((n) => n.channel === 'proffs') || list[0];
    if (!target) fail('Inga nyhetsbrev hittades i databasen.');
  }

  const full = await (await fetch(`${BACKEND}/api/newsletters/${target.id}`)).json();

  // 2. Rendera mailkompatibel HTML
  const renderRes = await fetch(`${BACKEND}/api/render/mjml`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks: full.blocks, settings: full.settings, channel: full.channel }),
  });
  let { html } = await renderRes.json();

  // Bädda in bilderna som CID-bilagor (PNG) så att de visas i mailklienter –
  // localhost-URL:er går inte att hämta och Outlook renderar inte WebP.
  const { html: embeddedHtml, attachments } = await embedImages(html);
  html = embeddedHtml;

  const subject = full.settings?.subject || full.title || 'Testutskick';

  // 3. Skicka via Gmail SMTP
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: GMAIL_USER, pass: APP_PASSWORD },
  });

  console.log(`Skickar "${subject}" (${full.channel}) → ${MAIL_TO} ...`);
  try {
    const info = await transporter.sendMail({
      from: `"${full.settings?.sender_name || 'ByggNytt'}" <${GMAIL_USER}>`,
      to: MAIL_TO,
      subject: `[TEST] ${subject}`,
      html,
      attachments,
    });
    console.log('✓ Skickat! messageId:', info.messageId, `(${attachments.length} inbäddade bilder)`);
  } catch (err) {
    if (/Invalid login|Username and Password not accepted|BadCredentials/i.test(err.message)) {
      fail(
        'Gmail nekade inloggningen. Kontrollera att:\n' +
          '  • GMAIL_USER är hela adressen\n' +
          '  • GMAIL_APP_PASSWORD är ett APP-lösenord (16 tecken), inte ditt vanliga lösenord\n' +
          '  • 2-stegsverifiering är på för kontot'
      );
    }
    fail('Sändning misslyckades: ' + err.message);
  }
}

main();
