const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /export type AppView = 'POS' \| 'INVENTORY' \| 'AI_ADVISOR' \| 'REPORTS' \| 'DEBT_BOOK' \| 'VOICE_TEST' \| 'SAAS_ADMIN' \| 'SETTINGS_EXTENSIONS' \| 'CUSTOMER_ORDERS';/g,
  "export type AppView = 'POS' | 'INVENTORY' | 'AI_ADVISOR' | 'REPORTS' | 'DEBT_BOOK' | 'VOICE_TEST' | 'SAAS_ADMIN' | 'SETTINGS_EXTENSIONS' | 'CUSTOMER_ORDERS' | 'DASHBOARD';"
);

fs.writeFileSync('src/App.tsx', code);
