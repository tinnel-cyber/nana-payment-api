const f={},o="nana_legal_ai_chat_history";const A="nana_gemini_api_key",C=`Tu es l'Expert Juriste d'Affaires & Spécialiste en Droit Commercial et Financier International de Nana POS.
Tu es un avocat d'affaires et juriste d'entreprise chevronné avec plus de 20 ans d'expérience en Afrique de l'Ouest, Afrique Centrale et Commerce International.

Tes domaines de maîtrise absolue :
1. DROIT DES AFFAIRES OHADA (Organisation pour l'Harmonisation en Afrique du Droit des Affaires) :
   - AUDCG (Acte Uniforme sur le Droit Commercial Général) : statut du commerçant, bail à usage professionnel (bail commercial), cession de fonds de commerce, vente commerciale, prescription.
   - AUSCGIE (Sociétés Commerciales et GIE) : SARL, SAS, SA, GIE, statuts, pactes d'associés, gérance, assemblées, responsabilité civile et pénale des dirigeants.
   - AUS (Sûretés) : cautionnement simple et solidaire, garantie autonome à première demande, nantissement de fonds de commerce, nantissement de créances, clause de réserve de propriété, hypothèque conventionnelle.
   - AUPCAP (Procédures Collectives d'Apurement du Passif) : conciliation, règlement préventif, redressement judiciaire, cessation des paiements.
   - AUCTMR (Transport de Marchandises par Route) : lettre de voiture, responsabilité du transporteur.
   - Arbitrage CCJA (Cour Commune de Justice et d'Arbitrage d'Abidjan) : clause compromissoire et exécution.

2. PRATIQUES BANCAIRES & FINANCIÈRES (UEMOA / CEMAC) :
   - Réglementation bancaire BCEAO / BEAC, contrôle des changes, effets de commerce (lettre de change, billet à ordre, protêt, chèques sans provision).
   - Garanties de paiement, crédits documentaires, sûretés personnelles et bancaires.
   - Droit du travail et conventions collectives régionales (CDD, CDI, préavis, licenciement, indemnités).

3. COMMERCE INTERNATIONAL :
   - Incoterms 2020 de la CCI (EXW, FCA, CPT, CIP, DAP, DPU, DDP, FAS, FOB, CFR, CIF) : transfert précis des risques, frais et formalités douanières.
   - Crédits Documentaires (RUU 600) : irrévocable, confirmé, stand-by.
   - Contrats d'import/export, clauses de réserve de propriété, clauses pénales, force majeure, clause de hardship.

Règles de réponse :
- Réponds avec clarté, rigueur et autorité en citant les articles des Actes Uniformes OHADA ou les règles de la CCI lorsque c'est pertinent.
- Fournis une analyse concrète des risques juridiques et financiers.
- Lorsque l'utilisateur demande une clause, donne une rédaction juridique protectrice prête à être insérée dans le contrat, avec des crochets [Nom des Parties].
- Structure avec des titres Markdown clairs et des listes à puces.`;function h(){try{const r=localStorage.getItem(o);if(!r)return[];const t=JSON.parse(r);if(!t||!Array.isArray(t.messages))return localStorage.removeItem(o),[];const e=Date.now(),s=t.messages.filter(n=>typeof n.timestamp=="number"&&e-n.timestamp<864e5);return s.length!==t.messages.length&&(s.length===0?localStorage.removeItem(o):localStorage.setItem(o,JSON.stringify({version:1,lastUpdated:e,messages:s}))),s}catch(r){console.warn("Erreur lecture historique IA juridique locale :",r);try{localStorage.removeItem(o)}catch{}return[]}}function I(r){try{const t=Date.now(),e=r.filter(n=>typeof n.timestamp=="number"&&t-n.timestamp<864e5);if(e.length===0){localStorage.removeItem(o);return}const s={version:1,lastUpdated:t,messages:e};localStorage.setItem(o,JSON.stringify(s))}catch(t){console.warn("Erreur sauvegarde historique IA juridique :",t)}}function y(){try{localStorage.removeItem(o)}catch{}}function v(r){if(r&&r.trim())return r.trim();try{const e=localStorage.getItem(A);if(e&&e.trim())return e.trim()}catch{}const t=f?.VITE_GEMINI_API_KEY;return t&&typeof t=="string"&&t.trim()?t.trim():""}function b(r,t){const e=r.toLowerCase();return e.includes("bail")||e.includes("loyer")||e.includes("locaux")||e.includes("expulsion")||e.includes("propriétaire")?`### 🏢 Synthèse Juridique : Bail Commercial à Usage Professionnel (Droit OHADA)

Selon les dispositions impératives de l'**Acte Uniforme sur le Droit Commercial Général (AUDCG)** :

1. **Droit au Renouvellement (Articles 123 à 132 AUDCG)** :
   - Le commerçant locataire bénéficie d'un droit au renouvellement après **2 années consécutives d'exploitation**.
   - Le locataire doit notifier sa demande de renouvellement au bailleur au plus tard **3 mois avant l'expiration du bail** (par acte extrajudiciaire ou tout moyen écrit probant).
   - En cas de refus sans motif légitime, le bailleur est redevable d'une **indemnité d'éviction** compensant le préjudice subi (perte de clientèle, frais de déménagement).

2. **Résiliation pour Non-Paiement (Art. 133 AUDCG)** :
   - Le bailleur ne peut pas expulser le locataire sans respecter une **mise en demeure d'au moins 1 mois**.
   - Cette mise en demeure doit mentionner expressément la clause résolutoire et le délai d'un mois accordé pour régulariser.

3. **Clause Résolutoire Protectrice Type** :
> *"En cas de non-paiement à son échéance exacte d'un seul terme de loyer ou des charges, et un mois après une mise en demeure d'exécuter demeurée infructueuse conformément à l'article 133 de l'AUDCG de l'OHADA, le présent bail sera résilié de plein droit sans qu'il soit besoin de remplir d'autre formalité judiciaire que de faire constater cette résiliation par la juridiction compétente."*`:e.includes("caution")||e.includes("garantie")||e.includes("sûreté")||e.includes("dette")||e.includes("créance")?`### 🛡️ Sécurisation des Paiements & Créances : Cautionnement vs Garantie Autonome (OHADA AUS)

Conformément à l'**Acte Uniforme portant organisation des Sûretés (AUS)** :

1. **Cautionnement Solidaire (Art. 13 à 38 AUS)** :
   - **Accessoire à la créance** : La caution peut opposer au créancier la nullité du contrat principal ou la contestation des montants.
   - *Clause indispensable* : Insérer la mention manuscrite de la caution et la renonciation formelle aux bénéfices de discussion et de division.

2. **Garantie Autonome à Première Demande (Art. 39 à 49 AUS)** :
   - **Engagement bancaire irrévocable et indépendant** du contrat de base.
   - La banque ou le garant paie à première demande écrite sans pouvoir différer le règlement ni invoquer une contestation entre vendeur et acheteur.
   - Sûreté reine pour les contrats d'approvisionnement importants ou marchés publics.

3. **Clause de Réserve de Propriété (Art. 72 à 78 AUS)** :
> *"Le vendeur conserve la pleine propriété juridique des marchandises désignées jusqu'au complet paiement du prix facturé en principal, intérêts et frais. Jusqu'à cette date, les marchandises livrées sont sous la garde matérielle de l'acquéreur qui en assume tous les risques."*`:e.includes("fob")||e.includes("cif")||e.includes("incoterm")||e.includes("dap")||e.includes("navire")||e.includes("fret")||e.includes("douane")?`### 🚢 Commerce International : Incoterms 2020 & Gestion des Risques

1. **FOB (Free On Board - Port d'embarquement convenu)** :
   - **Transfert des risques** : Dès que les marchandises sont chargées à bord du navire au port de départ.
   - **Responsabilité de l'acheteur** : Négocie et règle le fret maritime international, souscrit l'assurance de transport, assume les droits de douane à l'arrivée (ex: Port d'Abidjan, Dakar, San Pedro, Cotonou ou Douala).

2. **CIF (Cost, Insurance and Freight - Port de destination)** :
   - **Obligation du vendeur** : Règle le transport maritime jusqu'au port d'arrivée désigné et prend en charge l'assurance maritime basique (Institute Cargo Clauses C).
   - **Point critique** : Le risque de perte ou dommage est transféré à l'acheteur dès la mise à bord au port de départ. L'acheteur doit réclamer à l'assureur en cas d'avarie maritime.

3. **Recommandation Importateurs UEMOA/CEMAC** :
   - Privilégiez les Incoterms **CIP** (avec assurance multirisque tous risques) ou **DAP** (livré au lieu convenu, avant douane) si vous gérez des marchandises à forte valeur ajoutée acheminées en conteneurs fermés.`:e.includes("sarl")||e.includes("sas")||e.includes("statut")||e.includes("associé")||e.includes("gérant")||e.includes("directeur")?`### 🏛️ Droit des Sociétés Commerciales OHADA (AUSCGIE)

1. **SARL (Société à Responsabilité Limitée)** :
   - Cadre juridique protecteur et stable pour commerçants et PME.
   - Les parts sociales ne sont pas librement cessibles à des tiers (agrément à la majorité des associés représentant 3/4 du capital social, Art. 318 AUSCGIE).
   - Décisions ordinaires prises par un ou plusieurs associés représentant plus de la moitié du capital.

2. **SAS (Société par Actions Simplifiée)** :
   - Forme moderne et très flexible introduite par la révision de l'AUSCGIE.
   - Liberté contractuelle quasi totale dans la rédaction des statuts (entrée/sortie d'investisseurs, droit de veto, cession de parts facilitée).
   - Absence d'obligation de commissaire aux comptes sous certains seuils de chiffre d'affaires et d'effectif.

3. **Points de Vigilance pour la Gérance** :
   - Signature des contrats commerciaux : Vérifiez toujours que le signataire dispose d'un pouvoir express ou d'un mandat social à jour au Registre du Commerce et du Crédit Mobilier (RCCM).`:e.includes("litige")||e.includes("arbitrage")||e.includes("tribunal")||e.includes("clause")||e.includes("pénalité")?`### ⚖️ Résolution des Litiges & Clause Compromissoire CCJA

Pour éviter les lenteurs et blocages des juridictions locales, l'insertion d'une clause d'arbitrage sous l'égide de la **Cour Commune de Justice et d'Arbitrage (CCJA d'Abidjan)** est recommandée dans les contrats de commerce et de prestation :

**Modèle de Clause Compromissoire Type :**
> *"Tous différends nés du présent contrat ou s'y rapportant seront tranchés définitivement suivant le Règlement d'arbitrage de la Cour Commune de Justice et d'Arbitrage (CCJA) de l'OHADA par un ou plusieurs arbitres désignés conformément à ce Règlement. La sentence arbitrale rendue sera définitive, sans appel, et recevra l'exequatur direct dans tous les États membres de l'OHADA conformément à l'article 30 du Traité OHADA."*

**Clause Pénale de Retard de Paiement :**
> *"Tout retard de règlement des factures à leur date d'exigibilité entraînera de plein droit, et sans mise en demeure préalable, l'application d'un intérêt de retard de 1,5% par mois entamé, outre le remboursement des frais de recouvrement engagés."*`:`### ⚖️ Conseil Juridique & Financier OHADA / International Nana POS

Bonjour. En tant qu'expert en droit des affaires de l'espace **OHADA** (17 États membres) et en **Commerce International**, je vous accompagne dans la sécurisation de vos opérations :

${t?`📄 *Document actuellement actif : "${t}"*
`:""}
1. **Audit de Contrat & Relecture de Clauses** :
   - Détection des déséquilibres, clauses abusives ou ambiguïtés de paiement.
2. **Baux Commerciaux & Fonds de Commerce (AUDCG)** :
   - Renouvellement de bail, congés, cession de bail et indemnité d'éviction.
3. **Sûretés & Recouvrement de Créances (AUS)** :
   - Cautionnements solidaires, garanties bancaires à première demande, nantissements et clauses de réserve de propriété.
4. **Commerce Extérieur & Transport (Incoterms 2020)** :
   - Choix de l'Incoterm optimal (FOB, CIF, DAP), crédits documentaires RUU 600 et lettres de voiture routières (AUCTMR).

Posez-moi votre question, soumettez une clause à relire ou demandez un modèle contractuel adapté à votre situation.`}async function S(r){const{apiKey:t,message:e,history:s,documentContext:n}=r,l=["gemini-2.5-flash","gemini-1.5-flash"];for(const m of l)try{const i=`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${t}`,c=[],u=s.slice(-6);for(const p of u)c.push({role:p.role==="assistant"?"model":"user",parts:[{text:p.text}]});let d=e;n&&n.trim()&&(d=`[Document en cours : "${n.trim()}"]

${e}`),c.push({role:"user",parts:[{text:d}]});const a=await fetch(i,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:c,systemInstruction:{parts:[{text:C}]},generationConfig:{temperature:.4,maxOutputTokens:1500}})});if(a.status===429)return{reply:`⚠️ **Limite de requêtes atteinte (Tier Gratuit : 15 requêtes/minute)**

L'API Gemini Google AI Studio applique un plafond de 15 requêtes par minute sur le forfait gratuit. Veuillez patienter une vingtaine de secondes avant de poser votre prochaine question juridique. Vos données et votre historique local restent intacts.`,source:"google-aistudio-429",isRateLimited:!0,success:!1};if(a.ok){const g=(await a.json())?.candidates?.[0]?.content?.parts?.[0]?.text;if(g&&typeof g=="string")return{reply:g.trim(),source:m,success:!0}}}catch(i){if(i?.message?.includes("429")||i?.status===429)return{reply:`⚠️ **Limite de requêtes atteinte (Tier Gratuit : 15 requêtes/minute)**

Veuillez patienter 20 à 30 secondes avant de relancer votre demande.`,source:"google-aistudio-429",isRateLimited:!0,success:!1}}return null}async function q(r){const{message:t,history:e=[],documentContext:s="",apiKey:n}=r,l=v(n);if(l){const i=await S({apiKey:l,message:t,history:e,documentContext:s});if(i)return i}try{const i=new AbortController,c=setTimeout(()=>i.abort(),12e3),u=await fetch("/api/ai/legal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:t,history:e.slice(-6).map(a=>({role:a.role,text:a.text})),documentContext:s}),signal:i.signal});if(clearTimeout(c),u.status===429)return{reply:`⚠️ **Limite de requêtes atteinte (Tier Gratuit : 15 requêtes/minute)**

Veuillez patienter une vingtaine de secondes avant de poser votre prochaine question juridique. Vos données locales sont préservées.`,source:"server-429",isRateLimited:!0,success:!1};const d=u.headers.get("content-type")||"";if(u.ok&&d.includes("application/json")){const a=await u.json();if(a&&typeof a.reply=="string"&&a.reply.trim())return{reply:a.reply.trim(),source:a.source||"gemini-legal",success:!0}}}catch(i){console.warn("Appel API juridique échoué, activation du moteur local :",i)}return{reply:b(t,s),source:"nana-ohada-local-engine",success:!0}}export{A as G,h as a,q as b,y as c,v as g,I as s};
