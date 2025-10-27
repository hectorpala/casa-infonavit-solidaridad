#!/usr/bin/env node

/**
 * VERIFICADOR DE GEOLOCALIZACIÓN - PROTECCIÓN DE INTEGRIDAD
 * ==========================================================
 *
 * Script de pre-commit que verifica que la sección de geolocalización
 * no haya sido modificada accidentalmente.
 *
 * Protege las siguientes secciones en archivos HTML:
 * - <script> con initMap()
 * - Coordenadas de propiedades
 * - Markers del mapa
 * - API keys de Google Maps
 *
 * Uso:
 *   node verify-geolocation.js
 *   node verify-geolocation.js --fix  # Auto-restaurar desde backup
 *
 * @author Hector Palazuelos + Claude
 * @version 1.0
 * @date Octubre 2025
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CONFIG = {
    HASH_FILE: '.geolocation-hashes.json',
    BACKUP_DIR: '.geolocation-backups',
    PROTECTED_FILES: [
        'culiacan/index.html',
        'monterrey/index.html',
        'mazatlan/index.html'
    ],
    PROTECTED_SECTIONS: [
        'function initMap()',
        'MARKER_CONFIG',
        'CURRENT_PROPERTY_DATA',
        'google.maps.Map'
    ]
};

// Argumentos CLI
const args = process.argv.slice(2);
const AUTO_FIX = args.includes('--fix');
const VERBOSE = args.includes('--verbose') || args.includes('-v');

// ============================================================================
// COLORES PARA OUTPUT
// ============================================================================

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// ============================================================================
// FUNCIONES DE HASH
// ============================================================================

/**
 * Extrae la sección de geolocalización de un archivo HTML
 */
function extractGeoSection(htmlContent) {
    const sections = [];

    // Extraer script de initMap
    const mapScriptRegex = /<script[^>]*>[\s\S]*?function initMap\(\)[\s\S]*?<\/script>/g;
    const mapScripts = htmlContent.match(mapScriptRegex) || [];
    sections.push(...mapScripts);

    // Extraer MARKER_CONFIG
    const markerConfigRegex = /const MARKER_CONFIG = \{[\s\S]*?\};/g;
    const markerConfigs = htmlContent.match(markerConfigRegex) || [];
    sections.push(...markerConfigs);

    // Extraer CURRENT_PROPERTY_DATA
    const currentPropRegex = /const CURRENT_PROPERTY_DATA = \{[\s\S]*?\};/g;
    const currentProps = htmlContent.match(currentPropRegex) || [];
    sections.push(...currentProps);

    // Si no encontró nada, retornar contenido completo (para calcular hash inicial)
    if (sections.length === 0) {
        return htmlContent;
    }

    return sections.join('\n\n');
}

/**
 * Calcula el hash SHA256 de una sección
 */
function calculateHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Normaliza el contenido para comparación
 * (elimina espacios, saltos de línea extra, etc.)
 */
function normalizeContent(content) {
    return content
        .replace(/\s+/g, ' ')  // Multiple espacios → 1 espacio
        .replace(/\s*([{}();,])\s*/g, '$1')  // Espacios alrededor de símbolos
        .trim();
}

// ============================================================================
// LECTURA Y ESCRITURA DE HASHES
// ============================================================================

