# 🚀 GUÍA RÁPIDA - Configurar Google Apps Script para Acceso Público

## 📋 RESUMEN
Sigue estos pasos EN ORDEN para hacer que tu Google Apps Script sea accesible públicamente.

**Tiempo estimado:** 10-15 minutos

---

## ✅ PASO 1: HABILITAR APIs EN GOOGLE CLOUD PLATFORM (5 min)

### Pestaña ya abierta: APIs Library
**URL:** https://console.cloud.google.com/apis/library?project=formulario-inmuebles

### Acciones:

**1.1 Habilitar Google Sheets API:**
1. En el buscador, escribe: `Google Sheets API`
2. Click en el resultado "Google Sheets API"
3. Click en botón azul **"HABILITAR"** (si no está ya habilitada)
4. Esperar 10 segundos a que confirme

**1.2 Habilitar Gmail API:**
1. Click en "← Volver" o abrir nueva pestaña en: https://console.cloud.google.com/apis/library?project=formulario-inmuebles
2. En el buscador, escribe: `Gmail API`
3. Click en el resultado "Gmail API"
4. Click en botón azul **"HABILITAR"** (si no está ya habilitada)
5. Esperar 10 segundos a que confirme

✅ **Checkpoint:** Ambas APIs deben mostrar "API habilitada" con checkmark verde

---

## ✅ PASO 2: CONFIGURAR OAUTH CONSENT SCREEN (5 min)

### Pestaña ya abierta: OAuth Consent Screen
**URL:** https://console.cloud.google.com/apis/credentials/consent?project=formulario-inmuebles

### Acciones:

**2.1 Verificar estado actual:**
- Buscar el estado de publicación (arriba): ¿Dice "Testing" o "Production"?
- Si dice **"Testing"** → Continúa con 2.2
- Si dice **"Production"** → Salta al Paso 3

**2.2 Agregar scopes (permisos):**
1. Click en botón **"EDITAR APP"** (esquina superior derecha)
2. Click en **"GUARDAR Y CONTINUAR"** en la página 1 (OAuth consent screen)
3. En la página 2 (Scopes):
   - Click en **"ADD OR REMOVE SCOPES"**
   - En el buscador, buscar: `spreadsheets`
   - ✅ Marcar checkbox: `.../auth/spreadsheets` (ver, editar, crear hojas)
   - En el buscador, buscar: `gmail.send`
   - ✅ Marcar checkbox: `.../auth/gmail.send` (enviar emails)
   - Click en **"UPDATE"** abajo
   - Click en **"GUARDAR Y CONTINUAR"**
4. Click en **"GUARDAR Y CONTINUAR"** en la página 3 (Test users)
5. Click en **"VOLVER AL PANEL"**

**2.3 Publicar la app (CRÍTICO):**
1. En la pantalla principal de OAuth consent screen
2. Buscar botón **"PUBLICAR APP"** o **"PUBLISH APP"**
3. Click en **"PUBLICAR APP"**
4. Confirmar en el diálogo (puede decir que no está verificada - está bien)
5. ✅ El estado debe cambiar a **"Production"** o **"En producción"**

✅ **Checkpoint:** Estado = "Production" con scopes de Sheets y Gmail agregados

---

## ✅ PASO 3: RE-CONFIGURAR APPS SCRIPT DEPLOYMENT (3 min)

### Pestaña ya abierta: Apps Script Home
**URL:** https://script.google.com/home

### Acciones:

**3.1 Abrir el proyecto:**
1. Buscar tu proyecto en la lista (puede llamarse "Formulario Inmuebles" o similar)
2. Click en el nombre del proyecto para abrirlo

**3.2 Ir a Implementaciones:**
1. En el menú izquierdo, click en **"Implementar"** (ícono de cohete 🚀)
2. O click en botón **"Implementar"** arriba a la derecha → **"Administrar implementaciones"**

**3.3 Editar Versión 3:**
1. Buscar la fila de la **Versión 3** (la más reciente)
2. Click en el ícono de **lápiz** (✏️) al final de la fila para editarla

**3.4 Configurar acceso anónimo:**
1. En el diálogo que se abre:
   - **"Ejecutar como"** → Debe decir: **"Yo (hector.palazuelos@gmail.com)"**
   - **"Quién tiene acceso"** → Cambiar a: **"Solo yo"**
2. Click en **"Implementar"** (esto guarda temporalmente)
3. **IMPORTANTE:** Inmediatamente volver a editar (click en lápiz ✏️)
4. Cambiar **"Quién tiene acceso"** a: **"Cualquiera"**
5. ⚠️ **CRÍTICO:** Verificar que aparezca un toggle/switch que diga:
   - **"Requerir inicio de sesión"** → Debe estar **APAGADO** (gris)
   - O debe decir: **"Allow anonymous access"** → Debe estar **ENCENDIDO** (azul)
6. Click en **"Implementar"**

**3.5 Copiar NUEVA URL:**
1. Después de implementar, aparecerá la URL actualizada
2. **⚠️ COPIAR LA URL COMPLETA** que termina en `/exec`
3. Ejemplo: `https://script.google.com/macros/s/ABC123XYZ.../exec`
4. **PEGAR LA URL AQUÍ ABAJO:** (para no perderla)

