/**
 * Test unitaire de validation du Webhook officiel Sebpay
 * Conforme à la documentation officielle de Sebpay
 */
const crypto = require('crypto');
const SebpayAdapter = require('./nana-switch/adapters/sebpay-adapter');

const TEST_SECRET_KEY = 'sk_live_test_webhook_secret_key_12345';
process.env.SEBPAY_SECRET_KEY = TEST_SECRET_KEY;

async function runWebhookTests() {
  console.log('====================================================');
  console.log('🧪 TEST WEBHOOK OFFICIEL SEBPAY (SIGNATURE & PAYLOAD)');
  console.log('====================================================\n');

  const adapter = new SebpayAdapter();

  // 1. Simulation d'un payload officiel approuvé (status: "approved")
  const approvedPayload = {
    transaction_id: 'tx_sebpay_approved_98765',
    external_reference: 'nanasore_boutique___ORD-7777',
    status: 'approved',
    amount: 5000,
    currency: 'XOF',
    customer_phone: '22670123456',
    created_at: '2026-10-26T00:00:00Z',
    updated_at: '2026-10-26T00:00:15Z'
  };

  const rawBufferApproved = Buffer.from(JSON.stringify(approvedPayload), 'utf8');
  const validSignature = crypto
    .createHmac('sha256', TEST_SECRET_KEY)
    .update(rawBufferApproved)
    .digest('hex');

  console.log('--- 1. Test Signature Valide & Statut "approved" ---');
  const reqApproved = {
    headers: {
      'x-sebpay-signature': validSignature
    },
    body: rawBufferApproved,
    rawBody: rawBufferApproved
  };

  const resApproved = await adapter.verifyWebhook(reqApproved);
  console.log('Résultat vérification :', resApproved);

  if (resApproved.isValid === true && resApproved.status === 'PAID' && resApproved.transactionId === 'tx_sebpay_approved_98765') {
    console.log('✅ Test 1 : Signature valide et statut "approved" validé en PAID !\n');
  } else {
    console.error('❌ Échec Test 1');
    process.exit(1);
  }

  // 2. Simulation d'un payload officiel rejeté (status: "rejected")
  console.log('--- 2. Test Statut "rejected" ---');
  const rejectedPayload = {
    transaction_id: 'tx_sebpay_rejected_12345',
    external_reference: 'nanasore_boutique___ORD-8888',
    status: 'rejected',
    amount: 2500,
    currency: 'XOF',
    customer_phone: '22670000000',
    created_at: '2026-10-26T00:00:00Z',
    updated_at: '2026-10-26T00:00:10Z'
  };

  const rawBufferRejected = Buffer.from(JSON.stringify(rejectedPayload), 'utf8');
  const rejSignature = crypto
    .createHmac('sha256', TEST_SECRET_KEY)
    .update(rawBufferRejected)
    .digest('hex');

  const reqRejected = {
    headers: {
      'x-sebpay-signature': rejSignature
    },
    body: rawBufferRejected,
    rawBody: rawBufferRejected
  };

  const resRejected = await adapter.verifyWebhook(reqRejected);
  console.log('Résultat vérification rejet :', resRejected);

  if (resRejected.isValid === true && resRejected.status === 'FAILED') {
    console.log('✅ Test 2 : Statut "rejected" correctement identifié comme FAILED !\n');
  } else {
    console.error('❌ Échec Test 2');
    process.exit(1);
  }

  // 3. Test Signature Frauduleuse / Invalide
  console.log('--- 3. Test Signature Frauduleuse (Rejet 401) ---');
  const reqFraud = {
    headers: {
      'x-sebpay-signature': 'bad_fake_signature_hex_0000000000000000000000000000000000000000000000000000000000000000'
    },
    body: rawBufferApproved,
    rawBody: rawBufferApproved
  };

  const resFraud = await adapter.verifyWebhook(reqFraud);
  console.log('Résultat vérification frauduleuse :', resFraud);

  if (resFraud.isValid === false) {
    console.log('✅ Test 3 : Signature frauduleuse bloquée avec succès !\n');
  } else {
    console.error('❌ Échec Test 3');
    process.exit(1);
  }

  console.log('====================================================');
  console.log('🎉 TOUS LES TESTS DU WEBHOOK SEBPAY SONT CONFORMES !');
  console.log('====================================================');
}

runWebhookTests().catch(err => {
  console.error('Erreur test webhook :', err);
  process.exit(1);
});
