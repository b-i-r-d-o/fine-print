// app.js — the screen flow: welcome → start choice → profile → home, plus the side menu.
// The app decides which screen shows and which buttons appear.
// (Later slices add the AI conversation through agent.js.)

import { load, save, clearAll } from './storage.js';
import { askHelper, todayISO } from './agent.js';
import { prepareFile } from './upload.js';
import { saveVCard, contactLabel } from './contacts.js';
import { buildNotice, deliverBy, longDate, downloadNoticePDF, NOTICE_FIELDS } from './notice.js';

/* ---------- Themes ---------- */
const THEME_COLOURS = { linen: '#F3EDE4', midnight: '#0B0D12', heirloom: '#2A1823', popstar: '#FFF3FA', large: '#041E42' };

function applyTheme(name) {
  if (!THEME_COLOURS[name]) name = 'linen';
  document.documentElement.dataset.theme = name;
  document.querySelector('meta[name="theme-color"]').setAttribute('content', THEME_COLOURS[name]);
  document.querySelectorAll('.theme-select').forEach((s) => { s.value = name; });
  save('theme', name);
}

document.querySelectorAll('.theme-select').forEach((select) => {
  select.addEventListener('change', (e) => applyTheme(e.target.value));
});

/* ---------- Agreement categories (side menu) ---------- */
// The AI picks one of these when it reads an agreement (slice 2).
export const CATEGORIES = [
  { id: 'housing', label: 'Housing', hint: 'Leases, mortgages, property' },
  { id: 'medical', label: 'Medical', hint: 'Health plans, care agreements' },
  { id: 'financial', label: 'Financial', hint: 'Insurance, investments' },
  { id: 'marriage', label: 'Marriage', hint: 'Prenups, separation agreements' },
  { id: 'estate', label: 'Estate', hint: 'Wills, powers of attorney' },
  { id: 'work', label: 'Work', hint: 'Employment, contractor agreements, NDAs' },
  { id: 'other', label: 'Other', hint: 'Anything else you store' },
];
let filter = null; // null = all agreements, or a category id

/* ---------- Screens ---------- */
// Each screen change is added to the browser's history, so the phone's back
// gesture/button steps back through the screens instead of leaving the app.
function show(name, { push = true } = {}) {
  document.querySelectorAll('.screen').forEach((el) => { el.hidden = el.dataset.screen !== name; });
  save('screen', name);
  if (push && history.state?.screen !== name) history.pushState({ screen: name }, '', '#' + name);
  if (name === 'home') renderHome();
  closeDrawer();
  window.scrollTo(0, 0);
}

window.addEventListener('popstate', (e) => {
  if (!drawer.hidden) { closeDrawer(); }
  const name = e.state?.screen || 'welcome';
  if (name === 'profile') { startProfile({ push: false }); return; }
  if (name === 'agreement') { renderAgreement(load('openAgreement', null)); }
  if (name === 'notice') { renderNotice(); }
  show(name, { push: false });
});

document.querySelectorAll('[data-back]').forEach((btn) => {
  btn.addEventListener('click', () => history.back());
});

/* ---------- Welcome / demo sign-in ---------- */
// Fine Print holds personal contracts, so it always opens on sign-in.
// After (demo) sign-in, returning users go straight home; first-timers see the start choice.
document.querySelectorAll('[data-signin]').forEach((btn) => {
  btn.addEventListener('click', () => {
    save('signin', btn.dataset.signin); // demo only: nothing is sent anywhere
    if (load('onboarded', false)) {
      archiveSession(); // each sign-in starts a fresh chat; the last one is saved
      filter = null;
      show('home');
      welcomeBack();
    } else {
      show('start');
    }
  });
});

document.getElementById('reset-demo').addEventListener('click', () => {
  clearAll();
  location.reload();
});

/* ---------- Start choice ---------- */
document.querySelectorAll('[data-start]').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.dataset.start === 'profile') {
      startProfile();
    } else {
      goHome();
    }
  });
});

function goHome() {
  save('onboarded', true);
  filter = null;
  show('home');
  if (!chatLog.length) uploadPrompt();
}

// A question typed on the start or profile screen goes straight into the chat on home.
function askFromOutside(text) {
  save('onboarded', true);
  filter = null;
  show('home');
  handleUserMessage(text);
}

document.getElementById('start-composer').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('start-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  askFromOutside(text);
});

/* ---------- Profile ---------- */
// The questions depend on earlier answers: "Self" asks one age range;
// "Household" asks how many people, each person's age range, and how to organize.
const AGES_SELF = ['18–25', '25–35', '35–45', '45–65', '65+'];
const AGES_PERSON = ['1–20', '20–40', '40–60', '60+'];
const SIZES = ['2', '3', '4', '5', '6'];
// Where the user lives decides which laws apply, so the agent can name the jurisdiction.
const REGIONS = ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon', 'Outside Canada'];

function buildSteps(p) {
  const steps = [{ key: 'for', text: 'Are you looking to be supported with your contracts for yourself or your household?', options: ['Self', 'Household'] }];
  if (p.for === 'Household') {
    steps.push({ key: 'size', text: 'How many people are in your household?', options: SIZES });
    const n = Math.min(parseInt(p.size, 10) || 0, 10);
    for (let i = 1; i <= n; i++) {
      steps.push({ key: `person${i}`, text: `Person ${i}: what is their age range?`, options: AGES_PERSON });
    }
    if (n) steps.push({ key: 'setup', text: 'Would you like individual profiles set up, or keep all the contracts together for this household?', options: ['Individual profiles', 'Keep together'] });
  } else {
    steps.push({ key: 'age', text: 'What is your age range?', options: AGES_SELF });
  }
  if (p.for !== 'Household' || p.size) {
    steps.push({ key: 'region', text: 'Where do you live? Laws for agreements differ by province and territory.', options: REGIONS });
    steps.push({ key: 'goal', text: 'Would you like to learn about some contract topics, or review your own contracts?', options: ['Learn', 'Review'] });
  }
  return steps;
}

let qIndex = 0;
let profile = {};

function startProfile({ push = true } = {}) {
  qIndex = 0;
  profile = load('profile', {}) || {};
  show('profile', { push });
  renderQuestion();
}

