// ============================================================================
// UTILITAIRE DE RENDU CONDITIONNEL & GATING LMS (WAMEET CHANNELS)
// ============================================================================

export interface GatedLmsMessageItem {
  id?: string;
  moduleId?: string;
  lessonId?: string;
  prerequisiteLessonId?: string | null;
  requiredLessonTitle?: string;
  hideWhenLocked?: boolean; // Si true : totalement invisible ; Si false : carte verrouillée
  isInstructorOnly?: boolean;
  [key: string]: any;
}

/**
 * Détermine si un message LMS est débloqué pour un utilisateur donné.
 * - Si l'utilisateur est formateur/admin (isInstructor = true), tout est visible.
 * - S'il n'y a pas de prérequis, le message est débloqué.
 * - Si un prérequis est spécifié, il doit obligatoirement figurer dans les leçons complétées.
 */
export function isLmsMessageUnlocked(
  message: GatedLmsMessageItem,
  completedLessonIds: string[] | Set<string>,
  isInstructor: boolean = false
): boolean {
  if (isInstructor) return true;
  if (!message.prerequisiteLessonId) return true;

  if (completedLessonIds instanceof Set) {
    return completedLessonIds.has(message.prerequisiteLessonId);
  }

  return completedLessonIds.includes(message.prerequisiteLessonId);
}

/**
 * Filtre un flux de messages de discussion en appliquant la règle de visibilité :
 * - Les messages débloqués sont conservés.
 * - Les messages verrouillés avec `hideWhenLocked: true` sont masqués du flux.
 * - Les messages verrouillés avec `hideWhenLocked: false` (ou indéfini) sont conservés
 *   pour afficher le placeholder de verrouillage pédagogique.
 */
export function filterChatMessagesForUser<T extends GatedLmsMessageItem>(
  messages: T[],
  completedLessonIds: string[] | Set<string>,
  isInstructor: boolean = false
): T[] {
  if (!Array.isArray(messages)) return [];
  if (isInstructor) return messages;

  const completedSet = completedLessonIds instanceof Set
    ? completedLessonIds
    : new Set(completedLessonIds);

  return messages.filter(msg => {
    // Si c'est un message réservé au formateur
    if (msg.isInstructorOnly && !isInstructor) {
      return false;
    }

    const isUnlocked = !msg.prerequisiteLessonId || completedSet.has(msg.prerequisiteLessonId);
    if (isUnlocked) return true;

    // Si le formateur a configuré le masquage strict
    if (msg.hideWhenLocked === true) {
      return false;
    }

    return true;
  });
}
