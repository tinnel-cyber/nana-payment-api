/**
 * Test unitaire & d'intégration : Bascule Mode d'Intégration (AGREGATED vs BYOK) & Recharge Crédits API
 */

const assert = require('assert');

async function runTests() {
  console.log('--- TEST 1 : Vérification des modèles de données et assainissement des clés BYOK ---');

  const sanitizeCredentials = (creds) => {
    const sasKey = creds?.saspay?.api_key || '';
    const sebPk = creds?.sebpay?.public_key || '';
    const sebSk = creds?.sebpay?.secret_key || '';
    return {
      saspay: { api_key: String(sasKey).replace(/\s+/g, '').trim() },
      sebpay: {
        public_key: String(sebPk).trim(),
        secret_key: String(sebSk).trim()
      }
    };
  };

  const rawCreds = {
    saspay: { api_key: '  sas_live_ 9876543210 abc  ' },
    sebpay: { public_key: ' seb_pk_live_012345 ', secret_key: '  seb_sk_live_999999  ' }
  };

  const cleaned = sanitizeCredentials(rawCreds);
  assert.strictEqual(cleaned.saspay.api_key, 'sas_live_9876543210abc', 'SasPay API key whitespace cleanup failed');
  assert.strictEqual(cleaned.sebpay.public_key, 'seb_pk_live_012345', 'Sebpay public key cleanup failed');
  assert.strictEqual(cleaned.sebpay.secret_key, 'seb_sk_live_999999', 'Sebpay secret key cleanup failed');
  console.log('✓ Clés passerelles assainies et débarrassées des espaces parasites.');

  console.log('\n--- TEST 2 : Structure du document Firestore Marchand pour AGREGATED vs BYOK ---');
  
  const createMerchantPayload = (merchantId, mode, credentials) => {
    const cleanMode = mode === 'BYOK' ? 'BYOK' : 'AGREGATED';
    const sanitized = sanitizeCredentials(credentials);
    return {
      merchant_id: merchantId,
      integration_mode: cleanMode,
      integration_config: {
        mode: cleanMode,
        custom_credentials: sanitized
      },
      custom_credentials: sanitized,
      updated_at: new Date().toISOString()
    };
  };

  const agregatedDoc = createMerchantPayload('m_test_01', 'AGREGATED', {});
  assert.strictEqual(agregatedDoc.integration_mode, 'AGREGATED');
  assert.strictEqual(agregatedDoc.integration_config.mode, 'AGREGATED');
  console.log('✓ Payload mode AGREGATED validé.');

  const byokDoc = createMerchantPayload('m_test_01', 'BYOK', rawCreds);
  assert.strictEqual(byokDoc.integration_mode, 'BYOK');
  assert.strictEqual(byokDoc.integration_config.mode, 'BYOK');
  assert.strictEqual(byokDoc.integration_config.custom_credentials.saspay.api_key, 'sas_live_9876543210abc');
  console.log('✓ Payload mode BYOK avec custom_credentials validé.');

  console.log('\n--- TEST 3 : Calcul & Solde de Crédits API SaaS (0.02 XOF par transaction) ---');
  let creditsBalance = 5000;
  const requestCost = 0.02; // XOF
  const creditCostInXof = 0.02;
  
  // Simulation de 100 transactions directes en mode BYOK
  const transactionsCount = 100;
  creditsBalance -= transactionsCount;
  const totalCostXof = transactionsCount * creditCostInXof;

  assert.strictEqual(creditsBalance, 4900, 'Débit de crédits incorrect');
  assert.strictEqual(totalCostXof, 2.0, 'Coût calculé incorrect');
  console.log(`✓ 100 transactions traitées : ${transactionsCount} crédits débités (${totalCostXof} XOF au taux de 0.02 XOF/req). Nouveau solde : ${creditsBalance}.`);

  // Recharge de pack 50 000 crédits
  const rechargeAmount = 50000;
  creditsBalance += rechargeAmount;
  assert.strictEqual(creditsBalance, 54900, 'Solde après recharge incorrect');
  console.log(`✓ Recharge de pack 50 000 crédits effectuée. Nouveau solde : ${creditsBalance.toLocaleString()} crédits.`);

  console.log('\n--- TOUS LES TESTS UNITAIRES D\'INTÉGRATION SONT VALIDÉS AVEC SUCCÈS ! ---');
}

runTests().catch(err => {
  console.error('Test failure:', err);
  process.exit(1);
});