function renderQuestion() {
  const steps = buildSteps(profile);
  const q = steps[qIndex];
  // Household totals aren't known until "how many" is answered, so show a running count.
  const total = steps.length + (profile.for === 'Household' && !profile.size ? 3 : 0);
  document.getElementById('profile-step-label').textContent = `Question ${qIndex + 1} of ${total}`;
  document.getElementById('profile-question').textContent = q.text;
  const dots = document.querySelector('.progress-dots');
  dots.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const d = document.createElement('span');
    if (i <= qIndex) d.className = 'on';
    dots.appendChild(d);
  }
  const grid = document.getElementById('profile-options');
  grid.innerHTML = '';
  q.options.forEach((opt) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'option-btn' + (profile[q.key] === opt ? ' selected' : '');
    b.textContent = opt;
    b.addEventListener('click', () => answer(q.key, opt));
    grid.appendChild(b);
  });
}

function answer(key, value) {
  const changedBranch = (key === 'for' || key === 'size') && profile[key] !== value;
  profile[key] = value;
  if (changedBranch) {
    // Clear answers that belonged to the other branch.
    Object.keys(profile).forEach((k) => {
      if (key === 'for' && !['for'].includes(k)) delete profile[k];
      if (key === 'size' && (/^person\d+$/.test(k) || k === 'setup' || k === 'goal')) delete profile[k];
    });
    profile[key] = value;
  }
  save('profile', profile);
  const steps = buildSteps(profile);
  if (qIndex < steps.length - 1) {
    qIndex += 1;
    renderQuestion();
  } else {
    finishProfile();
  }
}

function finishProfile() {
  save('onboarded', true);
  const firstTime = chatLog.length === 0;
  filter = null;
  show('home');
  if (!firstTime) {
    agentSay('Profile updated ✓');
  } else if (profile.goal === 'Learn') {
    agentSay("Learning about contract topics is coming soon 📚. In the meantime, would you like to review your own contracts?", [
      { label: 'Review my contracts', onClick: () => { profile.goal = 'Review'; save('profile', profile); uploadPrompt(); } },
    ]);
  } else {
    uploadPrompt();
  }
}

// Typed answers count the same as tapping; anything else is treated as a question.
function matchOption(text, options) {
  const t = text.trim().toLowerCase().replace(/\s+/g, ' ');
  const plain = (s) => s.toLowerCase().replace(/[–—]/g, '-');
  return options.find((o) => plain(o) === plain(t)) ||
    options.find((o) => plain(o).startsWith(plain(t)) && t.length >= 3) ||
    (/^\d+$/.test(t) && options.includes(SIZES[0]) && +t >= 2 && +t <= 10 ? t : null);
}

document.getElementById('profile-composer').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('profile-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  const q = buildSteps(profile)[qIndex];
  const match = matchOption(text, q.options);
  if (match) answer(q.key, match);
  else askFromOutside(text);
});

document.getElementById('profile-back').addEventListener('click', () => {
  if (qIndex > 0) { qIndex -= 1; renderQuestion(); } else { history.back(); }
});

function profileSummary(p) {
  if (!p || !p.for) return '';
  const where = p.region ? ` · ${p.region}` : '';
  if (p.for === 'Self') return (p.age ? `Profile · Self · ${p.age}` : 'Profile · Self') + where;
  const n = p.size ? `Household of ${p.size}` : 'Household';
  const how = p.setup === 'Individual profiles' ? ' · individual profiles' : p.setup ? ' · contracts together' : '';
  return `Profile · ${n}${how}${where}`;
}

/* ---------- Side menu (drawer) ---------- */
const drawer = document.getElementById('drawer');
const scrim = document.getElementById('drawer-scrim');
const drawerBtn = document.getElementById('drawer-btn');

function openDrawer() {
  renderDrawer();
  drawer.hidden = false;
  scrim.hidden = false;
  requestAnimationFrame(() => document.body.classList.add('drawer-open'));
  drawerBtn.setAttribute('aria-expanded', 'true');
}
function closeDrawer() {
  document.body.classList.remove('drawer-open');
  drawerBtn.setAttribute('aria-expanded', 'false');
  drawer.hidden = true;
  scrim.hidden = true;
}
drawerBtn.addEventListener('click', openDrawer);
scrim.addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

const catToggle = document.getElementById('drawer-agreements');
catToggle.addEventListener('click', () => {
  const open = catToggle.getAttribute('aria-expanded') !== 'true';
  catToggle.setAttribute('aria-expanded', String(open));
  document.getElementById('drawer-cats').hidden = !open;
});

function renderDrawer() {
  const agreements = load('agreements', []);
  document.getElementById('drawer-all-count').textContent = agreements.length;
  const list = document.getElementById('drawer-cats');
  list.innerHTML = '';
  const all = document.createElement('button');
  all.type = 'button';
  all.className = 'drawer-sub' + (filter === null ? ' current' : '');
  all.innerHTML = '<span>All</span>';
  all.addEventListener('click', () => { filter = null; show('home'); });
  list.appendChild(all);
  CATEGORIES.forEach((c) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'drawer-sub' + (filter === c.id ? ' current' : '');
    const count = agreements.filter((a) => a.category === c.id).length;
    const name = document.createElement('span'); name.textContent = c.label;
    const n = document.createElement('span'); n.className = 'drawer-count'; n.textContent = count;
    b.append(name, n);
    b.addEventListener('click', () => { filter = c.id; show('home'); });
    list.appendChild(b);
  });
  document.getElementById('drawer-profile-sub').textContent = profileSummary(load('profile', null)).replace('Profile · ', '') || 'Not set up yet';
}

document.getElementById('drawer-home').addEventListener('click', () => { filter = null; show('home'); });

const writeToggle = document.getElementById('drawer-write');
writeToggle.addEventListener('click', () => {
  const open = writeToggle.getAttribute('aria-expanded') !== 'true';
  writeToggle.setAttribute('aria-expanded', String(open));
  document.getElementById('drawer-write-list').hidden = !open;
});
document.querySelectorAll('[data-write]').forEach((b) => b.addEventListener('click', () => {
  const kind = b.dataset.write;
  filter = null;
  show('home');
  agentSay(kind === 'other'
    ? "Writing your own simple agreement is coming soon ✍️ You'll be able to tell me what type of agreement you'd like to write, and I'll draft it with you. Drafts will be for education and guidance only, to be reviewed with a lawyer."
    : `Writing a simple ${kind} agreement is coming soon ✍️ I'll ask you a few questions and draft it with you. Drafts will be for education and guidance only, to be reviewed with a lawyer.`);
}));

document.getElementById('btn-mic').addEventListener('click', () => {
  agentSay("The mic feature is coming soon 🎤 For now, the microphone on your phone's keyboard works for speaking your messages.");
});
document.getElementById('drawer-profile').addEventListener('click', () => startProfile());
document.getElementById('drawer-signout').addEventListener('click', () => {
  // Demo sign-out: back to sign-in. Your agreements stay saved on this phone.
  show('welcome');
});

