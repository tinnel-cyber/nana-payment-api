export type FlashLiveStatus = 
  | 'pending'    // Client requested, awaiting merchant
  | 'accepted'   // Merchant accepted, room active
  | 'rejected'   // Merchant unavailable / declined
  | 'completed'  // Finished normally or converted
  | 'cancelled'; // Client cancelled before answer

export interface FlashLiveRequest {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productPhoto?: string;
  merchantId: string;
  storeName?: string;
  customerName?: string;
  status: FlashLiveStatus;
  roomUrl?: string;
  createdAt: number;
  acceptedAt?: number;
  endedAt?: number;
  notes?: string;
}

export interface FlashLiveTimerState {
  elapsedSeconds: number;
  totalLimitSeconds: number;
  remainingSeconds: number;
  formattedRemaining: string;
  isWarning30s: boolean;
  isCutoff: boolean;
}
