// contacts.js — turns a contact found in an agreement into a phone "contact card" (.vcf).
// Opening the card on a phone offers "Add to contacts", with a note saying which
// agreement it came from.

function esc(v) {
  return String(v || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

export function contactLabel(c) {
  return c.name || c.organization || c.role || 'Contact';
}

export function buildVCard(c, sourceFileName) {
  const display = c.name || c.organization || 'Contact';
  const parts = (c.name || '').trim().split(/\s+/);
  const last = parts.length > 1 ? parts.pop() : '';
  const first = parts.join(' ');
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${esc(display)}`,
    `N:${esc(last)};${esc(first || (c.name ? '' : display))};;;`,
  ];
  if (c.organization) lines.push(`ORG:${esc(c.organization)}`);
  if (c.role) lines.push(`TITLE:${esc(c.role)}`);
  if (c.phone) lines.push(`TEL;TYPE=WORK,VOICE:${esc(c.phone)}`);
  if (c.email) lines.push(`EMAIL;TYPE=INTERNET,WORK:${esc(c.email)}`);
  if (c.address) lines.push(`ADR;TYPE=WORK:;;${esc(c.address)};;;;`);
  lines.push(`NOTE:${esc(`Saved by Fine Print from: ${sourceFileName}${c.role ? ` (${c.role})` : ''}`)}`);
  lines.push('END:VCARD');
  return lines.join('\r\n') + '\r\n';
}

// Hand the card to the phone. Android opens it in Contacts after download;
// iPhone shows "Create New Contact".
export function saveVCard(c, sourceFileName) {
  const text = buildVCard(c, sourceFileName);
  const blob = new Blob([text], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${contactLabel(c).replace(/[^\w\- ]+/g, '').trim() || 'contact'}.vcf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return text;
}
