// app.js — the screen flow: welcome → start choice → profile → home.
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

/* ---------- Screens ---------- */
// Each screen change is added to the browser's history, so the phone's back
// gesture/button steps back through the screens instead of leaving the app.
function show(name, { push = true } = {}) {
  document.querySelectorAll('.screen').forEach((el) => { el.hidden = el.dataset.screen !== name; });
  save('screen', name);
  if (push && history.state?.screen !== name) history.pushState({ screen: name }, '', '#' + name);
  if (name === 'home') renderHome();
  closeMenu();
  window.scrollTo(0, 0);
}

window.addEventListener('popstate', (e) => {
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
      save('onboarded', true);
      show('home');
      if (!chatLog.length) uploadPrompt();
    }
  });
});

/* ---------- Profile ---------- */
const QUESTIONS = [
  { key: 'for', text: 'Are you looking to be supported with your contracts for yourself or your household?', options: ['Self', 'Household'] },
  { key: 'age', text: 'What is your age range?', options: ['18–25', '25–35', '35–45', '45–65', '65+'] },
  { key: 'goal', text: 'Would you like to learn about some contract topics, or review your own contracts?', options: ['Learn', 'Review'] },
];
let qIndex = 0;
let profile = load('profile', {});

function startProfile({ push = true } = {}) {
  qIndex = 0;
  profile = load('profile', {}) || {};
  show('profile', { push });
  renderQuestion();
}

function renderQuestion() {
  const q = QUESTIONS[qIndex];
  document.getElementById('profile-step-label').textContent = `Question ${qIndex + 1} of ${QUESTIONS.length}`;
  document.getElementById('profile-question').textContent = q.text;
  document.querySelectorAll('.progress-dots span').forEach((dot, i) => dot.classList.toggle('on', i <= qIndex));
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
  profile[key] = value;
  save('profile', profile);
  if (qIndex < QUESTIONS.length - 1) {
    qIndex += 1;
    renderQuestion();
  } else {
    save('onboarded', true);
    const firstTime = chatLog.length === 0;
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
}

document.getElementById('profile-back').addEventListener('click', () => {
  if (qIndex > 0) { qIndex -= 1; renderQuestion(); } else { history.back(); }
});

/* ---------- Home menu ---------- */
const menuBtn = document.getElementById('menu-btn');
const menuPanel = document.getElementById('menu-panel');
function closeMenu() { menuPanel.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); }
menuBtn.addEventListener('click', () => {
  const open = menuPanel.hidden;
  menuPanel.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
});
document.getElementById('menu-profile').addEventListener('click', () => startProfile());
document.getElementById('menu-signout').addEventListener('click', () => {
  save('onboarded', false); // demo sign-out: your agreements stay saved on this phone
  show('welcome');
});

/* ---------- Home ---------- */
function renderHome() {
  const agreements = load('agreements', []);
  document.getElementById('empty-state').hidden = agreements.length > 0;
  const chip = document.getElementById('profile-chip');
  const p = load('profile', null);
  if (p && p.for) {
    chip.textContent = `Profile · ${p.for} · ${p.age}`;
    chip.hidden = false;
  } else {
    chip.hidden = true;
  }
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
    b.innerHTML = '';
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
  userSay(text);
  agentSay('Upload an agreement first and I can help with it 📄.');
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
const startScreen = load('onboarded', false) ? 'home' : (load('screen', 'welcome') === 'start' ? 'start' : 'welcome');
history.replaceState({ screen: startScreen }, '', '#' + startScreen);
show(startScreen, { push: false });
if (startScreen === 'home') restoreChat();
