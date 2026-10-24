const rtdbData = [
  {
    "id": "row-0",
    "rowTitle": "Commerce & Caisse Tactile (POS)",
    "title": "Commerce & Caisse Tactile (POS)",
    "cards": [
      {
        "id": "card-2",
        "title": "Caisse Tactile (POS Offline)",
        "isRootApp": true,
        "linkedModuleIds": ["mod_stock", "mod_compta", "mod_ia"],
        "blocks": [
          { "type": "header", "title": "Caisse Tactile (POS Offline)", "badge": "⭐ 98% satisfaction" },
          { "type": "description", "text": "Encaissement ultra-rapide hors-ligne" }
        ]
      },
      {
        "id": "mod_stock",
        "title": "Stock & Inventaire",
        "isRootApp": false,
        "blocks": [
          { "type": "header", "title": "Stock & Inventaire", "badge": "Gestion" },
          { "type": "description", "text": "Suivi des stocks" }
        ]
      },
      {
        "id": "mod_compta",
        "title": "Comptabilité & Dettes",
        "isRootApp": false,
        "blocks": [
          { "type": "header", "title": "Comptabilité & Dettes", "badge": "Finance" },
          { "type": "description", "text": "Livre de comptes" }
        ]
      },
      {
        "id": "mod_ia",
        "title": "IA Conseiller Ventes",
        "isRootApp": false,
        "blocks": [
          { "type": "header", "title": "IA Conseiller Ventes", "badge": "Assistant" },
          { "type": "description", "text": "Conseils IA" }
        ]
      }
    ]
  },
  {
    "id": "row-1",
    "rowTitle": "Services & Applications Principales (IA & WhatsApp)",
    "title": "Services & Applications Principales (IA & WhatsApp)",
    "cards": [
      {
        "id": "card-1",
        "title": "Nanagénérateur AI",
        "isRootApp": false,
        "blocks": [
          { "type": "header", "title": "Nanagénérateur AI", "badge": "Générateur" },
          { "type": "description", "text": "Création de contenu IA" }
        ]
      }
    ]
  }
];

// Let's test normalizeHubData
function cleanUrl(u) { return u || ''; }

function normalizeHubData(rawData) {
  if (!rawData) return [];
  let list = Array.isArray(rawData) ? rawData.filter(Boolean) : Object.values(rawData).filter(Boolean);
  if (list.length === 0) return [];
  const sanitizeCard = (c, cIdx) => ({
    ...c,
    id: c?.id || `card-${cIdx}`,
    mediaUrl: cleanUrl(c?.mediaUrl || c?.url),
    blocks: c?.blocks
  });

  const hasRows = list.some(item => item && (item.cards || item.rowTitle || (item.title && (Array.isArray(item.cards) || typeof item.cards === 'object'))));
  if (!hasRows) {
    return [{ id: 'default-row', rowTitle: 'Applications & Services', cards: list.map(sanitizeCard) }];
  }

  return list.map((row, idx) => {
    let rowCards = Array.isArray(row?.cards) ? row.cards.filter(Boolean) : (row?.cards && typeof row.cards === 'object' ? Object.values(row.cards).filter(Boolean) : []);
    return {
      ...row,
      id: row?.id || `row-${idx}`,
      rowTitle: row?.rowTitle || row?.title || 'Section',
      cards: rowCards.map(sanitizeCard)
    };
  });
}

function getCardDetails(card) {
  if (!card) return { id: 'x', title: 'Module' };
  const linkedModuleIds = card.linkedModuleIds || (card.blocks && Array.isArray(card.blocks) && card.blocks.find(b => b?.linkedModuleIds)?.linkedModuleIds) || [];
  const isRootApp = Boolean(card.isRootApp || (linkedModuleIds && linkedModuleIds.length > 0));
  if (card.blocks && Array.isArray(card.blocks)) {
    const h = card.blocks.find(b => b?.type === 'header');
    const d = card.blocks.find(b => b?.type === 'description');
    return {
      id: card.id,
      title: card.title || h?.title || 'Module',
      subtitle: card.subtitle || h?.badge || '',
      description: card.description || d?.text || '',
      isRootApp,
      linkedModuleIds
    };
  }
  return {
    id: card.id,
    title: card.title || 'Module',
    subtitle: card.subtitle || '',
    description: card.description || '',
    isRootApp,
    linkedModuleIds
  };
}

