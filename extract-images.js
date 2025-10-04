const fs = require('fs');
const data = JSON.parse(fs.readFileSync('temp-next-data.json', 'utf-8'));

const images = new Set();

const findImages = (obj) => {
    if (typeof obj === 'string' && obj.includes('cdn.propiedades.com') && /\.(jpg|jpeg|png)/.test(obj)) {
        if (obj.includes('30154064')) {
            images.add(obj);
        }
    } else if (typeof obj === 'object' && obj !== null) {
        for (let key in obj) {
            findImages(obj[key]);
        }
    }
};

findImages(data);

images.forEach(img => console.log(img));
console.error('\nTotal fotos encontradas:', images.size);
