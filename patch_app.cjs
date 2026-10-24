const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Insert handleQuickCashCheckout right before handleConfirmCashPayment
const handleConfirmCashPaymentIndex = code.indexOf('const handleConfirmCashPayment');
const quickCheckoutCode = `
  const handleQuickCashCheckout = () => {
    if (cart.length === 0 || total === 0) return;
    const currentStoreId = currentUser?.storeId || 'store-nana-1';
    
    // Simulate cash amount equal to total
    const amountGiven = total;
    const change = 0;
    
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sale: CompletedSale = {
      id: \`sale-\${Date.now()}\`,
      storeId: currentStoreId,
      date: nowStr,
      timestamp: Date.now(),
      items: [...cart],
      total: total,
      paymentMethod: 'CASH',
      amountGiven: amountGiven,
      changeReturned: change,
      sellerId: activeSeller?.id,
    };
    sale.integrityHash = generateSaleIntegrityHash(sale);

    deductCartFromInventory(cart);
    setSalesHistory((prev) => [sale, ...prev]);
    persistCompletedSale(sale, currentStoreId);
    
    playValidationBeep();
    playValidationBeep(); // Double beep

    // Keep active receipt ready for 1-tap print / reprint
    const receipt = buildReceiptFromSale(sale, currentUser, activeSeller);
    setActiveReceiptData(receipt);

    setCart([]);

    setLastSaleToast(\`Vente Rapide : \${formatCFA(total)} enregistrée !\`);
    setTimeout(() => {
      setLastSaleToast(null);
    }, 4000);
  };
`;
code = code.slice(0, handleConfirmCashPaymentIndex) + quickCheckoutCode + '\n  ' + code.slice(handleConfirmCashPaymentIndex);

// Add onQuickCashCheckout prop to HeaderReceipt
code = code.replace(/<HeaderReceipt\s*cart=\{cart\}/g, '<HeaderReceipt\n                  onQuickCashCheckout={handleQuickCashCheckout}\n                  cart={cart}');

fs.writeFileSync('src/App.tsx', code);
