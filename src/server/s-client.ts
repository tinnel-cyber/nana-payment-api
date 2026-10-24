/**
 * @file s-client.ts
 * @description Alias rétro-compatible vers sebpay-client.ts
 */
export * from './sebpay-client';
import sebpayClientInstance, { SebpayClient, sClient } from './sebpay-client';

export { SebpayClient, SebpayClient as SClient, sClient, sebpayClientInstance as s };
export default sebpayClientInstance;
