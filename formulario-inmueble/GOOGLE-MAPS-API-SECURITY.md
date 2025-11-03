# 🔒 Configuración de Seguridad - Google Maps API Key

## 📋 RESUMEN

Tu API key de Google Maps actualmente está **expuesta en el código** sin restricciones. Esta guía te ayudará a configurar restricciones de seguridad para protegerla.

**API Key actual:** `AIzaSyDKzdyJP29acUNCqHr9klrz-Hz_0tIu7sk`

---

## ⚠️ RIESGOS ACTUALES

Sin restricciones, cualquier persona que vea tu código puede:
- ✅ Ver tu API key en el código fuente
- ✅ Usar tu API key en otros sitios web
- ✅ Generar cargos en tu cuenta de Google Cloud
- ✅ Agotar tu cuota mensual gratuita ($200 USD/mes)

---

## 🛡️ RESTRICCIONES RECOMENDADAS

### 1️⃣ **Restricciones de Aplicación (HTTP Referrers)**

Limita qué sitios web pueden usar tu API key.

**Pasos en Google Cloud Console:**

1. Ve a: https://console.cloud.google.com/google/maps-apis/credentials
2. Haz clic en tu API key: `AIzaSyDKzdyJP29acUNCqHr9klrz-Hz_0tIu7sk`
3. En "Application restrictions" selecciona: **"HTTP referrers (web sites)"**
4. Agrega estos referrers:

```
https://ubicacioncotizar.netlify.app/*
http://localhost:8080/*
http://127.0.0.1:8080/*
```

**Explicación:**
- `https://ubicacioncotizar.netlify.app/*` - Tu sitio en producción
- `http://localhost:8080/*` - Para desarrollo local
- `http://127.0.0.1:8080/*` - Alternativa de localhost

**⚠️ IMPORTANTE:** El `/*` al final permite todas las rutas del dominio.

---

### 2️⃣ **Restricciones de API**

Limita qué APIs de Google puede usar tu key.

**Pasos en Google Cloud Console:**

1. En la misma página de la API key
2. En "API restrictions" selecciona: **"Restrict key"**
3. Selecciona **SOLO** estas APIs:

```
☑ Geocoding API
☑ Maps JavaScript API (si decides usar mapas de Google en el futuro)
```

**Explicación:**
- **Geocoding API:** Convierte direcciones → coordenadas (lo que usas actualmente)
- **Maps JavaScript API:** Para mostrar mapas de Google (opcional, actualmente usas OpenStreetMap)

---

### 3️⃣ **Configurar Cuotas y Alertas**

Protege tu cuenta de cargos inesperados.

**Pasos en Google Cloud Console:**

1. Ve a: https://console.cloud.google.com/google/maps-apis/quotas
2. Selecciona: **Geocoding API**
3. Configura límites:

```
Requests per day: 1000
Requests per minute: 50
```

**Configurar Alertas de Facturación:**

1. Ve a: https://console.cloud.google.com/billing
2. En el menú lateral: **"Budgets & alerts"**
3. Crea una alerta:
   - Budget: $50 USD/mes
   - Email de alerta: tu email
   - Alertas en: 50%, 90%, 100%

---

## 📊 CUOTAS GRATUITAS DE GOOGLE MAPS

Google ofrece **$200 USD gratis/mes** en créditos para Maps API.

**Geocoding API - Precios:**
- **Primeros $200 USD:** Gratis
- **0-100,000 requests/mes:** $5 USD por cada 1,000 requests
- **100,001-500,000 requests/mes:** $4 USD por cada 1,000 requests

**Ejemplo de uso esperado para tu sitio:**
- 100 formularios/día = 100 requests/día
- 3,000 requests/mes ≈ $15 USD/mes
- **Total a pagar:** $0 (cubierto por los $200 gratis)

---

## 🔄 VERIFICAR CONFIGURACIÓN

Después de aplicar las restricciones:

