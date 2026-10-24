const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Add import
const importPos = "import { PosSearchBar } from './components/PosSearchBar';";
code = code.replace(importPos, importPos + "\nimport { DashboardView } from './components/DashboardView';");

// Add view switch
const reportsViewRegex = /\{\/\* ==========================================\n\s+\* 3\. VUE RAPPORTS & STATS \(Ancienne\)\n\s+\* ========================================== \*\/\}/m;

const dashboardMount = `
        {/* ==========================================
         * NOUVEAU TABLEAU DE BORD (Analytics & Hub Web)
         * ========================================== */}
        {currentView === 'DASHBOARD' && (
          <div className="absolute inset-0 z-10 bg-white">
            <DashboardView 
              sales={sales}
              inventory={inventory}
              customers={customers}
              currentUser={currentUser}
              onBack={() => setCurrentView('POS')}
            />
          </div>
        )}

        `;

code = code.replace(reportsViewRegex, dashboardMount + reportsViewRegex.source.replace(/\\/g, ''));

fs.writeFileSync('src/App.tsx', code);
