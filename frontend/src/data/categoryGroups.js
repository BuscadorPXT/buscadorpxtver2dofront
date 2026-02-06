export const CATEGORY_GROUPS = {
  APPLE: ['ACSS', 'IPD', 'IPH', 'MCB', 'MNTR', 'PODS', 'RLG'],
  ANDROID: ['MI', 'NOTE', 'PAD', 'POCO', 'RDM', 'REAL'],
};

export function groupCategories(flatCategories) {
  const groups = [];
  for (const [groupName, subcats] of Object.entries(CATEGORY_GROUPS)) {
    const matching = flatCategories.filter(c => subcats.includes(c.toUpperCase()));
    if (matching.length > 0) {
      groups.push({ title: groupName, options: matching });
    }
  }
  const allGrouped = Object.values(CATEGORY_GROUPS).flat();
  const ungrouped = flatCategories.filter(c => !allGrouped.includes(c.toUpperCase()));
  if (ungrouped.length > 0) {
    groups.push({ title: 'Outros', options: ungrouped });
  }
  return { groups };
}

export function getSubcategories(groupName) {
  return CATEGORY_GROUPS[groupName] || [];
}