/* ---------- Home ---------- */
function renderHome() {
  const agreements = load('agreements', []);
  const cat = CATEGORIES.find((c) => c.id === filter);
  const shown = cat ? agreements.filter((a) => a.category === cat.id) : agreements;
  document.getElementById('home-title').textContent = cat ? cat.label : 'Welcome to your agreements!';
  document.getElementById('empty-state').hidden = !(agreements.length === 0 && !cat);
  const catEmpty = document.getElementById('cat-empty');
  catEmpty.hidden = !(cat && shown.length === 0);
  if (cat) document.getElementById('cat-empty-text').textContent = `None yet in ${cat.label}. ${cat.hint} will show up here.`;
  renderList(shown);
  const chip = document.getElementById('profile-chip');
  const summary = profileSummary(load('profile', null));
  chip.textContent = summary;
  chip.hidden = !summary || !!cat;
  document.getElementById('chat').hidden = !!cat;
}

const CATEGORY_ICON = { housing: '🏠', medical: '🩺', financial: '💰', marriage: '💍', estate: '📜', work: '🧰', other: '🗂️' };

export function renderList(items) {
  const list = document.getElementById('agreement-list');
  list.innerHTML = '';
  items.forEach((a) => {
    const row = document.createElement('div');
    row.className = 'agreement-row' + (a.pendingAction ? ' has-action' : '');
    const icon = document.createElement('span');
    icon.className = 'row-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = CATEGORY_ICON[a.category] || '📄';
    const body = document.createElement('div');
    body.className = 'row-body';
    const name = document.createElement('p');
    name.className = 'row-name';
    name.textContent = a.fileName;
    const sub = document.createElement('p');
    sub.className = 'row-sub';
    sub.textContent = [a.typeLabel, a.party].filter(Boolean).join(' · ');
    body.append(name, sub);
    if (a.pendingAction) {
      const act = document.createElement('p');
      act.className = 'row-action';
      act.textContent = `⚑ Action pending: ${a.pendingAction}`;
      body.append(act);
    }
    const status = document.createElement('span');
    status.className = 'row-status';
    status.textContent = a.status;
    row.append(icon, body, status);
    row.setAttribute('role', 'button');
    row.tabIndex = 0;
    row.setAttribute('aria-label', `Open ${a.fileName}`);
    row.addEventListener('click', () => openAgreement(a.id));
    row.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAgreement(a.id); } });
    list.appendChild(row);
  });
}

/* ---------- Chat (agent messages shown in the app) ---------- */
const chatEl = document.getElementById('chat');
let chatLog = load('chat', []);

// Read aloud uses the phone's built-in voice (speechSynthesis). Hidden where unsupported.
const canSpeak = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
let speakingBtn = null;
function speak(text, btn) {
  if (!canSpeak) return;
  const wasThis = speakingBtn === btn;
  window.speechSynthesis.cancel();
  if (speakingBtn) speakingBtn.setAttribute('aria-pressed', 'false');
  speakingBtn = null;
  if (wasThis) return; // second tap stops
  const u = new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ''));
  u.lang = 'en-CA';
  u.onend = () => { btn.setAttribute('aria-pressed', 'false'); if (speakingBtn === btn) speakingBtn = null; };
  btn.setAttribute('aria-pressed', 'true');
  speakingBtn = btn;
  window.speechSynthesis.speak(u);
}

function bubble(role, text, { speakable = true } = {}) {
  const el = document.createElement('div');
  el.className = `bubble bubble-${role}`;
  const t = document.createElement('span');
  t.className = 'bubble-text';
  t.textContent = text;
  el.append(t);
  if (role === 'agent' && speakable && canSpeak) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'speak-btn';
    b.setAttribute('aria-label', 'Read aloud');
    b.setAttribute('aria-pressed', 'false');
    b.textContent = '🔊';
    b.addEventListener('click', () => speak(text, b));
    el.append(b);
  }
  chatEl.appendChild(el);
  scrollDown();
  return el;
}

function chipsRow(choices) {
  const row = document.createElement('div');
  row.className = 'chips';
  choices.forEach((c) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (c.soon ? ' chip-soon' : '');
    b.append(c.label);
    if (c.soon) {
      const t = document.createElement('span');
      t.className = 'tag tag-soon';
      t.textContent = 'Coming soon';
      b.append(t);
    }
    b.addEventListener('click', () => {
      if (!c.keep) row.querySelectorAll('button').forEach((x) => { x.disabled = true; });
      c.onClick && c.onClick();
    });
    row.appendChild(b);
  });
  chatEl.appendChild(row);
  scrollDown();
  return row;
}

function scrollDown() {
  const s = document.getElementById('home-scroll');
  requestAnimationFrame(() => { s.scrollTop = s.scrollHeight; });
}

// Each message remembers which agreement it was about, so past conversations
// can be shown on that agreement's page.
export function agentSay(text, choices, kind) {
  bubble('agent', text);
  chatLog.push({ role: 'agent', text, kind, about: current ? current.id : null });
  save('chat', chatLog);
  if (choices && choices.length) chipsRow(choices);
}

export function userSay(text) {
  bubble('user', text);
  chatLog.push({ role: 'user', text, about: current ? current.id : null });
  save('chat', chatLog);
}

// Save the last conversation and start a clean chat.
function archiveSession() {
  if (chatLog.length) {
    const sessions = load('sessions', []);
    sessions.push({ id: `s${Date.now()}`, date: todayISO(), messages: chatLog });
    save('sessions', sessions.slice(-30));
  }
  chatLog = [];
  save('chat', chatLog);
  chatEl.innerHTML = '';
  current = null;
  save('current', null);
  guidanceShown = false;
  circleUploadIcons(false);
}

// Draw a saved conversation back into the chat (bubbles and cards).
function renderLog(messages) {
  chatEl.innerHTML = '';
  messages.forEach((m) => {
    if (m.kind === 'contacts') { const c = buildContactsCard(m.contacts, m.source); if (c) chatEl.appendChild(c); return; }
    if (m.kind === 'dates') { const c = buildDatesCard(m.items); if (c) chatEl.appendChild(c); return; }
    if (m.kind === 'post') { const p = document.createElement('div'); p.className = 'card post-card'; const t = document.createElement('p'); t.className = 'post-text'; t.textContent = m.post; p.append(t); chatEl.appendChild(p); return; }
    if (m.kind === 'notice') { const a = getAgreement(m.about); if (a && a.notice) chatEl.appendChild(buildNoticeCard(a)); return; }
    if (!m.text) return;
    bubble(m.role, m.text);
    if (m.kind === 'upload-prompt') chipsRow([emailChip()]);
  });
  scrollDown();
}