function loadHashes() {
    try {
        if (fs.existsSync(CONFIG.HASH_FILE)) {
            const data = fs.readFileSync(CONFIG.HASH_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        log(`⚠️  Error leyendo hashes: ${error.message}`, 'yellow');
    }
    return {};
}

function saveHashes(hashes) {
    try {
        fs.writeFileSync(
            CONFIG.HASH_FILE,
            JSON.stringify(hashes, null, 2),
            'utf8'
        );
        return true;
    } catch (error) {
        log(`❌ Error guardando hashes: ${error.message}`, 'red');
        return false;
    }
}

// ============================================================================
// BACKUP Y RESTORE
// ============================================================================

function createBackup(filePath, content) {
    try {
        // Crear directorio de backups
        if (!fs.existsSync(CONFIG.BACKUP_DIR)) {
            fs.mkdirSync(CONFIG.BACKUP_DIR, { recursive: true });
        }

        // Nombre del backup con timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = path.basename(filePath).replace('.html', '') +
                          `-${timestamp}.html`;
        const backupPath = path.join(CONFIG.BACKUP_DIR, backupName);

        fs.writeFileSync(backupPath, content, 'utf8');

        if (VERBOSE) {
            log(`📦 Backup creado: ${backupPath}`, 'gray');
        }

        return backupPath;
    } catch (error) {
        log(`⚠️  Error creando backup: ${error.message}`, 'yellow');
        return null;
    }
}

function findLatestBackup(filePath) {
    try {
        const fileName = path.basename(filePath).replace('.html', '');
        const files = fs.readdirSync(CONFIG.BACKUP_DIR);

        const backups = files
            .filter(f => f.startsWith(fileName) && f.endsWith('.html'))
            .sort()
            .reverse();

        if (backups.length > 0) {
            return path.join(CONFIG.BACKUP_DIR, backups[0]);
        }
    } catch (error) {
        // Directorio no existe o está vacío
    }
    return null;
}

function restoreFromBackup(filePath) {
    const backupPath = findLatestBackup(filePath);

    if (!backupPath) {
        log(`❌ No se encontró backup para ${filePath}`, 'red');
        return false;
    }

    try {
        const backupContent = fs.readFileSync(backupPath, 'utf8');
        fs.writeFileSync(filePath, backupContent, 'utf8');
        log(`✅ Restaurado desde: ${backupPath}`, 'green');
        return true;
    } catch (error) {
        log(`❌ Error restaurando: ${error.message}`, 'red');
        return false;
    }
}

// ============================================================================
// VERIFICACIÓN
// ============================================================================

function verifyFile(filePath) {
    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
        if (VERBOSE) {
            log(`⏭️  Saltando (no existe): ${filePath}`, 'gray');
        }
        return { valid: true, skipped: true };
    }

    try {
        // Leer contenido actual
        const currentContent = fs.readFileSync(filePath, 'utf8');
        const geoSection = extractGeoSection(currentContent);
        const normalizedSection = normalizeContent(geoSection);
        const currentHash = calculateHash(normalizedSection);

        // Cargar hashes guardados
        const savedHashes = loadHashes();

        // Si no existe hash previo, guardarlo
        if (!savedHashes[filePath]) {
            log(`📝 Primera verificación de: ${filePath}`, 'cyan');

            // Crear backup inicial
            createBackup(filePath, currentContent);

            savedHashes[filePath] = {
                hash: currentHash,
                lastChecked: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };

            saveHashes(savedHashes);
            return { valid: true, isNew: true };
        }

        // Comparar con hash guardado
        if (currentHash === savedHashes[filePath].hash) {
            // Hash coincide - geolocalización intacta
            savedHashes[filePath].lastChecked = new Date().toISOString();
            saveHashes(savedHashes);

            if (VERBOSE) {
                log(`✅ Intacto: ${filePath}`, 'green');
            }

            return { valid: true };
        } else {
            // Hash NO coincide - geolocalización modificada
            return {
                valid: false,
                filePath,
                expectedHash: savedHashes[filePath].hash,
                actualHash: currentHash,
                lastModified: savedHashes[filePath].lastModified
            };
        }

    } catch (error) {
        log(`❌ Error verificando ${filePath}: ${error.message}`, 'red');
        return { valid: false, error: error.message };
    }
}

function verifyAll() {
    log('\n╔═══════════════════════════════════════════════════════════════╗', 'bright');
    log('║  🔍 VERIFICADOR DE GEOLOCALIZACIÓN                          ║', 'bright');
    log('╚═══════════════════════════════════════════════════════════════╝\n', 'bright');

    const results = [];
    let allValid = true;

    for (const filePath of CONFIG.PROTECTED_FILES) {
        const result = verifyFile(filePath);
        results.push({ filePath, ...result });

        if (!result.valid && !result.skipped) {
            allValid = false;
        }
    }

    // Mostrar resultados
    log('📊 Resultados:', 'cyan');
    console.log('');

    for (const result of results) {
        if (result.skipped) {
            log(`  ⏭️  ${result.filePath} (no existe)`, 'gray');
        } else if (result.isNew) {
            log(`  📝 ${result.filePath} (hash inicial guardado)`, 'cyan');
        } else if (result.valid) {
            log(`  ✅ ${result.filePath}`, 'green');
        } else {
            log(`  ❌ ${result.filePath} - MODIFICADO`, 'red');

            if (VERBOSE) {
                log(`     Hash esperado: ${result.expectedHash}`, 'gray');
                log(`     Hash actual:   ${result.actualHash}`, 'gray');
            }
        }
    }

    console.log('');

    // Si hay modificaciones
    if (!allValid) {
        log('⚠️  ADVERTENCIA: Se detectaron modificaciones en secciones de geolocalización', 'yellow');
        console.log('');
        log('Las siguientes secciones están protegidas:', 'yellow');
        CONFIG.PROTECTED_SECTIONS.forEach(section => {
            log(`  - ${section}`, 'gray');
        });
        console.log('');

        if (AUTO_FIX) {
            log('🔧 Modo AUTO-FIX activado. Restaurando desde backups...', 'cyan');
            console.log('');

            for (const result of results) {
                if (!result.valid && !result.skipped && !result.isNew) {
                    const restored = restoreFromBackup(result.filePath);
                    if (restored) {
                        // Actualizar hash después de restaurar
                        verifyFile(result.filePath);
                    }
                }
            }

            log('\n✅ Restauración completada', 'green');
        } else {
            log('Opciones:', 'cyan');
            log('  1. Revertir cambios manualmente', 'gray');
            log('  2. Ejecutar: node verify-geolocation.js --fix', 'gray');
            log('  3. Si los cambios son intencionales, actualizar hashes:', 'gray');
            log('     node verify-geolocation.js --update', 'gray');
            console.log('');

            process.exit(1);
        }
    } else {
        log('✅ Todas las secciones de geolocalización están intactas\n', 'green');
    }

    return allValid;
}

// ============================================================================
// ACTUALIZAR HASHES (cuando cambios son intencionales)
// ============================================================================

function updateHashes() {
    log('\n╔═══════════════════════════════════════════════════════════════╗', 'bright');
    log('║  🔄 ACTUALIZAR HASHES DE GEOLOCALIZACIÓN                     ║', 'bright');
    log('╚═══════════════════════════════════════════════════════════════╝\n', 'bright');

    log('⚠️  Esta acción actualizará los hashes de TODOS los archivos protegidos.', 'yellow');
    log('⚠️  Solo ejecutar si los cambios son INTENCIONADOS.\n', 'yellow');

    const savedHashes = loadHashes();

    for (const filePath of CONFIG.PROTECTED_FILES) {
        if (!fs.existsSync(filePath)) {
            log(`⏭️  Saltando (no existe): ${filePath}`, 'gray');
            continue;
        }

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const geoSection = extractGeoSection(content);
            const normalizedSection = normalizeContent(geoSection);
            const newHash = calculateHash(normalizedSection);

            // Crear backup antes de actualizar
            createBackup(filePath, content);

            savedHashes[filePath] = {
                hash: newHash,
                lastChecked: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };

            log(`✅ Hash actualizado: ${filePath}`, 'green');
        } catch (error) {
            log(`❌ Error procesando ${filePath}: ${error.message}`, 'red');
        }
    }

    saveHashes(savedHashes);
    log('\n✅ Todos los hashes actualizados\n', 'green');
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
    if (args.includes('--update')) {
        updateHashes();
    } else if (args.includes('--help') || args.includes('-h')) {
        console.log(`
VERIFICADOR DE GEOLOCALIZACIÓN
===============================

Protege las secciones de geolocalización contra modificaciones accidentales.

USO:
  node verify-geolocation.js              Verificar archivos
  node verify-geolocation.js --fix        Auto-restaurar desde backups
  node verify-geolocation.js --update     Actualizar hashes (cambios intencionales)
  node verify-geolocation.js --verbose    Mostrar detalles adicionales
  node verify-geolocation.js --help       Mostrar esta ayuda

ARCHIVOS PROTEGIDOS:
${CONFIG.PROTECTED_FILES.map(f => `  - ${f}`).join('\n')}

SECCIONES PROTEGIDAS:
${CONFIG.PROTECTED_SECTIONS.map(s => `  - ${s}`).join('\n')}

BACKUPS:
  Los backups se guardan automáticamente en: ${CONFIG.BACKUP_DIR}/

EXIT CODES:
  0 - Todo OK o cambios restaurados
  1 - Modificaciones detectadas (sin --fix)
`);
    } else {
        verifyAll();
    }
}

// ============================================================================
// ENTRY POINT
// ============================================================================

if (require.main === module) {
    main();
}

module.exports = { verifyFile, verifyAll, updateHashes };
