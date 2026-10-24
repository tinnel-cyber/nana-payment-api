/**
 * Script de diagnostic autonome pour tester Fixie et afficher l'IP Statique exacte
 * Usage :
 *   node test-fixie.js
 *   ou en passant l'URL en argument :
 *   node test-fixie.js http://fixie:TOKEN@velvet.usefixie.com:80
 */

require('dotenv').config();
const { HttpsProxyAgent } = require('https-proxy-agent');
const { ProxyAgent } = require('undici');

const fixieUrl = process.argv[2] || process.env.FIXIE_URL || process.env.QUOTAGUARDSTATIC_URL;

console.log('====================================================');
console.log('🧪 TEST DE CONNEXION FIXIE & DÉTECTION IP STATIQUE');
console.log('====================================================');

if (!fixieUrl) {
  console.warn('⚠️  Aucune variable FIXIE_URL fournie.');
  console.log('👉 Vous pouvez tester en direct avec :');
  console.log('   node test-fixie.js "http://fixie:VOTRE_CLE@velvet.usefixie.com:80"');
  console.log('\nTest en cours sans proxy (IP publique standard de votre machine/serveur) :');
} else {
  const masked = fixieUrl.replace(/:[^:@]+@/, ':****@');
  console.log(`📡 URL Fixie Proxy détectée : ${masked}`);
  console.log('⏳ Interrogation du service de détection IP à travers Fixie...');
}

async function runTest() {
  try {
    const fetchOptions = {
      headers: { 'User-Agent': 'FixieTestClient/1.0' },
      signal: AbortSignal.timeout(12000)
    };

    if (fixieUrl) {
      try {
        fetchOptions.dispatcher = new ProxyAgent(fixieUrl);
      } catch (e) {
        fetchOptions.agent = new HttpsProxyAgent(fixieUrl);
      }
    }

    const t0 = Date.now();
    const res = await fetch('https://api.ipify.org?format=json', fetchOptions);
    const elapsed = Date.now() - t0;

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    console.log('\n----------------------------------------------------');
    console.log('✅ RÉSULTAT DU TEST :');
    console.log(`🌐 ADRESSE IP SORTANTE : \x1b[32m\x1b[1m${data.ip}\x1b[0m`);
    console.log(`⚡ Temps de réponse : ${elapsed} ms`);
    console.log(`🔒 Tunnel Sécurisé : ${fixieUrl ? 'OUI (Via Fixie)' : 'NON (Connexion directe)'}`);
    console.log('----------------------------------------------------');

    if (fixieUrl) {
      console.log('\n🎯 ACTION BANQUE / WHITELISTING :');
      console.log(`👉 C'est cette adresse IP (\x1b[32m${data.ip}\x1b[0m) qu'il faut ajouter`);
      console.log('   dans la liste blanche (IP Whitelisting) de votre tableau de bord');
      console.log('   de paiement (Banque, CinetPay, Orange, etc.) !');
    }
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ Échec du test :', err.message);
    if (fixieUrl && (err.message.includes('407') || err.message.includes('Proxy Authentication'))) {
      console.error('👉 Vérifiez vos identifiants ou le token dans FIXIE_URL.');
    }
    console.log('====================================================\n');
  }
}

runTest();
