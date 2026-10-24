async function p(t,r,a=[]){try{const i=new AbortController,u=setTimeout(()=>i.abort(),1e4),l=a.map(n=>({role:n.sender==="tutor"?"model":"user",text:n.text})),s=await fetch("/api/ai/course-tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({courseTitle:t.title,courseCategory:t.category,instructorName:t.instructor?.name||"Ibrahim Pousbila Konkobo",modules:t.modules?.map(n=>({title:n.title}))||[],price:t.discountPrice||t.price,message:r,history:l}),signal:i.signal});clearTimeout(u);const d=s.headers.get("content-type")||"";if(s.ok&&d.includes("application/json")){const n=await s.json();if(n&&n.reply)return{reply:n.reply,source:n.source||"gemini-3.8-flash",success:!0}}}catch(i){console.warn("[COURSE_TUTOR_CLIENT] Network or endpoint notice, switching to contextual fallback:",i)}const e=r.toLowerCase(),c=t.instructor?.name||"Ibrahim Pousbila Konkobo";let o="";return e.includes("débutant")||e.includes("niveau")||e.includes("prérequis")?o=`**Absolument, ce cours est conçu pour être 100% accessible aux débutants !** 🎓

${c} commence par les fondamentaux et illustre chaque étape par des cas d'usage réels adaptés aux réalités du marché ouest-africain.

👉 **Vous pouvez vous inscrire en toute confiance dès maintenant !**`:e.includes("paiement")||e.includes("wave")||e.includes("orange")||e.includes("moov")||e.includes("mtn")?o=`**Tous les paiements Mobile Money sont acceptés instantanément !** 💳

Vous pouvez valider votre inscription en Francs CFA via Wave, Orange Money, Moov Money ou MTN en 1-Clic, sans carte bancaire internationale.

👉 **Cliquez sur "S'inscrire" pour débloquer votre accès immédiatement !**`:e.includes("certificat")||e.includes("diplôme")||e.includes("attestation")?o=`**Oui, vous recevez un Certificat Professionnel Officiel !** 📜

Dès la complétion des leçons et des ateliers, votre attestation officielle homologuée par NaNa Academy est générée avec un QR code de vérification.

👉 **Boostez votre profil professionnel en vous inscrivant aujourd'hui !**`:e.includes("durée")||e.includes("combien")||e.includes("heure")?o=`**Cette formation comprend ${t.durationLabel||"plusieurs heures de contenu intensif"} avec un accès illimité 24h/24 !** ⏱️

Vous apprenez à votre propre rythme, quand vous voulez, depuis votre smartphone ou votre PC.

👉 **Rejoignez les entrepreneurs déjà inscrits dès aujourd'hui !**`:o=`**La formation "${t.title}" est l'une des plus recommandées par les professionnels !** 🚀

Chaque module est orienté vers l'acquisition de compétences pratiques et immédiatement rentables.

👉 **N'hésitez plus : commencez votre apprentissage dès maintenant en 1-Clic !**`,{reply:o,source:"local-resilient-tutor",success:!0}}export{p as a};