// All conversations that mention an agreement: saved sessions plus the live chat, newest first.
function conversationsFor(id) {
  const out = load('sessions', []).map((s, i) => ({ sid: s.id || `idx${i}`, date: s.date, messages: s.messages, live: false }));
  out.push({ sid: 'live', date: todayISO(), messages: chatLog, live: true });
  return out
    .map((c) => ({ ...c, lines: c.messages.filter((m) => m.about === id && m.text && !m.kind) }))
    .filter((c) => c.lines.length)
    .reverse();
}

// Pick an earlier conversation back up in the chat.
function continueConversation(sid, agreementId) {
  if (sid !== 'live') {
    const sessions = load('sessions', []);
    const i = sessions.findIndex((s, idx) => (s.id || `idx${idx}`) === sid);
    if (i === -1) return;
    const [s] = sessions.splice(i, 1);
    save('sessions', sessions); // take it out of the saved list…
    archiveSession(); // …save whatever is in the chat now…
    chatLog = s.messages; // …and bring the earlier conversation back as the live chat
    save('chat', chatLog);
    renderLog(chatLog);
  }
  current = { id: agreementId, awaiting: null };
  save('current', current);
  filter = null;
  show('home');
  if (sid !== 'live') agentSay('Picking up where we left off 👋');
  scrollDown();
}

// Start a brand-new chat about one agreement (the current chat is saved first).
function startNewChat(id) {
  archiveSession();
  filter = null;
  show('home');
  reviewAgreement(id);
}

function welcomeBack() {
  const agreements = load('agreements', []);
  if (!agreements.length) { uploadPrompt(); return; }
  const pending = agreements.filter((a) => a.pendingAction);
  const n = agreements.length;
  let text = `Welcome back 👋 You have ${n} agreement${n === 1 ? '' : 's'} on file.`;
  if (pending.length) text += ` ⚑ ${pending.length} action${pending.length === 1 ? '' : 's'} pending.`;
  text += ' Tap one above to open it, or upload another with ＋ or 📷.';
  agentSay(text);
}

/* Contacts found in an agreement: save to phone contacts for real, email contacts coming soon. */
function contactsCard(contacts, source) {
  const card = buildContactsCard(contacts, source);
  if (!card) return;
  chatEl.appendChild(card);
  scrollDown();
  chatLog.push({ role: 'agent', kind: 'contacts', contacts, source, about: current ? current.id : null });
  save('chat', chatLog);
}

function buildContactsCard(contacts, source) {
  if (!contacts || !contacts.length) return null;
  const card = document.createElement('div');
  card.className = 'card card-contacts';
  const h = document.createElement('p');
  h.className = 'card-title';
  h.textContent = `📇 Contacts in this agreement`;
  card.append(h);
  contacts.forEach((c) => {
    const row = document.createElement('div');
    row.className = 'contact-row';
    const who = document.createElement('div');
    who.className = 'contact-who';
    const n = document.createElement('strong');
    n.textContent = contactLabel(c);
    const meta = document.createElement('span');
    meta.className = 'muted';
    meta.textContent = [c.name && c.organization ? c.organization : '', c.role, c.phone, c.email].filter(Boolean).join(' · ');
    who.append(n, meta);
    const actions = document.createElement('div');
    actions.className = 'contact-actions';
    const save = document.createElement('button');
    save.type = 'button';
    save.className = 'chip';
    save.textContent = 'Save to phone contacts';
    save.addEventListener('click', () => {
      saveVCard(c, source);
      save.textContent = 'Contact card ready ✓';
    });
    const email = document.createElement('button');
    email.type = 'button';
    email.className = 'chip chip-soon';
    email.append('Email contacts ');
    const t = document.createElement('span'); t.className = 'tag tag-soon'; t.textContent = 'Coming soon';
    email.append(t);
    email.addEventListener('click', () => agentSay('Saving to your email contacts (Gmail, Outlook) is coming soon ✉️. The phone contact card works today.'));
    actions.append(save, email);
    row.append(who, actions);
    card.append(row);
  });
  const note = document.createElement('p');
  note.className = 'card-note';
  note.textContent = `Each card notes it came from ${source}.`;
  card.append(note);
  return card;
}

function datesCard(items) {
  const card = buildDatesCard(items);
  if (!card) return;
  chatEl.appendChild(card);
  scrollDown();
  chatLog.push({ role: 'agent', kind: 'dates', items, about: current ? current.id : null });
  save('chat', chatLog);
}

function buildDatesCard(items) {
  if (!items || !items.length) return null;
  const card = document.createElement('div');
  card.className = 'card card-dates';
  const h = document.createElement('p');
  h.className = 'card-title';
  h.textContent = '🗓️ Dates and actions';
  card.append(h);
  const ul = document.createElement('ul');
  items.forEach((it) => {
    const li = document.createElement('li');
    const d = document.createElement('strong'); d.textContent = prettyDate(it.date);
    const a = document.createElement('span'); a.textContent = it.action;
    li.append(d, a);
    ul.append(li);
  });
  card.append(ul);
  return card;
}

function prettyDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return s || '';
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function circleUploadIcons(on) {
  ['btn-upload', 'btn-camera'].forEach((id) => document.getElementById(id).classList.toggle('circled', on));
}

function emailChip() {
  return { label: 'Connect email', soon: true, keep: true, onClick: () => agentSay('Connecting your email is coming soon ✉️. For now, tap ＋ to upload a file or 📷 to take photos.') };
}

function uploadPrompt() {
  agentSay('You can connect your email for us to sift through and pull out agreements in there, or manually upload any agreements for review.', [emailChip()], 'upload-prompt');
  circleUploadIcons(true);
}

/* ---------- Upload → the agent reads it ---------- */
const fileInput = document.getElementById('file-input');
const cameraInput = document.getElementById('camera-input');
document.getElementById('btn-upload').addEventListener('click', () => fileInput.click());
document.getElementById('empty-upload').addEventListener('click', () => fileInput.click());
document.getElementById('btn-camera').addEventListener('click', () => cameraInput.click());
[fileInput, cameraInput].forEach((input) => input.addEventListener('change', () => {
  const file = input.files && input.files[0];
  input.value = '';
  if (file) readAgreement(file);
}));

let current = load('current', null); // the agreement the conversation is about

