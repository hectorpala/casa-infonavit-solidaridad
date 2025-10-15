# 🏠 SISTEMA DE MONITOREO AUTOMÁTICO - INMUEBLES24 CULIACÁN

Sistema completo de scraping y notificaciones para monitorear cambios en las propiedades de Inmuebles24.

## 📋 CARACTERÍSTICAS

✅ **Scraping automático** - 10 páginas de Inmuebles24 Culiacán (~300 propiedades)
✅ **Detección de cambios** - Identifica propiedades nuevas y eliminadas
✅ **Notificaciones automáticas** - WhatsApp + Email cuando hay cambios
✅ **Histórico completo** - JSON con todas las propiedades y changelog
✅ **Stealth mode** - Puppeteer con evasión anti-bot

---

## 🚀 USO RÁPIDO

### Ejecutar manualmente:
```bash
node inmuebles24-scraper.js
```

### Ejecutar con script de monitoreo:
```bash
./inmuebles24-monitor.sh
```

### Configurar cron automático (cada 6 horas):
```bash
./setup-cron-inmuebles24.sh
```

---

## 📁 ARCHIVOS DEL SISTEMA

### 1️⃣ **inmuebles24-scraper.js** - Scraper principal
**Funciones:**
- Scrapea 10 páginas de Inmuebles24 Culiacán
- Extrae URLs, títulos y precios
- Compara con histórico anterior
- Detecta propiedades nuevas y eliminadas
- Guarda histórico actualizado
- **ENVÍA NOTIFICACIONES automáticamente**

**Configuración interna:**
```javascript
const CONFIG = {
    BASE_URL: 'https://www.inmuebles24.com/casas-en-venta-en-culiacan.html',
    TOTAL_PAGES: 10,
    STORAGE_FILE: 'inmuebles24-culiacan-historico.json',
    DELAY_BETWEEN_PAGES: 4000 // 4 segundos
};
```

**Output:**
- Console: Reporte detallado de cambios
- JSON: `inmuebles24-culiacan-historico.json`

---

### 2️⃣ **send-notification.js** - Sistema de notificaciones
**Servicios soportados:**
- ✅ **Email** (Gmail SMTP)
- ✅ **WhatsApp** (CallMeBot API - GRATIS)

**Configuración requerida:**
```javascript
const CONFIG = {
    EMAIL: {
        FROM: 'tu-email@gmail.com',
        TO: 'hector@example.com',
        PASSWORD: 'tu-app-password-aqui',  // App Password de Gmail
        ENABLED: true
    },
    WHATSAPP: {
        PHONE: '526671234567',              // Tu número con código país
        API_KEY: 'tu-api-key-aqui',        // De CallMeBot
        ENABLED: true
    }
};
```

**¿Cómo configurar?**

#### Gmail (Email):
1. Ve a: https://myaccount.google.com/apppasswords
2. Genera un "App Password" para "Mail"
3. Copia el password de 16 caracteres
4. Pega en `CONFIG.EMAIL.PASSWORD`

#### WhatsApp (CallMeBot):
1. Ve a: https://www.callmebot.com/blog/free-api-whatsapp-messages/
2. Sigue las instrucciones para obtener tu API Key
3. Envía mensaje a CallMeBot desde WhatsApp
4. Te responde con tu API Key
5. Pega en `CONFIG.WHATSAPP.API_KEY`

**Formato de notificaciones:**

**WhatsApp** (mensaje corto):
```
🏠 Inmuebles24 Monitor

✨ Nuevas: 5
❌ Eliminadas: 2
📊 Total: 303

⏰ 13/10/2025 14:30:00
```

**Email** (mensaje detallado con URLs):
```
🏠 INMUEBLES24 - REPORTE DE CAMBIOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ PROPIEDADES NUEVAS: 5
❌ PROPIEDADES ELIMINADAS: 2
📊 TOTAL ACTUAL: 303

⏰ Fecha: 13/10/2025 14:30:00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ PROPIEDADES NUEVAS:
1. Casa en Venta en Fracc. Los Pinos
   💰 $2,500,000
   🔗 https://www.inmuebles24.com/propiedades/...

2. Casa en Venta en Montebello
   💰 $3,200,000
   🔗 https://www.inmuebles24.com/propiedades/...

❌ PROPIEDADES ELIMINADAS:
1. Casa en Colinas de San Miguel
   💰 $1,800,000
   🔗 https://www.inmuebles24.com/propiedades/...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 3️⃣ **inmuebles24-monitor.sh** - Script de monitoreo
**Funciones:**
- Ejecuta el scraper
- Guarda logs con timestamp
- Extrae estadísticas
- Muestra resumen
- Envía notificación macOS (si hay cambios)

**Logs guardados en:**
```
logs/monitor-20251013-143000.log
```

---

### 4️⃣ **setup-cron-inmuebles24.sh** - Configuración cron
**Función:**
- Configura cron para ejecutar automáticamente cada 6 horas

**Horarios de ejecución:**
- 06:00 AM
- 12:00 PM
- 06:00 PM
- 12:00 AM

**Comando cron generado:**
```bash
0 6,12,18,0 * * * cd "/ruta/completa" && ./inmuebles24-monitor.sh >> logs/cron.log 2>&1
```

---

## 📊 ARCHIVO HISTÓRICO

**inmuebles24-culiacan-historico.json**

Estructura:
```json
{
  "lastCheck": "2025-10-13T20:30:00.000Z",
  "properties": [
    {
      "url": "https://www.inmuebles24.com/propiedades/casa-...",
      "title": "Casa en Venta Fracc. Los Pinos",
      "price": "$2,500,000",
      "scrapedAt": "2025-10-13T20:30:00.000Z"
    }
  ],
  "stats": {
    "totalProperties": 303,
    "nuevasDetectadas": 5,
    "eliminadasDetectadas": 2,
    "changeLog": [
      {
        "date": "2025-10-13T20:30:00.000Z",
        "nuevas": 5,
        "eliminadas": 2,
        "total": 303
      }
    ]
  }
}
```

---

## 🔧 INSTALACIÓN Y CONFIGURACIÓN

### 1. Instalar dependencias:
```bash
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth nodemailer
```

### 2. Configurar credenciales en `send-notification.js`:
```javascript
// Email
FROM: 'tu-email@gmail.com',
TO: 'destinatario@example.com',
PASSWORD: 'app-password-16-caracteres',

