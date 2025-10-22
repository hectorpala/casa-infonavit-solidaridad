#!/usr/bin/env node

/**
 * Wrapper para inmuebles24culiacanscraper.js
 * Auto-confirma la ciudad para uso desde la interfaz web
 */

const { spawn } = require('child_process');

const url = process.argv[2];

if (!url) {
    console.error('❌ Error: Se requiere una URL');
    process.exit(1);
}

// Spawn el scraper original
const scraper = spawn('node', ['inmuebles24culiacanscraper.js', url], {
    stdio: ['pipe', 'pipe', 'pipe']
});

// Pipe stdout y stderr
scraper.stdout.pipe(process.stdout);
scraper.stderr.pipe(process.stderr);

// Auto-confirmar ciudad después de 3 segundos
setTimeout(() => {
    scraper.stdin.write('\n');
    scraper.stdin.end();
}, 3000);

// Pasar el código de salida
scraper.on('exit', (code) => {
    process.exit(code);
});
