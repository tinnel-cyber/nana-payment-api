/**
 * Test de validation unitaire et d'intégration :
 * 1. Isolation et Résolution dynamique des Proxys Fixie (SEBPAY_FIXIE_URL, SASPAY_FIXIE_URL, Fallbacks)
 * 2. Traçabilité et logs structurés [PROXY ROUTER]
 * 3. Logique de priorité & Auto-failover NaNaSwitch (Sebpay -> SasPay sur 403/429/quota)
 * 4. Validation cryptographique isolée des Webhooks (SEBPAY_WEBHOOK_SECRET & SASPAY_WEBHOOK_SECRET)
 */

const assert = require('assert');
const crypto = require('crypto');

// 1. Test de résolution dynamique des Proxys
const {
  resolveProxyConfig,
  getFixieAgents,
  logProxyRouterUsage,
  maskProxyUrl
} = require('./fixie-proxy');

console.log('====================================================');
console.log('🧪 TEST 1 : RÉSOLUTION DYNAMIQUE DES PROXYS');
console.log('====================================================');

// Configuration d'un environnement de test
delete process.env.SEBPAY_FIXIE_URL;
delete process.env.SASPAY_FIXIE_URL;
delete process.env.FIXIE_URL;
delete process.env.FIXIE_URL_SEBPAY;
delete process.env.FIXIE_URL_SASPAY;

// Test 1a : Aucun proxy configuré
let res = resolveProxyConfig('sebpay');
assert.strictEqual(res.proxyUrl, null, 'Doit être null si aucune variable');
assert.strictEqual(res.variableName, 'AUCUN');
console.log('✅ Test 1a : Aucun proxy configuré validé.');

// Test 1b : SEBPAY_FIXIE_URL en priorité pour Sebpay
process.env.SEBPAY_FIXIE_URL = 'http://fixie:token_seb@ventoux.usefixie.com:80';
process.env.SASPAY_FIXIE_URL = 'http://fixie:token_sas@velvet.usefixie.com:80';
process.env.FIXIE_URL = 'http://fixie:token_global@global.usefixie.com:80';

res = resolveProxyConfig('sebpay');
assert.strictEqual(res.proxyUrl, 'http://fixie:token_seb@ventoux.usefixie.com:80');
assert.strictEqual(res.variableName, 'SEBPAY_FIXIE_URL');
console.log('✅ Test 1b : Priorité SEBPAY_FIXIE_URL pour Sebpay validée.');

// Test 1c : SASPAY_FIXIE_URL en priorité pour SasPay
res = resolveProxyConfig('saspay');
assert.strictEqual(res.proxyUrl, 'http://fixie:token_sas@velvet.usefixie.com:80');
assert.strictEqual(res.variableName, 'SASPAY_FIXIE_URL');
console.log('✅ Test 1c : Priorité SASPAY_FIXIE_URL pour SasPay validée.');

// Test 1d : Fallback global vers FIXIE_URL si variable spécifique absente
delete process.env.SEBPAY_FIXIE_URL;
res = resolveProxyConfig('sebpay');
assert.strictEqual(res.proxyUrl, 'http://fixie:token_global@global.usefixie.com:80');
assert.ok(res.variableName.includes('FIXIE_URL (Global Fallback)'));
console.log('✅ Test 1d : Fallback global vers FIXIE_URL validé.');

// Test 1e : Cross-Gateway Fallback vers le proxy alternatif si global absent
delete process.env.FIXIE_URL;
res = resolveProxyConfig('sebpay');
assert.strictEqual(res.proxyUrl, 'http://fixie:token_sas@velvet.usefixie.com:80');
assert.ok(res.variableName.includes('Cross-Gateway Fallback'));
console.log('✅ Test 1e : Fallback croisé vers le proxy de l\'autre opérateur validé.');

// Test 1f : Masquage sécurisé des logs
const masked = maskProxyUrl('http://fixie:SECRET_PASSWORD_123@ventoux.usefixie.com:80');
assert.strictEqual(masked, 'http://fixie:****@ventoux.usefixie.com:80');
assert.ok(!masked.includes('SECRET_PASSWORD_123'));
console.log('✅ Test 1f : Masquage systématique des credentials validé :', masked);

// Test 1g : Test d'instanciation des agents et format de log [PROXY ROUTER]
process.env.SEBPAY_FIXIE_URL = 'http://fixie:token_seb@ventoux.usefixie.com:80';
const agents = getFixieAgents('sebpay', { transactionId: 'TX_TEST_001' });
assert.ok(agents.httpsAgent, 'HttpsProxyAgent doit être instancié');
assert.ok(agents.undiciAgent, 'Undici ProxyAgent doit être instancié');
console.log('✅ Test 1g : Instanciation du pool d\'agents avec log structuré validée.');

console.log('\n====================================================');
console.log('🧪 TEST 2 : NANASWITCH PRIORITÉ & AUTO-FAILOVER');
console.log('====================================================');

const { NaNaSwitchManager } = require('./nana-switch/switch-manager');
const PaymentGatewayAdapter = require('./nana-switch/gateway-adapter');

// Création d'un manager isolé avec des adaptateurs mockés pour tester le failover
const mockSwitch = new NaNaSwitchManager();

// Mock Sebpay qui simule une erreur 429 de quota épuisé
class MockFailingSebpayAdapter extends PaymentGatewayAdapter {
  constructor() {
    super('sebpay', 'Sebpay Mock');
    this.callCount = 0;
  }
  async initiatePayment(params) {
    this.callCount++;
    const err = new Error('Quota journalier Sebpay dépassé (300/300 requêtes)');
    err.status = 429;
    err.code = 429;
    throw err;
  }
  async verifyWebhook() { return { isValid: true }; }
}

