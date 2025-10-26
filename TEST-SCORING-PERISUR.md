# 🧪 TEST MANUAL PENDIENTE - Sistema de Scoring

Para validar que el sistema de scoring funciona correctamente con Perisur:

## Comando de prueba:
```bash
node inmuebles24culiacanscraper.js "https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-fraccionamiento-perisur-142987188.html"
```

## Resultado esperado:

```
📊 Ranking de candidatas:
   1. [26+ pts] Nogal Bosque, Fraccionamiento Perisur, Culiacán
   2. [~8 pts] Prol. Álvaro Obregón 768, Nogal Bosque
   3. [~5 pts] Culiacán, Sinaloa
🏆 GANADORA: [26+ pts] H3
✅ Dirección final seleccionada: "Nogal Bosque, Fraccionamiento Perisur, Culiacán, Sinaloa"
```

## Verificación:
- ✅ La candidata #1 debe ser la dirección de Perisur (CON "Fraccionamiento")
- ✅ La candidata #2 debe ser la dirección de oficina (CON "Prol. Álvaro Obregón 768")
- ✅ El score de #1 debe ser MAYOR que #2
- ✅ La ganadora debe ser #1 (Perisur)

## Si el test falla:
- Revisar los valores de scoring en scoreAddressCandidate()
- Aumentar bonus para "Fraccionamiento" (+8 → +12)
- Aumentar penalización para direcciones con número + calle (-8 → -15)