function loaderBubble(text) {
  const el = bubble('agent', text, { speakable: false });
  el.classList.add('bubble-loading');
  return el;
}

async function readAgreement(file) {
  circleUploadIcons(false);
  if (filter) { filter = null; renderHome(); }
  userSay(`📎 ${file.name || 'Photo'}`);
  const prepared = await prepareFile(file);
  if (prepared.error) { agentSay(prepared.error); return; }
  // Same exact file as one already stored? Offer to review it instead of reading it again.
  const existing = prepared.hash && load('agreements', []).find((a) => a.hash === prepared.hash);
  if (existing) { alreadyStored(existing); return; }
  await sendForReading([prepared]);
}

function alreadyStored(existing) {
  agentSay(`This was previously uploaded and is already stored as ${existing.fileName}. Would you like to review this agreement?`, [
    { label: 'Yes, review it', onClick: () => reviewAgreement(existing.id) },
    { label: 'Not now', onClick: () => agentSay('No problem 👍 It\'s safe in your agreements.') },
  ]);
}

// Second check, after reading: same agreement date, other party and agreement number
// as one already stored. Catches photos and files uploaded before fingerprints existed.
function findSameAgreement(fileName, r) {
  const norm = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return load('agreements', []).find((a) => a.fileName === fileName &&
    norm(a.facts && a.facts.lease_identifiers) === norm(r.lease_identifiers)) || null;
}

function storeAgreement(agreement, r) {
  const agreements = load('agreements', []);
  agreements.push(agreement);
  save('agreements', agreements);
  current = { id: agreement.id, awaiting: r.action };
  save('current', current);
  renderHome();
  // the upload bubble belongs to this agreement's conversation too
  for (let i = chatLog.length - 1; i >= 0; i--) { if (chatLog[i].role === 'user') { chatLog[i].about = agreement.id; break; } }
}

async function sendForReading(files) {
  const loader = loaderBubble('Reading your agreement… 📄');
  // The fingerprint stays on the phone; only the file itself goes to the helper.
  const result = await askHelper({ mode: 'read', files: files.map(({ hash, ...f }) => f), today: todayISO(), profile: load('profile', null) });
  loader.remove();
  if (result.error) {
    agentSay(result.slow ? 'This is taking longer than usual. Try again?' : result.error, [
      { label: 'Try again', onClick: () => sendForReading(files) },
    ]);
    return;
  }
  handleReadReply(result.reply, files[0].name, files.length === 1 ? files[0].hash : null);
}

function slug(text, words = 2) {
  return String(text || '')
    .replace(/\b(ltd|inc|corp|corporation|limited|llc|co)\.?\b/gi, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean).slice(0, words).join('-');
}

function makeFileName(r) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(r.agreement_date || '') ? r.agreement_date : todayISO();
  const purpose = slug(r.file_purpose || r.type_label || 'agreement', 3) || 'agreement';
  return `${date}-${slug(r.party_name) || 'unknown'}-${purpose}.pdf`;
}

function statusFor(r) {
  if (!r.signed) return 'Unsigned';
  if (r.term_end && r.term_end < todayISO()) return 'Term ended';
  return 'Signed';
}

function handleReadReply(r, sourceName, hash = null) {
  if (r.readable === false) { agentSay(r.message); return; }
  if (r.is_agreement === false) { offerToStoreOther(r, sourceName, hash); return; }
  const fileName = makeFileName(r);
  const same = findSameAgreement(fileName, r);
  if (same) {
    if (hash && !same.hash) { // remember this file's fingerprint for next time
      save('agreements', load('agreements', []).map((a) => (a.id === same.id ? { ...a, hash } : a)));
    }
    alreadyStored(same);
    return;
  }
  const agreement = {
    id: `a${Date.now()}`,
    fileName,
    sourceName,
    type: r.type,
    typeLabel: r.type_label,
    category: r.category || 'housing',
    party: r.party_name,
    status: statusFor(r),
    pendingAction: null,
    facts: r,
    hash,
    addedAt: todayISO(),
  };
  if (r.action === 'store_or_review') {
    agentSay(r.message);
    datesCard(r.key_dates_and_actions);
    contactsCard(r.contacts, fileName);
    chipsRow([
      { label: 'Store', onClick: () => {
        if (findSameAgreement(fileName, r)) { agentSay(`${fileName} is already stored 🗂️`); return; }
        storeAgreement(agreement, r);
        agentSay(`Stored as ${fileName} 🗂️ You'll find it under ${(CATEGORIES.find((c) => c.id === agreement.category) || { label: 'All agreements' }).label}.`);
        if (r.is_new_home_purchase) celebrate(r);
      } },
      { label: 'Review', soon: true, keep: true, onClick: () => agentSay('A full review is coming soon 🔍. You can still tap Store.') },
    ]);
    return;
  }
  storeAgreement(agreement, r);
  agentSay(`Filed as ${fileName} 🗂️`);
  contactsCard(r.contacts, fileName);
  agentSay(r.message);
}
// Not an agreement: say what it looks like and offer to store it. No review, no rejection.
function offerToStoreOther(r, sourceName, hash) {
  const desc = (r.description || 'a document').trim();
  agentSay(r.message || `The document you've uploaded looks like ${desc}. Would you like to continue to store this document?`, [
    { label: 'Yes, store it', onClick: () => {
      userSay('Yes, store it');
      const ext = /\.(jpe?g|png|heic|webp)$/i.test(sourceName || '') ? 'jpg' : 'pdf';
      const doc = {
        id: `a${Date.now()}`,
        fileName: `${todayISO()}-${slug(desc, 4) || 'document'}.${ext}`,
        sourceName,
        type: 'document',
        typeLabel: desc.charAt(0).toUpperCase() + desc.slice(1),
        category: 'other', // not an agreement, so it's filed under Other
        party: null,
        status: 'Stored',
        pendingAction: null,
        facts: { summary: `Stored document: ${desc}.`, type: 'document' },
        hash,
        addedAt: todayISO(),
      };
      storeAgreement(doc, { action: 'none' });
      agentSay(`Stored as ${doc.fileName} 🗂️`);
    } },
    { label: 'No thanks', onClick: () => { userSay('No thanks'); agentSay("No problem, I won't keep it 👍"); } },
  ]);
}

// New-home celebration: offered only for a new purchase, with a post that never
// includes the address, amount or lender.
const SAFE_POST = "🏡🔑 We got the keys! After lots of paperwork (and a little happy-crying), I'm officially a homeowner. Stay tuned for housewarming party details 🥂✨ #NewHome #HomeSweetHome";

