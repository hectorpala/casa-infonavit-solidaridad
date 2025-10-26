# 🔥 Guía Rápida: Configurar ScraperAPI (5 minutos)

## Paso 1: Crear Cuenta (2 minutos)

1. **Ir a ScraperAPI**: https://www.scraperapi.com/signup
2. **Crear cuenta gratis**: Email + Password
3. **Verificar email**: Click en link de confirmación

## Paso 2: Obtener API Key (1 minuto)

1. **Login**: https://www.scraperapi.com/login
2. **Dashboard**: Verás tu API key en la primera pantalla
3. **Copiar API key**: Se ve así: `abc123def456ghi789...` (50+ caracteres)

## Paso 3: Configurar .env (30 segundos)

```bash
cd "/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad"
nano .env
```

Reemplazar esta línea:
```bash
SCRAPERAPI_KEY=
```

Con tu API key:
```bash
SCRAPERAPI_KEY=abc123def456ghi789...
```

Guardar: **Ctrl+X → Y → Enter**

## Paso 4: Verificar Configuración (30 segundos)

```bash
# Ver que la key esté configurada
grep SCRAPERAPI_KEY .env

# Debe mostrar:
# SCRAPERAPI_KEY=tu_api_key_aqui
```

## Paso 5: Probar Modo Auto (1 minuto)

```bash
./daily-scraping.sh
```

Debe mostrar:
```
ℹ️  Modo AUTO detectado (ScraperAPI configurado)
```

---

## 💰 Plan Gratuito vs Pagado

### Plan Gratuito (1000 requests gratis)
- ✅ Perfecto para probar
- ✅ 1000 requests = ~30-40 propiedades
- ✅ Todas las features incluidas
- ⚠️ Se acaba rápido si scrapeas diario

### Plan Hobby ($49/mes)
- ✅ 100,000 requests/mes
- ✅ = ~3,000 propiedades/mes
- ✅ = ~100 propiedades/día
- ✅ Soporte prioritario
- **RECOMENDADO** para uso diario

### Cuándo Actualizar
- Si scrapeas >30 propiedades/día → Actualizar a Hobby
- Si scrapeas <30 propiedades/día → Plan gratis OK inicialmente

---

## 🔍 Monitoreo de Uso

**Dashboard**: https://www.scraperapi.com/dashboard

Ver en tiempo real:
- Requests usados hoy
- Requests restantes
- Tasa de éxito
- Costos del mes

**Tip**: Revisa el dashboard cada semana para evitar sorpresas.

---

## ❓ Troubleshooting

### Error: "Invalid API key"
- Verificar que copiaste la key completa (50+ caracteres)
- Sin espacios al inicio/final
- Verificar en dashboard de ScraperAPI

### Error: "Quota exceeded"
- Plan gratis agotado (1000 requests)
- Solución: Actualizar a plan Hobby ($49/mes)
- O esperar al siguiente mes (reset mensual)

### Scraper sigue en modo MANUAL
- Verificar que `.env` existe
- Verificar que `SCRAPERAPI_KEY=` tiene valor
- Ejecutar: `grep SCRAPERAPI_KEY .env`

---

## 🎯 Próximos Pasos

Una vez configurado:

1. ✅ Verificar modo AUTO: `./daily-scraping.sh`
2. ✅ Configurar cron diario (ver AUTOMATION-README.md)
3. ✅ Monitorear dashboard de ScraperAPI semanalmente
4. ✅ Revisar logs en `logs/daily-scraping-*.log`

---

**Tiempo total**: 5 minutos  
**Costo**: $0 (plan gratis) o $49/mes (Hobby)  
**Resultado**: 100% automático, cero intervención manual
