import { json } from "@remix-run/node";
import { useActionData, Form, useNavigation } from "@remix-run/react";
import Replicate from "replicate";

// 1. LE MOTEUR (Backend) - S'exécute de manière sécurisée côté serveur
export const action = async () => {
  try {
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Test simple pour vérifier que la clé API fonctionne parfaitement
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5d1c712de7dfea535525255b1aa35c5565e08b", 
      {
        input: {
          prompt: "Un magnifique coucher de soleil, style cyberpunk, 4k"
        }
      }
    );

    return json({ success: true, result: output });
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
};

// 2. LE VISUEL (Frontend) - Ce que tu vois à l'écran
export default function TestVideo() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div style={{ 
      /* LA RUSE EST ICI : On force cette page à s'afficher au-dessus de tout le reste */
      position: "fixed", 
      top: 0, 
      left: 0, 
      width: "100vw", 
      height: "100vh", 
      backgroundColor: "white", 
      zIndex: 99999, 
      overflowY: "auto",
      /* Fin de la ruse */
      padding: "40px", 
      fontFamily: "Arial, sans-serif", 
      textAlign: "center" 
    }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ color: "#333" }}>Test de Connexion Replicate</h1>
        <p style={{ color: "#666", marginBottom: "30px" }}>
          Vérifions que ta clé API locale fonctionne.
        </p>

        <Form method="post">
          <button
            type="submit"
            disabled={isSubmitting}
            style={{ 
              padding: "15px 30px", 
              fontSize: "18px", 
              fontWeight: "bold",
              cursor: isSubmitting ? "wait" : "pointer",
              backgroundColor: isSubmitting ? "#ccc" : "#007BFF",
              color: "white",
              border: "none",
              borderRadius: "8px"
            }}
          >
            {isSubmitting ? "⏳ Génération en cours..." : "🚀 Générer le test"}
          </button>
        </Form>

        {/* Affichage des erreurs si la clé API est mauvaise */}
        {actionData?.error && (
          <div style={{ backgroundColor: "#ffebee", color: "#c62828", padding: "15px", marginTop: "30px", borderRadius: "8px" }}>
            <strong>Erreur de l'API :</strong> {actionData.error}
          </div>
        )}

        {/* Affichage du résultat si tout fonctionne */}
        {actionData?.success && (
          <div style={{ backgroundColor: "#e8f5e9", color: "#2e7d32", padding: "15px", marginTop: "30px", borderRadius: "8px" }}>
            <h3>✅ Succès ! La clé fonctionne.</h3>
            <p>Voici le lien direct renvoyé par Replicate :</p>
            <a href={actionData.result[0]} target="_blank" rel="noreferrer" style={{ wordBreak: "break-all", color: "#1565c0" }}>
              {actionData.result[0]}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