function safePost(r) {
  const post = String(r.celebration_post || '').trim();
  if (!post) return SAFE_POST;
  const lower = post.toLowerCase();
  const leaks = [r.rental_address, r.party_name, r.lease_identifiers, r.other_party_address]
    .filter(Boolean).some((v) => String(v).split(/[,\s]+/).filter((w) => w.length > 4 && /\d|[A-Z]/.test(w)).some((w) => lower.includes(w.toLowerCase())));
  return leaks || /\$\s?\d|\d{3,}/.test(post) ? SAFE_POST : post;
}

function celebrate(r) {
  const post = safePost(r);
  agentSay("Congratulations 🎉 Good news like this is worth sharing! I wrote a social media announcement for you, if you'd like to share it.");
  const card = document.createElement('div');
  card.className = 'card post-card';
  const t = document.createElement('p'); t.className = 'card-title'; t.textContent = '📣 Your announcement';
  const body = document.createElement('p'); body.className = 'post-text'; body.textContent = post;
  const actions = document.createElement('div'); actions.className = 'contact-actions';
  const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'chip'; copy.textContent = 'Copy';
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(post); copy.textContent = 'Copied ✓'; } catch {
      const range = document.createRange(); range.selectNodeContents(body);
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
      copy.textContent = 'Selected, tap Copy';
    }
  });
  actions.append(copy);
  if (navigator.share) {
    const share = document.createElement('button'); share.type = 'button'; share.className = 'chip'; share.textContent = 'Share';
    share.addEventListener('click', () => { navigator.share({ text: post }).catch(() => {}); });
    actions.append(share);
  }
  const note = document.createElement('p'); note.className = 'card-note'; note.textContent = 'No address, amounts or lender included.';
  card.append(t, body, actions, note);
  chatEl.appendChild(card);
  scrollDown();
  chatLog.push({ role: 'agent', kind: 'post', post, about: current ? current.id : null });
  save('chat', chatLog);
}

/* ---------- One agreement's page ---------- */
function getAgreement(id) { return load('agreements', []).find((a) => a.id === id) || null; }

function openAgreement(id) {
  save('openAgreement', id);
  renderAgreement(id);
  show('agreement');
}

// Go back to the chat and pick the conversation up about this agreement.
function reviewAgreement(id) {
  const a = getAgreement(id);
  if (!a) return;
  current = { id: a.id, awaiting: a.facts && a.facts.action };
  save('current', current);
  filter = null;
  if (document.getElementById('screen-home').hidden) show('home');
  agentSay(`Let's look at ${a.fileName} 📄`);
  if (a.facts && a.facts.action === 'ask_renewal' && a.facts.message) agentSay(a.facts.message.replace(/^\[Practice reply\]\s*/, ''));
  else agentSay('What would you like to know about it?');
}

function detailRow(label, value) {
  if (!value) return null;
  const row = document.createElement('div');
  row.className = 'detail-row';
  const l = document.createElement('dt'); l.textContent = label;
  const v = document.createElement('dd'); v.textContent = value;
  row.append(l, v);
  return row;
}

function renderAgreement(id) {
  const a = getAgreement(id);
  const box = document.getElementById('agreement-detail');
  box.innerHTML = '';
  if (!a) { box.textContent = 'This agreement is no longer here.'; return; }
  const f = a.facts || {};

  const head = document.createElement('div');
  head.className = 'detail-head';
  const icon = document.createElement('span'); icon.className = 'row-icon'; icon.textContent = CATEGORY_ICON[a.category] || '📄';
  const titles = document.createElement('div'); titles.className = 'row-body';
  const h = document.createElement('h1'); h.className = 'detail-title'; h.textContent = a.fileName;
  const sub = document.createElement('p'); sub.className = 'row-sub'; sub.textContent = [a.typeLabel, a.party].filter(Boolean).join(' · ');
  titles.append(h, sub);
  const st = document.createElement('span'); st.className = 'row-status'; st.textContent = a.status;
  head.append(icon, titles, st);
  box.append(head);

  if (a.pendingAction) {
    const act = document.createElement('p'); act.className = 'row-action'; act.textContent = `⚑ Action pending: ${a.pendingAction}`;
    box.append(act);
  }
  if (f.summary) { const p = document.createElement('p'); p.className = 'detail-summary'; p.textContent = f.summary; box.append(p); }

  const dl = document.createElement('dl');
  dl.className = 'card detail-facts';
  const term = f.term_start || f.term_end ? `${prettyDate(f.term_start) || '?'} → ${prettyDate(f.term_end) || '?'}${f.term_type ? ` (${f.term_type})` : ''}` : null;
  [
    detailRow('With', [f.party_name, f.party_role && `(${f.party_role})`].filter(Boolean).join(' ')),
    detailRow('For', f.user_name),
    detailRow('Term', term),
    detailRow('Rent', f.rent_amount),
    detailRow('Property', f.rental_address),
    detailRow(`${f.party_role || 'Other party'} address`, f.other_party_address || (f.type === 'residential_tenancy' ? 'Not listed in the agreement' : null)),
    detailRow('Agreement no.', f.lease_identifiers),
    detailRow('Signed', f.signed === true ? 'Yes' : f.signed === false ? 'No' : null),
    detailRow('Category', (CATEGORIES.find((c) => c.id === a.category) || {}).label),
    detailRow('Added', prettyDate(a.addedAt)),
  ].filter(Boolean).forEach((r) => dl.append(r));
  box.append(dl);

  if (a.notice) box.append(buildNoticeCard(a));
  const dates = buildDatesCard(f.key_dates_and_actions); if (dates) box.append(dates);
  const contacts = buildContactsCard(f.contacts, a.fileName); if (contacts) box.append(contacts);

  // Conversations about this agreement: one collapsible section each, newest open.
  const convos = conversationsFor(a.id);
  const wrap = document.createElement('div');
  wrap.className = 'detail-convos';
  const ct = document.createElement('p'); ct.className = 'card-title'; ct.textContent = `💬 Conversations (${convos.length})`;
  wrap.append(ct);
  if (!convos.length) {
    const none = document.createElement('p'); none.className = 'card-note'; none.textContent = 'No conversations yet.';
    wrap.append(none);
  }
  convos.forEach((c, i) => {
    const d = document.createElement('details');
    d.className = 'card convo';
    if (i === 0) d.open = true;
    const sum = document.createElement('summary');
    const label = document.createElement('span');
    label.textContent = `${prettyDate(c.date)} · ${c.lines.length} message${c.lines.length === 1 ? '' : 's'}`;
    sum.append(label);
    if (c.live) { const tag = document.createElement('span'); tag.className = 'tag tag-soon'; tag.textContent = 'Current chat'; sum.append(tag); }
    d.append(sum);
    const body = document.createElement('div'); body.className = 'convo-body';
    c.lines.forEach((m) => {
      const line = document.createElement('p');
      line.className = `convo-line convo-${m.role}`;
      const who = document.createElement('strong'); who.textContent = m.role === 'user' ? 'You' : 'Fine Print';
      line.append(who, ` ${m.text.replace(/^\[Practice reply\]\s*/, '')}`);
      body.append(line);
    });
    const cont = document.createElement('button');
    cont.type = 'button'; cont.className = 'btn btn-quiet'; cont.textContent = 'Continue this chat';
    cont.addEventListener('click', () => continueConversation(c.sid, a.id));
    body.append(cont);
    d.append(body);
    wrap.append(d);
  });
  box.append(wrap);

  const actions = document.createElement('div');
  actions.className = 'detail-actions';
  const ask = document.createElement('button');
  ask.type = 'button'; ask.className = 'btn btn-primary'; ask.textContent = 'Start new chat';
  ask.addEventListener('click', () => startNewChat(a.id));
  actions.append(ask);
  box.append(actions);

  // Delete sits at the top, out of the way of the conversations.
  const top = document.createElement('div');
  top.className = 'detail-top';
  const del = document.createElement('button');
  del.type = 'button'; del.className = 'btn btn-danger-quiet btn-small'; del.textContent = 'Delete agreement';
  const confirmBox = document.createElement('div');
  confirmBox.className = 'confirm-delete'; confirmBox.hidden = true;
  const msg = document.createElement('p'); msg.textContent = 'Delete this agreement and its notes from this phone? This can\'t be undone.';
  const yes = document.createElement('button'); yes.type = 'button'; yes.className = 'btn btn-danger'; yes.textContent = 'Delete';
  const no = document.createElement('button'); no.type = 'button'; no.className = 'btn btn-quiet'; no.textContent = 'Cancel';
  yes.addEventListener('click', () => deleteAgreement(a.id));
  no.addEventListener('click', () => { confirmBox.hidden = true; del.hidden = false; });
  del.addEventListener('click', () => { confirmBox.hidden = false; del.hidden = true; });
  const row = document.createElement('div'); row.className = 'confirm-buttons'; row.append(yes, no);
  confirmBox.append(msg, row);
  top.append(del, confirmBox);
  box.prepend(top);
}

