#!/usr/bin/env node

/**
 * GESTOR DE LOTES - INMUEBLES24
 *
 * Gestión completa de lotes de URLs con metadatos, backups y recuperación.
 *
 * COMANDOS:
 *   node lote-manager.js init <archivo-urls> [opciones]       Crear nuevo lote
 *   node lote-manager.js add-metadata [opciones]              Agregar/editar metadatos
 *   node lote-manager.js mark-processed <propertyId>          Marcar URL como procesada
 *   node lote-manager.js mark-failed <propertyId> <razon>     Marcar URL como fallida
 *   node lote-manager.js status                               Ver estado del lote
 *   node lote-manager.js backup                               Crear backup manual
 *   node lote-manager.js restore [backup-file]                Restaurar desde backup
 *   node lote-manager.js list-backups                         Listar backups disponibles
 *
 * OPCIONES init:
 *   --rango-precio "3M-4M"        Rango de precios del lote
 *   --ciudad "Culiacán"           Ciudad de las propiedades
 *   --tipo "Casas en Venta"       Tipo de propiedades
 *   --notas "Lote semanal..."     Notas adicionales
 *
 * OPCIONES add-metadata:
 *   --rango-precio <rango>
 *   --ciudad <ciudad>
 *   --tipo <tipo>
 *   --notas <notas>
 *
 * EJEMPLOS:
 *   # Crear lote nuevo
 *   node lote-manager.js init audit-2025-10-26-nuevas.txt \
 *     --rango-precio "3M-4M" \
 *     --ciudad "Culiacán" \
 *     --tipo "Casas en Venta" \
 *     --notas "Lote semanal de propiedades premium"
 *
 *   # Marcar URL como procesada (scrapeada exitosamente)
 *   node lote-manager.js mark-processed 147805533
 *
 *   # Marcar URL como fallida
 *   node lote-manager.js mark-failed 147696056 "Propiedad removida de Inmuebles24"
 *
 *   # Ver estado del lote
 *   node lote-manager.js status
 *
 *   # Restaurar desde último backup
 *   node lote-manager.js restore
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURACIÓN
// ============================================

const CONFIG = {
    loteFile: '1depuracionurlinmuebles24.json',
    backupDir: 'backups-lotes',
    maxBackups: 10
};

// ============================================
// FUNCIONES DE BACKUP
// ============================================

/**
 * Crea directorio de backups si no existe
 */
function ensureBackupDir() {
    if (!fs.existsSync(CONFIG.backupDir)) {
        fs.mkdirSync(CONFIG.backupDir, { recursive: true });
    }
}

/**
 * Crea backup del lote actual
 */
