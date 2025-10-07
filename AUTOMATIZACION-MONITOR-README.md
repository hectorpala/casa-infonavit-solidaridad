# 🤖 Automatización del Monitor de Propiedades

Guía para ejecutar el monitor automáticamente sin intervención manual.

---

## ⚡ Opción 1: Cron Job (macOS/Linux) - RECOMENDADO

### 🎯 ¿Qué es Cron?
Cron es un programador de tareas en sistemas Unix que ejecuta comandos automáticamente en intervalos regulares.

### 📋 Configuración Paso a Paso

#### **1. Editar Crontab**

Abre el editor de cron:
```bash
crontab -e
```

Si es la primera vez, te preguntará qué editor usar. Selecciona `nano` (más fácil) presionando `1`.

#### **2. Agregar Tarea Programada**

Copia y pega una de estas líneas según la frecuencia deseada:

**Cada 6 horas (4 veces al día):**
```cron
0 */6 * * * /Users/hectorpc/Documents/Hector\ Palazuelos/Google\ My\ Business/landing\ casa\ solidaridad/auto-monitor.sh
```

**Cada 12 horas (2 veces al día):**
```cron
0 */12 * * * /Users/hectorpc/Documents/Hector\ Palazuelos/Google\ My\ Business/landing\ casa\ solidaridad/auto-monitor.sh
```

**Una vez al día (9 AM):**
```cron
0 9 * * * /Users/hectorpc/Documents/Hector\ Palazuelos/Google\ My\ Business/landing\ casa\ solidaridad/auto-monitor.sh
```

**Dos veces al día (9 AM y 6 PM):**
```cron
0 9,18 * * * /Users/hectorpc/Documents/Hector\ Palazuelos/Google\ My\ Business/landing\ casa\ solidaridad/auto-monitor.sh
```

**De Lunes a Viernes a las 9 AM:**
```cron
0 9 * * 1-5 /Users/hectorpc/Documents/Hector\ Palazuelos/Google\ My\ Business/landing\ casa\ solidaridad/auto-monitor.sh
```

#### **3. Guardar y Salir**

En `nano`:
- Presiona `Ctrl + O` (guardar)
- Presiona `Enter` (confirmar)
- Presiona `Ctrl + X` (salir)

#### **4. Verificar que se guardó**

```bash
crontab -l
```

Deberías ver tu línea de cron.

---

## 📊 Formato Cron Explicado

```
┌───────── minuto (0 - 59)
│ ┌─────── hora (0 - 23)
│ │ ┌───── día del mes (1 - 31)
│ │ │ ┌─── mes (1 - 12)
│ │ │ │ ┌─ día de la semana (0 - 7) (0 y 7 = Domingo)
│ │ │ │ │
* * * * * comando
```

**Ejemplos:**
- `0 9 * * *` → Todos los días a las 9:00 AM
- `0 */6 * * *` → Cada 6 horas (00:00, 06:00, 12:00, 18:00)
- `0 9,18 * * *` → 9:00 AM y 6:00 PM
- `0 9 * * 1-5` → 9:00 AM de Lunes a Viernes
- `*/30 * * * *` → Cada 30 minutos

---

## 📁 Archivos de Log

Los logs se guardan automáticamente en:
```
logs-monitor/
  ├── monitor-2025-10-07_09-00-00.log
  ├── monitor-2025-10-07_15-00-00.log
  ├── monitor-2025-10-08_09-00-00.log
  └── alertas.txt
```

**Ver últimas ejecuciones:**
```bash
ls -lt logs-monitor/ | head -10
```

**Ver log más reciente:**
```bash
tail -50 logs-monitor/$(ls -t logs-monitor/ | grep monitor | head -1)
```

**Ver alertas de nuevas propiedades:**
```bash
cat logs-monitor/alertas.txt
```

---

## 🔔 Notificaciones de Escritorio (macOS)

El script ya incluye notificaciones automáticas cuando detecta nuevas propiedades.

**Ejemplo de notificación:**
```
┌────────────────────────────────────┐
│ Monitor Inmobiliario               │
│                                    │
│ Nuevas propiedades detectadas      │
│ en propiedades.com                 │
└────────────────────────────────────┘
```

---

## ✅ Verificar que Funciona

### **Prueba Manual:**
```bash
/Users/hectorpc/Documents/Hector\ Palazuelos/Google\ My\ Business/landing\ casa\ solidaridad/auto-monitor.sh
```

Debería:
- ✅ Ejecutarse sin errores
- ✅ Crear archivo en `logs-monitor/`
- ✅ Mostrar notificación si hay nuevas propiedades

### **Ver si Cron está ejecutando:**
```bash
# Ver logs del sistema (macOS)
log show --predicate 'process == "cron"' --last 1h
```

---

## 🔧 Troubleshooting

### **Problema: Cron no ejecuta el script**

**Solución 1:** Dar permisos a cron (macOS Catalina+)
1. Abrir `Preferencias del Sistema` → `Seguridad y Privacidad`
2. Ir a `Privacidad` → `Acceso Total al Disco`
3. Agregar `/usr/sbin/cron`

