/**
 * ==============================================================================
 * Test Automatisé NaNaSwitch : Routage Dynamique & Failover Sebpay <-> SasPay
 * ==============================================================================
 */

const { switchManager } = require('./nana-switch/switch-manager');
const PaymentGatewayAdapter = require('./nana-switch/gateway-adapter');

console.log('================================================================');
console.log('🧪 TEST SUITE NANASWITCH : ROUTAGE DYNAMIQUE & FAILOVER 0ms');
console.log('================================================================\n');

// 1. TEST CONFIGURATION DYNAMIQUE
console.log('--- 1. Configuration Dynamique des Passerelles ---');
console.log('Configuration initiale :', switchManager.getRoutingConfig());

switchManager.setPrimaryGateway('saspay');
switchManager.setFallbackGateway('sebpay');
const conf1 = switchManager.getRoutingConfig();
console.log('Après setPrimaryGateway("saspay") & setFallbackGateway("sebpay") :');
console.log('  Primary  :', conf1.primaryGateway);
console.log('  Fallback :', conf1.fallbackGateway);

if (conf1.primaryGateway !== 'saspay' || conf1.fallbackGateway !== 'sebpay') {
  console.error('❌ Échec test configuration dynamique');
  process.exit(1);
}
console.log('✅ Test 1 Validé : Configuration dynamique active (PRIMARY=saspay, FALLBACK=sebpay).\n');

// 2. TEST MOCK FAILOVER SEBPAY -> SASPAY
console.log('--- 2. Test Automatique Failover (Sebpay Rejet 400 -> SasPay Succès) ---');

class MockFailingSebpayAdapter extends PaymentGatewayAdapter {
  constructor() {
    super('sebpay', 'Mock Sebpay Défaillant');
  }
  async initiatePayment(params) {
    console.log('  [MOCK SEBPAY] Simulation rejet opérateur 400 PAYMENT_DECLINED...');
    const err = new Error('The operator declined the payment request.');
    err.status = 400;
    err.code = 'PAYMENT_DECLINED';
    err.data = { code: 'PAYMENT_DECLINED', transaction_id: 'tx_fail_123' };
    throw err;
  }
  async checkPaymentStatus(txId) {
    return { status: 'FAILED', isPaid: false, amount: 500 };
  }
}

class MockSuccessSaspayAdapter extends PaymentGatewayAdapter {
  constructor() {
    super('saspay', 'Mock SasPay Opérationnel');
  }
  async initiatePayment(params) {
    console.log('  [MOCK SASPAY] Traitement Softpay push USSD pour ' + params.phone + '...');
    return {
      success: true,
      paymentUrl: 'https://pay.saspay.me/checkout/sas_mock_success_999',
      checkout_url: 'https://pay.saspay.me/checkout/sas_mock_success_999',
      redirectUrl: 'https://pay.saspay.me/checkout/sas_mock_success_999',
      provider_link: 'https://pay.saspay.me/checkout/sas_mock_success_999',
      action: 'ussd_push',
      transactionId: 'sas_mock_success_999',
      reference: params.externalReference,
      orderId: params.orderId,
      storeId: params.storeId,
      amount: params.amount,
      currency: 'XOF'
    };
  }
  async checkPaymentStatus(txId) {
    return { status: 'SUCCESS', isPaid: true, amount: 500, currency: 'XOF' };
  }
}

// Enregistrement des adaptateurs de test
switchManager.registerAdapter(new MockFailingSebpayAdapter());
switchManager.registerAdapter(new MockSuccessSaspayAdapter());

