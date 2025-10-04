const fs = require('fs');

const urls = fs.readFileSync('batch-urls-temp.txt', 'utf-8')
    .split('\n')
    .filter(line => line.trim());

const urlsArray = urls.map(url => `    "${url}"`).join(',\n');

console.log('const propertyUrls = [');
console.log(urlsArray);
console.log('];');
