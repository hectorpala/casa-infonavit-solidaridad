# 🛡️ SISTEMA DE PROTECCIÓN DE PUBLICACIÓN

Sistema de protección contra modificaciones accidentales de geolocalización con commits centralizados y seguros.

---

## 🎯 Objetivo

Prevenir que las secciones críticas de geolocalización (mapas, coordenadas, markers) sean modificadas accidentalmente durante el desarrollo y publicación de propiedades.

---

## 🔍 Componentes del Sistema

### **1. Verificador de Geolocalización** (`verify-geolocation.js`)

Script que calcula hashes SHA256 de las secciones de geolocalización y las compara con versiones conocidas.

**Secciones Protegidas:**
- `function initMap()`
- `MARKER_CONFIG`
- `CURRENT_PROPERTY_DATA`
- `google.maps.Map`

**Archivos Protegidos:**
- `culiacan/index.html`
- `monterrey/index.html`
- `mazatlan/index.html`

**Uso:**
```bash
# Verificar integridad
node verify-geolocation.js

# Modo verbose (detalles)
node verify-geolocation.js --verbose

# Auto-restaurar desde backups
node verify-geolocation.js --fix

# Actualizar hashes (cambios intencionales)
node verify-geolocation.js --update
```

### **2. Helper de Publicación** (`publish-helper.sh`)

Script centralizado para commits seguros con verificación automática.

**Modos de Uso:**

#### Modo Interactivo (Recomendado)
```bash
./publish-helper.sh
```

**Workflow:**
1. Verifica geolocalización automáticamente
2. Muestra git status
3. Pide tipo de commit (feat, fix, docs, etc.)
4. Pide mensaje del commit
5. Opcionalmente: cuerpo del mensaje
6. Preview del commit
7. Confirmar y crear commit
8. Opcionalmente: push a GitHub

#### Modo Directo
```bash
./publish-helper.sh "feat: Nueva propiedad Casa Tres Ríos"
```

#### Comandos Especiales
```bash
# Verificar geolocalización
./publish-helper.sh --verify

# Restaurar geo desde backups
./publish-helper.sh --restore-geo

# Actualizar hashes de geo
./publish-helper.sh --update-geo

# Ver template de commits
./publish-helper.sh --template

# Ayuda
./publish-helper.sh --help
```

### **3. Pre-Commit Hook** (`.husky/pre-commit`)

Hook de Git que se ejecuta **ANTES** de cada commit para verificar geolocalización.

**Comportamiento:**
- ✅ Si geo intacta: Permite commit
- ❌ Si geo modificada: Bloquea commit + muestra opciones

**Ubicación:** `.husky/pre-commit`

**Bypass (NO recomendado):**
```bash
git commit --no-verify
```

### **4. Template de Commits** (`.commit-templates/publish-template.txt`)

Plantilla estándar para mensajes de commit con ejemplos y guías.

**Tipos de commit:**
- `feat`: Nueva propiedad o característica
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Cambios de formato
- `refactor`: Refactorización
- `perf`: Mejoras de rendimiento
- `chore`: Mantenimiento

**Ver template:**
```bash
cat .commit-templates/publish-template.txt
```

---

## 📊 Workflow Completo

### **Caso 1: Publicar Nueva Propiedad (Sin Modificar Geo)**

```bash
# 1. Desarrollar la nueva propiedad
# ... scrapear, generar HTML, etc ...

# 2. Ver cambios
git status

# 3. Agregar archivos
git add culiacan/nueva-propiedad/

# 4. Commit seguro (interactivo)
./publish-helper.sh

# 5. El helper verifica geo automáticamente
# 6. Seleccionar tipo: 1 (feat)
# 7. Ingresar mensaje: "Nueva propiedad Casa Tres Ríos"
# 8. Confirmar commit
# 9. Confirmar push a GitHub

# ✅ Resultado: Propiedad publicada sin afectar geo
```

### **Caso 2: Publicar con Commit Directo**

```bash
# 1. Agregar cambios
git add .

# 2. Commit directo
./publish-helper.sh "feat: Propiedades semana 2025-10-27 - 3 casas Culiacán"

# ✅ Resultado: Commit + push automático (si geo OK)
```

### **Caso 3: Modificación Accidental de Geo Detectada**

