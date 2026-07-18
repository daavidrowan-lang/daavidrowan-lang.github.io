import { dataFreshness, deadlineStatus, filterOpportunities, sortOpportunities } from './logic.js';

const list = document.querySelector('#opportunity-list');
const dialog = document.querySelector('#detail-dialog');
const dialogContent = document.querySelector('#dialog-content');
const searchInput = document.querySelector('#opportunity-search');
const sortSelect = document.querySelector('#opportunity-sort');
const resultsSummary = document.querySelector('#results-summary');
const resetButton = document.querySelector('#reset-filters');
const freshnessStatus = document.querySelector('#freshness-status');
let opportunities = [];
let activeFilter = 'all';

const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
const date = value => value ? new Intl.DateTimeFormat('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value)) : 'nincs megadva';
const money = (value, currency) => value ? new Intl.NumberFormat('hu-HU', { notation: 'compact', maximumFractionDigits: 1, style: currency ? 'currency' : 'decimal', currency: currency || undefined }).format(value) : null;

function currentResults() {
  const filtered = filterOpportunities(opportunities, { filter: activeFilter, query: searchInput.value });
  return sortOpportunities(filtered, sortSelect.value);
}

function render() {
  const matching = currentResults();
  const visible = matching.slice(0, 12);
  resultsSummary.textContent = matching.length > 12
    ? `${matching.length} találatból az első 12 látható.`
    : `${matching.length} találat látható.`;
  resetButton.hidden = activeFilter === 'all' && !searchInput.value.trim() && sortSelect.value === 'score';

  if (!visible.length) {
    list.innerHTML = '<div class="empty">Nincs találat ezekkel a feltételekkel. <button type="button" data-reset>Szűrők törlése</button></div>';
    return;
  }

  list.innerHTML = visible.map(item => {
    const deadline = deadlineStatus(item.daysLeft);
    return `
      <article class="opportunity">
        <div class="score ${item.score >= 65 ? 'high' : ''}" aria-label="${item.score} pont">${item.score}</div>
        <div>
          <div class="decision">${escapeHtml(item.decision)}</div>
          <h3>${escapeHtml(item.title)}</h3>
          <div class="meta">
            <span>${escapeHtml(item.buyer || 'Ismeretlen ajánlatkérő')}</span>
            <span>Határidő: ${date(item.deadline)}</span>
            <span class="deadline-badge ${deadline.tone}">${escapeHtml(deadline.label)}</span>
            ${item.estimatedValue ? `<span>${escapeHtml(money(item.estimatedValue, item.currency))}</span>` : ''}
          </div>
        </div>
        <button class="open-detail" data-id="${escapeHtml(item.id)}">Miért?</button>
      </article>`;
  }).join('');
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('Copy unavailable');
}

function showDetail(id) {
  const item = opportunities.find(candidate => candidate.id === id);
  if (!item) return;
  const deadline = deadlineStatus(item.daysLeft);
  dialogContent.innerHTML = `
    <span class="dialog-score">${item.score}/100 · ${escapeHtml(item.decision)}</span>
    <h2>${escapeHtml(item.title)}</h2>
    <p><strong>Ajánlatkérő:</strong> ${escapeHtml(item.buyer || 'Nincs megadva')}<br><strong>Határidő:</strong> ${date(item.deadline)} · ${escapeHtml(deadline.label)}<br><strong>TED azonosító:</strong> ${escapeHtml(item.id)}</p>
    <h3>A pontszám okai</h3><ul class="reason-list">${item.reasons.map(reason => `<li>${escapeHtml(reason)}</li>`).join('')}</ul>
    <div class="dialog-actions">
      <a class="source-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noreferrer">Hivatalos hirdetmény megnyitása ↗</a>
      <button type="button" class="copy-source" data-copy-source="${escapeHtml(item.sourceUrl)}">Forráslink másolása</button>
      <span id="copy-status" role="status"></span>
    </div>
    <p class="disclaimer">A TenderFit előszűr. A részvételi feltételeket és dokumentumokat mindig a hivatalos hirdetmény alapján kell ellenőrizni.</p>`;
  dialog.showModal();
}

function resetFilters() {
  activeFilter = 'all';
  searchInput.value = '';
  sortSelect.value = 'score';
  document.querySelector('.filter.active')?.classList.remove('active');
  document.querySelector('.filter[data-filter="all"]')?.classList.add('active');
  document.querySelectorAll('.filter').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === 'all')));
  render();
  searchInput.focus();
}

list.addEventListener('click', event => {
  const detailButton = event.target.closest('[data-id]');
  if (detailButton) showDetail(detailButton.dataset.id);
  if (event.target.closest('[data-reset]')) resetFilters();
});
dialogContent.addEventListener('click', async event => {
  const copyButton = event.target.closest('[data-copy-source]');
  if (!copyButton) return;
  const status = document.querySelector('#copy-status');
  try {
    await copyText(copyButton.dataset.copySource);
    status.textContent = 'Link másolva.';
  } catch {
    status.textContent = 'A másolás ebben a böngészőben nem érhető el.';
  }
});
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
searchInput.addEventListener('input', render);
sortSelect.addEventListener('change', render);
resetButton.addEventListener('click', resetFilters);
document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
  document.querySelector('.filter.active')?.classList.remove('active');
  button.classList.add('active');
  activeFilter = button.dataset.filter;
  document.querySelectorAll('.filter').forEach(candidate => candidate.setAttribute('aria-pressed', String(candidate === button)));
  render();
}));

async function load() {
  try {
    const response = await fetch('./opportunities.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    opportunities = payload.opportunities;
    document.querySelector('#source-count').textContent = payload.metadata.fetched;
    document.querySelector('#match-count').textContent = opportunities.length;
    document.querySelector('#updated-at').textContent = `Frissítve: ${date(payload.metadata.generatedAt)} · TED API`;
    const freshness = dataFreshness(payload.metadata.generatedAt);
    freshnessStatus.textContent = freshness.label;
    freshnessStatus.dataset.tone = freshness.tone;
    render();
  } catch {
    list.innerHTML = '<div class="empty">A lista most nem érhető el. Kérjük, próbáld újra később.</div>';
    resultsSummary.textContent = 'Az adatok nem tölthetők be.';
    freshnessStatus.textContent = 'Az adatfrissítés nem ellenőrizhető.';
    freshnessStatus.dataset.tone = 'warning';
  }
}

load();
