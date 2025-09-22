# 🏠 Sistema de Automatización de Páginas de Propiedades

Sistema automatizado para generar páginas de propiedades optimizadas basado en el template de Infonavit Solidaridad.

## 🚀 Características

- ✅ **Generación automática de HTML** con template optimizado
- ✅ **Escaneo automático de fotos** y generación de carousels
- ✅ **JavaScript optimizado** con scope global y performance
- ✅ **Mensajes WhatsApp personalizados** por propiedad
- ✅ **Optimizaciones de performance** integradas
- ✅ **SEO y Schema.org** automático
- ✅ **Responsive design** y accesibilidad

## 📁 Estructura de Archivos

```
automation/
├── property-page-generator.js    # Generador principal
├── generate-property.js          # Script de uso rápido
├── templates/
│   └── property-template.html    # Template base optimizado
└── README.md                     # Esta documentación

images/
└── [nombre-propiedad]/           # Fotos de cada propiedad
    ├── fachada.jpg
    ├── sala.jpg
    └── ...
```

## 🎯 Uso Rápido

### 1. Generar una propiedad predefinida

```bash
# Generar página de ejemplo
node automation/generate-property.js casa-ejemplo

# Ver propiedades disponibles
node automation/generate-property.js --help
```

### 2. Crear estructura inicial

```bash
node automation/generate-property.js --init
```

### 3. Agregar nueva propiedad

1. **Crear directorio de fotos:**
   ```bash
   mkdir images/mi-nueva-casa
   ```

2. **Agregar fotos** (formatos: jpg, jpeg, png, webp):
   ```
   images/mi-nueva-casa/
   ├── fachada.jpg
   ├── sala.jpg
   ├── cocina.jpg
   ├── recamara1.jpg
   └── bano.jpg
   ```

3. **Editar configuración** en `generate-property.js`:
   ```javascript
   'mi-nueva-casa': {
       key: 'mi-nueva-casa',
       title: 'Casa en Venta $1,500,000 - Mi Nueva Casa',
       subtitle: 'Hermosa casa en excelente ubicación',
       description: 'Casa funcional con todas las comodidades.',
       price: 1500000,
       location: 'Culiacán, Sinaloa',
       bedrooms: 3,
       bathrooms: 2,
       features: ['Cochera', 'Jardín', 'Cocina integral'],
       canonicalURL: 'https://casasenventa.info/casa-venta-mi-nueva-casa/'
   }
   ```

4. **Generar página:**
   ```bash
   node automation/generate-property.js mi-nueva-casa
   ```

## 🛠️ Uso Avanzado

### Generador Programático

```javascript
const PropertyPageGenerator = require('./automation/property-page-generator');

const generator = new PropertyPageGenerator();

const propertyConfig = {
    key: 'casa-premium',
    title: 'Casa Premium en Venta',
    subtitle: 'Excelente ubicación y acabados de lujo',
    description: 'Casa con acabados premium en zona exclusiva',
    price: 2500000,
    location: 'Las Quintas, Culiacán',
    bedrooms: 4,
    bathrooms: 3,
    features: ['Alberca', 'Jardín amplio', 'Cochera doble'],
    canonicalURL: 'https://casasenventa.info/casa-premium/'
};

const filepath = generator.generate(propertyConfig);
console.log(`Página generada: ${filepath}`);
```

## 📸 Gestión de Fotos

### Nombres Recomendados

Para mejor detección automática de captions:

```
fachada.jpg          → "Fachada Principal"
sala.jpg             → "Sala"
comedor.jpg          → "Comedor"  
cocina.jpg           → "Cocina"
recamara.jpg         → "Recámara"
bano.jpg             → "Baño"
jardin.jpg           → "Jardín"
garage.jpg           → "Garage"
estacionamiento.jpg  → "Estacionamiento"
```

### Optimización de Fotos

```bash
# Redimensionar fotos para web
for img in *.jpg; do
    magick "$img" -quality 85 -resize 1200x "optimized_$img"
done

# Convertir a WebP para mejor performance
for img in *.jpg; do
    magick "$img" -quality 80 "${img%.jpg}.webp"
done
```

## ⚙️ Configuración

### Template Personalizado

Editar `automation/templates/property-template.html` para cambiar:

- Estructura HTML
- Estilos personalizados
- Campos adicionales
- Optimizaciones específicas

### Variables Disponibles

```html
{{PROPERTY_TITLE}}        - Título completo
{{PROPERTY_SUBTITLE}}     - Subtítulo descriptivo  
{{PROPERTY_DESCRIPTION}}  - Descripción detallada
{{PROPERTY_PRICE}}        - Precio formateado ($1,500,000)
{{PROPERTY_PRICE_NUMBER}} - Precio numérico (1500000)
{{PROPERTY_LOCATION}}     - Ubicación
{{PROPERTY_BEDROOMS}}     - Número de recámaras
{{PROPERTY_BATHROOMS}}    - Número de baños
{{PROPERTY_FEATURES}}     - Lista de características
{{HERO_CAROUSEL}}         - HTML del carousel hero
{{GALLERY_CAROUSEL}}      - HTML del carousel galería
{{CAROUSEL_JAVASCRIPT}}   - JavaScript de carousels
{{WHATSAPP_URL}}          - URL personalizada de WhatsApp
{{CANONICAL_URL}}         - URL canónica
{{OG_IMAGE}}              - Imagen principal para Open Graph
{{PROPERTY_KEY}}          - Clave de identificación
```

## 🎨 Características Incluidas

### Optimizaciones de Performance
- ✅ Font preloading y display optimization
- ✅ DNS prefetch para recursos externos
- ✅ Lazy loading en imágenes
- ✅ JavaScript diferido con DOMContentLoaded
- ✅ Scope global para funciones de carousel

### SEO y Accesibilidad
- ✅ Meta tags completos
- ✅ Schema.org structured data
- ✅ Open Graph para redes sociales
- ✅ Alt text automático en imágenes
- ✅ ARIA labels en controles

### Funcionalidad
- ✅ Dual carousel (hero + galería) independientes
- ✅ Touch/swipe support móvil
- ✅ Navegación por teclado
- ✅ Calculadora de hipoteca integrada
- ✅ Botón flotante de WhatsApp
- ✅ Mensajes WhatsApp personalizados

## 🔧 Troubleshooting

### Problema: "No photos found"
```bash
# Verificar que el directorio existe
ls -la images/nombre-propiedad/

# Verificar formatos compatibles
ls images/nombre-propiedad/*.{jpg,jpeg,png,webp}
```

### Problema: "Template file not found"
```bash
# Verificar estructura
ls automation/templates/property-template.html

# Recrear si es necesario
node automation/generate-property.js --init
```

### Problema: JavaScript no funciona
- Verificar que las funciones estén expuestas globalmente
- Comprobar la sintaxis en la consola del navegador
- Verificar que el DOMContentLoaded esté funcionando

## 📈 Próximas Mejoras

- [ ] Integración con CMS
- [ ] Batch processing de múltiples propiedades
- [ ] Optimización automática de imágenes
- [ ] Generación de sitemap automático
- [ ] Integración con analytics
- [ ] Multi-idioma support

## 🤝 Contribución

Para agregar nuevas características:

1. Fork del repositorio
2. Crear branch feature
3. Implementar mejoras
4. Actualizar documentación
5. Crear pull request

## 📞 Soporte

Para soporte técnico:
- Email: hector@bienesraices.mx
- WhatsApp: +52 811 165 2545