function createBackup(reason = 'manual') {
    ensureBackupDir();

    if (!fs.existsSync(CONFIG.loteFile)) {
        console.log('⚠️  No hay lote actual para hacer backup');
        return null;
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T').join('_').split('Z')[0];
    const backupFile = path.join(CONFIG.backupDir, `lote-backup-${timestamp}.json`);

    // Copiar archivo
    const loteData = JSON.parse(fs.readFileSync(CONFIG.loteFile, 'utf8'));

    // Agregar metadata de backup
    const backupData = {
        ...loteData,
        backupMetadata: {
            createdAt: now.toISOString(),
            createdAtReadable: now.toLocaleString('es-MX'),
            reason,
            originalFile: CONFIG.loteFile
        }
    };

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');

    console.log(`✅ Backup creado: ${backupFile}`);
    console.log(`   Razón: ${reason}`);

    // Limpiar backups antiguos
    cleanOldBackups();

    return backupFile;
}

/**
 * Limpia backups antiguos (mantiene solo los últimos N)
 */
function cleanOldBackups() {
    if (!fs.existsSync(CONFIG.backupDir)) return;

    const backups = fs.readdirSync(CONFIG.backupDir)
        .filter(f => f.startsWith('lote-backup-') && f.endsWith('.json'))
        .map(f => ({
            name: f,
            path: path.join(CONFIG.backupDir, f),
            mtime: fs.statSync(path.join(CONFIG.backupDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.mtime - a.mtime); // Más recientes primero

    if (backups.length > CONFIG.maxBackups) {
        const toDelete = backups.slice(CONFIG.maxBackups);
        toDelete.forEach(backup => {
            fs.unlinkSync(backup.path);
            console.log(`   🗑️  Backup antiguo eliminado: ${backup.name}`);
        });
    }
}

/**
 * Lista backups disponibles
 */
function listBackups() {
    ensureBackupDir();

    const backups = fs.readdirSync(CONFIG.backupDir)
        .filter(f => f.startsWith('lote-backup-') && f.endsWith('.json'))
        .map(f => {
            const fullPath = path.join(CONFIG.backupDir, f);
            const stats = fs.statSync(fullPath);
            const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

            return {
                name: f,
                path: fullPath,
                mtime: stats.mtime,
                size: stats.size,
                totalUrls: data.totalUrlsNuevas || data.metadata?.totalUrls || 0,
                procesadas: data.progreso?.procesadas || 0,
                pendientes: data.progreso?.pendientes || 0
            };
        })
        .sort((a, b) => b.mtime - a.mtime);

    if (backups.length === 0) {
        console.log('ℹ️  No hay backups disponibles');
        return [];
    }

    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  📦 BACKUPS DISPONIBLES                                      ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');

    backups.forEach((backup, index) => {
        const date = backup.mtime.toLocaleString('es-MX');
        const sizeMB = (backup.size / 1024).toFixed(2);
        console.log(`${index + 1}. ${backup.name}`);
        console.log(`   📅 Fecha: ${date}`);
        console.log(`   📊 URLs: ${backup.totalUrls} total, ${backup.procesadas} procesadas, ${backup.pendientes} pendientes`);
        console.log(`   💾 Tamaño: ${sizeMB} KB`);
        console.log('');
    });

    return backups;
}

/**
 * Restaura desde backup
 */
function restoreFromBackup(backupFile = null) {
    ensureBackupDir();

    // Si no se especifica backup, usar el más reciente
    if (!backupFile) {
        const backups = fs.readdirSync(CONFIG.backupDir)
            .filter(f => f.startsWith('lote-backup-') && f.endsWith('.json'))
            .map(f => ({
                name: f,
                path: path.join(CONFIG.backupDir, f),
                mtime: fs.statSync(path.join(CONFIG.backupDir, f)).mtime.getTime()
            }))
            .sort((a, b) => b.mtime - a.mtime);

        if (backups.length === 0) {
            console.log('❌ No hay backups disponibles');
            return false;
        }

        backupFile = backups[0].path;
        console.log(`📦 Usando backup más reciente: ${path.basename(backupFile)}`);
    } else {
        // Verificar que existe
        if (!fs.existsSync(backupFile)) {
            // Intentar en directorio de backups
            const fullPath = path.join(CONFIG.backupDir, backupFile);
            if (fs.existsSync(fullPath)) {
                backupFile = fullPath;
            } else {
                console.log(`❌ Backup no encontrado: ${backupFile}`);
                return false;
            }
        }
    }

    // Crear backup del estado actual antes de restaurar
    if (fs.existsSync(CONFIG.loteFile)) {
        console.log('💾 Creando backup del estado actual antes de restaurar...');
        createBackup('pre-restore');
    }

    // Leer backup
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    // Eliminar metadata de backup antes de restaurar
    if (backupData.backupMetadata) {
        delete backupData.backupMetadata;
    }

    // Escribir archivo restaurado
    fs.writeFileSync(CONFIG.loteFile, JSON.stringify(backupData, null, 2), 'utf8');

    console.log('');
    console.log('✅ Lote restaurado exitosamente desde backup');
    console.log(`   📁 Backup: ${path.basename(backupFile)}`);
    console.log(`   📊 URLs restauradas: ${backupData.totalUrlsNuevas || backupData.metadata?.totalUrls || 0}`);
    console.log('');

    return true;
}

// ============================================
// GESTIÓN DE LOTE
// ============================================

/**
 * Extrae Property ID desde URL
 */
function extractPropertyId(url) {
    const match = url.match(/-(\d+)\.html/);
    return match ? match[1] : null;
}

/**
 * Inicializa un nuevo lote desde archivo de URLs
 */
function initLote(urlsFile, options = {}) {
    if (!fs.existsSync(urlsFile)) {
        throw new Error(`Archivo no encontrado: ${urlsFile}`);
    }

    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  🚀 INICIALIZANDO NUEVO LOTE                                 ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📁 Archivo de entrada: ${urlsFile}`);
    console.log('');

    // Leer URLs
    const urlsContent = fs.readFileSync(urlsFile, 'utf8');
    const urls = urlsContent.split('\n')
        .map(line => line.trim())
        .filter(line => line && line.startsWith('http'));

    console.log(`📊 URLs cargadas: ${urls.length}`);

    // Crear estructura del lote
    const now = new Date();
    const loteData = {
        metadata: {
            generadoEn: now.toISOString(),
            generadoEnReadable: now.toLocaleString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }),
            archivoOrigen: urlsFile,
            version: '2.0',
            rangoPrecio: options.rangoPrecio || null,
            ciudad: options.ciudad || null,
            tipo: options.tipo || null,
            notas: options.notas || null
        },
        progreso: {
            totalUrls: urls.length,
            procesadas: 0,
            fallidas: 0,
            pendientes: urls.length,
            porcentajeCompletado: '0.00%'
        },
        urls: urls.map(url => {
            const propertyId = extractPropertyId(url);
            return {
                url,
                urlNormalizada: url,
                propertyId,
                claveCanonica: propertyId ? `id:${propertyId}` : null,
                estado: 'pendiente', // pendiente, procesada, fallida
                procesadaEn: null,
                razonFallo: null
            };
        }),
        historial: [
            {
                timestamp: now.toISOString(),
                evento: 'lote_creado',
                descripcion: `Lote inicializado con ${urls.length} URLs`
            }
        ]
    };

    // Hacer backup si ya existe un lote
    if (fs.existsSync(CONFIG.loteFile)) {
        console.log('💾 Lote existente detectado, creando backup...');
        createBackup('pre-init');
    }

    // Guardar lote
    fs.writeFileSync(CONFIG.loteFile, JSON.stringify(loteData, null, 2), 'utf8');

    console.log('');
    console.log('✅ Lote inicializado exitosamente');
    console.log('');
    console.log('📊 METADATOS:');
    if (loteData.metadata.rangoPrecio) {
        console.log(`   💰 Rango de precio: ${loteData.metadata.rangoPrecio}`);
    }
    if (loteData.metadata.ciudad) {
        console.log(`   🏙️  Ciudad: ${loteData.metadata.ciudad}`);
    }
    if (loteData.metadata.tipo) {
        console.log(`   🏠 Tipo: ${loteData.metadata.tipo}`);
    }
    if (loteData.metadata.notas) {
        console.log(`   📝 Notas: ${loteData.metadata.notas}`);
    }
    console.log('');
    console.log(`📁 Archivo: ${CONFIG.loteFile}`);
    console.log('');

    return loteData;
}

/**
 * Agrega o edita metadatos del lote
 */
function addMetadata(options = {}) {
    if (!fs.existsSync(CONFIG.loteFile)) {
        throw new Error('No hay lote activo. Usa "init" primero.');
    }

    // Crear backup antes de modificar
    createBackup('pre-metadata-edit');

    const loteData = JSON.parse(fs.readFileSync(CONFIG.loteFile, 'utf8'));

    // Actualizar metadatos
    if (options.rangoPrecio !== undefined) {
        loteData.metadata.rangoPrecio = options.rangoPrecio;
    }
    if (options.ciudad !== undefined) {
        loteData.metadata.ciudad = options.ciudad;
    }
    if (options.tipo !== undefined) {
        loteData.metadata.tipo = options.tipo;
    }
    if (options.notas !== undefined) {
        loteData.metadata.notas = options.notas;
    }

    // Agregar evento al historial
    const now = new Date();
    loteData.historial.push({
        timestamp: now.toISOString(),
        evento: 'metadata_actualizada',
        descripcion: 'Metadatos del lote actualizados',
        cambios: options
    });

    // Guardar
    fs.writeFileSync(CONFIG.loteFile, JSON.stringify(loteData, null, 2), 'utf8');

    console.log('✅ Metadatos actualizados exitosamente');
    console.log('');
    console.log('📊 METADATOS ACTUALES:');
    console.log(`   💰 Rango de precio: ${loteData.metadata.rangoPrecio || 'N/A'}`);
    console.log(`   🏙️  Ciudad: ${loteData.metadata.ciudad || 'N/A'}`);
    console.log(`   🏠 Tipo: ${loteData.metadata.tipo || 'N/A'}`);
    console.log(`   📝 Notas: ${loteData.metadata.notas || 'N/A'}`);
    console.log('');

    return loteData;
}

/**
 * Marca una URL como procesada
 */
function markProcessed(propertyId) {
    if (!fs.existsSync(CONFIG.loteFile)) {
        throw new Error('No hay lote activo.');
    }

    // Crear backup antes de modificar
    createBackup('auto-checkpoint');

    const loteData = JSON.parse(fs.readFileSync(CONFIG.loteFile, 'utf8'));

    // Buscar URL
    const urlIndex = loteData.urls.findIndex(u => u.propertyId === propertyId);
    if (urlIndex === -1) {
        throw new Error(`Property ID no encontrado: ${propertyId}`);
    }

    const url = loteData.urls[urlIndex];

    // Actualizar estado
    const now = new Date();
    url.estado = 'procesada';
    url.procesadaEn = now.toISOString();

    // Actualizar progreso
    loteData.progreso.procesadas++;
    loteData.progreso.pendientes--;
    loteData.progreso.porcentajeCompletado =
        ((loteData.progreso.procesadas / loteData.progreso.totalUrls) * 100).toFixed(2) + '%';

    // Agregar evento
    loteData.historial.push({
        timestamp: now.toISOString(),
        evento: 'url_procesada',
        propertyId,
        url: url.url
    });

    // Guardar
    fs.writeFileSync(CONFIG.loteFile, JSON.stringify(loteData, null, 2), 'utf8');

    console.log(`✅ URL marcada como procesada: ${propertyId}`);
    console.log(`   📊 Progreso: ${loteData.progreso.procesadas}/${loteData.progreso.totalUrls} (${loteData.progreso.porcentajeCompletado})`);

    return loteData;
}

/**
 * Marca una URL como fallida
 */
function markFailed(propertyId, razon) {
    if (!fs.existsSync(CONFIG.loteFile)) {
        throw new Error('No hay lote activo.');
    }

    // Crear backup antes de modificar
    createBackup('auto-checkpoint');

    const loteData = JSON.parse(fs.readFileSync(CONFIG.loteFile, 'utf8'));

    // Buscar URL
    const urlIndex = loteData.urls.findIndex(u => u.propertyId === propertyId);
    if (urlIndex === -1) {
        throw new Error(`Property ID no encontrado: ${propertyId}`);
    }

    const url = loteData.urls[urlIndex];

    // Actualizar estado
    const now = new Date();
    url.estado = 'fallida';
    url.procesadaEn = now.toISOString();
    url.razonFallo = razon;

    // Actualizar progreso
    loteData.progreso.fallidas++;
    loteData.progreso.pendientes--;

    // Agregar evento
    loteData.historial.push({
        timestamp: now.toISOString(),
        evento: 'url_fallida',
        propertyId,
        url: url.url,
        razon
    });

    // Guardar
    fs.writeFileSync(CONFIG.loteFile, JSON.stringify(loteData, null, 2), 'utf8');

    console.log(`❌ URL marcada como fallida: ${propertyId}`);
    console.log(`   Razón: ${razon}`);
    console.log(`   📊 Progreso: ${loteData.progreso.procesadas}/${loteData.progreso.totalUrls}`);

    return loteData;
}

/**
 * Muestra estado del lote actual
 */
function showStatus() {
    if (!fs.existsSync(CONFIG.loteFile)) {
        console.log('ℹ️  No hay lote activo');
        return null;
    }

    const loteData = JSON.parse(fs.readFileSync(CONFIG.loteFile, 'utf8'));

    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  📊 ESTADO DEL LOTE                                          ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📋 INFORMACIÓN GENERAL:');
    console.log(`   📅 Creado: ${loteData.metadata.generadoEnReadable}`);
    if (loteData.metadata.rangoPrecio) {
        console.log(`   💰 Rango: ${loteData.metadata.rangoPrecio}`);
    }
    if (loteData.metadata.ciudad) {
        console.log(`   🏙️  Ciudad: ${loteData.metadata.ciudad}`);
    }
    if (loteData.metadata.tipo) {
        console.log(`   🏠 Tipo: ${loteData.metadata.tipo}`);
    }
    if (loteData.metadata.notas) {
        console.log(`   📝 Notas: ${loteData.metadata.notas}`);
    }
    console.log('');

    console.log('📊 PROGRESO:');
    console.log(`   Total URLs: ${loteData.progreso.totalUrls}`);
    console.log(`   ✅ Procesadas: ${loteData.progreso.procesadas}`);
    console.log(`   ❌ Fallidas: ${loteData.progreso.fallidas}`);
    console.log(`   ⏳ Pendientes: ${loteData.progreso.pendientes}`);
    console.log(`   📈 Completado: ${loteData.progreso.porcentajeCompletado}`);
    console.log('');

    // URLs pendientes (primeras 10)
    const pendientes = loteData.urls.filter(u => u.estado === 'pendiente');
    if (pendientes.length > 0) {
        console.log('⏳ URLS PENDIENTES (primeras 10):');
        pendientes.slice(0, 10).forEach((u, i) => {
            console.log(`   ${i + 1}. ID ${u.propertyId} - ${u.url.substring(0, 60)}...`);
        });
        if (pendientes.length > 10) {
            console.log(`   ... y ${pendientes.length - 10} más`);
        }
        console.log('');
    }

    // URLs fallidas
    const fallidas = loteData.urls.filter(u => u.estado === 'fallida');
    if (fallidas.length > 0) {
        console.log('❌ URLS FALLIDAS:');
        fallidas.forEach((u, i) => {
            console.log(`   ${i + 1}. ID ${u.propertyId} - ${u.razonFallo}`);
        });
        console.log('');
    }

    return loteData;
}

// ============================================
// CLI
// ============================================

if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];

    try {
        switch (command) {
            case 'init': {
                const urlsFile = args[1];
                if (!urlsFile) {
                    console.log('❌ Falta archivo de URLs');
                    console.log('Uso: node lote-manager.js init <archivo-urls> [opciones]');
                    process.exit(1);
                }

                const options = {};
                for (let i = 2; i < args.length; i += 2) {
                    const flag = args[i];
                    const value = args[i + 1];
                    if (flag === '--rango-precio') options.rangoPrecio = value;
                    if (flag === '--ciudad') options.ciudad = value;
                    if (flag === '--tipo') options.tipo = value;
                    if (flag === '--notas') options.notas = value;
                }

                initLote(urlsFile, options);
                break;
            }

            case 'add-metadata': {
                const options = {};
                for (let i = 1; i < args.length; i += 2) {
                    const flag = args[i];
                    const value = args[i + 1];
                    if (flag === '--rango-precio') options.rangoPrecio = value;
                    if (flag === '--ciudad') options.ciudad = value;
                    if (flag === '--tipo') options.tipo = value;
                    if (flag === '--notas') options.notas = value;
                }

                addMetadata(options);
                break;
            }

            case 'mark-processed': {
                const propertyId = args[1];
                if (!propertyId) {
                    console.log('❌ Falta Property ID');
                    console.log('Uso: node lote-manager.js mark-processed <propertyId>');
                    process.exit(1);
                }
                markProcessed(propertyId);
                break;
            }

            case 'mark-failed': {
                const propertyId = args[1];
                const razon = args.slice(2).join(' ');
                if (!propertyId || !razon) {
                    console.log('❌ Faltan argumentos');
                    console.log('Uso: node lote-manager.js mark-failed <propertyId> <razon>');
                    process.exit(1);
                }
                markFailed(propertyId, razon);
                break;
            }

            case 'status':
                showStatus();
                break;

            case 'backup':
                createBackup('manual');
                break;

            case 'restore': {
                const backupFile = args[1];
                restoreFromBackup(backupFile);
                break;
            }

            case 'list-backups':
                listBackups();
                break;

            default:
                console.log('');
                console.log('╔═══════════════════════════════════════════════════════════════╗');
                console.log('║  📦 GESTOR DE LOTES - INMUEBLES24                            ║');
                console.log('╚═══════════════════════════════════════════════════════════════╝');
                console.log('');
                console.log('COMANDOS:');
                console.log('  init <archivo-urls> [opciones]     Crear nuevo lote');
                console.log('  add-metadata [opciones]            Agregar/editar metadatos');
                console.log('  mark-processed <propertyId>        Marcar URL como procesada');
                console.log('  mark-failed <propertyId> <razon>   Marcar URL como fallida');
                console.log('  status                             Ver estado del lote');
                console.log('  backup                             Crear backup manual');
                console.log('  restore [backup-file]              Restaurar desde backup');
                console.log('  list-backups                       Listar backups');
                console.log('');
                console.log('EJEMPLOS:');
                console.log('  node lote-manager.js init urls.txt --rango-precio "3M-4M"');
                console.log('  node lote-manager.js mark-processed 147805533');
                console.log('  node lote-manager.js restore');
                console.log('');
                process.exit(command ? 1 : 0);
        }
    } catch (error) {
        console.error('');
        console.error('❌ ERROR:', error.message);
        console.error('');
        process.exit(1);
    }
}

// ============================================
// EXPORTAR
// ============================================

module.exports = {
    initLote,
    addMetadata,
    markProcessed,
    markFailed,
    showStatus,
    createBackup,
    restoreFromBackup,
    listBackups
};
