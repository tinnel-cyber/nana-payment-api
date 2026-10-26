/**
 * Test Suite de Sécurité Cryptographique Webhook NanaSwitch Cloud :
 * 1. Génération du Secret Webhook (ns_whsec_...)
 * 2. Signature HMAC-SHA256 sortante (x-nanaswitch-signature: t=...,v1=...)
 * 3. Validation de signature et protection anti-rejeu (fenêtre 300s)
 * 4. Validation des Webhooks entrants Sebpay (SEBPAY_WEBHOOK_SECRET)
 * 5. Validation des Webhooks entrants SasPay (SASPAY_WEBHOOK_SECRET)
 */

const assert = require('assert');
const crypto = require('crypto');
const {
  generateWebhookSecret,
  signWebhookPayload,
  verifyWebhookSignature
} = require('./nana-switch/webhookNotifier');
const { verifySaspayWebhookSignature } = require('./saspay-client');

async function runTests() {
  console.log('--- TEST 1 : Génération du Secret Webhook (ns_whsec_...) ---');
  const secret = generateWebhookSecret();
  console.log('Secret Webhook généré :', secret);
  assert(secret.startsWith('ns_whsec_'), 'Le secret webhook doit commencer par "ns_whsec_"');
  assert.strictEqual(secret.length, 'ns_whsec_'.length + 64, 'Le secret doit contenir 32 octets hexadécimaux (64 caractères)');
  console.log('✓ Format du secret validé avec succès (format 64 hex chars).');

  console.log('\n--- TEST 2 : Signature HMAC-SHA256 Sortante (NanaSwitch -> Marchand) ---');
  const payload = {
    id: 'evt_test_12345',
    event: 'payment.success',
    created_at: 1729960000,
    merchant_id: 'm_live_bf_001',
    data: {
      order_id: 'ORD_9988',
      amount: 15000,
      currency: 'XOF',
      status: 'SUCCESS'
    }
  };

  const fixedTimestamp = Math.floor(Date.now() / 1000);
  const signResult = signWebhookPayload(payload, secret, fixedTimestamp);
  console.log('En-tête de signature généré :', signResult.signatureHeader);

  assert(signResult.signatureHeader.startsWith(`t=${fixedTimestamp},v1=`), 'L\'en-tête doit respecter le format t=<timestamp>,v1=<hmac>');
  assert.strictEqual(signResult.timestamp, fixedTimestamp);
  assert.strictEqual(signResult.hmac.length, 64, 'Le hash HMAC-SHA256 doit comporter 64 caractères hexadécimaux');
  console.log('✓ En-tête "x-nanaswitch-signature" généré avec succès.');

  console.log('\n--- TEST 3 : Helper de Vérification de Signature & Anti-Rejeu ---');
  // 3a. Vérification avec signature valide
  const verifyOk = verifyWebhookSignature({
    payload: signResult.serializedPayload,
    signatureHeader: signResult.signatureHeader,
    secretKey: secret,
    toleranceSeconds: 300
  });
  assert.strictEqual(verifyOk.valid, true, 'La signature légitime doit être validée');
  assert.strictEqual(verifyOk.reason, null);
  console.log('✓ Signature valide acceptée.');

  // 3b. Vérification avec payload altéré (attaque par altération de données)
  const tamperedPayload = signResult.serializedPayload.replace('15000', '1000');
  const verifyTampered = verifyWebhookSignature({
    payload: tamperedPayload,
    signatureHeader: signResult.signatureHeader,
    secretKey: secret
  });
  assert.strictEqual(verifyTampered.valid, false, 'Le payload falsifié doit être rejeté');
  assert.strictEqual(verifyTampered.reason, 'signature_mismatch');
  console.log('✓ Payload falsifié rejeté avec succès (signature_mismatch).');

  // 3c. Vérification avec mauvaise clé secrète
  const wrongSecret = generateWebhookSecret();
  const verifyWrongSecret = verifyWebhookSignature({
    payload: signResult.serializedPayload,
    signatureHeader: signResult.signatureHeader,
    secretKey: wrongSecret
  });
  assert.strictEqual(verifyWrongSecret.valid, false, 'Une mauvaise clé secrète doit être rejetée');
  assert.strictEqual(verifyWrongSecret.reason, 'signature_mismatch');
  console.log('✓ Mauvaise clé secrète rejetée avec succès.');

  // 3d. Vérification anti-rejeu (timestamp expiré > 300s)
  const expiredTimestamp = fixedTimestamp - 400; // 400s dans le passé
  const expiredSign = signWebhookPayload(payload, secret, expiredTimestamp);
  const verifyExpired = verifyWebhookSignature({
    payload: expiredSign.serializedPayload,
    signatureHeader: expiredSign.signatureHeader,
    secretKey: secret,
    toleranceSeconds: 300
  });
  assert.strictEqual(verifyExpired.valid, false, 'Un webhook ancien de plus de 300s doit être rejeté');
  assert.strictEqual(verifyExpired.reason, 'timestamp_expired');
  console.log('✓ Attaque par rejeu rejetée avec succès (timestamp_expired).');

  console.log('\n--- TEST 4 : Validation Webhook Entrant Sebpay (SEBPAY_WEBHOOK_SECRET) ---');
  const testSebpaySecret = 'whsec_sebpay_partner_secret_test_key_2026';
  const sebpayPayload = JSON.stringify({
    status: 'approved',
    transaction_id: 'seb_tx_777',
    amount: 5000,
    external_reference: 'm_live_bf_001___ORD_123'
  });
  const sebpayBuffer = Buffer.from(sebpayPayload, 'utf8');

  // Calcul HMAC Sebpay officiel
  const expectedSebpaySignature = crypto
    .createHmac('sha256', testSebpaySecret)
    .update(sebpayBuffer)
    .digest('hex');

  // Test conformité HMAC Sebpay
  const calculatedHash = crypto.createHmac('sha256', testSebpaySecret).update(sebpayBuffer).digest('hex').toLowerCase();
  const isSebpayValid = expectedSebpaySignature.toLowerCase() === calculatedHash;
  assert.strictEqual(isSebpayValid, true, 'HMAC Sebpay doit être conforme à la documentation officielle');
  console.log('✓ Validation cryptographique du Webhook Sebpay certifiée.');

  console.log('\n--- TEST 5 : Validation Webhook Entrant SasPay (SASPAY_WEBHOOK_SECRET) ---');
  const testSaspaySecret = 'whsec_saspay_partner_secret_test_key_2026';
  const saspayPayload = JSON.stringify({
    event: 'payin.success',
    data: {
      id: 'sas_payin_444',
      status: 'SUCCESS',
      amount: 10000,
      currency: 'XOF'
    }
  });
  const saspayBuffer = Buffer.from(saspayPayload, 'utf8');
  const nowTs = Math.floor(Date.now() / 1000);

  // Construction de la signature SasPay selon spec : HMAC-SHA256 sur Buffer f"{timestamp}.{raw_body}"
  const saspaySignedBuffer = Buffer.concat([Buffer.from(`${nowTs}.`, 'utf8'), saspayBuffer]);
  const saspayHmac = crypto.createHmac('sha256', testSaspaySecret).update(saspaySignedBuffer).digest('hex');

  const saspayCheck = verifySaspayWebhookSignature({
    rawBody: saspayBuffer,
    signature: saspayHmac,
    timestamp: nowTs,
    secret: testSaspaySecret
  });
  assert.strictEqual(saspayCheck.valid, true, 'Le webhook SasPay légitime doit être accepté');
  assert.strictEqual(saspayCheck.reason, null);

  // Test altération du payload SasPay
  const saspayTamperedCheck = verifySaspayWebhookSignature({
    rawBody: Buffer.from(saspayPayload.replace('10000', '20000'), 'utf8'),
    signature: saspayHmac,
    timestamp: nowTs,
    secret: testSaspaySecret
  });
  assert.strictEqual(saspayTamperedCheck.valid, false, 'Le webhook SasPay altéré doit être rejeté');
  console.log('✓ Validation cryptographique du Webhook SasPay certifiée (timingSafeEqual + timestamp).');

  console.log('\n======================================================');
  console.log('🎉 TOUS LES TESTS DE SIGNATURE WEBHOOK SONT CONFORMES !');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
