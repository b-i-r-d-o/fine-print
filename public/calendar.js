// calendar.js — turns an agreement's dates into a calendar file (.ics).
// Opening the file on a phone offers "Add to Calendar" (iPhone) or opens the calendar app (Android).
// Each event notes which agreement it came from, with a reminder before it.

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const pad = (n) => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}${pad(m)}${pad(d)}`;

function esc(v) {
  return String(v || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function addDays(y, m, d, n) {
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()];
}

function daysIn(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }

/**
 * Work out when one "date" from an agreement happens next.
 * Understands: 2030-10-15 · "Monthly on the 15th" · "Every year by July 31" · "Every year in November".
 * @returns {{start:[number,number,number], rrule:string|null}|null}  null = past or not a date
 */
export function whenIs(text, todayISO) {
  const s = String(text || '').trim();
  const [ty, tm, td] = todayISO.split('-').map(Number);
  const today = ymd(ty, tm, td);
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const [y, mo, d] = m.slice(1).map(Number);
    return ymd(y, mo, d) >= today ? { start: [y, mo, d], rrule: null } : null;
  }
  m = s.match(/monthly\b.*?\b(\d{1,2})(st|nd|rd|th)?\b/i);
  if (m) {
    const day = Number(m[1]);
    if (day < 1 || day > 31) return null;
    let [y, mo] = [ty, tm];
    if (day < td) { mo += 1; if (mo > 12) { mo = 1; y += 1; } }
    return { start: [y, mo, Math.min(day, daysIn(y, mo))], rrule: `FREQ=MONTHLY;BYMONTHDAY=${day}` };
  }
  m = s.match(/(every year|yearly|annually|each year)\b.*?\b(january|february|march|april|may|june|july|august|september|october|november|december)\b(?:\s+(\d{1,2}))?/i);
  if (m) {
    const mo = MONTHS.indexOf(m[2].toLowerCase()) + 1;
    const day = m[3] ? Number(m[3]) : 1;
    let y = ty;
    if (ymd(y, mo, day) < today) y += 1;
    return { start: [y, mo, Math.min(day, daysIn(y, mo))], rrule: `FREQ=YEARLY;BYMONTH=${mo};BYMONTHDAY=${day}`, monthOnly: !m[3] };
  }
  return null;
}

/** The dates from an agreement that can go in a calendar (upcoming or repeating). */
// Repeating dates stop when the agreement's term ends (`until`); if it already ended, they're left out.
export function calendarItems(items, todayISO, until = null) {
  const end = /^\d{4}-\d{2}-\d{2}$/.test(until || '') ? until : null;
  return (items || []).map((it) => ({ ...it, when: whenIs(it.date, todayISO) }))
    .filter((it) => it.when && !(it.when.rrule && end && end < todayISO))
    .map((it) => (it.when.rrule && end ? { ...it, when: { ...it.when, rrule: `${it.when.rrule};UNTIL=${end.replace(/-/g, '')}` } } : it));
}

/**
 * @param {Array<{date:string, action:string, when?:object}>} items
 * @param {{source:string, party?:string, todayISO:string, until?:string}} info
 */
export function buildICS(items, { source, party, todayISO, until = null }) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Fine Print//Agreement dates//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  calendarItems(items, todayISO, until).forEach((it, i) => {
    const [y, m, d] = it.when.start;
    const end = addDays(y, m, d, 1);
    lines.push(
      'BEGIN:VEVENT',
      `UID:fp-${ymd(y, m, d)}-${i}-${Math.random().toString(36).slice(2, 10)}@fineprint`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(y, m, d)}`,
      `DTEND;VALUE=DATE:${ymd(...end)}`,
    );
    if (it.when.rrule) lines.push(`RRULE:${it.when.rrule}`);
    lines.push(
      `SUMMARY:${esc(it.action)}`,
      `DESCRIPTION:${esc(`From Fine Print: ${source}${party ? ` (${party})` : ''}.\nGuidance only, not legal advice. Check the agreement for details.`)}`,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(it.action)}`, `TRIGGER:${it.when.rrule ? '-P1D' : '-P3D'}`, 'END:VALARM',
      'END:VEVENT',
    );
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

export function icsFileName(source) {
  return `${String(source || 'dates').replace(/\.[a-z]+$/i, '').replace(/[^\w\- ]+/g, '').trim() || 'dates'}.ics`;
}

const DAY_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ord = (n) => `${n}${[, 'st', 'nd', 'rd'][n % 100 >> 3 ^ 1 && n % 10] || 'th'}`;

/** Plain words for when an event happens, e.g. "Every month on the 15th, until Oct 15, 2030". */
export function describeWhen(it) {
  const [y, m, d] = it.when.start;
  const pretty = (yy, mm, dd) => `${DAY_NAMES[mm - 1].slice(0, 3)} ${dd}, ${yy}`;
  const until = ((it.when.rrule || '').match(/UNTIL=(\d{4})(\d{2})(\d{2})/) || []).slice(1).map(Number);
  const tail = until.length ? `, until ${pretty(...until)}` : '';
  if (/FREQ=MONTHLY/.test(it.when.rrule || '')) return `Every month on the ${ord(d)}, from ${pretty(y, m, d)}${tail}`;
  if (/FREQ=YEARLY/.test(it.when.rrule || '') && it.when.monthOnly) return `Every year in ${DAY_NAMES[m - 1]} (on the 1st), from ${y}${tail}`;
  if (/FREQ=YEARLY/.test(it.when.rrule || '')) return `Every year on ${DAY_NAMES[m - 1]} ${d}, from ${y}${tail}`;
  return pretty(y, m, d);
}

/** A link that opens Google Calendar with this event filled in (no file, no download). */
export function googleCalendarLink(it, { source, party }) {
  const [y, m, d] = it.when.start;
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: it.action,
    dates: `${ymd(y, m, d)}/${ymd(...addDays(y, m, d, 1))}`,
    details: `From Fine Print: ${source}${party ? ` (${party})` : ''}.\nGuidance only, not legal advice. Check the agreement for details.`,
  });
  if (it.when.rrule) p.set('recur', `RRULE:${it.when.rrule}`);
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export function icsBlob(items, info) {
  return new Blob([buildICS(items, info)], { type: 'text/calendar;charset=utf-8' });
}

// Hand the file to the phone, the same way contact cards are saved.
export function saveICS(items, info) {
  const text = buildICS(items, info);
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = icsFileName(info.source);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return text;
}