// Test d'initiation avec Sebpay comme passerelle primaire (qui va échouer 400 et basculer sur SasPay)
(async () => {
  try {
    const failoverResult = await switchManager.initiatePaymentWithFailover('sebpay', {
      orderId: 'CHK-TEST-FAILOVER-001',
      storeId: 'nanasore_boutique',
      amount: 500,
      currency: 'XOF',
      phone: '+22665565805',
      customerName: 'Client Test',
      country: 'BF',
      operator: 'orange'
    });

    console.log('Résultat reçu après initiation :');
    console.log({
      success: failoverResult.success,
      gateway: failoverResult.gateway,
      provider: failoverResult.provider,
      failedOver: failoverResult.failedOver,
      originalGateway: failoverResult.originalGateway,
      failoverReason: failoverResult.failoverReason,
      transactionId: failoverResult.transactionId,
      action: failoverResult.action
    });

    if (
      failoverResult.success === true &&
      failoverResult.gateway === 'saspay' &&
      failoverResult.failedOver === true &&
      failoverResult.originalGateway === 'sebpay'
    ) {
      console.log('✅ Test 2 Validé : Capture automatique de l\'erreur Sebpay (400) et basculement instantané vers SasPay réussi !\n');
    } else {
      console.error('❌ Échec Test 2 : Le basculement ne s\'est pas déroulé comme attendu.');
      process.exit(1);
    }

    // 3. TEST INITIATION DIRECTE SUR PRIMARY (SASPAY SANS ERREUR)
    console.log('--- 3. Test Initiation Directe Passerelle Principale (SasPay) ---');
    const directResult = await switchManager.initiatePaymentWithFailover('saspay', {
      orderId: 'CHK-TEST-DIRECT-002',
      storeId: 'nanasore_boutique',
      amount: 1000,
      currency: 'XOF',
      phone: '+22665565805',
      customerName: 'Client Direct',
      country: 'BF',
      operator: 'orange'
    });

    console.log({
      success: directResult.success,
      gateway: directResult.gateway,
      failedOver: directResult.failedOver,
      transactionId: directResult.transactionId
    });

    if (directResult.success === true && directResult.gateway === 'saspay' && directResult.failedOver === false) {
      console.log('✅ Test 3 Validé : Initiation directe sans failover conforme.\n');
    } else {
      console.error('❌ Échec Test 3');
      process.exit(1);
    }

    // 4. TEST VÉRIFICATION STATUT UNIFIÉE
    console.log('--- 4. Test Vérification Statut Unifiée (checkPaymentStatus) ---');
    const statusRes = await switchManager.checkPaymentStatus('sas_mock_success_999', 'saspay');
    console.log('Statut vérifié :', statusRes);
    if (statusRes.isPaid === true && statusRes.status === 'SUCCESS') {
      console.log('✅ Test 4 Validé : Vérification de statut unifiée opérationnelle.\n');
    } else {
      console.error('❌ Échec Test 4');
      process.exit(1);
    }

    // 5. TEST ROUTAGE 100% PAR DÉFAUT VERS SASPAY (SANS PARAMÈTRE DE GATEWAY)
    console.log('--- 5. Test Routage 100% par Défaut vers SasPay (gateway = null) ---');
    const defaultCallResult = await switchManager.initiatePaymentWithFailover(null, {
      orderId: 'CHK-TEST-DEFAULT-003',
      storeId: 'nanasore_boutique',
      amount: 750,
      currency: 'XOF',
      phone: '+22665565805',
      customerName: 'Client Sans Paramètre Gateway',
      country: 'BF',
      operator: 'orange'
    });

    console.log({
      success: defaultCallResult.success,
      gateway: defaultCallResult.gateway,
      failedOver: defaultCallResult.failedOver,
      transactionId: defaultCallResult.transactionId
    });

    if (defaultCallResult.success === true && defaultCallResult.gateway === 'saspay' && defaultCallResult.failedOver === false) {
      console.log('✅ Test 5 Validé : 100% des requêtes sans passerelle explicite routent bien vers SasPay par défaut !\n');
    } else {
      console.error('❌ Échec Test 5');
      process.exit(1);
    }

    // 6. TEST FAILOVER INVERSÉ : SASPAY ÉCHOUE -> REPLI VERS SEBPAY
    console.log('--- 6. Test Failover Inversé (SasPay Échoue -> Sebpay Prend le Relais) ---');
    class MockFailingSaspayAdapter extends PaymentGatewayAdapter {
      constructor() {
        super('saspay', 'Mock SasPay Défaillant');
      }
      async initiatePayment(params) {
        console.log('  [MOCK SASPAY] Simulation erreur API 500...');
        const err = new Error('Saspay API Temporary Unavailable (500)');
        err.status = 500;
        throw err;
      }
    }
    class MockWorkingSebpayAdapter extends PaymentGatewayAdapter {
      constructor() {
        super('sebpay', 'Mock Sebpay Opérationnel de Secours');
      }
      async initiatePayment(params) {
        console.log('  [MOCK SEBPAY] Initiation réussie sur passerelle de secours...');
        return {
          success: true,
          paymentUrl: 'https://checkout.sebpay.bj/pay/seb_mock_999',
          checkout_url: 'https://checkout.sebpay.bj/pay/seb_mock_999',
          redirectUrl: 'https://checkout.sebpay.bj/pay/seb_mock_999',
          provider_link: 'https://checkout.sebpay.bj/pay/seb_mock_999',
          action: 'redirect',
          transactionId: 'seb_mock_999',
          reference: params.externalReference,
          orderId: params.orderId,
          storeId: params.storeId,
          amount: params.amount,
          currency: 'XOF'
        };
      }
    }

    switchManager.registerAdapter(new MockFailingSaspayAdapter());
    switchManager.registerAdapter(new MockWorkingSebpayAdapter());

    const fallbackToSebpayResult = await switchManager.initiatePaymentWithFailover('saspay', {
      orderId: 'CHK-TEST-FAILOVER-SAS-TO-SEB',
      storeId: 'nanasore_boutique',
      amount: 1500,
      currency: 'XOF',
      phone: '+22665565805',
      customerName: 'Client Failover Sas to Seb',
      country: 'BF',
      operator: 'orange'
    });

    console.log({
      success: fallbackToSebpayResult.success,
      gateway: fallbackToSebpayResult.gateway,
      failedOver: fallbackToSebpayResult.failedOver,
      originalGateway: fallbackToSebpayResult.originalGateway,
      failoverReason: fallbackToSebpayResult.failoverReason,
      transactionId: fallbackToSebpayResult.transactionId
    });

    if (
      fallbackToSebpayResult.success === true &&
      fallbackToSebpayResult.gateway === 'sebpay' &&
      fallbackToSebpayResult.failedOver === true &&
      fallbackToSebpayResult.originalGateway === 'saspay'
    ) {
      console.log('✅ Test 6 Validé : En cas d\'échec de SasPay, Sebpay prend immédiatement le relais en secours !\n');
    } else {
      console.error('❌ Échec Test 6');
      process.exit(1);
    }

    console.log('================================================================');
    console.log('🎉 TOUS LES TESTS DU ROUTEUR ET FAILOVER NANASWITCH SONT 100% VALIDÉS !');
    console.log('================================================================');
  } catch (err) {
    console.error('❌ Erreur inattendue pendant les tests :', err);
    process.exit(1);
  }
})();