const configRows = normalizeHubData(rtdbData);
const allCardsRegistry = [];
configRows.forEach(row => {
  const rowLabel = row?.rowTitle || row?.title || 'Section';
  const rawCards = row.cards || [];
  rawCards.forEach(c => {
    const details = getCardDetails(c);
    allCardsRegistry.push({ ...details, rowTitle: rowLabel });
  });
});

console.log('Registered cards in registry:');
allCardsRegistry.forEach(c => console.log(' -', c.id, '|', c.title, '| isRootApp:', c.isRootApp, '| linked:', c.linkedModuleIds));

// Let's test queries!
const queries = ['', 'caisse', 'stock', 'nanagenerateur', 'toto'];

queries.forEach(qStr => {
  const normalize = (val) => (val || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const q = normalize(qStr);

  const findCustomCaisse = () => {
    return (
      allCardsRegistry.find(b => b.isRootApp && (normalize(b.title).includes('caisse') || normalize(b.id).includes('caisse') || normalize(b.id).includes('pos'))) ||
      allCardsRegistry.find(b => normalize(b.title).includes('caisse') || normalize(b.id).includes('card-2') || normalize(b.id).includes('pos')) ||
      allCardsRegistry.find(b => b.isRootApp)
    );
  };

  const getRowCompanionIds = (card) => {
    const companionIds = [];
    configRows.forEach((r) => {
      const cards = r.cards || [];
      const hasThisCard = card && cards.some(c => c.id === card.id || c.title === card.title);
      if (hasThisCard) {
        cards.forEach(c => {
          if (c.id !== card.id && c.id) companionIds.push(c.id);
        });
      }
    });
    return companionIds;
  };

  let matchedRootApp = null;
  if (!q) {
    const customCaisse = findCustomCaisse();
    if (customCaisse) {
      const companionIds = getRowCompanionIds(customCaisse);
      matchedRootApp = { ...customCaisse, isRootApp: true, linkedModuleIds: Array.from(new Set([...(customCaisse.linkedModuleIds || []), ...companionIds])) };
    }
  } else if (q.includes('caisse') || q.includes('pos')) {
    const customCaisse = findCustomCaisse();
    if (customCaisse) {
      const companionIds = getRowCompanionIds(customCaisse);
      matchedRootApp = { ...customCaisse, isRootApp: true, linkedModuleIds: Array.from(new Set([...(customCaisse.linkedModuleIds || []), ...companionIds])) };
    }
  } else {
    const explicitRoot = allCardsRegistry.find(b => b.isRootApp && (normalize(b.title).includes(q) || normalize(b.description).includes(q)));
    if (explicitRoot) {
      matchedRootApp = { ...explicitRoot, isRootApp: true, linkedModuleIds: Array.from(new Set([...(explicitRoot.linkedModuleIds || []), ...getRowCompanionIds(explicitRoot)])) };
    } else {
      const matchedFirst = allCardsRegistry.find(b => normalize(b.title).includes(q) || normalize(b.description).includes(q));
      if (matchedFirst) {
        matchedRootApp = { ...matchedFirst, isRootApp: true, linkedModuleIds: Array.from(new Set([...(matchedFirst.linkedModuleIds || []), ...getRowCompanionIds(matchedFirst)])) };
      } else {
        matchedRootApp = findCustomCaisse();
      }
    }
  }

  // Linked modules
  const moduleIds = matchedRootApp?.linkedModuleIds || [];
  const linkedModules = moduleIds.map(modId => {
    const fromReg = allCardsRegistry.find(b => b.id === modId);
    return fromReg || { id: modId, title: modId };
  });

  console.log(`\n=== QUERY: "${qStr}" ===`);
  console.log('BLOC 1 (Root App):', matchedRootApp?.title, `(id: ${matchedRootApp?.id})`);
  console.log('BLOC 2 (Linked Modules count: ' + linkedModules.length + '):', linkedModules.map(m => m.title).join(', '));
});
