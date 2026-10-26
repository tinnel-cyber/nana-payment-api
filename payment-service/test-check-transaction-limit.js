/**
 * Tests Unitaires & d'Intégration : Plafonnement Mensuel des Transactions KYC (Particulier vs Entreprise)
 */

const assert = require('assert');
const {
  KYC_LIMITS,
  resolveMerchantKycTier,
  getMerchantMonthlyLimit,
  checkTransactionLimit,
  recordTransactionVolume,
  inMemoryMonthlyUsage
} = require('./middleware/checkTransactionLimit');

async function runTests() {
  console.log('--- TEST 1 : Constantes & Règles de Plafonds Mensuels ---');
  assert.strictEqual(KYC_LIMITS.INDIVIDUAL.max_monthly_volume_xof, 1000000, 'Plafond Particulier doit être 1 000 000 XOF');
  assert.strictEqual(KYC_LIMITS.ENTERPRISE.max_monthly_volume_xof, 5000000, 'Plafond Entreprise doit être 5 000 000 XOF');
  console.log('✓ Plafonds certifiés : Particulier = 1 000 000 XOF, Entreprise = 5 000 000 XOF.');

  console.log('\n--- TEST 2 : Résolution du Profil KYC (INDIVIDUAL vs ENTERPRISE) ---');
  const merchantParticulier = { merchant_id: 'm_indiv_01', type: 'particulier', business_name: 'Solo Dev' };
  const merchantEntreprise = { merchant_id: 'm_ent_01', type: 'entreprise', business_name: 'Mega Corp SARL' };
  const merchantCustomLimit = { merchant_id: 'm_vip_01', type: 'entreprise', custom_monthly_limit_xof: 25000000 };

  assert.strictEqual(resolveMerchantKycTier(merchantParticulier), 'INDIVIDUAL');
  assert.strictEqual(resolveMerchantKycTier(merchantEntreprise), 'ENTERPRISE');
  assert.strictEqual(getMerchantMonthlyLimit(merchantParticulier), 1000000);
  assert.strictEqual(getMerchantMonthlyLimit(merchantEntreprise), 5000000);
  assert.strictEqual(getMerchantMonthlyLimit(merchantCustomLimit), 25000000);
  console.log('✓ Profils KYC et extensions de quota Super Admin résolus avec succès.');

  console.log('\n--- TEST 3 : Validation de transaction sous le plafond (Particulier) ---');
  const currentMonth = new Date().toISOString().slice(0, 7);
  // Simule un volume mensuel de 850 000 XOF
  inMemoryMonthlyUsage.set(`m_indiv_01_${currentMonth}`, 850000);

  // Transaction de 100 000 XOF -> Total 950 000 XOF <= 1 000 000 XOF (OK)
  const allowedCheck = await checkTransactionLimit(null, merchantParticulier, 100000);
  assert.strictEqual(allowedCheck.allowed, true);
  assert.strictEqual(allowedCheck.currentVolume, 850000);
  assert.strictEqual(allowedCheck.projectedVolume, 950000);
  assert.strictEqual(allowedCheck.remainingVolume, 50000);
  console.log('✓ Transaction de 100 000 XOF autorisée (Cumul : 950 000 / 1 000 000 XOF).');

  console.log('\n--- TEST 4 : Rejet strict 403 Forbidden sur dépassement de plafond (Particulier) ---');
  // Transaction de 200 000 XOF -> Total 1 050 000 XOF > 1 000 000 XOF (Dépassement)
  const blockedCheck = await checkTransactionLimit(null, merchantParticulier, 200000);
  assert.strictEqual(blockedCheck.allowed, false);
  assert.strictEqual(blockedCheck.code, 403);
  assert.strictEqual(blockedCheck.error, 'ERROR_MONTHLY_VOLUME_LIMIT_REACHED');
  assert.strictEqual(blockedCheck.errorResponse.code, 403);
  assert.strictEqual(blockedCheck.errorResponse.error, 'ERROR_MONTHLY_VOLUME_LIMIT_REACHED');
  assert(blockedCheck.statusText.includes('850'), 'Le statut doit indiquer le volume actuel');
  assert(blockedCheck.statusText.includes('1'), 'Le statut doit indiquer le plafond');
  console.log('✓ Transaction bloquée avec HTTP 403 :');
  console.log('  Status Text :', blockedCheck.statusText);
  console.log('  Message :', blockedCheck.errorResponse.message);
  console.log('  Upgrade Incentive :', blockedCheck.errorResponse.limit_details.upgrade_incentive);

  console.log('\n--- TEST 5 : Vérification Compte Entreprise (Plafond 5 000 000 XOF) ---');
  inMemoryMonthlyUsage.set(`m_ent_01_${currentMonth}`, 3500000);

  // 1 000 000 XOF supplémentaire -> Total 4 500 000 XOF <= 5 000 000 XOF (OK)
  const entAllowed = await checkTransactionLimit(null, merchantEntreprise, 1000000);
  assert.strictEqual(entAllowed.allowed, true);
  assert.strictEqual(entAllowed.projectedVolume, 4500000);
  console.log('✓ Entreprise : 1 000 000 XOF autorisé sur cumul de 3 500 000 XOF (Reste 500 000 XOF).');

  // 2 000 000 XOF supplémentaire -> Total 5 500 000 XOF > 5 000 000 XOF (Rejeté)
  const entBlocked = await checkTransactionLimit(null, merchantEntreprise, 2000000);
  assert.strictEqual(entBlocked.allowed, false);
  assert.strictEqual(entBlocked.code, 403);
  assert.strictEqual(entBlocked.error, 'ERROR_MONTHLY_VOLUME_LIMIT_REACHED');
  console.log('✓ Entreprise : Dépassement bloqué avec HTTP 403 ERROR_MONTHLY_VOLUME_LIMIT_REACHED.');

  console.log('\n--- TEST 6 : Enregistrement et cumul du volume transactionnel ---');
  await recordTransactionVolume(null, 'm_indiv_01', 50000);
  const updatedVol = inMemoryMonthlyUsage.get(`m_indiv_01_${currentMonth}`);
  assert.strictEqual(updatedVol, 900000);
  console.log(`✓ Volume incrémenté avec succès : nouveau cumul = ${updatedVol.toLocaleString()} XOF.`);

  console.log('\n======================================================');
  console.log('🎉 TOUS LES TESTS DE PLAFONNEMENT MENSUEL KYC SONT VALIDÉS !');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('Erreur test:', err);
  process.exit(1);
});