```
NUEVA URL VERSIÓN 3 (o 4):
_________________________________________________________
```

✅ **Checkpoint:** URL nueva copiada, acceso configurado como "Cualquiera" sin login

---

## ✅ PASO 4: PROBAR LA URL CON CURL (1 min)

### Volver a esta terminal/Claude

**4.1 Probar acceso anónimo:**

Cuando tengas la nueva URL, pégala aquí y yo ejecutaré el curl para verificar que funcione.

**Comando que ejecutaré:**
```bash
curl -X POST "TU_URL_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"tipoPropiedad":"Casa","nombre":"Test"}'
```

**✅ Respuesta CORRECTA (esperada):**
```json
{"success":true,"message":"Datos guardados y email enviado exitosamente"}
```

**❌ Respuesta INCORRECTA (error):**
```html
<!DOCTYPE html>
<title>No se encontró la página</title>
```

Si obtienes la respuesta correcta → ¡Éxito! Continúa al Paso 5
Si obtienes error → Revisa que el toggle "Requerir inicio de sesión" esté APAGADO

---

## ✅ PASO 5: ACTUALIZAR VARIABLE EN NETLIFY (1 min)

### Yo ejecutaré este comando automáticamente

Cuando confirmes que el curl funciona, yo ejecutaré:
```bash
netlify env:set GOOGLE_SCRIPT_URL "TU_NUEVA_URL"
```

✅ **Checkpoint:** Variable actualizada en Netlify

---

## ✅ PASO 6: RE-DEPLOY A NETLIFY (1 min)

### Drag & Drop del folder

**Opción A: Drag & Drop (Recomendado):**
1. Ir a: https://app.netlify.com/sites/ubicacioncotizar/deploys
2. Arrastrar la carpeta `formulario-inmueble` completa a la zona de drop
3. Esperar 30-60 segundos

**Opción B: Yo hago el deploy:**
Puedo intentar hacer un deploy automático si tienes configurado netlify CLI

✅ **Checkpoint:** Sitio re-deployed con nueva URL del script

---

## ✅ PASO 7: PROBAR FORMULARIO COMPLETO (2 min)

### Abrir formulario en navegador

1. Ir a: https://ubicacioncotizar.netlify.app/
2. Llenar formulario completo (todos los pasos)
3. Click en **"Enviar Cotización"**
4. ✅ Debe aparecer: **"Formulario enviado exitosamente"**

### Verificar Google Sheets

1. Abrir tu Google Sheet: "Formulario Inmuebles - Cotizaciones"
2. ✅ Debe haber una nueva fila con los datos que enviaste

### Verificar Email

1. Abrir tu email: hector.palazuelos@gmail.com
2. ✅ Debe haber un email nuevo con asunto: "🏠 Nueva Cotización - ..."

---

## 🎉 SI TODO FUNCIONÓ

**¡FELICIDADES! El sistema está 100% operativo:**

✅ APIs habilitadas (Sheets + Gmail)
✅ OAuth en producción con scopes correctos
✅ Apps Script accesible públicamente
✅ Netlify actualizado con nueva URL
✅ Formulario guardando en Sheets
✅ Emails automáticos funcionando

---

## ❌ TROUBLESHOOTING

### Error: "No se encontró la página" persiste

**Solución 1: Verificar toggle "Requerir inicio de sesión"**
- En Apps Script → Implementaciones → Editar V3
- El toggle debe estar APAGADO (gris)
- Si no ves el toggle, intenta crear una Versión 4 nueva

**Solución 2: Esperar propagación**
- Después de publicar OAuth Screen, espera 5-10 minutos
- Google puede tardar en propagar los cambios

**Solución 3: Crear Versión 4 desde cero**
- En Apps Script → Implementar → Nueva implementación
- Tipo: Aplicación web
- Ejecutar como: Yo
- Acceso: Cualquiera (sin login)
- Copiar nueva URL

### Error: APIs no habilitadas

- Volver a: https://console.cloud.google.com/apis/dashboard?project=formulario-inmuebles
- Verificar que ambas APIs (Sheets + Gmail) aparezcan en la lista

### Error: OAuth no se puede publicar

- Esto es normal si la app no está verificada
- Click en "Publicar de todos modos" o "Publish anyway"
- No necesitas verificación de Google para uso personal

---

## 🔗 URLS ÚTILES

- **Apps Script Home:** https://script.google.com/home
- **OAuth Consent:** https://console.cloud.google.com/apis/credentials/consent?project=formulario-inmuebles
- **APIs Library:** https://console.cloud.google.com/apis/library?project=formulario-inmuebles
- **Netlify Deploys:** https://app.netlify.com/sites/ubicacioncotizar/deploys
- **Formulario:** https://ubicacioncotizar.netlify.app/

---

**Última actualización:** 30 octubre 2025
**Tiempo total:** 10-15 minutos
**Siguiente paso:** Habilitar APIs (Paso 1)
