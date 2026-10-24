import {
  handlePosSyncSale,
  setPinnedProductInLiveRoom,
  setPosSyncSocketEmitter,
  getActiveLiveRooms,
  POS_SYNC_M2M_TOKEN
} from './posSyncController';

async function runPosSyncTests() {
  console.log('=== TEST 1: Configuration de l’émetteur WebSocket & Salle Live Active ===');
  const emittedEvents: { room: string; event: string; data: any }[] = [];

  const mockIo = {
    to: (room: string) => ({
      emit: (event: string, data: any) => {
        emittedEvents.push({ room, event, data });
      }
    }),
    emit: (event: string, data: any) => {
      emittedEvents.push({ room: '*', event, data });
    }
  };

  setPosSyncSocketEmitter(mockIo);

  // Configuration d'une salle Live active avec stock initial de 3 unités
  setPinnedProductInLiveRoom(
    'live_room_test_sync',
    'prod_flash_live_1',
    'Coffret Karité Royal Or Prestige',
    3
  );

  const rooms = getActiveLiveRooms();
  console.log('Salles Live actives enregistrées :', rooms.map(r => ({ id: r.liveRoomId, pinned: r.pinnedProductId, stock: r.currentStock })));
  console.log('PASS: Salle Live initialisée avec produit épinglé.');

  console.log('\n=== TEST 2: Vente Physique en Magasin (1 unité vendue à Ouagadougou) ===');
  const result1 = await handlePosSyncSale({
    storeLocation: 'Boutique Ouagadougou',
    items: [
      {
        productId: 'prod_flash_live_1',
        quantitySold: 1,
        productName: 'Coffret Karité Royal Or Prestige'
      }
    ],
    receiptId: 'TICKET_OUAGA_1001',
    cashierId: 'cashier_awa'
  });

  console.log('Résultat Synchronisation 1 :', result1);

  if (result1.activeMatches.length === 0) {
    throw new Error('ÉCHEC : Aucune salle live détectée pour le produit vendu !');
  }

  const match1 = result1.activeMatches.find(m => m.liveRoomId === 'live_room_test_sync');
  if (!match1) throw new Error('ÉCHEC : live_room_test_sync non trouvée');
  if (match1.newStock !== 2) throw new Error(`Stock attendu: 2, reçu: ${match1.newStock}`);

  // Vérification de l'événement WebSocket 'physical_store_sale'
  const saleEvent = emittedEvents.find(e => e.event === 'physical_store_sale' && e.room === 'live_room_test_sync');
  if (!saleEvent) throw new Error('Événement WebSocket physical_store_sale non émis !');
  console.log('Événement WebSocket émis :', saleEvent);

  if (saleEvent.data.location !== 'Boutique Ouagadougou') throw new Error('Mauvaise location dans le signal WebSocket');
  if (saleEvent.data.newStock !== 2) throw new Error('Mauvais newStock dans le signal WebSocket');

  console.log('PASS: physical_store_sale émis instantanément avec newStock=2 et location="Boutique Ouagadougou"');

  console.log('\n=== TEST 3: Sécurité de Rupture (Stock restant épuisé -> newStock === 0) ===');
  // Vente physique des 2 dernières unités restantes en caisse
  const result2 = await handlePosSyncSale({
    storeLocation: 'Boutique Ouagadougou',
    items: [
      {
        productId: 'prod_flash_live_1',
        quantitySold: 2
      }
    ],
    receiptId: 'TICKET_OUAGA_1002'
  });

  console.log('Résultat Synchronisation 2 (Rupture) :', result2);
  const match2 = result2.activeMatches.find(m => m.liveRoomId === 'live_room_test_sync');
  if (!match2) throw new Error('ÉCHEC : match2 non trouvé');
  if (match2.newStock !== 0) throw new Error(`Stock attendu: 0, reçu: ${match2.newStock}`);
  if (!match2.isOutOfStock) throw new Error('isOutOfStock doit être true');

  // Vérification de l'événement WebSocket 'lock_product_sales'
  const lockEvent = emittedEvents.find(e => e.event === 'lock_product_sales' && e.room === 'live_room_test_sync');
  if (!lockEvent) throw new Error('Événement WebSocket lock_product_sales non émis en cas de rupture !');
  console.log('Événement Sécurité Rupture émis :', lockEvent);

  if (lockEvent.data.reason !== 'physical_store_stock_exhausted') {
    throw new Error('Raison de blocage invalide');
  }

  console.log('PASS: lock_product_sales émis avec succès pour bloquer les boutons d’achat en direct.');

  console.log('\n=== TEST 4: Vente d’un produit non présenté en direct ===');
  const result3 = await handlePosSyncSale({
    storeLocation: 'Boutique Abidjan Mall',
    items: [
      {
        productId: 'prod_unrelated_sku_99',
        quantitySold: 5
      }
    ]
  });

  console.log('Résultat Produit Hors Live :', result3);
  if (result3.activeMatches.length !== 0) throw new Error('Aucun match ne devrait être trouvé');
  if (!result3.unmatchedItems.includes('prod_unrelated_sku_99')) throw new Error('Doit être dans unmatchedItems');

  console.log('PASS: Produit hors Live traité sans polluer les salles de direct.');

  console.log('\n>>> TOUS LES TESTS DE SYNCHRONISATION PHYGITALE ONT RÉUSSI À 100% <<<');
}

runPosSyncTests().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
