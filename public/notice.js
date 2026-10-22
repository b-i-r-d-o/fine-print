// notice.js — the tenant's notice to end a tenancy (Alberta).
// The END DATE is calculated here in code, not by the AI, so the legal date can't be guessed wrong.
// Rule (Government of Alberta): one full tenancy month's written notice; late notice runs to the
// end of the NEXT complete tenancy month.

/** Parse 'YYYY-MM-DD' as a local date. */
export function parseISO(s) {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }

/** The date a tenancy month starts in a given month, for rent due on `rentDay` (clamped for short months). */
function periodStart(y, m, rentDay) {
  return new Date(y, m, Math.min(rentDay, daysInMonth(y, m)));
}

/**
 * Last day of the next COMPLETE tenancy month after notice is given on `todayISO`.
 * Notice given ON the first day of a tenancy month counts that month as the full month.
 * Examples (rent due on the 1st): Oct 20 → Nov 30; Nov 1 → Nov 30; Dec 15 → Jan 31; Feb 2 → Mar 31.
 */
export function noticeEndDate(todayISO, rentDay = 1) {
  const day = Math.min(Math.max(parseInt(rentDay, 10) || 1, 1), 31);
  const t = parseISO(todayISO);
  let start = periodStart(t.getFullYear(), t.getMonth(), day);
  if (t > start) start = periodStart(t.getFullYear(), t.getMonth() + 1, day); // this month already started → next one
  const nextStart = periodStart(start.getFullYear(), start.getMonth() + 1, day);
  const end = new Date(nextStart.getFullYear(), nextStart.getMonth(), nextStart.getDate() - 1);
  return toISO(end);
}

/** The landlord must receive the notice by this date for the end date above to hold. */
export function deliverBy(todayISO, rentDay = 1) {
  const end = parseISO(noticeEndDate(todayISO, rentDay));
  const day = Math.min(Math.max(parseInt(rentDay, 10) || 1, 1), 31);
  // the full tenancy month that ends on `end` starts one month earlier
  const start = periodStart(end.getFullYear(), end.getMonth() - (end.getDate() >= day ? 0 : 1), day);
  const startISO = toISO(start);
  if (startISO <= todayISO) return todayISO;
  return toISO(new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1));
}

export function longDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || '';
  return parseISO(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Build the notice from the agreement's facts. Everything here can be edited by the user. */
export function buildNotice(facts, { todayISO, landlordAddress = '' }) {
  const endISO = noticeEndDate(todayISO, facts.rent_day || 1);
  const agreementRef = [facts.lease_identifiers, facts.agreement_date ? `dated ${longDate(facts.agreement_date)}` : '']
    .filter(Boolean).join(', ');
  return {
    title: "Notice to End a Periodic Tenancy (Tenant's Notice)",
    date: longDate(todayISO),
    endISO,
    to: facts.party_name || '',
    landlordAddress: landlordAddress || '',
    from: facts.user_name || '',
    premises: facts.rental_address || '',
    agreement: agreementRef,
    body: `I am giving you notice that I will end my tenancy of the rental premises listed above. My tenancy will end on ${longDate(endISO)}, and I will give up possession of the premises on or before that date.\n\nThis notice is given under the Residential Tenancies Act (Alberta).\n\nPlease return my security deposit, with any interest owed, as required by the Act.`,
    forwarding: '',
  };
}

export const NOTICE_FIELDS = [
  { key: 'date', label: 'Date of notice' },
  { key: 'to', label: 'To (landlord)' },
  { key: 'landlordAddress', label: "Landlord's address", blank: 'Not listed in the lease. Fill in by hand' },
  { key: 'from', label: 'From (tenant)' },
  { key: 'premises', label: 'Rental premises' },
  { key: 'agreement', label: 'Rental agreement' },
  { key: 'body', label: 'Notice', multiline: true },
  { key: 'forwarding', label: 'My forwarding address', blank: 'Optional. Fill in by hand' },
];

/** Plain-text version (used for checks and as the PDF source). */
export function noticeLines(n) {
  return [
    n.title,
    '',
    `Date: ${n.date}`,
    `To (landlord): ${n.to}`,
    `Landlord's address: ${n.landlordAddress || '______________________________'}`,
    `From (tenant): ${n.from}`,
    `Rental premises: ${n.premises}`,
    `Rental agreement: ${n.agreement}`,
    '',
    n.body,
    '',
    `My forwarding address: ${n.forwarding || '______________________________'}`,
    '',
    '',
    'Tenant signature: ______________________________',
    `Tenant name: ${n.from}`,
    'Date signed: ____________________',
  ];
}

let jsPDFLoaded = null;
function loadJsPDF() {
  if (window.jspdf) return Promise.resolve();
  if (!jsPDFLoaded) {
    jsPDFLoaded = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = '/vendor/jspdf.umd.min.js'; // jsPDF 2.5.1, bundled with the app
      s.onload = resolve;
      s.onerror = () => reject(new Error('Could not load the PDF tool.'));
      document.head.appendChild(s);
    });
  }
  return jsPDFLoaded;
}

/** Make the PDF and hand it to the phone to save or print. Returns the file name. */
export async function downloadNoticePDF(n) {
  await loadJsPDF();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const left = 64; const width = 612 - left * 2; let y = 72;
  const line = (text, { size = 11, bold = false, gap = 6 } = {}) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const wrapped = doc.splitTextToSize(text, width);
    wrapped.forEach((w) => { if (y > 740) { doc.addPage(); y = 72; } doc.text(w, left, y); y += size * 1.35; });
    y += gap;
  };
  line(n.title, { size: 15, bold: true, gap: 14 });
  [['Date', n.date], ['To (landlord)', n.to], ["Landlord's address", n.landlordAddress || '______________________________'],
    ['From (tenant)', n.from], ['Rental premises', n.premises], ['Rental agreement', n.agreement]]
    .forEach(([k, v]) => line(`${k}: ${v}`, { gap: 2 }));
  y += 12;
  n.body.split(/\n\s*\n/).forEach((p) => line(p.trim(), { gap: 10 }));
  line(`My forwarding address: ${n.forwarding || '______________________________'}`, { gap: 36 });
  line('Tenant signature: ______________________________', { gap: 4 });
  line(`Tenant name: ${n.from}`, { gap: 4 });
  line('Date signed: ____________________', { gap: 4 });
  const fileName = 'Notice-to-End-Tenancy.pdf';
  doc.save(fileName);
  return { fileName, text: noticeLines(n).join('\n') };
}
