import { buildBriefMailto, buildBriefText } from './brief.js';

const form = document.querySelector('#brief-form');
const copyButton = document.querySelector('#copy-brief');
const status = document.querySelector('#brief-status');

function detailsFromForm() {
  const data = new FormData(form);
  return Object.fromEntries(['app', 'problem', 'url', 'deadline'].map(key => [key, String(data.get(key) ?? '')]));
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

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  status.textContent = 'Opening your email app with the brief prepared.';
  window.location.href = buildBriefMailto(detailsFromForm());
});

copyButton.addEventListener('click', async () => {
  const details = detailsFromForm();
  if (!details.problem.trim()) {
    status.textContent = 'Describe what is broken before copying the brief.';
    form.elements.problem.focus();
    return;
  }
  try {
    await copyText(buildBriefText(details));
    status.textContent = 'Project brief copied.';
  } catch {
    status.textContent = 'Copy is unavailable in this browser. Use Prepare email instead.';
  }
});
