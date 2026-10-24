const fs = require('fs');
let code = fs.readFileSync('src/components/HeaderReceipt.tsx', 'utf-8');

// Replace Compta with Dashboard
const reportsRegex = /\{\/\* Rapports & Compta \*\/\}\s*\{onOpenReports && \([\s\S]+?\}\)/m;

const newDashboardButton = `
          {/* Tableau de Bord & Compta */}
          {onOpenReports && (
            <button
              id="btn-nav-reports"
              type="button"
              onClick={onOpenReports}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 border border-indigo-700/50 active:scale-95 transition-all text-[11px] font-semibold cursor-pointer"
              title="Tableau de Bord & Analytics"
            >
              <TrendingUp className="w-3 h-3 text-indigo-400" />
              <span className="hidden xs:inline">Boutique</span>
            </button>
          )}`;

code = code.replace(reportsRegex, newDashboardButton);
fs.writeFileSync('src/components/HeaderReceipt.tsx', code);

// Now update App.tsx to route onOpenReports to DASHBOARD view
let appCode = fs.readFileSync('src/App.tsx', 'utf-8');
appCode = appCode.replace(/onOpenReports=\{\(\) => setCurrentView\('REPORTS'\)\}/g, "onOpenReports={() => setCurrentView('DASHBOARD')}");
fs.writeFileSync('src/App.tsx', appCode);

