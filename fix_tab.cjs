const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Add Store to lucide-react imports if not there
if (!code.includes('Store,')) {
    code = code.replace(/Mic,/, 'Mic,\n  Store,');
}

// Replace the Voice tab
const voiceRegex = /<button\n\s+id="tab-nav-voice"[\s\S]+?<Mic className="w-4 h-4" \/>\n\s+<span className="text-\[9\.5px\]">Voix<\/span>\n\s+<\/button>/;

const newTab = `<button
            id="tab-nav-store"
            type="button"
            onClick={() => setCurrentView('DASHBOARD')}
            className={\`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors cursor-pointer \${
              currentView === 'DASHBOARD'
                ? 'text-indigo-400 font-bold'
                : 'text-slate-400 hover:text-slate-200 font-medium'
            }\`}
          >
            <Store className="w-4 h-4" />
            <span className="text-[9.5px]">Boutique</span>
          </button>`;

code = code.replace(voiceRegex, newTab);
fs.writeFileSync('src/App.tsx', code);
console.log('Tab replaced');
