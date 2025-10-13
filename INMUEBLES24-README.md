# 🏠 INMUEBLES24 SCRAPER - SISTEMA DE MONITOREO AUTOMÁTICO

Sistema automático para detectar propiedades NUEVAS y ELIMINADAS en Inmuebles24 Culiacán.

## 🚀 CONFIGURACIÓN COMPLETADA

✅ **Cron job configurado** - Se ejecuta automáticamente **todos los días a las 6:00 AM**
✅ **300 propiedades** ya registradas en el histórico inicial
✅ **Notificaciones de macOS** cuando hay cambios

---

## 📂 ARCHIVOS DEL SISTEMA

| Archivo | Descripción |
|---------|-------------|
| `inmuebles24-scraper.js` | Script principal del scraper |
| `inmuebles24-culiacan-historico.json` | Base de datos de URLs (116KB, 300 propiedades) |
| `setup-cron-inmuebles24.sh` | Script para configurar cron job |
| `inmuebles24-monitor.sh` | Script con notificaciones de macOS |
| `logs/` | Directorio con logs de cada ejecución |

---

## 🎯 ¿QUÉ HACE EL SISTEMA?

Cada día a las 6 AM:

1. **Scrapea** las primeras 10 páginas de Inmuebles24 Culiacán (300 propiedades)
2. **Compara** con el histórico anterior
3. **Detecta:**
   - ✨ **NUEVAS** - Propiedades que no estaban antes (ALTAS)
   - ❌ **ELIMINADAS** - Propiedades que ya no aparecen (BAJAS)
4. **Guarda** el nuevo histórico en JSON
5. **Genera** un reporte con las diferencias

---

## 📊 EJEMPLO DE REPORTE

```
============================================================
📊 REPORTE DE CAMBIOS - INMUEBLES24
============================================================

📈 Total propiedades actuales: 305
📉 Total propiedades anterior: 300
📊 Diferencia: +5

✨ PROPIEDADES NUEVAS (8):
   1. Casa en Venta Colinas de San Miguel
      💰 $2,500,000
      🔗 https://www.inmuebles24.com/propiedades/...

   2. Residencia en La Primavera
      💰 $3,800,000
      🔗 https://www.inmuebles24.com/propiedades/...

❌ PROPIEDADES ELIMINADAS (3):
   1. Casa en Terranova
      💰 $1,850,000
      🔗 https://www.inmuebles24.com/propiedades/...
```

---

## 🔧 COMANDOS ÚTILES

### Ver cron jobs activos:
```bash
crontab -l
```

### Ejecutar manualmente el scraper:
```bash
node inmuebles24-scraper.js
```

### Ejecutar con notificaciones de macOS:
```bash
./inmuebles24-monitor.sh
```

### Ver logs de ejecuciones:
```bash
ls -lh logs/
tail -f logs/inmuebles24-*.log
```

### Eliminar el cron job:
```bash
crontab -e
# Eliminar la línea que contiene 'inmuebles24-scraper.js'
```

### Reconfigurar el cron job:
```bash
./setup-cron-inmuebles24.sh
```

---

## 📅 PRÓXIMA EJECUCIÓN

**Mañana a las 6:00 AM** se ejecutará automáticamente y comparará con las 300 propiedades actuales.

El reporte mostrará:
- URLs nuevas que aparecieron
- URLs que desaparecieron
- Total de cambios

---

## 📝 HISTORIAL DE CAMBIOS

El archivo `inmuebles24-culiacan-historico.json` guarda:

```json
{
  "lastCheck": "2025-10-13T19:52:52.000Z",
  "properties": [
    {
      "url": "https://www.inmuebles24.com/propiedades/...",
      "title": "Casa en Venta...",
      "price": "$2,500,000",
      "scrapedAt": "2025-10-13T19:55:00.000Z"
    }
  ],
  "stats": {
    "totalProperties": 300,
    "nuevasDetectadas": 0,
    "eliminadasDetectadas": 0,
    "changeLog": [...]
  }
}
```

---

## 🔔 NOTIFICACIONES

Cuando el script `inmuebles24-monitor.sh` detecta cambios, envía una notificación de macOS con:
- Número de propiedades nuevas
- Número de propiedades eliminadas

---

## ⚙️ CONFIGURACIÓN TÉCNICA

- **URL base:** `https://www.inmuebles24.com/casas-en-venta-en-culiacan.html`
- **Páginas scrapeadas:** 10 (página 1 a 10)
- **Propiedades por página:** ~30
- **Total monitoreado:** ~300 propiedades
- **Frecuencia:** Diaria a las 6:00 AM
- **Motor:** Puppeteer + Stealth Plugin (evasión anti-bot)
- **Formato URLs:** `_Desde_31.html`, `_Desde_61.html`, etc.

---

## 🐛 TROUBLESHOOTING

### El cron no se ejecuta:
```bash
# Verificar que cron está corriendo
ps aux | grep cron

# Ver logs del sistema
tail -f /var/log/system.log
```

### Scraper falla:
```bash
# Verificar Node.js
which node

# Verificar puppeteer
npm list puppeteer-extra

# Ejecutar manualmente con logs
node inmuebles24-scraper.js 2>&1 | tee debug.log
```

### No recibo notificaciones:
```bash
# Verificar que las notificaciones están habilitadas
# Preferencias del Sistema > Notificaciones > Terminal
```

---

## 📧 INTEGRACIÓN FUTURA (OPCIONAL)

Puedes agregar notificaciones por:
- ✉️ Email (usando nodemailer)
- 📱 WhatsApp (usando Twilio)
- 💬 Telegram (usando telegram-bot-api)
- 📲 SMS (usando Twilio)

---

✅ **Sistema 100% funcional y configurado**
