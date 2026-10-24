const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace state initializations
code = code.replace(/const \[inventory, setInventory\] = useState<InventoryProduct\[\]>\(\(\) => \{[\s\S]*?\}\);/g, 'const [inventory, setInventory] = useState<InventoryProduct[]>([]);');
code = code.replace(/const \[stockMovements, setStockMovements\] = useState<StockMovement\[\]>\(\(\) => \{[\s\S]*?\}\);/g, 'const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);');
code = code.replace(/const \[losses, setLosses\] = useState<LossRecord\[\]>\(\(\) => \{[\s\S]*?\}\);/g, 'const [losses, setLosses] = useState<LossRecord[]>([]);');
code = code.replace(/const \[customers, setCustomers\] = useState<DebtCustomer\[\]>\(\(\) => \{[\s\S]*?\}\);/g, 'const [customers, setCustomers] = useState<DebtCustomer[]>([]);');
code = code.replace(/const \[salesHistory, setSalesHistory\] = useState<CompletedSale\[\]>\(\(\) => \{[\s\S]*?\}\);/g, 'const [salesHistory, setSalesHistory] = useState<CompletedSale[]>([]);');
code = code.replace(/const \[customerOrders, setCustomerOrders\] = useState<CustomerOrder\[\]>\(\(\) => \{[\s\S]*?\}\);/g, 'const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);');
code = code.replace(/const \[sellers, setSellers\] = useState<SellerUser\[\]>\(\(\) => \{[\s\S]*?\}\);/g, 'const [sellers, setSellers] = useState<SellerUser[]>([]);');

fs.writeFileSync('src/App.tsx', code);
