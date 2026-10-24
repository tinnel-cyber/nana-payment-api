const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace nav class
code = code.replace(
  /className="h-12 shrink-0 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-1 z-20 select-none"/,
  'className="h-14 shrink-0 bg-slate-900 border-t border-slate-800 flex items-center justify-start px-4 gap-6 overflow-x-auto overflow-y-hidden z-20 select-none scroll-smooth"'
);

// We need to add the hide-scrollbar utility class in index.css if it doesn't exist, or just use tailwind arbitrary variants like `[&::-webkit-scrollbar]:hidden` 
code = code.replace(
  /className="h-14 shrink-0 bg-slate-900 border-t border-slate-800 flex items-center justify-start px-4 gap-6 overflow-x-auto overflow-y-hidden z-20 select-none scroll-smooth"/,
  'className="h-14 shrink-0 bg-slate-900 border-t border-slate-800 flex items-center justify-start px-4 gap-6 overflow-x-auto overflow-y-hidden z-20 select-none scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"'
);

// We also need to change `flex-1 py-1 flex flex-col` to `shrink-0 flex flex-col` for all buttons inside <nav>
const navContentRegex = /<nav[\s\S]*?<\/nav>/;
const navMatch = code.match(navContentRegex);

if (navMatch) {
  let navHtml = navMatch[0];
  // Remove flex-1 from all buttons inside nav
  navHtml = navHtml.replace(/flex-1 /g, 'shrink-0 min-w-[50px] ');
  
  // Add Partenaire button before closing </nav>
  const partnerButton = `
          <button
            id="tab-nav-affiliate"
            type="button"
            onClick={() => {
              playTapBeep();
              setIsAffiliateModalOpen(true);
            }}
            className={\`shrink-0 min-w-[50px] py-1 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors cursor-pointer text-pink-400 hover:text-pink-300 font-medium\`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[9.5px]">Partenaire</span>
          </button>
        </nav>`;
        
  navHtml = navHtml.replace(/<\/nav>/, partnerButton);
  code = code.replace(navContentRegex, navHtml);
  fs.writeFileSync('src/App.tsx', code);
  console.log('Nav updated successfully!');
} else {
  console.log('Could not find nav element.');
}

