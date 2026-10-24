const fs = require('fs');
let code = fs.readFileSync('src/components/HeaderReceipt.tsx', 'utf-8');

// Replace the checkout actions area
const targetBlock = /\{\/\* Actions Caisse: Imprimer, PDF & Paiement Cash \*\/\}[^]+?\<\/div\>\s+\<\/div\>\s+\<\/div\>\s+\)\;\s+\}\;/m;

const newBlock = `{/* Actions Caisse: Imprimer, PDF & Paiement Cash */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2">
          {/* Bouton Télécharger Facture PDF */}
          {onDownloadPdfReceipt && (
            <button
              id="btn-pdf-ticket-caisse"
              type="button"
              disabled={cart.length === 0}
              onClick={onDownloadPdfReceipt}
              className={\`p-2.5 sm:py-3 sm:px-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1 border transition-all cursor-pointer active:scale-95 \${
                cart.length > 0
                  ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-slate-850 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
              }\`}
              title="Télécharger la facture sous format PDF (jsPDF)"
            >
              <FileDown className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          )}

          {/* Double Option d'Encaissement */}
          <div className="flex flex-1 sm:flex-none items-center gap-1.5">
            {/* 1. Validation Rapide Cash */}
            <button
              id="btn-validation-rapide"
              type="button"
              onClick={onQuickCashCheckout}
              disabled={total === 0}
              className={\`flex-1 sm:flex-none px-3 py-2.5 sm:py-3 rounded-xl font-black text-[11px] sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 shadow-lg transition-all cursor-pointer active:scale-95 \${
                total > 0
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:brightness-110 text-white border border-emerald-400/30'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
              }\`}
              title="Validation Rapide Cash (1-clic direct dans Firestore)"
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-emerald-200" />
              <span className="tracking-tight whitespace-nowrap text-center leading-tight">
                Rapide<br className="sm:hidden" /> Cash
              </span>
            </button>

            {/* 2. Finaliser & Reçu */}
            <button
              id="btn-paiement-cash"
              type="button"
              disabled={total === 0}
              onClick={onOpenCashPayment}
              className={\`flex-1 sm:flex-none px-3 py-2.5 sm:py-3 rounded-xl font-black text-[11px] sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 shadow-lg transition-all cursor-pointer active:scale-95 \${
                total > 0
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:brightness-110 text-white shadow-blue-500/25 border border-blue-400/40 ring-1 ring-blue-400/20 animate-pulse'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
              }\`}
            >
              <Banknote className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span className="tracking-tight uppercase whitespace-nowrap text-center leading-tight">
                Finaliser<br className="sm:hidden" /> & Reçu
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
\``;

code = code.replace(targetBlock, newBlock);
code = code.replace(/onOpenCashPayment: \(\) => void;/g, 'onOpenCashPayment: () => void;\n  onQuickCashCheckout: () => void;');
code = code.replace(/onOpenCashPayment,\n\}\)/g, 'onOpenCashPayment,\n  onQuickCashCheckout,\n})');

// Also import Zap
if (!code.includes('Zap')) {
  code = code.replace(/import \{([^}]+)\} from 'lucide-react';/, "import {$1, Zap} from 'lucide-react';");
}

fs.writeFileSync('src/components/HeaderReceipt.tsx', code);