// WhatsApp
PHONE: '526671234567',
API_KEY: 'tu-api-key-callmebot',
```

### 3. Activar/Desactivar servicios:
```javascript
EMAIL: { ..., ENABLED: true },   // true = activado
WHATSAPP: { ..., ENABLED: true } // false = desactivado
```

### 4. Ejecutar primera vez:
```bash
node inmuebles24-scraper.js
```

Esto crea el archivo histórico inicial (`inmuebles24-culiacan-historico.json`).

### 5. Configurar cron automático:
```bash
chmod +x setup-cron-inmuebles24.sh
./setup-cron-inmuebles24.sh
```

Verifica con:
```bash
crontab -l
```

---

## 🧪 TESTING

### Test de notificaciones (sin scraping):
```bash
node send-notification.js
```

Envía notificación de prueba:
- ✨ Nuevas: 5
- ❌ Eliminadas: 2
- 📊 Total: 303

### Test de scraping (sin notificaciones):
Desactiva notificaciones temporalmente en `send-notification.js`:
```javascript
ENABLED: false
```

---

## 📈 FLUJO COMPLETO

```
┌─────────────────────────────────────────────────┐
│  CRON (cada 6 horas)                            │
│  └─> inmuebles24-monitor.sh                     │
│      └─> node inmuebles24-scraper.js            │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  SCRAPER                                         │
│  1. Carga histórico anterior                     │
│  2. Scrapea 10 páginas (~300 propiedades)       │
│  3. Compara con histórico                        │
│  4. Detecta cambios                              │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  ¿HAY CAMBIOS?                                   │
│  └─> SI: Continúa                                │
│  └─> NO: Termina (no notifica)                   │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  NOTIFICACIONES (send-notification.js)           │
│  1. Genera mensaje corto (WhatsApp)             │
│  2. Genera mensaje largo con URLs (Email)       │
│  3. Envía ambos en paralelo                      │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  GUARDA HISTÓRICO ACTUALIZADO                    │
│  └─> inmuebles24-culiacan-historico.json         │
└─────────────────────────────────────────────────┘
```

---

## 🐛 TROUBLESHOOTING

### Problema: "Error enviando WhatsApp"
**Causa:** API Key incorrecta o número sin código país
**Solución:**
1. Verifica API Key en https://www.callmebot.com
2. Número debe incluir código país: `526671234567` (no `6671234567`)

### Problema: "Error enviando email"
**Causa:** App Password incorrecto o 2FA no habilitado
**Solución:**
1. Habilita 2FA en tu cuenta Google
2. Genera nuevo App Password en https://myaccount.google.com/apppasswords
3. Usa el password de 16 caracteres (sin espacios)

### Problema: Scraper no detecta propiedades
**Causa:** Cambio en estructura HTML de Inmuebles24
**Solución:**
1. Ejecuta `node inmuebles24-test.js` para ver screenshot
2. Inspecciona la estructura actual
3. Ajusta el selector en `scrapePage()` si es necesario

### Problema: Cron no ejecuta
**Causa:** Permisos o ruta incorrecta
**Solución:**
```bash
# Verificar cron está activo
crontab -l

# Ver logs de cron
tail -f logs/cron.log

# Dar permisos de ejecución
chmod +x inmuebles24-monitor.sh
```

---

## 📝 LOGS Y DEBUGGING

### Ver último scraping:
```bash
tail -100 logs/monitor-*.log | less
```

### Ver histórico de cambios:
```bash
node -e "console.log(JSON.stringify(require('./inmuebles24-culiacan-historico.json').stats.changeLog, null, 2))"
```

### Ver todas las propiedades actuales:
```bash
node -e "console.log(require('./inmuebles24-culiacan-historico.json').properties.length)"
```

---

## 🎯 PRÓXIMOS PASOS

- [ ] Configurar credenciales en `send-notification.js`
- [ ] Ejecutar primera vez: `node inmuebles24-scraper.js`
- [ ] Verificar notificaciones de prueba: `node send-notification.js`
- [ ] Configurar cron automático: `./setup-cron-inmuebles24.sh`
- [ ] Verificar primer ejecución automática en 6 horas

---

## 📞 SOPORTE

Si algo no funciona:
1. Revisa logs en `logs/monitor-*.log`
2. Ejecuta test de notificaciones: `node send-notification.js`
3. Verifica configuración en `send-notification.js`

---

**Sistema desarrollado para Hector es Bienes Raíces**
*Última actualización: Octubre 2025*
