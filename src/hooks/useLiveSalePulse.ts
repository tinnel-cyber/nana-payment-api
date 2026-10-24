import { useState, useEffect, useCallback } from 'react';

export interface LiveSaleNotification {
  id: string;
  customerName: string;
  city: string;
  country: string;
  productName: string;
  paymentMethod: string;
  timeAgo: string;
  avatarUrl: string;
}

const REGIONAL_PULSES: Omit<LiveSaleNotification, 'id'>[] = [
  {
    customerName: 'Kadiatou T.',
    city: 'Bamako',
    country: 'Mali',
    productName: 'cet article',
    paymentMethod: 'Orange Money',
    timeAgo: 'il y a 2 min',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'
  },
  {
    customerName: 'Moussa D.',
    city: 'Ouagadougou',
    country: 'Burkina Faso',
    productName: 'cet article',
    paymentMethod: 'Wave',
    timeAgo: 'il y a 4 min',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80'
  },
  {
    customerName: 'Aïcha K.',
    city: 'Abidjan',
    country: 'Côte d\'Ivoire',
    productName: 'cet article',
    paymentMethod: 'Wave',
    timeAgo: 'il y a 7 min',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop&q=80'
  },
  {
    customerName: 'Cheikh N.',
    city: 'Dakar',
    country: 'Sénégal',
    productName: 'cet article',
    paymentMethod: 'Orange Money',
    timeAgo: 'il y a 11 min',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80'
  },
  {
    customerName: 'Romuald B.',
    city: 'Cotonou',
    country: 'Bénin',
    productName: 'cet article',
    paymentMethod: 'Moov Money',
    timeAgo: 'il y a 14 min',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&auto=format&fit=crop&q=80'
  }
];

export function useLiveSalePulse(productNameFallback: string = 'cet article', intervalSeconds: number = 14) {
  const [currentNotification, setCurrentNotification] = useState<LiveSaleNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let index = 0;

    const cycle = () => {
      const template = REGIONAL_PULSES[index % REGIONAL_PULSES.length];
      setCurrentNotification({
        ...template,
        id: `pulse-${Date.now()}-${index}`,
        productName: productNameFallback || template.productName
      });
      setIsVisible(true);

      // Masquer après 5 secondes
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);

      index++;
    };

    // Premier affichage après 3 secondes
    const initialTimeout = setTimeout(cycle, 3000);
    const interval = setInterval(cycle, intervalSeconds * 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [productNameFallback, intervalSeconds]);

  return { currentNotification, isVisible, dismiss: () => setIsVisible(false) };
}
