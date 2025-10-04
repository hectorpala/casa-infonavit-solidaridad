const PropertyPageGenerator = require('./automation/generador-de-propiedades');
const path = require('path');

(async () => {
    console.log('🏠 Generando Casa en Renta San Francisco Sur La Primavera...\n');

    const config = {
        key: 'san-francisco-la-primavera',
        title: 'Casa en Renta San Francisco Sur La Primavera',
        price: '$28,000',
        bedrooms: 3,
        bathrooms: 3.5,
        area: 182,
        landArea: 170,
        location: 'Circuito San Francisco 41, La Primavera, Culiacán',
        locationShort: 'San Francisco Sur, La Primavera',
        description: `¡Bienvenido a tu nuevo hogar en San Francisco Sur La Primavera! Esta hermosa casa de 2 pisos combina diseño moderno, comodidad y una ubicación privilegiada en uno de los fraccionamientos más exclusivos de Culiacán.

🏡 CARACTERÍSTICAS PRINCIPALES:
• 3 recámaras amplias con clósets
• 3.5 baños (3 completos + 1 medio baño)
• 182 m² de construcción
• 170 m² de terreno
• 2 pisos de diseño moderno
• Cocina integral equipada
• Sala y comedor espaciosos
• Estacionamiento techado para 2 autos

✨ AMENIDADES DEL FRACCIONAMIENTO:
• Seguridad 24/7 con caseta de vigilancia
• Áreas verdes y parques
• Excelente ubicación cerca de escuelas
• Cercanía a centros comerciales
• Ambiente familiar y seguro
• Calles pavimentadas e iluminadas

💰 RENTA MENSUAL: $28,000
📋 Depósito en garantía equivalente a 1 mes de renta

Esta propiedad es ideal para familias que buscan calidad de vida, seguridad y comodidad en una de las zonas más cotizadas de Culiacán. ¡No dejes pasar esta oportunidad!`,
        features: [
            'Sala amplia con ventilación natural',
            'Comedor con espacio para 6 personas',
            'Cocina integral totalmente equipada',
            '3 recámaras con closets amplios',
            '3.5 baños completos',
            'Estacionamiento techado para 2 autos',
            'Patio trasero',
            '2 pisos de diseño moderno',
            'Protecciones en ventanas',
            'Calentador de gas',
            'Instalación para minisplit',
            'Closets en todas las recámaras'
        ],
        amenities: [
            'Seguridad 24/7',
            'Área de juegos',
            'Parques',
            'Vigilancia',
            'Acceso controlado',
            'Calles pavimentadas'
        ],
        photoCount: 22,
        sourcePhotosDir: '/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS/casa renta san francisco sur la primavera inmuebles24'
    };

    // Generar con PropertyPageGenerator (isRental = true)
    const generator = new PropertyPageGenerator(true);

    try {
        const filename = await generator.generateIndividualPage(config);
        console.log(`\n✅ Página generada exitosamente: ${filename}`);

        console.log('\n📋 Resumen:');
        console.log(`   • Precio: ${config.price}/mes`);
        console.log(`   • Recámaras: ${config.bedrooms}`);
        console.log(`   • Baños: ${config.bathrooms}`);
        console.log(`   • M² construcción: ${config.area}`);
        console.log(`   • M² terreno: ${config.landArea}`);
        console.log(`   • Fotos: ${config.photoCount}`);
        console.log(`   • Tipo: RENTA (badge naranja)`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();
