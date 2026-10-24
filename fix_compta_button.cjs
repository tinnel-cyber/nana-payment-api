const fs = require('fs');
let code = fs.readFileSync('src/components/HeaderReceipt.tsx', 'utf-8');

const regex = /\{\/\* Rapports & Compta \*\/\}[\s\S]*?<\/button>\n\s+\)\}/;

const newButton = `{/* Analytics & Boutique */}
          {onOpenReports && (
            <button
              id="btn-nav-reports"
              type="button"
              onClick={onOpenReports}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-900/80 hover:bg-indigo-800 text-indigo-300 border border-indigo-500/40 active:scale-95 transition-all text-[11px] font-bold cursor-pointer shadow-sm"
              title="Tableau de Bord & Analytics"
            >
              <TrendingUp className="w-3 h-3 text-indigo-400" />
              <span className="hidden xs:inline">Boutique</span>
            </button>
          )}`;

if (regex.test(code)) {
    code = code.replace(regex, newButton);
    fs.writeFileSync('src/components/HeaderReceipt.tsx', code);
    console.log("Button replaced successfully!");
} else {
    console.log("Regex didn't match!");
}

