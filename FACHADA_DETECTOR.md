# 🏠 Detección Automática de Fachada

Sistema de detección automática de fachada usando Claude Vision API para identificar la mejor foto de portada de propiedades inmobiliarias.

## 📋 Características

- ✅ **Clasificación inteligente con IA**: Usa Claude 3.5 Sonnet para analizar imágenes
- ✅ **Heurísticas por nombre**: Bonus/penalización por palabras clave en nombre de archivo
- ✅ **Detección de señales positivas**: Cielo, calle, cochera, número de casa, volúmenes exteriores
- ✅ **Detección de señales negativas**: Espacios interiores (cocina, baño, recámara, etc.)
- ✅ **Generación automática de cover.jpg**: Optimizado a 1600px, calidad 85%
- ✅ **Reporte JSON completo**: Rankings, scores y razones de cada imagen
- ✅ **Integración automática**: Se ejecuta al subir propiedades con property-page-generator

## 🚀 Instalación

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar API Key**:
   - Copia `.env.example` a `.env`
   - Obtén tu API key en: https://console.anthropic.com/
   - Agrega tu API key al archivo `.env`:
     ```
     ANTHROPIC_API_KEY=tu_api_key_real_aqui
     ```

## 📝 Uso

### Opción 1: Integración automática (recomendado)

Al subir una propiedad nueva con `property-page-generator.js`, la detección de fachada se ejecuta automáticamente:

```javascript
const PropertyPageGenerator = require('./automation/property-page-generator');

const config = {
    key: 'mi-propiedad',
    title: 'Casa en Venta',
    fotos_origen: '/ruta/a/fotos',
    // ... otros campos
};

const generator = new PropertyPageGenerator(false);
await generator.generate(config);

// ✅ Al procesar las fotos, se genera automáticamente:
// - images/mi-propiedad/cover.jpg (portada optimizada)
// - images/mi-propiedad/resultados.json (análisis completo)
```

### Opción 2: Usar directamente el módulo

```javascript
const { setCoverFromBatch } = require('./automation/fachada-detector');

// Analizar carpeta y generar cover.jpg
const result = await setCoverFromBatch('./images/mi-propiedad', './images/mi-propiedad');

console.log('Cover:', result.coverPath);
console.log('Ganador:', result.winner.file);
console.log('Score:', result.winner.finalScore);
console.log('Fallback:', result.fallback);
```

### Opción 3: Script de prueba

```bash
# Con carpeta por defecto (fixtures/fotos)
npm run test:fachada

# Con carpeta personalizada
npm run test:fachada ./images/acacia-kenya
```

## 📊 Outputs Generados

### 1. `cover.jpg`
- Imagen optimizada de la fachada seleccionada
- Máximo 1600px en lado mayor
- Calidad JPEG 85%
- Lista para usar como portada

### 2. `resultados.json`
```json
{
  "cover": "cover.jpg",
  "selected_from": "01_fachada.jpg",
  "fallback": false,
  "threshold": 0.72,
  "ranked": [
    {
      "file": "01_fachada.jpg",
      "score": 0.89,
      "raw": {
        "is_fachada": true,
        "score": 0.85,
        "reasons": "Vista frontal completa...",
        "detected": {
          "sky": true,
          "calle/banqueta": true,
          "cochera/portón": true,
          "numero_casa": false,
          "volumen_exterior": true
        },
        "anti_signals": []
      }
    }
  ]
}
```

## 🎯 Sistema de Scoring

### Score Base (0.0 - 1.0)
Asignado por Claude Vision basado en:
- Presencia de señales positivas (cielo, calle, cochera, etc.)
- Ausencia de señales negativas (interiores)
- Calidad y claridad de la vista frontal

### Ajustes por Nombre de Archivo
- **+0.10**: Contiene `fachada`, `frente`, `front`, `exterior`, `portada`, `cover`
- **-0.20**: Contiene `interior`, `bath`, `baño`, `kitchen`, `cocina`, `room`, `recamara`

### Bonus por Detección
- **+0.05**: Si tiene ≥2 de: cielo, calle/banqueta, cochera/portón, volumen_exterior

### Penalización
- **-0.10**: Si detecta anti-señales de interiores

### Umbral de Aceptación
- **≥0.72**: Fachada válida (fallback = false)
- **<0.72**: Mejor disponible pero puede no ser ideal (fallback = true)

## 📸 Ejemplo de Análisis

```
🏆 === TOP 5 CANDIDATOS ===

🥇 1. 01_fachada.jpg
   Score: 0.890 (raw: 0.82, bonus: 0.10, detect: 0.05, penalty: 0.00)
   Razón: Vista frontal completa con cielo, calle y cochera visible

🥈 2. 02_exterior.jpg
   Score: 0.750 (raw: 0.70, bonus: 0.10, detect: 0.00, penalty: -0.05)
   Razón: Vista exterior parcial, falta contexto de calle

🥉 3. 09_cochera.jpg
   Score: 0.650 (raw: 0.65, bonus: 0.00, detect: 0.00, penalty: 0.00)
   Razón: Enfoque en cochera, no muestra fachada completa

   4. 10_patio.jpg
   Score: 0.480 (raw: 0.48, bonus: 0.00, detect: 0.00, penalty: 0.00)
   Razón: Vista trasera/patio, no es fachada frontal

   5. 03_sala.jpg
   Score: 0.150 (raw: 0.15, bonus: 0.00, detect: 0.00, penalty: -0.10)
   Razón: Espacio interior, no aplica como fachada
```

## 🔧 Configuración Avanzada

### Cambiar umbral de score
Edita `automation/fachada-detector.js`:
```javascript
const FACHADA_SCORE_MIN = 0.72; // Cambiar a tu umbral preferido
```

### Cambiar calidad de cover.jpg
```javascript
const MAX_COVER_SIZE = 1600; // Tamaño máximo en píxeles
const COVER_QUALITY = 85;     // Calidad JPEG (0-100)
```

### Cambiar modelo de Claude
```javascript
const MODEL = 'claude-3-5-sonnet-20241022'; // O el último disponible
```

## ⚠️ Solución de Problemas

### Error: "ANTHROPIC_API_KEY no encontrada"
- Verifica que exista el archivo `.env`
- Verifica que contenga: `ANTHROPIC_API_KEY=tu_key_aqui`
- No uses comillas en el archivo `.env`

### Error: "No se encontraron imágenes"
- Verifica que la carpeta tenga archivos `.jpg`, `.jpeg`, `.png` o `.webp`
- Verifica permisos de lectura en la carpeta

### Fallback = true (score < 0.72)
- El sistema seleccionó la mejor imagen disponible
- Puede no ser una fachada ideal
- Revisa manualmente si la imagen es apropiada
- Considera agregar más fotos exteriores

## 📚 Archivos del Sistema

```
automation/
├── fachada-detector.js       # Módulo principal
├── property-page-generator.js # Integración automática
└── templates/                 # Templates HTML

scripts/
└── test-fachada.js           # Script de prueba

fixtures/
└── fotos/                     # Fotos de ejemplo para testing

.env.example                   # Template de configuración
.env                          # TU configuración (no subir a git)
```

## 🎓 Instrucciones Rápidas

1. **Configurar**: Copia `.env.example` a `.env` y agrega tu API key
2. **Probar**: `npm run test:fachada`
3. **Usar**: Ya está integrado en `property-page-generator.js` automáticamente

---

**Desarrollado para:** Hector es Bienes Raíces
**Tecnología:** Claude 3.5 Sonnet + Sharp
**Versión:** 1.0.0
