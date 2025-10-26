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

## 🔧 SOLUCIÓN REQUERIDA

1. El scraper debe identificar QUÉ texto está VISUALMENTE arriba del iframe del mapa
2. NO debe tomar direcciones de la descripción del inmueble
3. La dirección correcta es la que aparece como ENCABEZADO o TÍTULO cerca del mapa, NO en el cuerpo del texto

## 📝 NOTA IMPORTANTE

**Fecha:** 2025-10-26
**Usuario:** Hector
**Instrucción:** "la puta direccion se toma arriba del mapa de la publica"

Esta regla NO debe olvidarse. Cualquier modificación al scraper debe respetar esta prioridad absoluta.
