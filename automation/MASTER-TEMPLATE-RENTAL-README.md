# 🏠 MASTER TEMPLATE RENTAL - Sistema de Generación de Páginas de RENTA

## ⚡ **RESUMEN EJECUTIVO (30 SEGUNDOS)**

```javascript
// Generar página de RENTA completa en 3 líneas:
const generator = new PropertyPageGenerator(false);
const html = generator.generateFromMasterTemplateRental({
    title: 'Casa en Renta Privanzas Natura',
    price: '$25,000',
    slug: 'privanzas-natura-renta',
    location: 'Privanzas Natura, Culiacán',
    bedrooms: 3, bathrooms: 2, photoCount: 12,
    furnishedStatus: 'Amueblada'
});
fs.writeFileSync('casa-renta-privanzas-natura.html', html);
```

**Resultado:** Página completa con carrusel, lightbox, sticky bar, animations, share buttons, SEO, y badge naranja.

**Diferencias vs VENTA:** ❌ Sin calculadora | 🟠 Badge naranja `#ff6a00` | ✅ Badge "Amueblada"

---

## 📋 **OVERVIEW**

Template completo para generar páginas de **CASAS EN RENTA** con TODAS las características modernas del sistema de VENTA, pero adaptado para rentas.

**Inspirado en:** `inmuebles24culiacanscraper.js` (template más completo y robusto del proyecto)

**Template ubicación:** `automation/templates/master-template-rental.html`

**Documentado en:** `CLAUDE.md` líneas 289-432

---

## ✨ **CARACTERÍSTICAS INCLUIDAS**

