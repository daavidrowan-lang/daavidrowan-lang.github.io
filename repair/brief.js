export function buildBriefText({ app = '', problem = '', url = '', deadline = '' } = {}) {
  return [
    `App: ${app.trim() || 'Not specified'}`,
    `Problem: ${problem.trim() || 'Not specified'}`,
    `Demo/repository: ${url.trim() || 'Not provided'}`,
    `Deadline: ${deadline.trim() || 'Not specified'}`
  ].join('\n');
}

export function buildBriefMailto(details) {
  const subject = details.app?.trim() ? `Web app fit check — ${details.app.trim()}` : 'Web app fit check';
  const body = `Hi David,\n\n${buildBriefText(details)}\n\nPlease let me know whether this looks like a fit and what you would need to inspect.`;
  return `mailto:daavidrowan@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
