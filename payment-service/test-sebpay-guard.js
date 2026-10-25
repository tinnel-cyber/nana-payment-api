/**
 * Test unitaire et de sécurité : Validation de la barrière de sécurité SEBPAY GUARD
 */
const {
  resolveSebpayOperatorDetails,
  createSebpayCollection,
  BF_OPERATORS_MAP
} = require('./sebpay-client');

async function runGuardTests() {
  console.log('====================================================');
  console.log('🧪 TEST SÉCURITÉ : BARRIÈRE DE VALIDATION SEBPAY GUARD');
  console.log('====================================================\n');

  // 1. Test Résolution dynamique des opérateurs
  console.log('--- 1. Résolution dynamique des opérateurs BF ---');
  const orangeDetails = await resolveSebpayOperatorDetails('BF', 'orange');
  console.log('Opérateur Orange BF résolu :', orangeDetails);

  if (
    orangeDetails.slug === 'orange-bf' &&
    orangeDetails.code === 'orange' &&
    orangeDetails.id === '20260506192835289381' &&
    orangeDetails.otp_required === true &&
    orangeDetails.ussd_code === '*144*4*6*montant#'
  ) {
    console.log('✅ Test 1 : Résolution dynamique des opérateurs BF conforme !\n');
  } else {
    console.error('❌ Échec Test 1');
    process.exit(1);
  }

  // 2. Test Blocage strict si OTP manquant pour Orange BF
  console.log('--- 2. Contrôle strict de l\'OTP (Orange BF sans OTP) ---');
  let blockedOtp = false;
  try {
    await createSebpayCollection({
      orderId: 'ORD_TEST_NO_OTP',
      amount: 1000,
      currency: 'XOF',
      country: 'BF',
      phone: '70123456',
      operator: 'orange'
      // AUCUN OTP FOURNI
    });
  } catch (err) {
    if (err.code === 'OTP_REQUIRED' && err.status === 400) {
      blockedOtp = true;
      console.log('✅ [SEBPAY GUARD] Blocage immédiat confirmé avec code :', err.code);
      console.log('   Message :', err.message);
      console.log('   Syntaxe USSD :', err.ussd_code);
    } else {
      console.error('❌ Erreur inattendue :', err);
    }
  }

  if (!blockedOtp) {
    console.error('❌ Échec Test 2 : La requête sans OTP aurait dû être bloquée avant POST /collections !');
    process.exit(1);
  }

  // 3. Test Blocage numéro de téléphone invalide pour le Burkina Faso
  console.log('\n--- 3. Contrôle du numéro de téléphone local (Burkina Faso) ---');
  let blockedPhone = false;
  try {
    await createSebpayCollection({
      orderId: 'ORD_TEST_BAD_PHONE',
      amount: 1000,
      currency: 'XOF',
      country: 'BF',
      phone: '123', // Invalide (< 8 chiffres)
      operator: 'orange',
      otpCode: '1234'
    });
  } catch (err) {
    if (err.code === 'INVALID_PHONE_NUMBER' && err.status === 400) {
      blockedPhone = true;
      console.log('✅ [SEBPAY GUARD] Blocage immédiat numéro invalide confirmé avec code :', err.code);
      console.log('   Message :', err.message);
    }
  }

  if (!blockedPhone) {
    console.error('❌ Échec Test 3 : Le numéro invalide aurait dû être bloqué !');
    process.exit(1);
  }

  // 4. Test Opérateur ne nécessitant pas d'OTP (ex: Moov Money)
  console.log('\n--- 4. Opérateur sans OTP requis (Moov BF) ---');
  const moovDetails = await resolveSebpayOperatorDetails('BF', 'moov');
  console.log('Opérateur Moov BF résolu :', moovDetails);
  if (moovDetails.slug === 'moov-bf' && moovDetails.otp_required === false) {
    console.log('✅ Test 4 : Moov BF résolu sans exigence d\'OTP !\n');
  } else {
    console.error('❌ Échec Test 4');
    process.exit(1);
  }

  // 5. Test Formatage Orange Burkina Faso (226 + 8 chiffres & operator = orange)
  console.log('\n--- 5. Validation payload Orange BF (Préfixe 226 & operator=orange) ---');
  const { formatBurkinaPhoneNumber, formatSebpayPhoneNumber } = require('./sebpay-client');
  const bfPhoneWithPrefix = formatBurkinaPhoneNumber('70123456');
  const intlBfPhone = formatSebpayPhoneNumber('+226 70 12 34 56', 'BF');

  if (bfPhoneWithPrefix === '22670123456' && intlBfPhone === '22670123456') {
    console.log('✅ Test 5 : Téléphone Burkina Faso avec indicatif 226 validé :', bfPhoneWithPrefix);
  } else {
    console.error('❌ Échec Test 5');
    process.exit(1);
  }

  // 6. Test Exécution sans ReferenceError dans createSebpayCollection
  console.log('\n--- 6. Test Exécution createSebpayCollection (Validation des variables) ---');
  try {
    await createSebpayCollection({
      orderId: 'ORD_TEST_EXEC',
      amount: 200,
      currency: 'XOF',
      country: 'BF',
      phone: '70123456',
      operator: 'orange',
      otpCode: '123456'
    });
  } catch (err) {
    if (err instanceof ReferenceError) {
      console.error('❌ Échec Test 6 : ReferenceError détecté :', err);
      process.exit(1);
    }
    console.log('✅ Test 6 : Aucune ReferenceError dans createSebpayCollection (Erreur réseau normale sans clés: ' + err.message + ')');
  }

  console.log('====================================================');
  console.log('🎉 TOUS LES CONTRÔLES SEBPAY GUARD SONT 100% VALIDÉS !');
  console.log('====================================================');
}

runGuardTests().catch(err => {
  console.error('Erreur test guard :', err);
  process.exit(1);
});
