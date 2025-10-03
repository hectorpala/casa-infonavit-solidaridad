const fs = require('fs');
let html = fs.readFileSync('culiacan/index.html', 'utf8');

// Reemplazos simples y directos
html = html.replace(/casa-renta-valle-alto-712258[\s\S]{1,1000}?\$14,000\n/m, (match) => match.replace('$14,000\n', '$14,000/mes\n'));
html = html.replace(/casa-renta-portabelo-742687[\s\S]{1,1000}?\$11,000\n/m, (match) => match.replace('$11,000\n', '$11,000/mes\n'));
html = html.replace(/casa-renta-desarrollo-urbano-3-rios-806900[\s\S]{1,1000}?\$13,500\n/m, (match) => match.replace('$13,500\n', '$13,500/mes\n'));
html = html.replace(/casa-renta-culiacan-tres-rios-937431[\s\S]{1,1000}?\$13,000\n/m, (match) => match.replace('$13,000\n', '$13,000/mes\n'));
html = html.replace(/casa-renta-la-altea-i-839267[\s\S]{1,1000}?\$28,500\n/m, (match) => match.replace('$28,500\n', '$28,500/mes\n'));
html = html.replace(/casa-renta-portalegre-871021[\s\S]{1,1000}?\$14,000\n/m, (match) => match.replace('$14,000\n', '$14,000/mes\n'));
html = html.replace(/casa-renta-villa-del-cedro-983772[\s\S]{1,1000}?\$10,800\n/m, (match) => match.replace('$10,800\n', '$10,800/mes\n'));

fs.writeFileSync('culiacan/index.html', html);
console.log('✅ Agregado /mes');
