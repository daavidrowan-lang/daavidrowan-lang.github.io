const list = document.querySelector('#opportunity-list');
const dialog = document.querySelector('#detail-dialog');
const dialogContent = document.querySelector('#dialog-content');
let opportunities = [];
let activeFilter = 'all';

const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
const date = value => value ? new Intl.DateTimeFormat('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value)) : 'nincs megadva';
const money = (value, currency) => value ? new Intl.NumberFormat('hu-HU', { notation: 'compact', maximumFractionDigits: 1, style: currency ? 'currency' : 'decimal', currency: currency || undefined }).format(value) : null;

function matchesFilter(item) {
  if (activeFilter === 'high') return item.score >= 65;
  if (activeFilter === 'deadline') return item.daysLeft !== null && item.daysLeft <= 14;
  return true;
}

function render() {
  const visible = opportunities.filter(matchesFilter).slice(0, 12);
  if (!visible.length) {
    list.innerHTML = '<div class="empty">Ebben a szűrésben most nincs aktív találat.</div>';
    return;
  }
  list.innerHTML = visible.map(item => `
    <article class="opportunity">
      <div class="score ${item.score >= 65 ? 'high' : ''}" aria-label="${item.score} pont">${item.score}</div>
      <div>
        <div class="decision">${escapeHtml(item.decision)}</div>
        <h3>${escapeHtml(item.title)}</h3>
        <div class="meta"><span>${escapeHtml(item.buyer || 'Ismeretlen ajánlatkérő')}</span><span>Határidő: ${date(item.deadline)}</span>${item.estimatedValue ? `<span>${escapeHtml(money(item.estimatedValue, item.currency))}</span>` : ''}</div>
      </div>
      <button class="open-detail" data-id="${escapeHtml(item.id)}">Miért?</button>
    </article>`).join('');
}

function showDetail(id) {
  const item = opportunities.find(candidate => candidate.id === id);
  if (!item) return;
  dialogContent.innerHTML = `
    <span class="dialog-score">${item.score}/100 · ${escapeHtml(item.decision)}</span>
    <h2>${escapeHtml(item.title)}</h2>
    <p><strong>Ajánlatkérő:</strong> ${escapeHtml(item.buyer || 'Nincs megadva')}<br><strong>Határidő:</strong> ${date(item.deadline)}<br><strong>TED azonosító:</strong> ${escapeHtml(item.id)}</p>
    <h3>A pontszám okai</h3><ul class="reason-list">${item.reasons.map(reason => `<li>${escapeHtml(reason)}</li>`).join('')}</ul>
    <p><a class="source-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noreferrer">Hivatalos hirdetmény megnyitása ↗</a></p>
    <p class="disclaimer">A TenderFit előszűr. A részvételi feltételeket és dokumentumokat mindig a hivatalos hirdetmény alapján kell ellenőrizni.</p>`;
  dialog.showModal();
}

list.addEventListener('click', event => {
  const button = event.target.closest('[data-id]');
  if (button) showDetail(button.dataset.id);
});
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
  document.querySelector('.filter.active')?.classList.remove('active');
  button.classList.add('active');
  activeFilter = button.dataset.filter;
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
    render();
  } catch {
    list.innerHTML = '<div class="empty">A lista most nem érhető el. Kérjük, próbáld újra később.</div>';
  }
}

load();
