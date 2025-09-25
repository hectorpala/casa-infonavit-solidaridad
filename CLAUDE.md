# PROYECTO: Hector es Bienes Raíces - Website

## 🏠 CONTEXTO DEL PROYECTO
Sitio web de bienes raíces con propiedades en Culiacán, Sinaloa. Especializado en compra, remodelación y venta/renta de propiedades.

## 🎯 COMANDOS PRINCIPALES

### AGREGAR NUEVA PROPIEDAD
**Comando usuario:** "Vamos a subir una nueva propiedad"
**Acción:** Usar automation/property-page-generator.js para crear página optimizada

### PUBLICAR CAMBIOS  
**Comando usuario:** "publica ya"
**Acción:** Usar gitops-publicador para deployment directo

## 🔧 SISTEMA DE AUTOMATIZACIÓN

### PropertyPageGenerator
- **Ubicación:** `automation/property-page-generator.js`
- **Templates:** `automation/templates/rental-template.html` y `property-template.html`
- **🤖 AUTOMÁTICO:** Auto-detecta fotos en carpeta PROYECTOS
- **🤖 AUTOMÁTICO:** Ejecuta `automation/optimizar-fotos.sh` sin intervención
- **🤖 AUTOMÁTICO:** Ejecuta `verificar-optimizaciones.sh` pre-publicación
- **Función:** PROCESO 100% AUTOMÁTICO - Solo requiere fotos en PROYECTOS

### Estructura de Fotos
- **Origen:** `/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS/[carpeta]/`
- **Destino:** `images/[property-slug]/`
- **🤖 PROCESO 100% AUTOMÁTICO:**
  1. Auto-detecta carpeta en PROYECTOS por nombre/título
  2. Copia + optimiza automáticamente (PNG→JPG, 85% calidad, 1200px max)
  3. Verifica optimizaciones automáticamente
  4. Muestra "READY TO PUBLISH" si todo correcto
- **Generación:** Carruseles automáticos con fotos optimizadas

## 📄 ARCHIVOS CRÍTICOS

### Páginas Principales
- `culiacan/index.html` - **PÁGINA PRINCIPAL QUE SIRVE EL SITIO**
- `index.html` - Backup/landing principal
- `casa-[tipo]-[nombre].html` - Páginas individuales de propiedades

### Estilos y Scripts
- `culiacan/infonavit-solidaridad/styles.css` - CSS principal
- Carruseles JavaScript embebidos en cada página

## ⚙️ OPTIMIZACIONES IMPLEMENTADAS
- SEO completo (meta tags, structured data, Open Graph)
- Performance (preloading, DNS prefetch, lazy loading)
- WhatsApp integration con mensajes personalizados
- Dual carousel system (hero + gallery)
- Responsive design
- Rental calculators para propiedades de renta

## 🚀 DEPLOYMENT
- **Servicio:** GitHub Pages
- **URL Principal:** https://casasenventa.info (NO zasakitchenstudio.mx)
- **Comando:** "publica ya" → gitops-publicador → merge directo a main
- **Verificación:** Siempre verificar en casasenventa.info después del deployment

## 📱 CARACTERÍSTICAS ESPECIALES
- Botones WhatsApp flotantes personalizados por propiedad
- Calculadoras de renta interactivas
- Carruseles touch/swipe para móvil
- Optimización de imágenes automática
- Cache busting para actualizaciones

## 🎨 CONVENCIONES DE CÓDIGO
- **Archivos HTML:** casa-[venta/renta]-[slug].html
- **Carpetas imágenes:** images/[property-slug]/
- **Clase CSS:** .property-card para listings
- **WhatsApp:** Mensajes URL-encoded específicos por propiedad

## 📋 PROCESO VERIFICACIÓN
1. Revisar fotos y descripciones precisas
2. Confirmar fachada como imagen principal  
3. Validar aparición en ambos index
4. Verificar WhatsApp y contacto
5. Publicar con "publica ya"
6. **IMPORTANTE**: Verificar en https://casasenventa.info que se vea la propiedad

## 🔧 COMANDOS CLAVE
- **Invocar instrucciones**: "Lee INSTRUCCIONES_AGREGAR_PROPIEDADES.md"
- **Identificar fotos**: "puedes identificar las fotos osea saber que son?"
- **Corregir descripciones**: "si"
- **Publicar**: "publica ya"

## 📈 HISTORIAL DE ÉXITO
- **Casa Privada Puntazul**: Commit 48ec161 ✅
- **Casa Zona Dorada**: Commit 7df9bcf ✅