function deleteAgreement(id) {
  const a = getAgreement(id);
  save('agreements', load('agreements', []).filter((x) => x.id !== id));
  if (current && current.id === id) { current = null; save('current', null); }
  save('openAgreement', null);
  filter = null;
  show('home');
  agentSay(`Deleted ${a ? a.fileName : 'that agreement'} 🗑️`);
}

document.getElementById('composer').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('composer-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  if (filter) { filter = null; renderHome(); }
  handleUserMessage(text);
});

/* ---------- Conversation with the agent ---------- */
let guidanceShown = false; // the subtle "not legal advice" caption shows once per session
let awaitingAddress = false;

// The app adds this caption (not the AI), the first time per session a reply explains a rule.
function guidanceCaption() {
  if (guidanceShown) return;
  guidanceShown = true;
  const c = document.createElement('p');
  c.className = 'caption-guidance';
  c.textContent = 'General guidance, not legal advice.';
  chatEl.appendChild(c);
  scrollDown();
}

function conversationAbout(id) {
  return chatLog.filter((m) => m.text && !m.kind && (id ? m.about === id : true)).slice(-10).map((m) => ({ role: m.role, text: m.text }));
}

async function handleUserMessage(text) {
  userSay(text);
  if (awaitingAddress && current) { awaitingAddress = false; makeDraft(text.trim()); return; }
  const a = current ? getAgreement(current.id) : null;
  const loader = loaderBubble('…');
  const result = await askHelper({
    mode: 'chat', message: text, facts: a ? a.facts : null,
    conversation: conversationAbout(a ? a.id : null).slice(0, -1),
    today: todayISO(), profile: load('profile', null),
  });
  loader.remove();
  if (result.error) {
    agentSay(result.error, [{ label: 'Try again', onClick: () => { chatLog.pop(); save('chat', chatLog); handleUserMessage(text); } }]);
    return;
  }
  const r = result.reply;
  let choices = null;
  if (r.action === 'offer_draft' && a) {
    choices = [
      { label: 'Yes, draft it', onClick: () => { userSay('Yes, draft it'); startDraft(); } },
      { label: 'No thanks', onClick: () => { userSay('No thanks'); agentSay("No problem. I'm here if you change your mind 👍"); } },
    ];
  } else if (r.choices && r.choices.length) {
    choices = r.choices.slice(0, 4).map((label) => ({ label, onClick: () => handleUserMessage(label) }));
  }
  agentSay(r.message, null);
  if (r.explains_rule) guidanceCaption();
  if (choices) chipsRow(choices);
}

function startDraft() {
  const a = current && getAgreement(current.id);
  if (!a) return;
  const where = String(a.facts.jurisdiction || 'Alberta');
  if (!/alberta/i.test(where)) {
    agentSay(`Right now I can only draft tenancy notices for Alberta. This agreement looks like it's under ${where} law, where the notice rules may differ. Your province's residential tenancy office can confirm what's needed.`);
    return;
  }
  if (!a.facts.other_party_address) {
    agentSay("The lease doesn't list an address for the landlord. Do you have this?", [
      { label: 'Yes', onClick: () => { userSay('Yes'); awaitingAddress = true; agentSay("Great, type the landlord's address and I'll add it ✍️"); document.getElementById('composer-input').focus(); } },
      { label: 'No', onClick: () => { userSay('No'); makeDraft(''); } },
    ]);
  } else {
    makeDraft(a.facts.other_party_address);
  }
}

function updateAgreement(id, changes) {
  save('agreements', load('agreements', []).map((x) => (x.id === id ? { ...x, ...changes } : x)));
}

