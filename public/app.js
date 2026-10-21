// app.js — the screen flow: welcome → start choice → profile → home, plus the side menu.
// The app decides which screen shows and which buttons appear.
// (Later slices add the AI conversation through agent.js.)

import { load, save, clearAll } from './storage.js';

/* ---------- Themes ---------- */
const THEME_COLOURS = { linen: '#F3EDE4', midnight: '#0B0D12', heirloom: '#2A1823' };

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
  show(name, { push: false });
});

document.querySelectorAll('[data-back]').forEach((btn) => {
  btn.addEventListener('click', () => history.back());
});

/* ---------- Welcome / demo sign-in ---------- */
document.querySelectorAll('[data-signin]').forEach((btn) => {
  btn.addEventListener('click', () => {
    save('signin', btn.dataset.signin); // demo only: nothing is sent anywhere
    show('start');
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
  save('onboarded', false); // demo sign-out: your agreements stay saved on this phone
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

// Agreement rows are filled in from slice 2 onward.
export function renderList(items) {
  const list = document.getElementById('agreement-list');
  list.innerHTML = '';
  items.forEach((a) => {
    const row = document.createElement('div');
    row.className = 'agreement-row' + (a.pendingAction ? ' has-action' : '');
    row.textContent = a.fileName;
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

export function agentSay(text, choices, kind) {
  bubble('agent', text);
  chatLog.push({ role: 'agent', text, kind });
  save('chat', chatLog);
  if (choices && choices.length) chipsRow(choices);
}

export function userSay(text) {
  bubble('user', text);
  chatLog.push({ role: 'user', text });
  save('chat', chatLog);
}

function restoreChat() {
  chatLog.forEach((m) => {
    bubble(m.role, m.text);
    if (m.kind === 'upload-prompt') chipsRow([emailChip()]);
  });
  if (!chatLog.length) uploadPrompt();
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

function comingSoonUpload() {
  circleUploadIcons(false);
  agentSay('Reading agreements arrives in the next build step 🛠️.');
}

document.getElementById('btn-upload').addEventListener('click', comingSoonUpload);
document.getElementById('btn-camera').addEventListener('click', comingSoonUpload);
document.getElementById('empty-upload').addEventListener('click', comingSoonUpload);
document.getElementById('composer').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('composer-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  if (filter) { filter = null; renderHome(); }
  handleUserMessage(text);
});

// Slice 1 placeholder: the AI conversation is connected in a later build step.
function handleUserMessage(text) {
  userSay(text);
  agentSay("Great question! Answering contract questions arrives in an upcoming build step 🛠️. You can also upload an agreement with ＋ or 📷.");
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
const startScreen = load('onboarded', false) ? 'home' : (load('screen', 'welcome') === 'start' ? 'start' : 'welcome');
history.replaceState({ screen: startScreen }, '', '#' + startScreen);
show(startScreen, { push: false });
if (startScreen === 'home') restoreChat();
