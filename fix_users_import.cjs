const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

if (!code.includes('Users,')) {
    code = code.replace(/Camera\n\} from 'lucide-react';/, "Camera,\n  Users\n} from 'lucide-react';");
    fs.writeFileSync('src/App.tsx', code);
    console.log('Added Users import!');
} else {
    console.log('Users already imported.');
}