```bash
# 1. Intentar commit
./publish-helper.sh

# ❌ Output:
# ⚠️  ADVERTENCIA: Se detectaron modificaciones en geolocalización
#   ❌ culiacan/index.html - MODIFICADO
#
# Opciones:
#   1. Revertir cambios: git checkout -- culiacan/index.html
#   2. Auto-restaurar: ./publish-helper.sh --restore-geo
#   3. Si son cambios intencionales: ./publish-helper.sh --update-geo

# 2. Opción A: Revertir manualmente
git checkout -- culiacan/index.html

# 2. Opción B: Auto-restaurar desde backup
./publish-helper.sh --restore-geo

# 3. Intentar commit nuevamente
./publish-helper.sh

# ✅ Resultado: Geo restaurada, commit exitoso
```

### **Caso 4: Actualizar Geo Intencionalmente**

```bash
# Escenario: Agregaste una nueva propiedad al mapa modal de Culiacán

# 1. Actualizar hashes
./publish-helper.sh --update-geo

# ⚠️  Output:
# ⚠️  Esta acción actualizará los hashes de TODOS los archivos protegidos.
# ⚠️  Solo ejecutar si los cambios son INTENCIONADOS.
#
# ¿Continuar? (yes/no): yes

# ✅ Hashes actualizados

# 2. Agregar archivo de hashes
git add .geolocation-hashes.json

# 3. Commit normal
./publish-helper.sh "feat: Agregar Casa Tres Ríos al mapa modal Culiacán"

# ✅ Resultado: Geo actualizada + hashes actualizados + commit exitoso
```

---

## 🔧 Configuración

### **Instalar Husky (Primera vez)**

```bash
# Instalar Husky
npm install --save-dev husky

# Inicializar Husky
npx husky install

# Crear pre-commit hook
npx husky add .husky/pre-commit "node verify-geolocation.js"

# Dar permisos
chmod +x .husky/pre-commit
```

### **Configurar Git Template**

```bash
# Establecer template de commit
git config commit.template .commit-templates/publish-template.txt
```

---

## 📁 Estructura de Archivos

```
/
├── verify-geolocation.js           # Verificador principal
├── publish-helper.sh               # Helper de publicación
├── .geolocation-hashes.json        # Hashes guardados
├── .commit-templates/
│   └── publish-template.txt        # Template de commits
├── .geolocation-backups/           # Backups automáticos
│   ├── index-2025-10-27T00-12-52-004Z.html
│   └── ...
└── .husky/
    └── pre-commit                  # Hook de Git
```

---

## 🛡️ Archivos Protegidos

### **culiacan/index.html**

**Secciones protegidas:**
```html
<script>
    // MARKER_CONFIG
    const MARKER_CONFIG = {
        'casa-venta-slug': {
            position: { lat: 24.8091, lng: -107.3940 },
            // ...
        }
    };

    // CURRENT_PROPERTY_DATA
    const CURRENT_PROPERTY_DATA = {
        priceShort: "$4M",
        // ...
    };

    // initMap()
    function initMap() {
        // ...
    }
</script>
```

### **monterrey/index.html**

Similar a Culiacán, pero con coordenadas de Monterrey.

### **mazatlan/index.html**

Similar a Culiacán, pero con coordenadas de Mazatlán.

---

## 📊 Hash de Geolocalización

El sistema calcula hashes SHA256 de las secciones de geolocalización:

```json
{
  "culiacan/index.html": {
    "hash": "a1b2c3d4e5f6...",
    "lastChecked": "2025-10-27T00:12:52.004Z",
    "lastModified": "2025-10-27T00:12:52.004Z"
  },
  "monterrey/index.html": {
    "hash": "f6e5d4c3b2a1...",
    "lastChecked": "2025-10-27T00:12:52.009Z",
    "lastModified": "2025-10-27T00:12:52.009Z"
  }
}
```

**Proceso:**
1. Extraer secciones de geo del HTML
2. Normalizar contenido (espacios, saltos)
3. Calcular SHA256
4. Comparar con hash guardado
5. Si difiere: Bloquear commit

---

## 🔍 Análisis de Backups

```bash
# Ver backups disponibles
ls -lh .geolocation-backups/

# Ver diferencias con backup
diff culiacan/index.html .geolocation-backups/index-*.html

# Restaurar manualmente desde backup específico
cp .geolocation-backups/index-2025-10-27T00-12-52-004Z.html culiacan/index.html
```

---

## ⚙️ Configuración Avanzada

### **Agregar Archivos Protegidos**

