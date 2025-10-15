# 🎯 ANÁLISIS DE PATRÓN - URLs DE CULIACÁN CONFIRMADAS

**Fecha:** 13/10/2025, 1:56:34 p.m.
**URLs analizadas:** 5 (confirmadas por usuario como Culiacán)

---

## 📋 URLs DE EJEMPLO

1. https://www.inmuebles24.com/propiedades/clasificado/veclcain-venta-de-casa-por-calle-mariano-escobedo-centro-de-la-143508352.html
2. https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-venta-en-fracc-colinas-de-san-miguel-81519985.html
3. https://www.inmuebles24.com/propiedades/clasificado/veclcain-vendo-casa-en-desarrollo-urbano-tres-rios-culiacan-145215095.html
4. https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-venta-en-culiacan-con-alberca-145337185.html
5. https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-venta-culiacancito-culiacan-sinaloa-147696056.html

---

## 🔑 PALABRAS CLAVE DETECTADAS

**Palabras que aparecen en las propiedades de Culiacán:**

| Palabra Clave | Frecuencia | % Aparición |
|---------------|------------|-------------|
| `culiacán` | 5/5 | 100% |
| `sinaloa` | 5/5 | 100% |
| `fracc` | 4/5 | 80% |
| `fraccionamiento` | 4/5 | 80% |
| `culiacan` | 3/5 | 60% |
| `centro` | 1/5 | 20% |
| `colinas` | 1/5 | 20% |
| `san miguel` | 1/5 | 20% |
| `tres rios` | 1/5 | 20% |
| `desarrollo urbano` | 1/5 | 20% |
| `culiacancito` | 1/5 | 20% |

---

## 📄 DETALLES DE CADA PROPIEDAD


### 1. Venta de Casa por Calle Mariano Escobedo Centro de La Ciudad...

- **URL:** https://www.inmuebles24.com/propiedades/clasificado/veclcain-venta-de-casa-por-calle-mariano-escobedo-centro-de-la-143508352.html
- **Ubicación:** Mariano escobedo ,  Centro, Culiacán
- **Precio:** Ocultar aviso
- **Descripción:** Venta de casa por Mariano Escobedo primer cuadro de la ciudad. Excelente ubicación, cerca de hospitales, mercado, Restaurant. Supermercado, bancos. La casa cuenta con la siguiente distribución Planta ...

### 2. Casa en Venta en Fracc Colinas de San Miguel...

- **URL:** https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-venta-en-fracc-colinas-de-san-miguel-81519985.html
- **Ubicación:** PRIV. RIO BALUARTE ,  Fraccionamiento Colinas de San Miguel, Culiacán
- **Precio:** Ocultar aviso
- **Descripción:** PRECIOSA CASA EN VENTA EN FRACC. COLINAS DE SAN MIGUEL AMPLIO TERRENO Y ESPACIOS SUPERFICIE: 733 m2 CONTRUCCION: 600 m2 (DOS PLANTAS) PLANTA BAJA: ENTRADA PRINCIPAL CON JARDIN, RECIBIDOR, SALA, COMEDO...

### 3. Vendo Casa en Desarrollo Urbano Tres Rios Culiacán...

- **URL:** https://www.inmuebles24.com/propiedades/clasificado/veclcain-vendo-casa-en-desarrollo-urbano-tres-rios-culiacan-145215095.html
- **Ubicación:** Blvd. Alfonso Zaragoza Maytorena  al 1800,  Fraccionamiento Alegranza, Culiacán
- **Precio:** Ocultar aviso
- **Descripción:** Tu Nuevo Comienzo en Tres RíosModerna casa en privada con doble frente — Culiacán, SinaloaImagina despertar cada mañana en una zona segura, tranquila y con el 90% de su comunidad ya consolidada. Esta ...

### 4. Casa en Venta en Culiacan con Alberca...

- **URL:** https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-venta-en-culiacan-con-alberca-145337185.html
- **Ubicación:** Isla Musala, Banus , Culiacán, Sinaloa,  Fraccionamiento Banus 360, Culiacán
- **Precio:** Ocultar aviso
- **Descripción:** Residencia en venta en Culiacán en Isla Músala con alberca propia, en privada con acceso controlado y alberca propia, A PRECIO OPORTUNIDAD DE VENTA A 10,000,000, MUY POR ABAJO DE SU VALOR AVALUO, ES D...

### 5. Casa en Venta Culiacancito Culiacan Sinaloa...

- **URL:** https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-venta-culiacancito-culiacan-sinaloa-147696056.html
- **Ubicación:** Granados 13,  Fraccionamiento Valle Alto, Culiacán
- **Precio:** Ocultar aviso
- **Descripción:** CASA EN VENTA, EN CULIACANCITO, CULICAN, SINALOALa propiedad se encuentra cerca de Iglesia, Mercado,Parques, escuelas, Hospitales.Cuenta con servicios de Agua potable, drenaje, alumbradoo publico, tra...

---

## 🎯 PATRÓN IDENTIFICADO

### ✅ Criterios para detectar propiedades de Culiacán:


**Keywords con alta confianza (60%+ aparición):**

- `culiacán` (5/5 propiedades)
- `sinaloa` (5/5 propiedades)
- `fracc` (4/5 propiedades)
- `fraccionamiento` (4/5 propiedades)
- `culiacan` (3/5 propiedades)

**Filtro recomendado:**

```javascript
const esCuliacan = (texto) => {
    const textoLower = texto.toLowerCase();
    const keywords = ['culiacán', 'sinaloa', 'fracc', 'fraccionamiento', 'culiacan'];
    return keywords.some(kw => textoLower.includes(kw));
};
```

---

**Generado:** 13/10/2025, 1:56:34 p.m.
