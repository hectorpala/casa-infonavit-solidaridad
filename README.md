# Casa Solidaridad - Landing Page

Una hermosa landing page para la venta de una casa en Solidaridad, Quintana Roo.

## Estructura del Proyecto

```
landing-casa-solidaridad/
├── index.html          # Página principal
├── styles.css          # Estilos CSS responsive
├── script.js           # JavaScript para interactividad
├── images/             # Carpeta para las fotos de la casa
│   ├── casa-principal.jpg
│   ├── exterior.jpg
│   ├── sala.jpg
│   ├── cocina.jpg
│   ├── recamara.jpg
│   ├── bano.jpg
│   └── jardin.jpg
└── README.md           # Este archivo
```

## Características

- **Diseño Responsive**: Se adapta a todos los dispositivos (móvil, tablet, desktop)
- **Galería de Fotos**: Visualización elegante de las imágenes de la casa
- **Integración WhatsApp**: Botón directo para contactar por WhatsApp
- **Información Detallada**: Características, precio y detalles de la propiedad
- **Animaciones Suaves**: Efectos visuales modernos y profesionales

## Configuración

### 1. Agregar las Fotos

Coloca las siguientes imágenes en la carpeta `images/`:
- `casa-principal.jpg` - Foto principal de la casa (recomendado: 800x600px)
- `exterior.jpg` - Vista exterior
- `sala.jpg` - Sala de estar
- `cocina.jpg` - Cocina
- `recamara.jpg` - Recámara principal
- `bano.jpg` - Baño
- `jardin.jpg` - Jardín

### 2. Personalizar la Información

Edita el archivo `index.html` para personalizar:

**Información de Contacto (línea ~132):**
```html
<a href="https://wa.me/5215551234567?text=Hola,%20me%20interesa%20la%20casa%20en%20venta%20que%20vi%20en%20su%20página%20web" 
```
- Cambia `5215551234567` por tu número de WhatsApp (formato: código país + número)

**Información de la Casa (líneas ~102-117):**
- Superficie
- Terreno
- Año de construcción
- Servicios
- etc.

**Precio (línea ~121):**
```html
<div class="price">$2,500,000</div>
```

**Información de Contacto (líneas ~135-137):**
- Dirección
- Teléfono
- Email

## Despliegue en GitHub Pages

### 1. Crear Repositorio
```bash
git init
git add .
git commit -m "Initial commit: Casa Solidaridad landing page"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/casa-solidaridad.git
git push -u origin main
```

### 2. Activar GitHub Pages
1. Ve a tu repositorio en GitHub
2. Clicks en "Settings"
3. Scroll down a "Pages"
4. En "Source", selecciona "Deploy from a branch"
5. Selecciona "main" branch y "/ (root)"
6. Click "Save"

Tu sitio estará disponible en: `https://TU_USUARIO.github.io/casa-solidaridad`

## Personalización Avanzada

### Cambiar Colores
En `styles.css`, busca estas variables para cambiar el esquema de colores:
- Azul principal: `#2563eb`
- Verde (botones): `#059669`
- Gris oscuro: `#1e293b`

### Agregar Más Secciones
Puedes agregar nuevas secciones como:
- Mapa de ubicación
- Video tour
- Testimonios
- Financiamiento

### SEO
El sitio incluye meta tags básicos para SEO. Para mejorar:
1. Agrega más meta tags específicos
2. Incluye datos estructurados (JSON-LD)
3. Optimiza las imágenes con alt tags descriptivos

## Soporte

Si necesitas ayuda con la personalización o el despliegue, revisa la documentación de GitHub Pages o contacta al desarrollador.

## Licencia

Este proyecto es de uso libre para la venta de la casa especificada.