function makeDraft(landlordAddress) {
  const a = current && getAgreement(current.id);
  if (!a) return;
  const notice = buildNotice(a.facts, { todayISO: todayISO(), landlordAddress });
  notice.deliverBy = deliverBy(todayISO(), a.facts.rent_day || 1);
  updateAgreement(a.id, { notice });
  const card = buildNoticeCard(getAgreement(a.id));
  chatEl.appendChild(card);
  scrollDown();
  chatLog.push({ role: 'agent', kind: 'notice', about: a.id });
  save('chat', chatLog);
  agentSay(`I've drafted the notice for you, please review 📝${landlordAddress ? '' : " I've left a blank line for the landlord's address so you can fill it in by hand."}`);
  agentSay('Would you like to edit the notice?', [
    { label: 'Yes, edit it', onClick: () => { userSay('Yes, edit it'); openNotice(a.id, { edit: true, thenReady: true }); } },
    { label: 'No, it looks good', onClick: () => { userSay('No, it looks good'); noticeReady(a.id); } },
  ]);
}

function buildNoticeCard(a) {
  const n = a.notice;
  const card = document.createElement('div');
  card.className = 'card notice-card';
  const t = document.createElement('p'); t.className = 'card-title'; t.textContent = '📝 Notice to end tenancy';
  const meta = document.createElement('p'); meta.className = 'notice-meta';
  meta.textContent = `From ${n.from} to ${n.to}. Tenancy ends ${longDate(n.endISO)}.`;
  const note = document.createElement('p'); note.className = 'card-note'; note.textContent = 'Drafted as a guide. Review it before you send it.';
  const actions = document.createElement('div'); actions.className = 'contact-actions';
  const open = document.createElement('button'); open.type = 'button'; open.className = 'chip'; open.textContent = 'Open notice';
  open.addEventListener('click', () => openNotice(a.id));
  const pdf = document.createElement('button'); pdf.type = 'button'; pdf.className = 'chip'; pdf.textContent = 'Get PDF';
  pdf.addEventListener('click', () => getPDF(a.id, pdf));
  actions.append(open, pdf);
  card.append(t, meta, actions, note);
  return card;
}

async function getPDF(id, btn) {
  const a = getAgreement(id);
  if (!a || !a.notice) return;
  try {
    await downloadNoticePDF(a.notice);
    if (btn) btn.textContent = 'PDF ready ✓';
  } catch {
    agentSay("I couldn't make the PDF just now. Try again in a moment?");
  }
}

function noticeReady(id) {
  const a = getAgreement(id);
  if (!a || !a.notice) return;
  updateAgreement(id, { pendingAction: 'deliver notice to landlord' });
  renderHome();
  const by = a.notice.deliverBy ? ` Make sure ${a.notice.to || 'your landlord'} gets it by ${longDate(a.notice.deliverBy)} so your tenancy ends ${longDate(a.notice.endISO)}.` : '';
  agentSay(`The notice is ready as a PDF to print and mail or drop off, or email if that's the agreed contact method 📬 Next step: deliver it to your landlord.${by}`, [
    { label: 'Get PDF', keep: true, onClick: () => getPDF(id) },
  ]);
}

/* ---------- Notice screen (view / edit) ---------- */
let noticeState = { id: null, edit: false, thenReady: false };

function openNotice(id, { edit = false, thenReady = false } = {}) {
  noticeState = { id, edit, thenReady };
  save('openNotice', id);
  renderNotice();
  show('notice');
}

function renderNotice() {
  const id = noticeState.id || load('openNotice', null);
  const a = getAgreement(id);
  const box = document.getElementById('notice-view');
  box.innerHTML = '';
  if (!a || !a.notice) { box.textContent = 'No notice yet.'; return; }
  const n = a.notice;
  const h = document.createElement('h2'); h.textContent = n.title; box.append(h);
  NOTICE_FIELDS.forEach((f) => {
    if (f.multiline) {
      const body = document.createElement('div'); body.className = 'notice-body';
      if (noticeState.edit) {
        const ta = document.createElement('textarea'); ta.id = `nf-${f.key}`; ta.value = n[f.key] || ''; ta.setAttribute('aria-label', f.label);
        body.append(ta);
      } else {
        (n[f.key] || '').split(/\n\s*\n/).forEach((para) => { const p = document.createElement('p'); p.textContent = para.trim(); body.append(p); });
      }
      box.append(body);
      return;
    }
    const row = document.createElement('div'); row.className = 'notice-field';
    const k = document.createElement('span'); k.className = 'k'; k.textContent = f.label;
    let v;
    if (noticeState.edit) {
      v = document.createElement('input'); v.id = `nf-${f.key}`; v.value = n[f.key] || ''; v.placeholder = f.blank || ''; v.setAttribute('aria-label', f.label);
    } else {
      v = document.createElement('span'); v.className = 'v' + (n[f.key] ? '' : ' blank');
      v.textContent = n[f.key] || `______________ (${f.blank || 'blank'})`;
    }
    row.append(k, v);
    box.append(row);
  });
  const sign = document.createElement('div'); sign.className = 'notice-sign';
  ['Tenant signature: ______________________', `Tenant name: ${n.from}`, 'Date signed: ______________'].forEach((t) => { const p = document.createElement('span'); p.textContent = t; sign.append(p); });
  box.append(sign);
  document.getElementById('notice-edit').hidden = noticeState.edit;
  document.getElementById('notice-save').hidden = !noticeState.edit;
}

document.getElementById('notice-edit').addEventListener('click', () => { noticeState.edit = true; renderNotice(); });
document.getElementById('notice-save').addEventListener('click', () => {
  const id = noticeState.id || load('openNotice', null);
  const a = getAgreement(id);
  if (!a) return;
  const n = { ...a.notice };
  NOTICE_FIELDS.forEach((f) => { const el = document.getElementById(`nf-${f.key}`); if (el) n[f.key] = el.value; });
  updateAgreement(id, { notice: n });
  const thenReady = noticeState.thenReady;
  noticeState = { id, edit: false, thenReady: false };
  renderNotice();
  if (thenReady) {
    show('home');
    agentSay('Saved your changes ✓');
    noticeReady(id);
  }
});
document.getElementById('notice-pdf').addEventListener('click', (e) => {
  const id = noticeState.id || load('openNotice', null);
  if (noticeState.edit) document.getElementById('notice-save').click();
  getPDF(id, e.currentTarget);
});

/* ---------- Practice mode banner ---------- */
fetch('/api/agent')
  .then((r) => r.json())
  .then((info) => {
    document.getElementById('practice-banner').hidden = !info.practice;
    document.body.classList.toggle('has-banner', !!info.practice);
  })
  .catch(() => {});

/* ---------- Boot ---------- */
applyTheme(load('theme', 'linen'));
// Always open on the sign-in screen, whatever page or link was used last.
history.replaceState({ screen: 'welcome' }, '', '#welcome');
show('welcome', { push: false });
