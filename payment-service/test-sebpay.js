/**
 * Test unitaire de validation de l'instance Sebpay (Headers & Sécurité)
 */

process.env.SEBPAY_PUBLIC_KEY = 'pk_live_sample_key_12345';
process.env.SEBPAY_SECRET_KEY = 'sk_live_sample_secret_67890';

const {
  getSebpayBaseUrl,
  getSebpayHeaders,
  getSebpayConfigStatus,
  getFixieHttpsProxyAgent,
  getSebpayAxiosConfig,
  SUPPORTED_COUNTRIES,
  resolveCountryAndCurrency
} = require('./sebpay-client');

console.log('=== TEST SEBPAY CLIENT ===');
console.log('Base URL :', getSebpayBaseUrl());

const headers = getSebpayHeaders();
console.log('Headers injectés :');
console.log('  X-Public-Key :', headers['X-Public-Key']);
console.log('  X-Secret-Key :', headers['X-Secret-Key'] ? 'PRESENT (PROTEGÉ CÔTÉ SERVEUR)' : 'ABSENT');
console.log('  Content-Type :', headers['Content-Type']);

const status = getSebpayConfigStatus();
console.log('\nStatut exposé (Sans secret) :');
console.log(JSON.stringify(status, null, 2));

const testDefault = resolveCountryAndCurrency();
const testBJ = resolveCountryAndCurrency(null, '+22961000000');
const testCM = resolveCountryAndCurrency('CM');
const testName = resolveCountryAndCurrency('Burkina Faso');

console.log('\n=== TEST RESOLUTION PAYS & DEVISE ===');
console.log('Default :', testDefault);
console.log('Par préfixe +229 :', testBJ);
console.log('Par code CM :', testCM);
console.log('Par nom Burkina Faso :', testName);

const isCountryValidationOk = 
  testDefault.country === 'BF' && testDefault.currency === 'XOF' &&
  testBJ.country === 'BJ' && testBJ.currency === 'XOF' &&
  testCM.country === 'CM' && testCM.currency === 'XAF' &&
  testName.country === 'BF' && testName.currency === 'XOF';

console.log('\n=== TEST PROXY FIXIE HTTPS-PROXY-AGENT ===');
const proxyAgent = getFixieHttpsProxyAgent();
const axiosConfig = getSebpayAxiosConfig();
console.log('HttpsProxyAgent présent :', Boolean(proxyAgent));
console.log('Axios config httpsAgent présent :', Boolean(axiosConfig.httpsAgent));
console.log('Axios config proxy disabled (false) :', axiosConfig.proxy === false);

if (
  headers['X-Public-Key'] === 'pk_live_sample_key_12345' &&
  headers['X-Secret-Key'] === 'sk_live_sample_secret_67890' &&
  headers['Content-Type'] === 'application/json' &&
  getSebpayBaseUrl() === 'https://newapi.sebpay.bj/api/v1/' &&
  status.isConfigured === true &&
  !('hasSecretKey' in status ? status.X_Secret_Key : false) &&
  isCountryValidationOk &&
  Boolean(proxyAgent) &&
  Boolean(axiosConfig.httpsAgent) &&
  axiosConfig.proxy === false
) {
  console.log('\n>>> VALIDATION REUSSIE : L\'instance réseau Sebpay et la validation country/currency sont 100% conformes !');
  process.exit(0);
} else {
  console.error('\n>>> ECHEC VALIDATION');
  process.exit(1);
}
