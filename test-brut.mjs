import Replicate from "replicate";
import fs from "fs";

// 1. Récupération de la clé dans ton fichier .env
const envFile = fs.readFileSync('.env', 'utf8');
const tokenLine = envFile.split('\n').find(line => line.startsWith('REPLICATE_API_TOKEN='));
const token = tokenLine ? tokenLine.split('=')[1].trim().replace(/['"]/g, '') : null;

if (!token) {
  console.error("❌ ERREUR : Clé REPLICATE_API_TOKEN introuvable dans le .env !");
  process.exit(1);
}

// 2. Connexion à Replicate
const replicate = new Replicate({ auth: token });
console.log("🚀 Connexion réussie à Replicate. Lancement de la génération (patiente 10 à 30 secondes)...");

// 3. Test de génération avec le modèle actif black-forest-labs/flux-schnell
try {
  const output = await replicate.run(
    "black-forest-labs/flux-schnell",
    { input: { prompt: "Un coucher de soleil cyberpunk, 4k" } }
  );
  console.log("\n✅ SUCCÈS ! Voici le lien de ton fichier généré :");
  console.log(output);
} catch (error) {
  console.error("\n❌ ERREUR DE L'API :");
  console.error(error.message);
}