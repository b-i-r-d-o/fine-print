// app.js — the screen flow: welcome → start choice → profile → home, plus the side menu.
// The app decides which screen shows and which buttons appear.
// (Later slices add the AI conversation through agent.js.)

import { load, save, clearAll } from './storage.js';
import { askHelper, todayISO } from './agent.js';
import { prepareFile } from './upload.js';
import { saveVCard, contactLabel } from './contacts.js';

/* ---------- Themes ---------- */
const THEME_COLOURS = { linen: '#F3EDE4', midnight: '#0B0D12', heirloom: '#2A1823', popstar: '#FFF3FA' };

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
  { id: 'estate', label: 'Estate planning', hint: 'Wills, powers of attorney' },
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
  if (p.for === 'Self') return p.age ? `Profile · Self · ${p.age}` : 'Profile · Self';
  const n = p.size ? `Household of ${p.size}` : 'Household';
  const how = p.setup === 'Individual profiles' ? ' · individual profiles' : p.setup ? ' · contracts together' : '';
  return `Profile · ${n}${how}`;
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

const CATEGORY_ICON = { housing: '🏠', medical: '🩺', financial: '💼', marriage: '💍', estate: '📜' };

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

function bubble(role, text) {
  const el = document.createElement('div');
  el.className = `bubble bubble-${role}`;
  el.textContent = text;
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
    sessions.push({ date: todayISO(), messages: chatLog });
    save('sessions', sessions.slice(-30));
  }
  chatLog = [];
  save('chat', chatLog);
  chatEl.innerHTML = '';
  current = null;
  save('current', null);
  circleUploadIcons(false);
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
  const el = bubble('agent', text);
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
  if (existing) {
    agentSay(`This was previously uploaded and is already stored as ${existing.fileName}. Would you like to review this agreement?`, [
      { label: 'Yes, review it', onClick: () => reviewAgreement(existing.id) },
      { label: 'Not now', onClick: () => agentSay('No problem 👍 It\'s safe in your agreements.') },
    ]);
    return;
  }
  await sendForReading([prepared]);
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
  if (r.readable === false || r.is_agreement === false) {
    agentSay(r.message);
    return;
  }
  const fileName = makeFileName(r);
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
    // Store / Review choice is completed in a later build step (slice 5).
    agentSay(r.message);
    datesCard(r.key_dates_and_actions);
    contactsCard(r.contacts, fileName);
    chipsRow([
      { label: 'Store', onClick: () => agentSay('Storing arrives in an upcoming build step 🛠️.') },
      { label: 'Review', soon: true, onClick: () => agentSay('A full review is coming soon 🔍.') },
    ]);
    return;
  }
  const agreements = load('agreements', []);
  agreements.push(agreement);
  save('agreements', agreements);
  current = { id: agreement.id, awaiting: r.action };
  save('current', current);
  renderHome();
  // the upload bubble belongs to this agreement's conversation too
  for (let i = chatLog.length - 1; i >= 0; i--) { if (chatLog[i].role === 'user') { chatLog[i].about = agreement.id; break; } }
  agentSay(`Filed as ${fileName} 🗂️`);
  contactsCard(r.contacts, fileName);
  agentSay(r.message);
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

  const dates = buildDatesCard(f.key_dates_and_actions); if (dates) box.append(dates);
  const contacts = buildContactsCard(f.contacts, a.fileName); if (contacts) box.append(contacts);

  // Past conversation about this agreement (earlier sessions + this one).
  const past = [...load('sessions', []).flatMap((s) => s.messages), ...chatLog]
    .filter((m) => m.about === a.id && m.text && !m.kind);
  const conv = document.createElement('div');
  conv.className = 'card detail-convo';
  const ct = document.createElement('p'); ct.className = 'card-title'; ct.textContent = '💬 Conversation about this agreement';
  conv.append(ct);
  if (!past.length) {
    const none = document.createElement('p'); none.className = 'card-note'; none.textContent = 'No conversation yet.';
    conv.append(none);
  } else {
    past.forEach((m) => {
      const line = document.createElement('p');
      line.className = `convo-line convo-${m.role}`;
      const who = document.createElement('strong'); who.textContent = m.role === 'user' ? 'You' : 'Fine Print';
      line.append(who, ` ${m.text.replace(/^\[Practice reply\]\s*/, '')}`);
      conv.append(line);
    });
  }
  box.append(conv);

  const actions = document.createElement('div');
  actions.className = 'detail-actions';
  const ask = document.createElement('button');
  ask.type = 'button'; ask.className = 'btn btn-primary'; ask.textContent = 'Ask about this agreement';
  ask.addEventListener('click', () => reviewAgreement(a.id));
  const del = document.createElement('button');
  del.type = 'button'; del.className = 'btn btn-danger-quiet'; del.textContent = 'Delete agreement';
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
  actions.append(ask, del, confirmBox);
  box.append(actions);
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

// Free-typed replies and questions are connected to the AI in the next build step (slice 3).
function handleUserMessage(text) {
  userSay(text);
  if (current && current.awaiting === 'ask_renewal') {
    agentSay("Got it. Helping with your next steps arrives in the next build step 🛠️.");
  } else {
    agentSay("Great question! Answering contract questions arrives in an upcoming build step 🛠️. You can also upload an agreement with ＋ or 📷.");
  }
}

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
