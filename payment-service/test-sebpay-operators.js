/**
 * Script de diagnostic officiel des opérateurs Sebpay
 * Interroge l'API Sebpay (ou le relais de production Render whitelisté) pour vérifier la configuration exacte
 */
const axios = require('axios');

async function checkSebpayOperators() {
  console.log('--- DIAGNOSTIC OPERATEURS SEBPAY BURKINA FASO (BF) ---');
  try {
    const res = await axios.get('https://nana-payment-api.onrender.com/api/payment/sebpay/operators?country=BF');
    console.log('\n=== REPONSE SEBPAY OPERATEURS (BF) VIA RENDER FIXIE ===');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Erreur diagnostic :', err.response?.data || err.message);
  }
}

checkSebpayOperators();