**Solución 2:** Verificar que el script es ejecutable
```bash
chmod +x /Users/hectorpc/Documents/Hector\ Palazuelos/Google\ My\ Business/landing\ casa\ solidaridad/auto-monitor.sh
```

**Solución 3:** Usar ruta absoluta en crontab
```bash
# NO usar rutas relativas
# Siempre usar rutas absolutas completas
```

### **Problema: Script se ejecuta pero no genera logs**

Verificar que el directorio existe:
```bash
mkdir -p "/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad/logs-monitor"
```

---

## 🗑️ Desactivar Automatización

Si quieres desactivar el monitor automático:

```bash
crontab -e
```

Comenta la línea agregando `#` al inicio:
```cron
# 0 */6 * * * /Users/hectorpc/Documents/Hector\ Palazuelos/Google\ My\ Business/landing\ casa\ solidaridad/auto-monitor.sh
```

O bórrala completamente.

---

## 📊 Opción 2: Aplicación de Automatización (Alternativa)

Si prefieres una interfaz gráfica en vez de Cron:

### **Usar "Automator" (macOS)**

1. Abrir `Automator` (búscalo en Spotlight)
2. Crear nuevo `Calendar Alarm`
3. Agregar acción `Run Shell Script`
4. Pegar:
   ```bash
   /Users/hectorpc/Documents/Hector\ Palazuelos/Google\ My\ Business/landing\ casa\ solidaridad/auto-monitor.sh
   ```
5. Guardar
6. Abrir `Calendario` → crear evento recurrente → agregar alarma

---

## 🎯 Recomendación de Frecuencia

**Para propiedades.com:**
- ✅ **Cada 12 horas** - Balance perfecto (mañana y noche)
- ✅ **Una vez al día (9 AM)** - Mínimo recomendado
- ⚠️ **Cada 6 horas** - Solo si quieres estar muy al día
- ❌ **Cada hora** - Excesivo, puede causar bloqueos

**Configuración recomendada:**
```cron
# Todos los días a las 9 AM y 9 PM
0 9,21 * * * /Users/hectorpc/Documents/Hector\ Palazuelos/Google\ My\ Business/landing\ casa\ solidaridad/auto-monitor.sh
```

---

## 📧 Opción 3: Notificaciones por Email (Avanzado)

Si quieres recibir emails cuando hay nuevas propiedades, edita `auto-monitor.sh` y agrega:

```bash
# Después de la línea que detecta nuevas propiedades
if grep -q "PROPIEDADES NUEVAS" "$LOG_FILE"; then
    # Enviar email usando mail (requiere configurar SMTP)
    mail -s "Nuevas Propiedades Detectadas" tu@email.com < "$LOG_FILE"
fi
```

---

## 🚀 Workflow Automático Completo

```
┌─────────────────────────────────────────┐
│  CRON ejecuta cada 12 horas             │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  auto-monitor.sh ejecuta                │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Monitor scrapea propiedades.com        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Compara con snapshot anterior          │
└─────────────────────────────────────────┘
              ↓
        ¿Hay nuevas?
              ├─ NO → Guarda log y termina
              │
              └─ SÍ → ┌────────────────────────┐
                      │ Notificación escritorio│
                      └────────────────────────┘
                              ↓
                      ┌────────────────────────┐
                      │ Genera batch file      │
                      └────────────────────────┘
                              ↓
                      ┌────────────────────────┐
                      │ Guarda en alertas.txt  │
                      └────────────────────────┘
                              ↓
                    TÚ revisas y decides
                    si scrapear las nuevas
```

---

## 📝 Comandos Útiles

**Ver status del monitor:**
```bash
tail -f logs-monitor/alertas.txt
```

**Ejecutar manualmente ahora:**
```bash
./auto-monitor.sh
```

**Ver todas las ejecuciones de hoy:**
```bash
grep "Monitor ejecutado" logs-monitor/*.log | grep $(date '+%Y-%m-%d')
```

**Limpiar todos los logs:**
```bash
rm -rf logs-monitor/*
```

---

## ✅ Checklist Final

- [ ] Script `auto-monitor.sh` tiene permisos de ejecución
- [ ] Probaste ejecutar `./auto-monitor.sh` manualmente
- [ ] Agregaste línea a crontab con `crontab -e`
- [ ] Verificaste con `crontab -l`
- [ ] Esperaste a la hora programada y verificaste logs
- [ ] Recibiste notificación de escritorio

---

## 🎯 Resultado Final

Una vez configurado, **nunca más tendrás que ejecutar nada manualmente**:

1. ✅ Cron ejecuta automáticamente cada X horas
2. ✅ Monitor detecta nuevas propiedades
3. ✅ Recibes notificación en escritorio
4. ✅ Revisas `logs-monitor/alertas.txt`
5. ✅ Decides si scrapear las nuevas propiedades
6. ✅ Ejecutas `scraper-batch.js` solo cuando hay nuevas

**Totalmente automático y sin intervención.** 🚀
