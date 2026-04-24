const fs = require('fs');
const path = require('path');

const targets = [
    'cleanup.js',
    'template_update.cjs',
    'scratch'
];

targets.forEach(target => {
    const fullPath = path.join(__dirname, target);
    if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
            fs.rmSync(fullPath, { recursive: true, force: true });
            console.log(`Deleted directory: ${target}`);
        } else {
            fs.unlinkSync(fullPath);
            console.log(`Deleted file: ${target}`);
        }
    } else {
        console.log(`Not found: ${target}`);
    }
});