Editar `verify-geolocation.js`:

```javascript
const CONFIG = {
    PROTECTED_FILES: [
        'culiacan/index.html',
        'monterrey/index.html',
        'mazatlan/index.html',
        'nuevo-ciudad/index.html'  // Agregar aquí
    ]
};
```

### **Agregar Secciones Protegidas**

```javascript
const CONFIG = {
    PROTECTED_SECTIONS: [
        'function initMap()',
        'MARKER_CONFIG',
        'CURRENT_PROPERTY_DATA',
        'google.maps.Map',
        'nueva-seccion'  // Agregar aquí
    ]
};
```

---

## 🚨 Troubleshooting

### **Problema: Pre-commit hook no se ejecuta**

**Solución:**
```bash
# Verificar que Husky esté instalado
npx husky install

# Verificar permisos
chmod +x .husky/pre-commit

# Verificar contenido
cat .husky/pre-commit
```

### **Problema: Falso positivo (geo no modificada pero detectada)**

**Causa:** Espacios o saltos de línea diferentes

**Solución:**
```bash
# Ver diferencias exactas
node verify-geolocation.js --verbose

# Si es falso positivo, actualizar hashes
./publish-helper.sh --update-geo
```

### **Problema: Backup corrupto**

**Solución:**
```bash
# Ver backups disponibles
ls -lht .geolocation-backups/

# Usar backup más reciente
cp .geolocation-backups/index-LATEST.html culiacan/index.html

# Actualizar hashes
./publish-helper.sh --update-geo
```

### **Problema: Necesito bypass urgente**

**NO RECOMENDADO, pero si es urgente:**
```bash
# Bypass del hook
git commit --no-verify -m "mensaje"

# Después arreglar geo
./publish-helper.sh --restore-geo
git add .
git commit -m "fix: Restaurar geolocalización"
```

---

## 📈 Mejores Prácticas

### ✅ **DO:**
- Usar `./publish-helper.sh` para TODOS los commits
- Verificar geo antes de commit: `./publish-helper.sh --verify`
- Crear backups manualmente antes de cambios grandes
- Actualizar hashes después de cambios intencionales en geo
- Usar mensajes de commit descriptivos

### ❌ **DON'T:**
- NO usar `git commit --no-verify` habitualmente
- NO modificar `MARKER_CONFIG` sin actualizar hashes
- NO editar `.geolocation-hashes.json` manualmente
- NO ignorar advertencias del verificador
- NO commitear sin verificar cambios en geo

---

## 📚 Comandos de Referencia Rápida

```bash
# ═══════════════════════════════════════════════════════════════
# COMMITS SEGUROS
# ═══════════════════════════════════════════════════════════════

# Modo interactivo (recomendado)
./publish-helper.sh

# Commit directo
./publish-helper.sh "feat: Nueva propiedad"

# ═══════════════════════════════════════════════════════════════
# VERIFICACIÓN DE GEO
# ═══════════════════════════════════════════════════════════════

# Verificar integridad
./publish-helper.sh --verify
node verify-geolocation.js

# Verificar con detalles
node verify-geolocation.js --verbose

# ═══════════════════════════════════════════════════════════════
# RESTAURACIÓN
# ═══════════════════════════════════════════════════════════════

# Auto-restaurar desde backups
./publish-helper.sh --restore-geo
node verify-geolocation.js --fix

# Restaurar manualmente
git checkout -- culiacan/index.html

# ═══════════════════════════════════════════════════════════════
# ACTUALIZACIÓN DE HASHES
# ═══════════════════════════════════════════════════════════════

# Actualizar hashes (cambios intencionales)
./publish-helper.sh --update-geo
node verify-geolocation.js --update

# ═══════════════════════════════════════════════════════════════
# BACKUPS
# ═══════════════════════════════════════════════════════════════

# Ver backups
ls -lht .geolocation-backups/

# Restaurar desde backup específico
cp .geolocation-backups/index-TIMESTAMP.html culiacan/index.html

# ═══════════════════════════════════════════════════════════════
# TEMPLATE Y AYUDA
# ═══════════════════════════════════════════════════════════════

# Ver template de commits
./publish-helper.sh --template

# Ver ayuda
./publish-helper.sh --help
node verify-geolocation.js --help
```

---

**Versión:** 1.0
**Última actualización:** Octubre 2025
**Mantenido por:** Hector Palazuelos + Claude
