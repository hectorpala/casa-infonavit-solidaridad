const PropertyPageGenerator = require('./automation/generador-de-propiedades');
const fs = require('fs');

const config = {
    key: 'san-francisco-la-primavera',
    title: 'Casa en Renta San Francisco Sur La Primavera',
    nombre: 'Casa en Renta San Francisco Sur La Primavera',
    price: '$28,000',
    bedrooms: 3,
    bathrooms: 3.5,
    area: 182,
    landArea: 170,
    location: 'Circuito San Francisco 41, La Primavera, Culiacán',
    description: 'Se renta casa en San Francisco Sur, desarrollo urbano La Primavera. Cuenta con 3 recámaras con baños completos cada una, la principal con vestidor amplio, jacuzzi y balcón amplio. Closet amplio de blancos, área de home office, área de sala y comedor con medio baño, bodega amplia, área de lavado, bar o estudio con medio baño, jardín con pasto artificial, pasillo lateral que permite accesar al bar o estudio, cochera techada para 2 autos con closets en exterior. La privada cuenta con áreas comunes como alberca con asador, canchas y área para reuniones.',
    photoCount: 22
};

console.log('🚀 Generando con PropertyPageGenerator (método correcto)\n');

const generator = new PropertyPageGenerator(true); // true = isRental

(async () => {
    try {
        // Generar página individual
        const filename = await generator.generateIndividualPage(config);
        console.log(`\n✅ Página generada: ${filename}`);
        
        // Generar tarjeta
        const tarjeta = generator.generatePropertyCard(config, 'culiacan/index.html');
        fs.writeFileSync(`tarjeta-${config.key}.html`, tarjeta);
        console.log(`✅ Tarjeta generada: tarjeta-${config.key}.html`);
        
        // Insertar en culiacan/index.html
        const indexPath = 'culiacan/index.html';
        let indexContent = fs.readFileSync(indexPath, 'utf8');
        const insertPoint = indexContent.indexOf('<!-- BEGIN CARD-ADV');
        
        if (insertPoint !== -1) {
            indexContent = indexContent.slice(0, insertPoint) +
                           tarjeta + '\n\n' +
                           indexContent.slice(insertPoint);
            fs.writeFileSync(indexPath, indexContent);
            console.log(`✅ Tarjeta insertada en culiacan/index.html`);
        }
        
        console.log('\n🎯 Listo para "publica ya"');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
})();