### 🎨 **1. Diseño Completo**
- ✅ Hero con carrusel de fotos (todas las fotos de la propiedad)
- ✅ Badge NARANJA (#ff6a00) para RENTA
- ✅ Features section compacta estilo Zillow
- ✅ Details section con info badges
- ✅ Contact section
- ✅ Lightbox gallery expandible
- ✅ Share buttons (WhatsApp, Facebook, Email, Copy)

### 🟠 **2. Diferencias con VENTA**
| Característica | VENTA (Verde) | RENTA (Naranja) |
|---------------|--------------|----------------|
| **Badge color** | `#10b981` (verde) | `#ff6a00` (naranja) |
| **Precio label** | "En Venta" | "Renta Mensual" |
| **Precio format** | `$X,XXX,XXX` | `$XX,XXX/mes` |
| **Price detail** | "Se acepta contado y créditos" | "Depósito y primer mes requeridos" |
| **Schema.org @type** | `SingleFamilyResidence` | `Accommodation` |
| **Schema priceSpec** | N/A | `unitText: "MONTH"` |
| **Calculadora** | ✅ Incluida | ❌ Eliminada |
| **Badge extra** | N/A | ✅ `{{FURNISHED_STATUS}}` |

### 🧩 **3. Modern Features (TODAS incluidas)**
- ✅ **Sticky Price Bar** - Barra fija naranja al hacer scroll
- ✅ **Scroll Animations** - Fade-in suave para todas las secciones
- ✅ **Haptic Feedback** - Vibración móvil en interacciones
- ✅ **Lightbox Gallery** - Galería expandible con navegación teclado/flechas
- ✅ **Share Buttons** - WhatsApp, Facebook, Email, Copy link
- ✅ **Responsive Design** - Mobile-first, optimizado para todos los dispositivos
- ✅ **SEO Completo** - Meta tags, Schema.org, Open Graph

### ❌ **4. Características NO incluidas (vs VENTA)**
- ❌ **Calculadora Hipotecaria** - No tiene sentido para rentas
- ❌ **Mapa con marcador personalizado** - (Se puede agregar después si se necesita)

---

## 📦 **PLACEHOLDERS DISPONIBLES**

### **Información Básica**
```javascript
{{TITLE}}                  // Casa en Renta Privanzas Natura
{{PRICE}}                  // $25,000
{{PRICE_NUMBER}}           // 25000 (sin formato para Schema.org)
{{SLUG}}                   // privanzas-natura-renta
```

### **Ubicación**
```javascript
{{LOCATION}}               // Privanzas Natura, Culiacán, Sinaloa
{{LOCATION_SHORT}}         // Privanzas Natura
{{FULL_ADDRESS}}           // Calle Ébano 123, Privanzas Natura, 80000 Culiacán, Sin.
{{STREET_ADDRESS}}         // Calle Ébano 123
{{ADDRESS_LOCALITY}}       // Privanzas Natura
{{POSTAL_CODE}}            // 80000
{{LATITUDE}}               // 24.8091
{{LONGITUDE}}              // -107.3940
```

### **Características**
```javascript
{{BEDROOMS}}               // 3
{{BATHROOMS}}              // 2
{{PARKING_SPACES}}         // 2
{{CONSTRUCTION_AREA}}      // 180
{{LAND_AREA}}              // 200
{{FLOORS}}                 // 2
{{TOTAL_ROOMS}}            // 5 (total de cuartos)
{{FURNISHED_STATUS}}       // Amueblada / Semi-amueblada / Sin amueblar
```

### **Fotos y Carrusel**
```javascript
{{PHOTO_COUNT}}            // 12
{{CAROUSEL_SLIDES}}        // HTML generado automáticamente
{{CAROUSEL_DOTS}}          // HTML generado automáticamente
{{LIGHTBOX_IMAGES_ARRAY}}  // Array JavaScript ['images/foto-1.jpg', ...]
```

### **SEO y Metadata**
```javascript
{{META_DESCRIPTION}}       // Meta description para SEO
{{OG_DESCRIPTION}}         // Open Graph description
{{SCHEMA_DESCRIPTION}}     // Schema.org description
{{AMENITIES_JSON}}         // JSON array de amenidades
{{HERO_SUBTITLE}}          // Subtítulo del hero
```

### **WhatsApp**
```javascript
{{WHATSAPP_MESSAGE_ENCODED}} // Mensaje URL-encoded para WhatsApp
```

---

## 🚀 **USO DEL TEMPLATE**

### **Método 1: Desde Generador (Recomendado)**

```javascript
const PropertyPageGenerator = require('./automation/generador-de-propiedades');

// Crear instancia para RENTA
const generator = new PropertyPageGenerator(false); // false = venta, true = renta

// Generar HTML desde master template rental
const html = generator.generateFromMasterTemplateRental({
    // Básico
    title: 'Casa en Renta Privanzas Natura',
    price: '$25,000',
    priceNumber: 25000,
    slug: 'privanzas-natura-renta',

    // Ubicación
    location: 'Privanzas Natura, Culiacán, Sinaloa',
    locationShort: 'Privanzas Natura',
    streetAddress: 'Calle Ébano 123',
    addressLocality: 'Privanzas Natura',
    postalCode: '80000',
    latitude: 24.8091,
    longitude: -107.3940,

    // Características
    bedrooms: 3,
    bathrooms: 2,
    parkingSpaces: 2,
    constructionArea: 180,
    landArea: 200,
    floors: 2,
    totalRooms: 5,
    furnishedStatus: 'Amueblada', // "Amueblada" | "Semi-amueblada" | "Sin amueblar"

    // Fotos
    photoCount: 12,

    // SEO
    metaDescription: 'Casa amueblada en renta en Privanzas Natura, Culiacán. 3 recámaras, 2 baños, 180m² construcción.',
    ogDescription: 'Casa amueblada en renta en Privanzas Natura, Culiacán. 3 recámaras, 2 baños.',
    schemaDescription: 'Casa amueblada en renta en Privanzas Natura, Culiacán.',
    heroSubtitle: 'Casa amueblada en excelente estado en Privanzas Natura. 3 recámaras, 2 baños, cocina integral, jardín amplio.',

    // Amenidades (JSON)
    amenitiesJson: [
        { "@type": "LocationFeatureSpecification", "name": "Amueblada", "value": true },
        { "@type": "LocationFeatureSpecification", "name": "Cocina Integral", "value": true },
        { "@type": "LocationFeatureSpecification", "name": "Jardín", "value": true },
        { "@type": "LocationFeatureSpecification", "name": "Estacionamiento", "value": true }
    ]
});

// Guardar HTML
fs.writeFileSync('casa-renta-privanzas-natura.html', html, 'utf8');
```

### **Método 2: Reemplazo Manual de Placeholders**

```javascript
const fs = require('fs');

// Leer template
let html = fs.readFileSync('automation/templates/master-template-rental.html', 'utf8');

// Reemplazos básicos
html = html.replace(/{{TITLE}}/g, 'Casa en Renta Privanzas Natura');
html = html.replace(/{{PRICE}}/g, '$25,000');
html = html.replace(/{{SLUG}}/g, 'privanzas-natura-renta');

// ... más reemplazos ...

// Generar carousel slides dinámicamente
const photoCount = 12;
let carouselSlides = '';
for (let i = 0; i < photoCount; i++) {
    const activeClass = i === 0 ? ' active' : '';
    const loading = i === 0 ? 'eager' : 'lazy';
    carouselSlides += `
                <div class="carousel-slide${activeClass}" data-slide="${i}">
    <img src="images/foto-${i + 1}.jpg"
         alt="casa-renta-privanzas-natura - Vista ${i + 1}"
         loading="${loading}"
         decoding="async"
         onclick="openLightbox(${i})">
                </div>`;
}
html = html.replace('{{CAROUSEL_SLIDES}}', carouselSlides);

// Generar carousel dots
let carouselDots = '';
for (let i = 0; i < photoCount; i++) {
    const activeClass = i === 0 ? ' active' : '';
    carouselDots += `                    <span class="carousel-dot${activeClass}" onclick="goToSlideHero(${i})"></span>\n`;
}
html = html.replace('{{CAROUSEL_DOTS}}', carouselDots);

// Generar lightbox array
const lightboxArray = Array.from({length: photoCount}, (_, i) => `'images/foto-${i+1}.jpg'`).join(',\n        ');
html = html.replace('{{LIGHTBOX_IMAGES_ARRAY}}', lightboxArray);

// Guardar
fs.writeFileSync('casa-renta-privanzas-natura.html', html, 'utf8');
```

---

## 📂 **ESTRUCTURA DE ARCHIVOS**

### **Para RENTA (ROOT):**
```
/
├── casa-renta-privanzas-natura.html  ← HTML principal
├── images/
│   └── privanzas-natura-renta/
│       ├── foto-1.jpg                ← FACHADA (siempre primera)
│       ├── foto-2.jpg
│       └── ...
└── styles.css                        ← CSS compartido (87KB versión completa)
```

### **Tarjeta en index.html (badge naranja):**
```html
<div class="property-card">
    <div class="absolute top-3 right-3 bg-orange-500 ...">
        $25,000/mes
    </div>
    <!-- ... resto de la tarjeta ... -->
    <a href="../casa-renta-privanzas-natura.html" class="from-orange-500 to-orange-600 ...">
        Ver Detalles
    </a>
</div>
```

---

## 🎨 **ESTILOS CRÍTICOS**

### **Badge Naranja (RENTA)**
```css
.price-badge-rental {
    background: linear-gradient(135deg, #ff6a00, #ff8533) !important;
}

.sticky-price-bar {
    background: linear-gradient(135deg, #ff6a00, #ff8533);
}

.price-value {
    background: linear-gradient(135deg, #ff6a00, #ff8533);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
```

### **CTA Buttons (RENTA)**
```css
.cta-button {
    background: linear-gradient(135deg, #ff6a00, #ff8533);
    box-shadow: 0 4px 12px rgba(255, 106, 0, 0.3);
}

.cta-button:hover {
    box-shadow: 0 6px 16px rgba(255, 106, 0, 0.4);
}
```

---

## 🔧 **INTEGRACIÓN CON SISTEMA**

### **Agregar método en generador-de-propiedades.js**

```javascript
class PropertyPageGenerator {
    constructor(forRent = false) {
        this.forRent = forRent;
    }

    /**
     * Genera página HTML desde master template RENTAL
     * @param {Object} config - Configuración de la propiedad
     * @returns {string} HTML completo
     */
    generateFromMasterTemplateRental(config) {
        // Leer template
        const templatePath = path.join(__dirname, 'templates', 'master-template-rental.html');
        let html = fs.readFileSync(templatePath, 'utf8');

        // Reemplazos básicos
        html = html.replace(/{{TITLE}}/g, config.title);
        html = html.replace(/{{PRICE}}/g, config.price);
        html = html.replace(/{{PRICE_NUMBER}}/g, config.priceNumber);
        html = html.replace(/{{SLUG}}/g, config.slug);

        // Ubicación
        html = html.replace(/{{LOCATION}}/g, config.location);
        html = html.replace(/{{LOCATION_SHORT}}/g, config.locationShort || config.location.split(',')[0]);
        html = html.replace(/{{FULL_ADDRESS}}/g, config.fullAddress || config.location);
        html = html.replace(/{{STREET_ADDRESS}}/g, config.streetAddress || '');
        html = html.replace(/{{ADDRESS_LOCALITY}}/g, config.addressLocality || '');
        html = html.replace(/{{POSTAL_CODE}}/g, config.postalCode || '80000');
        html = html.replace(/{{LATITUDE}}/g, config.latitude || 24.8091);
        html = html.replace(/{{LONGITUDE}}/g, config.longitude || -107.3940);

        // Características
        html = html.replace(/{{BEDROOMS}}/g, config.bedrooms || 'N/A');
        html = html.replace(/{{BATHROOMS}}/g, config.bathrooms || 'N/A');
        html = html.replace(/{{PARKING_SPACES}}/g, config.parkingSpaces || 'N/A');
        html = html.replace(/{{CONSTRUCTION_AREA}}/g, config.constructionArea || 'N/A');
        html = html.replace(/{{LAND_AREA}}/g, config.landArea || 'N/A');
        html = html.replace(/{{FLOORS}}/g, config.floors || 'N/A');
        html = html.replace(/{{TOTAL_ROOMS}}/g, config.totalRooms || config.bedrooms + 2);
        html = html.replace(/{{FURNISHED_STATUS}}/g, config.furnishedStatus || 'Sin especificar');

        // Fotos
        html = html.replace(/{{PHOTO_COUNT}}/g, config.photoCount);

        // Generar carousel slides dinámicamente
        let carouselSlides = '';
        for (let i = 0; i < config.photoCount; i++) {
            const activeClass = i === 0 ? ' active' : '';
            const loading = i === 0 ? 'eager' : 'lazy';
            carouselSlides += `
                <div class="carousel-slide${activeClass}" data-slide="${i}">
                    <img src="images/${config.slug}/foto-${i + 1}.jpg"
                         alt="${config.slug} - Vista ${i + 1}"
                         loading="${loading}"
                         decoding="async"
                         onclick="openLightbox(${i})">
                </div>`;
        }
        html = html.replace('{{CAROUSEL_SLIDES}}', carouselSlides.trim());

        // Generar carousel dots
        let carouselDots = '';
        for (let i = 0; i < config.photoCount; i++) {
            const activeClass = i === 0 ? ' active' : '';
            carouselDots += `                    <span class="carousel-dot${activeClass}" onclick="goToSlideHero(${i})"></span>\n`;
        }
        html = html.replace('{{CAROUSEL_DOTS}}', carouselDots.trim());

        // Generar lightbox array
        const lightboxArray = Array.from({length: config.photoCount}, (_, i) =>
            `            {src: 'images/${config.slug}/foto-${i+1}.jpg', alt: '${config.title} - Foto ${i+1}'}`
        ).join(',\n');
        html = html.replace('{{LIGHTBOX_IMAGES_ARRAY}}', lightboxArray);

        // SEO
        html = html.replace(/{{META_DESCRIPTION}}/g, config.metaDescription || '');
        html = html.replace(/{{OG_DESCRIPTION}}/g, config.ogDescription || config.metaDescription || '');
        html = html.replace(/{{SCHEMA_DESCRIPTION}}/g, config.schemaDescription || config.metaDescription || '');
        html = html.replace(/{{HERO_SUBTITLE}}/g, config.heroSubtitle || '');
        html = html.replace(/{{AMENITIES_JSON}}/g, JSON.stringify(config.amenitiesJson || [], null, 10));

        // WhatsApp
        const whatsappMsg = encodeURIComponent(
            `Hola! Me interesa la propiedad en renta:\n${config.title}\n${config.price}/mes\n${config.location}`
        );
        html = html.replace(/{{WHATSAPP_MESSAGE_ENCODED}}/g, whatsappMsg);

        return html;
    }
}
```

---

## 📊 **COMPARACIÓN: TEMPLATE RENTAL vs SCRAPER INMUEBLES24**

| Característica | Master Template Rental | Inmuebles24 Scraper |
|---------------|----------------------|-------------------|
| **Carrusel Hero** | ✅ Completo | ✅ Completo |
| **Lightbox Gallery** | ✅ Con navegación | ✅ Con navegación |
| **Sticky Price Bar** | ✅ Naranja | ✅ Verde/Naranja |
| **Scroll Animations** | ✅ Fade-in | ✅ Fade-in |
| **Haptic Feedback** | ✅ Móvil | ✅ Móvil |
| **Share Buttons** | ✅ 4 opciones | ✅ 4 opciones |
| **Calculadora** | ❌ Eliminada | ✅ Incluida |
| **Mapa Interactivo** | ❌ No incluido | ✅ Con marcador custom |
| **InfoWindow Carrusel** | ❌ No incluido | ✅ En mapa modal |
| **Multi-ciudad** | ❌ Manual | ✅ Automático |
| **Auto-commit Git** | ❌ Manual | ✅ Automático |
| **CRM Vendedores** | ❌ No | ✅ Integrado |

---

## 🎯 **PRÓXIMOS PASOS**

### **✅ Listo para usar:**
1. Template rental completo y funcional
2. Todos los placeholders documentados
3. Estilos naranjas aplicados
4. Sin calculadora hipotecaria

### **🔧 Opcional (agregar después):**
1. **Mapa interactivo** - Copiar función `generateMapWithCustomMarker()` del scraper
2. **InfoWindow con carrusel** - Copiar función `showPropertyCard()` del scraper
3. **Auto-add al mapa modal** - Copiar función `addPropertyToMap()` del scraper
4. **Sistema multi-ciudad** - Adaptar detección de ciudad
5. **Scraper automático** - Crear `rental-scraper.js` para sitios de rentas

---

## 📖 **DOCUMENTACIÓN ADICIONAL**

- **Template VENTA:** `automation/templates/master-template.html`
- **Scraper Inmuebles24:** `inmuebles24culiacanscraper.js`
- **Generador propiedades:** `automation/generador-de-propiedades.js`
- **CSS completo:** `styles.css` (87KB - debe estar actualizado)

---

## 🚨 **IMPORTANTE**

1. **CSS actualizado:** Siempre copiar `styles.css` desde una propiedad completa
2. **Foto 1 = FACHADA:** La primera foto SIEMPRE debe ser la fachada
3. **Badge naranja:** Color `#ff6a00` para diferenciación visual
4. **Precio formato:** `$XX,XXX/mes` (incluir "/mes")
5. **Schema.org:** Usar `@type: "Accommodation"` y `unitText: "MONTH"`

---

**✨ Template listo para generar páginas profesionales de RENTA con todas las características modernas! ✨**