1. **Prueba en producción:**
   ```
   https://ubicacioncotizar.netlify.app/geocoding-map.html
   ```
   ✅ Debería funcionar normalmente

2. **Prueba en localhost:**
   ```
   http://localhost:8080/geocoding-map.html
   ```
   ✅ Debería funcionar normalmente

3. **Prueba desde otro dominio:**
   - Si alguien copia tu API key y la usa en otro sitio
   - ❌ Debería fallar con error de restricción

---

## 🚨 QUÉ HACER SI SE EXPUSO TU API KEY

Si tu API key ya fue expuesta públicamente:

### Opción 1: Regenerar la API Key (Recomendado)

1. Ve a: https://console.cloud.google.com/google/maps-apis/credentials
2. Haz clic en tu API key
3. Click en **"Regenerate Key"**
4. Copia la nueva key
5. Actualiza `js/geocoding.js` línea 9 con la nueva key
6. Aplica restricciones (pasos 1️⃣ y 2️⃣)

### Opción 2: Solo Aplicar Restricciones

Si no detectaste uso indebido:
- Aplica restricciones (pasos 1️⃣ y 2️⃣)
- Monitorea uso en: https://console.cloud.google.com/google/maps-apis/metrics

---

## 📈 MONITOREAR USO

**Dashboard de métricas:**
https://console.cloud.google.com/google/maps-apis/metrics

**Qué revisar:**
- ✅ Requests por día (debería ser < 1000)
- ✅ Requests por mes (debería ser < 30,000)
- ✅ Errores (debería ser < 1%)
- ⚠️ Picos inusuales (indicador de abuso)

---

## 🔐 MEJORES PRÁCTICAS ADICIONALES

### 1. Usar Variable de Entorno (Recomendado para el futuro)

**Problema actual:**
```javascript
// js/geocoding.js línea 9
google: 'AIzaSyDKzdyJP29acUNCqHr9klrz-Hz_0tIu7sk', // ❌ Expuesta en el código
```

**Solución futura (con backend):**
- Crear una función serverless en Netlify
- Guardar API key como variable de entorno
- Hacer requests desde el servidor, no desde el cliente

**Archivo creado:** `.env.example` - Template para variables de entorno

### 2. Rate Limiting en el Frontend

Evitar requests excesivos desde el cliente:

```javascript
// Ejemplo de throttle (ya implementado con debounce)
const geocodeThrottled = debounce(geocodeAddress, 500);
```

### 3. Caché de Resultados

Guardar coordenadas en localStorage para evitar re-geocodificar:

```javascript
// Verificar si ya geocodificamos esta dirección
const cacheKey = `geocode_${fullAddress}`;
const cached = localStorage.getItem(cacheKey);
if (cached) {
    return JSON.parse(cached);
}
```

---

## ✅ CHECKLIST DE SEGURIDAD

- [ ] **Paso 1:** Aplicar restricciones de HTTP referrers
- [ ] **Paso 2:** Aplicar restricciones de API
- [ ] **Paso 3:** Configurar cuota diaria (1000 requests/día)
- [ ] **Paso 4:** Configurar alerta de facturación ($50/mes)
- [ ] **Paso 5:** Verificar que funciona en producción
- [ ] **Paso 6:** Verificar que funciona en localhost
- [ ] **Paso 7:** Monitorear uso durante 1 semana
- [ ] **Paso 8:** (Opcional) Regenerar API key si fue expuesta

---

## 📞 SOPORTE

**Google Cloud Support:**
- Documentación: https://developers.google.com/maps/documentation
- Consola: https://console.cloud.google.com
- Pricing: https://mapsplatform.google.com/pricing

**Costos actuales estimados:**
- Uso esperado: 3,000 requests/mes
- Costo esperado: $0 (cubierto por $200 gratis)
- Sin restricciones: Riesgo de cargos ilimitados ⚠️

---

**Fecha:** 2025-01-03
**Versión:** 1.0.0
**Estado:** ⚠️ API Key sin restricciones - Acción requerida
