import { StoreUser } from '../types';

export const DEMO_BLOCKED_MESSAGE = "Action désactivée : La modification de données est bloquée en mode Démo.";

export interface DemoBlockToastEventDetail {
  message: string;
  type?: 'warning' | 'error' | 'info';
  duration?: number;
}

/**
 * Détermine si le compte utilisateur actif est en mode Démo.
 * Est considéré comme Démo si :
 * - role === 'demo'
 * - id === 'usr-demo'
 * - loginProvider === 'demo'
 */
export function isDemoAccount(user: StoreUser | null | undefined): boolean {
  if (!user) return false;
  return (
    user.role === 'demo' ||
    user.id === 'usr-demo' ||
    user.loginProvider === 'demo' ||
    (typeof user.email === 'string' && user.email.toLowerCase() === 'demo@nanasore.com')
  );
}

/**
 * Émet une notification Toast spécifique de blocage démo ou d'alerte générale
 */
export function showDemoBlockedToast(message = DEMO_BLOCKED_MESSAGE): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<DemoBlockToastEventDetail>('nana_show_toast', {
        detail: {
          message,
          type: 'warning',
          duration: 4500,
        },
      })
    );
  }
}

/**
 * Intercepte l'action si l'utilisateur est en mode Démo.
 * Affiche immédiatement le toast bloquant sans exécuter aucune requête réseau Firebase.
 *
 * @returns true si l'action est bloquée (mode Démo), false si l'action est autorisée.
 */
export function checkAndBlockDemoAction(
  user: StoreUser | null | undefined, 
  customMessage?: string
): boolean {
  if (isDemoAccount(user)) {
    showDemoBlockedToast(customMessage || DEMO_BLOCKED_MESSAGE);
    return true;
  }
  return false;
}
