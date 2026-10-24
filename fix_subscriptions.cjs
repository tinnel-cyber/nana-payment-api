const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/if \(remoteSales\.length > 0\) \{\s*setSalesHistory\(remoteSales\);\s*\}/g, 'setSalesHistory(remoteSales);');
code = code.replace(/if \(remoteInventory\.length > 0\) \{\s*setInventory\(remoteInventory\);\s*\}/g, 'setInventory(remoteInventory);');
code = code.replace(/if \(remoteCustomers\.length > 0\) \{\s*setCustomers\(remoteCustomers\);\s*\}/g, 'setCustomers(remoteCustomers);');
code = code.replace(/if \(remoteLosses\.length > 0\) \{\s*setLosses\(remoteLosses\);\s*\}/g, 'setLosses(remoteLosses);');
code = code.replace(/if \(remoteMovements\.length > 0\) \{\s*setStockMovements\(remoteMovements\);\s*\}/g, 'setStockMovements(remoteMovements);');
code = code.replace(/if \(remoteOrders\.length > 0\) \{\s*setCustomerOrders\(remoteOrders\);\s*\}/g, 'setCustomerOrders(remoteOrders);');

fs.writeFileSync('src/App.tsx', code);
