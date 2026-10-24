/**
 * NaNaSwitch Cloud — Smart API Router & Connector
 * Background Service Worker (Manifest V3)
 * Architecture Zero-Trust : Aucune dépendance mère, communication sécurisée Nœud Cloud.
 */

const CLOUD_ROUTER_NODE = "https://cloud.nanasore.com/v1/switch/route";

chrome.runtime.onInstalled.addListener(() => {
  console.log("[NaNaSwitch Cloud] Extension Zero-Trust initialisée avec succès.");
});

// Écoute des requêtes d'aiguillage depuis les onglets ou la popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "route_payment" || request.action === "dispatch_api") {
    chrome.storage.local.get(["nanaswitch_api_key"], async (result) => {
      const apiKey = result.nanaswitch_api_key;
      if (!apiKey) {
        sendResponse({ 
          success: false, 
          error: "Jeton Cloud non configuré. Veuillez renseigner votre clé nana_sw_live_... dans l'extension." 
        });
        return;
      }

      try {
        const response = await fetch(CLOUD_ROUTER_NODE, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "X-NaNaSwitch-Key": apiKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(request.payload || {})
        });

        const data = await response.json();
        sendResponse({ success: true, data });
      } catch (err) {
        sendResponse({ success: false, error: err.message || "Erreur réseau Nœud Cloud" });
      }
    });

    // Retour asynchrone Chrome
    return true;
  }
});
