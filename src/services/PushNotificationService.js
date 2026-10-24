export {
  default,
  isPushNotificationSupported,
  getFirebaseMessaging,
  requestNotificationPermission,
  getOrRegisterFcmToken,
  triggerNotification,
  getStoredFcmToken,
  onForegroundNotification,
  cleanOldNotifications,
  saveMerchantNotification,
  notifyMerchantNewOrder,
  CLOUDFLARE_WORKER_URL,
  FCM_LOCAL_STORAGE_KEY,
  FIREBASE_VAPID_KEY
} from './PushNotificationService.ts';