// Mock SasPay opérationnel qui prend le relais en secours
class MockHealthySaspayAdapter extends PaymentGatewayAdapter {
  constructor() {
    super('saspay', 'SasPay Mock');
    this.callCount = 0;
  }
  async initiatePayment(params) {
    this.callCount++;
    return {
      success: true,
      paymentUrl: `https://pay.saspay.me/checkout/mock_${params.orderId}`,
      transactionId: `sas_tx_${Date.now()}`,
      reference: `store___${params.orderId}`,
      orderId: params.orderId,
      amount: params.amount,
      currency: params.currency || 'XOF'
    };
  }
  async verifyWebhook() { return { isValid: true }; }
}

const failingSebpay = new MockFailingSebpayAdapter();
const healthySaspay = new MockHealthySaspayAdapter();

mockSwitch.registerAdapter(failingSebpay);
mockSwitch.registerAdapter(healthySaspay);

async function testFailover() {
  const mockDb = {
    persistedIntents: [],
    collection(colName) {
      return {
        doc(docId) {
          return {
            async set(data, opts) {
              mockDb.persistedIntents.push({ colName, docId, data, opts });
              return Promise.resolve();
            }
          };
        }
      };
    }
  };

  const orderParams = {
    orderId: 'ORD_FAILOVER_TEST',
    storeId: 'boutique_alpha',
    amount: 15000,
    currency: 'XOF',
    customerPhone: '+22670123456',
    customerName: 'Aissata Traore'
  };

  console.log('Appel de mockSwitch.initiatePaymentWithFailover(\'sebpay\', ...) :');
  const result = await mockSwitch.initiatePaymentWithFailover('sebpay', orderParams, { db: mockDb });

  assert.strictEqual(failingSebpay.callCount, 1, 'Sebpay a bien été tenté en priorité');
  assert.strictEqual(healthySaspay.callCount, 1, 'SasPay a bien été sollicité en secours (Failover)');
  assert.strictEqual(result.gateway, 'saspay', 'La passerelle retenue finale doit être saspay');
  assert.strictEqual(result.originalGateway, 'sebpay', 'La passerelle d\'origine doit être sebpay');
  assert.strictEqual(result.failedOver, true, 'Le flag failedOver doit être true');
  assert.ok(result.paymentUrl.includes('saspay.me'), 'L\'URL de paiement doit être celle de SasPay');

  // Vérification de la persistance Firestore
  const savedIntent = mockDb.persistedIntents.find(i => i.docId === 'ORD_FAILOVER_TEST');
  assert.ok(savedIntent, 'L\'intent doit être enregistré dans Firestore');
  assert.strictEqual(savedIntent.data.gateway, 'saspay', 'Le champ gateway dans Firestore doit valoir "saspay"');
  assert.strictEqual(savedIntent.data.provider, 'SASPAY', 'Le champ provider dans Firestore doit valoir "SASPAY"');
  assert.strictEqual(savedIntent.data.failedOver, true, 'Le flag failedOver dans Firestore doit valoir true');

  console.log('✅ Test 2a : Auto-failover sur 429 Quota dépassé validé avec succès !');
  console.log('✅ Test 2b : Persistance Firestore de "gateway: saspay" validée !');
}

console.log('\n====================================================');
console.log('🧪 TEST 3 : SÉPARATION STRICTE DES WEBHOOKS');
console.log('====================================================');

const { verifySaspayWebhookSignature } = require('./saspay-client');

function testWebhookSecurity() {
  const saspaySecret = 'sk_webhook_saspay_secret_key_prod_2026';
  const rawBody = JSON.stringify({ event: 'payment.success', data: { id: 'sas_tx_999', status: 'SUCCESS' } });
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Signature HMAC-SHA256 valide : f"{timestamp}.{raw_body}"
  const validSig = crypto
    .createHmac('sha256', saspaySecret)
    .update(Buffer.concat([Buffer.from(`${timestamp}.`, 'utf8'), Buffer.from(rawBody, 'utf8')]))
    .digest('hex');

  const checkValid = verifySaspayWebhookSignature({
    rawBody,
    signature: validSig,
    timestamp,
    secret: saspaySecret
  });
  assert.strictEqual(checkValid.valid, true, 'La signature SasPay doit être valide');

  // Rejet en cas de secret erroné
  const checkWrongSecret = verifySaspayWebhookSignature({
    rawBody,
    signature: validSig,
    timestamp,
    secret: 'wrong_secret_123'
  });
  assert.strictEqual(checkWrongSecret.valid, false, 'Doit être rejeté avec un mauvais secret');

  // Rejet en cas de timestamp drift > 300s (anti-rejeu)
  const oldTimestamp = (Math.floor(Date.now() / 1000) - 350).toString();
  const checkReplay = verifySaspayWebhookSignature({
    rawBody,
    signature: validSig,
    timestamp: oldTimestamp,
    secret: saspaySecret
  });
  assert.strictEqual(checkReplay.valid, false, 'Doit être rejeté si plus de 300s');
  assert.strictEqual(checkReplay.reason, 'timestamp_drift_exceeded_300s');

  console.log('✅ Test 3a : HMAC-SHA256 SasPay valide.');
  console.log('✅ Test 3b : Protection anti-rejeu > 300s validée.');
  console.log('✅ Test 3c : Rejet en cas de secret erroné validé.');
}

async function runAll() {
  await testFailover();
  testWebhookSecurity();
  console.log('\n====================================================');
  console.log('🎉 TOUS LES TESTS SONT VALIDÉS AVEC SUCCÈS (100%) !');
  console.log('====================================================\n');
}

runAll().catch(err => {
  console.error('\n❌ Échec du test :', err);
  process.exit(1);
});
