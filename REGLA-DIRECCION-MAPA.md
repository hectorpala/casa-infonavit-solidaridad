# ⚠️ REGLA CRÍTICA - EXTRACCIÓN DE DIRECCIÓN

## 🎯 REGLA DE ORO

**LA DIRECCIÓN SE TOMA DE LA QUE APARECE ARRIBA DEL MAPA EN LA PUBLICACIÓN DE INMUEBLES24**

## 📋 Casos Documentados

### ❌ CASO INCORRECTO - Perisur (Property ID: 142987188)

**URL:** https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-fraccionamiento-perisur-142987188.html

**Dirección CORRECTA arriba del mapa:**
```
Nogal Bosque, Fraccionamiento Perisur, Culiacán
```

**Dirección INCORRECTA scrapeada:**
```
Prol. Álvaro Obregón 768, Nogal Bosque, Culiacán, Sinaloa
```

**Problema:** El scraper tomó la dirección de la oficina inmobiliaria que aparece en la DESCRIPCIÓN, no la dirección que está ARRIBA DEL MAPA.

**Root cause:** El algoritmo da prioridad alta a direcciones con número + nombre de calle, pero NO verifica si esa dirección realmente está ARRIBA del mapa o si está en otro lugar de la página (como la descripción).

## 🔧 SOLUCIÓN IMPLEMENTADA

**Fecha implementación:** 2025-10-26 (mismo día del problema)

### Sistema de Scoring Inteligente

Se implementó la función `scoreAddressCandidate()` que evalúa cada candidata de dirección con un sistema de puntos:

#### ✅ PUNTOS POSITIVOS (prioriza encabezados):
- **+20 pts**: Hermano directo del iframe (elemento inmediato arriba del mapa)
- **+15 pts**: Elemento `<h1>` (título principal)
- **+12 pts**: Elemento `<h2>` (subtítulo)
- **+10 pts**: Elemento `<h3>`
- **+8 pts**: Elemento `<h4>` o `<p>` corto (<100 chars)
- **+8 pts**: Contiene "Fraccionamiento"
- **+6 pts**: Contiene "Colonia"
- **+5 pts**: Contiene "Residencial"
- **+3 pts por coma**: Múltiples componentes de dirección
- **+5 pts**: Texto conciso (20-80 chars)

#### ⚠️ PENALIZACIONES (descarta descripciones):
- **-8 pts**: Tiene número + nombre de calle (ej: "Prol. Álvaro Obregón 768")
  - Razón: Direcciones completas suelen ser de oficinas inmobiliarias
- **-15 pts**: Texto largo (>150 chars)
- **-25 pts**: Texto muy largo (>200 chars)
- **-10 pts**: Está dentro de un contenedor con texto >500 chars (descripción)

### Resultado

El scraper ahora:
1. ✅ Encuentra TODAS las direcciones candidatas antes del mapa
2. ✅ Calcula score para cada una según contexto HTML
3. ✅ Muestra ranking de top 5 candidatas con scores
4. ✅ Selecciona la candidata con MAYOR SCORE
5. ✅ Prioriza elementos de encabezado sobre texto en descripciones
6. ✅ Penaliza direcciones completas que probablemente sean de oficinas

### Ejemplo de output:

```
🗺️  Encontradas 3 dirección(es) cerca del mapa de Google
📊 Ranking de candidatas:
   1. [26 pts] Nogal Bosque, Fraccionamiento Perisur, Culiacán
   2. [8 pts] Prol. Álvaro Obregón 768, Nogal Bosque
   3. [5 pts] Culiacán, Sinaloa
🏆 GANADORA: [26 pts] H3
✅ Dirección final seleccionada: "Nogal Bosque, Fraccionamiento Perisur, Culiacán, Sinaloa"
```

## 📝 NOTA IMPORTANTE

**Fecha problema:** 2025-10-26
**Usuario:** Hector
**Instrucción original:** "la puta direccion se toma arriba del mapa de la publica"
**Solución:** Implementado mismo día (Commit a604483)

Esta regla NO debe olvidarse. El sistema de scoring garantiza que SIEMPRE se priorice la dirección que aparece en encabezados/títulos cerca del mapa, y NO direcciones de oficinas en descripciones.
