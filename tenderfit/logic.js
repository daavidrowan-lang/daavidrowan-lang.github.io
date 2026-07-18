export function filterOpportunities(items, { filter = 'all', query = '' } = {}) {
  const normalizedQuery = query.trim().toLocaleLowerCase('hu-HU');

  return items.filter(item => {
    if (filter === 'high' && item.score < 65) return false;
    if (filter === 'deadline' && (item.daysLeft === null || item.daysLeft < 0 || item.daysLeft > 14)) return false;
    if (!normalizedQuery) return true;

    return [item.title, item.buyer, item.description, item.id]
      .filter(Boolean)
      .some(value => String(value).toLocaleLowerCase('hu-HU').includes(normalizedQuery));
  });
}

export function sortOpportunities(items, mode = 'score') {
  return [...items].sort((left, right) => {
    if (mode === 'deadline') {
      const leftDays = left.daysLeft ?? Number.POSITIVE_INFINITY;
      const rightDays = right.daysLeft ?? Number.POSITIVE_INFINITY;
      return leftDays - rightDays || right.score - left.score;
    }

    if (mode === 'value') {
      return (right.estimatedValue ?? -1) - (left.estimatedValue ?? -1) || right.score - left.score;
    }

    return right.score - left.score || (left.daysLeft ?? Number.POSITIVE_INFINITY) - (right.daysLeft ?? Number.POSITIVE_INFINITY);
  });
}

export function deadlineStatus(daysLeft) {
  if (daysLeft === null || daysLeft === undefined) return { label: 'Határidő nincs megadva', tone: 'neutral' };
  if (daysLeft < 0) return { label: 'Lejárt', tone: 'expired' };
  if (daysLeft === 0) return { label: 'Ma zárul', tone: 'urgent' };
  if (daysLeft <= 3) return { label: `${daysLeft} nap maradt`, tone: 'urgent' };
  if (daysLeft <= 14) return { label: `${daysLeft} nap maradt`, tone: 'soon' };
  return { label: `${daysLeft} nap maradt`, tone: 'neutral' };
}

export function dataFreshness(generatedAt, now = Date.now()) {
  const timestamp = new Date(generatedAt).getTime();
  if (!Number.isFinite(timestamp)) return { label: 'Az adatfrissítés ideje nem ellenőrizhető.', tone: 'warning' };
  const ageHours = Math.max(0, (now - timestamp) / 3_600_000);
  if (ageHours > 48) return { label: 'A lista több mint 48 órás. A hivatalos hirdetményt ellenőrizd különösen figyelmesen.', tone: 'warning' };
  return { label: 'A lista 48 órán belül frissült.', tone: 'current' };
}
