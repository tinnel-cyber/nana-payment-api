import { MarketplaceCourse } from '../components/lms/marketplace/types';

export interface TutorChatMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  timestamp: number;
}

/**
 * Interroge l'assistant pédagogique IA Tinnela Tutor pour un cours spécifique
 */
export async function askTinnelaTutor(
  course: MarketplaceCourse,
  message: string,
  history: TutorChatMessage[] = []
): Promise<{ reply: string; source: string; success: boolean }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s max

    const formattedHistory = history.map(h => ({
      role: h.sender === 'tutor' ? 'model' : 'user',
      text: h.text
    }));

    const response = await fetch('/api/ai/course-tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseTitle: course.title,
        courseCategory: course.category,
        instructorName: course.instructor?.name || 'Ibrahim Pousbila Konkobo',
        modules: course.modules?.map(m => ({ title: m.title })) || [],
        price: course.discountPrice || course.price,
        message,
        history: formattedHistory
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type") || "";
    if (response.ok && contentType.includes("application/json")) {
      const data = await response.json();
      if (data && data.reply) {
        return {
          reply: data.reply,
          source: data.source || 'gemini-3.8-flash',
          success: true
        };
      }
    }
  } catch (err) {
    console.warn('[COURSE_TUTOR_CLIENT] Network or endpoint notice, switching to contextual fallback:', err);
  }

  // Moteur de secours local intelligent et contextuel
  const q = message.toLowerCase();
  const instructor = course.instructor?.name || 'Ibrahim Pousbila Konkobo';
  let fallbackReply = '';

  if (q.includes('débutant') || q.includes('niveau') || q.includes('prérequis')) {
    fallbackReply = `**Absolument, ce cours est conçu pour être 100% accessible aux débutants !** 🎓\n\n${instructor} commence par les fondamentaux et illustre chaque étape par des cas d'usage réels adaptés aux réalités du marché ouest-africain.\n\n👉 **Vous pouvez vous inscrire en toute confiance dès maintenant !**`;
  } else if (q.includes('paiement') || q.includes('wave') || q.includes('orange') || q.includes('moov') || q.includes('mtn')) {
    fallbackReply = `**Tous les paiements Mobile Money sont acceptés instantanément !** 💳\n\nVous pouvez valider votre inscription en Francs CFA via Wave, Orange Money, Moov Money ou MTN en 1-Clic, sans carte bancaire internationale.\n\n👉 **Cliquez sur "S'inscrire" pour débloquer votre accès immédiatement !**`;
  } else if (q.includes('certificat') || q.includes('diplôme') || q.includes('attestation')) {
    fallbackReply = `**Oui, vous recevez un Certificat Professionnel Officiel !** 📜\n\nDès la complétion des leçons et des ateliers, votre attestation officielle homologuée par NaNa Academy est générée avec un QR code de vérification.\n\n👉 **Boostez votre profil professionnel en vous inscrivant aujourd'hui !**`;
  } else if (q.includes('durée') || q.includes('combien') || q.includes('heure')) {
    fallbackReply = `**Cette formation comprend ${course.durationLabel || 'plusieurs heures de contenu intensif'} avec un accès illimité 24h/24 !** ⏱️\n\nVous apprenez à votre propre rythme, quand vous voulez, depuis votre smartphone ou votre PC.\n\n👉 **Rejoignez les entrepreneurs déjà inscrits dès aujourd'hui !**`;
  } else {
    fallbackReply = `**La formation "${course.title}" est l'une des plus recommandées par les professionnels !** 🚀\n\nChaque module est orienté vers l'acquisition de compétences pratiques et immédiatement rentables.\n\n👉 **N'hésitez plus : commencez votre apprentissage dès maintenant en 1-Clic !**`;
  }

  return {
    reply: fallbackReply,
    source: 'local-resilient-tutor',
    success: true
  };
}
