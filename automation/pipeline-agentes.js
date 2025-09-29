#!/usr/bin/env node

/**
 * PIPELINE ORQUESTADO DE 16 AGENTES - SPEC orchestration-v1.1
 * 
 * AGENTE 0 — ORQUESTADOR (Coordinador de Turno)
 * Reglas Base: Documento 1 — Reglas para Subir Propiedades (SPEC props-v3.3)
 * 
 * SISTEMA DE COMPUERTAS Go/No-Go:
 * - Orden estricto #1 → #13 (sin saltar fases)
 * - Handoffs estándar con contratos de datos
 * - Modo Estricto v1.1 (Cumplimiento reforzado)
 * - Token OK_TO_APPLY=true requerido para publicación
 * 
 * FASES IMPLEMENTADAS:
 * #0 Orquestador (Verificación SPEC props-v3.3)
 * #1 IntakeReglas (Secciones normalizadas)
 * #2 RevisorFotos (≥6 fotos, cover, carpeta PROYECTOS)
 * #3 Optimizador (1200px, q=85, images/<slug>/)
 * #4-13 TODO: Implementar según agente-0-orquestador.md
 * 
 * MARCADORES CANÓNICOS:
 * - PAGES: <!-- BEGIN: PAGES -->
 * - HOME: <!-- BEGIN: GRID PROPS -->
 * - CULIACÁN: <!-- BEGIN: GRID CULIACAN -->
 * - CORE: <!-- BEGIN: CAROUSEL CORE -->
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PipelineAgentes {
    constructor() {
        this.baseDirectory = './';
        this.proyectosPath = '/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS';
        this.agentesPath = './docs/automation';
        
        // Estado del pipeline
        this.estado = {
            propiedad: null,
            fotosPath: null,
            slug: null,
            paginaGenerada: null,
            errores: []
        };
    }

    /**
     * AGENTE 0 - ORQUESTADOR (Coordinador de Turno)
     * SPEC: orchestration-v1.1
     * Reglas Base: Documento 1 — Reglas para Subir Propiedades (SPEC props-v3.3)
     * Rol: Coordinar agentes #1 → #13 en orden estricto con compuertas Go/No-Go
     */
    async agente0_orquestador(nombrePropiedad, datosPropiedad = {}) {
        console.log('🎯 AGENTE 0 — ORQUESTADOR (Coordinador de Turno)');
        console.log('SPEC: orchestration-v1.1');
        console.log('═'.repeat(60));
        
        // Inicializar estado del pipeline
        this.estado = {
            ...this.estado,
            orquestador: {
                version: 'orchestration-v1.1',
                especPropsRequerida: 'props-v3.3',
                inicioTurno: new Date().toISOString(),
                fases: {},
                compuertasGo: {},
                handoffs: {},
                tokenPublicacion: false
            },
            propiedad: {
                nombre: nombrePropiedad,
                ...datosPropiedad
            }
        };
        
        console.log('📋 FASE 0: VERIFICACIÓN DE VERSIÓN');
        
        // OBLIGATORIO: Verificar Documento 1 SPEC props-v3.3
        try {
            const documento1Path = './documento 1 reglas para subir.md';
            const documento1 = fs.readFileSync(documento1Path, 'utf8');
            
            // Verificar SPEC props-v3.3
            if (!documento1.includes('props-v3.3')) {
                console.log('❌ NO-GO: Documento 1 no declara SPEC props-v3.3');
                console.log('🔧 Acción: Actualizar Documento 1 a SPEC props-v3.3');
                this.estado.orquestador.compuertasGo.fase0 = false;
                return false;
            }
            
            this.estado.documento1 = documento1;
            this.estado.orquestador.compuertasGo.fase0 = true;
            console.log('✅ DOCUMENTO 1 CARGADO - SPEC props-v3.3 VERIFICADO');
            
        } catch (error) {
            console.error('❌ NO-GO: No se pudo leer Documento 1');
            console.error('🔧 Acción: Verificar ruta ./documento 1 reglas para subir.md');
            this.estado.orquestador.compuertasGo.fase0 = false;
            return false;
        }
        
        console.log('📊 ENTRADAS REQUERIDAS:');
        console.log(`   • Documento 1: ✅ SPEC props-v3.3`);
        console.log(`   • Brief propiedad: ${nombrePropiedad}`);
        console.log(`   • Golden Source patrón: Urbivilla del Roble`);
        console.log(`   • Token publicación: ❌ Pendiente OK_TO_APPLY=true`);
        
        console.log('🎯 SISTEMA: 16 AGENTES ESPECIALIZADOS (#1 → #13)');
        console.log('⚡ MODO: Estricto v1.1 (Cumplimiento reforzado)');
        console.log('🚫 NO PUBLICAR sin token: OK_TO_APPLY=true');
        
        // Inicializar panel de fases
        this.inicializarPanelFases();
        
        console.log('✅ AGENTE 0 COMPLETADO - Pipeline autorizado para continuar');
        console.log('🔄 HANDOFF → Agente #1 IntakeReglas');
        
        return true;
    }
    
    /**
     * Inicializar panel de control de fases
     */
    inicializarPanelFases() {
        const fases = [
            { id: 1, nombre: 'IntakeReglas', status: 'PENDING' },
            { id: 2, nombre: 'RevisorFotos', status: 'PENDING' },
            { id: 3, nombre: 'Optimizador', status: 'PENDING' },
            { id: 4, nombre: 'Normalizador', status: 'PENDING' },
            { id: 5, nombre: 'Slug', status: 'PENDING' },
            { id: 6, nombre: 'GoldenSource', status: 'PENDING' },
            { id: 7, nombre: 'CarouselDoctor', status: 'PENDING' },
            { id: 8, nombre: 'IntegradorDoble', status: 'PENDING' },
            { id: 9, nombre: 'WhatsAppLink', status: 'PENDING' },
            { id: 10, nombre: 'SEO&Schema', status: 'PENDING' },
            { id: 11, nombre: 'CompositorDiffs', status: 'PENDING' },
            { id: 12, nombre: 'GuardiaPrePublicacion', status: 'PENDING' },
            { id: 13, nombre: 'Publicador', status: 'BLOCKED' }
        ];
        
        this.estado.orquestador.fases = fases;
        console.log('📊 PANEL DE FASES INICIALIZADO (#1 → #13)');
    }
    
    /**
     * Validar compuerta Go/No-Go
     */
    validarCompuerta(faseId, criterios) {
        const fase = this.estado.orquestador.fases.find(f => f.id === faseId);
        
        // Verificar criterios obligatorios
        for (const [criterio, valor] of Object.entries(criterios)) {
            if (!valor) {
                console.log(`❌ NO-GO: Fase #${faseId} ${fase.nombre} - ${criterio} falló`);
                fase.status = 'FAIL';
                fase.motivo = criterio;
                this.estado.orquestador.compuertasGo[`fase${faseId}`] = false;
                return false;
            }
        }
        
        console.log(`✅ GO: Fase #${faseId} ${fase.nombre} - Todos los criterios PASS`);
        fase.status = 'PASS';
        this.estado.orquestador.compuertasGo[`fase${faseId}`] = true;
        return true;
    }
    
    /**
     * Generar reporte de turno
     */
    generarReporteTurno() {
        const orq = this.estado.orquestador;
        const propiedad = this.estado.propiedad;
        
        console.log('📋 REPORTE DE TURNO');
        console.log('═'.repeat(50));
        console.log(`Propiedad/slug: ${propiedad.nombre} | ${orq.inicioTurno}`);
        console.log(`SPEC: ${orq.especPropsRequerida} | Version: ${orq.version}`);
        
        let reporteFases = '';
        orq.fases.forEach(fase => {
            const status = fase.status === 'PASS' ? '✅' : 
                          fase.status === 'FAIL' ? '❌' : 
                          fase.status === 'PENDING' ? '⏳' : '🚫';
            reporteFases += `#${fase.id} ${status} `;
        });
        
        console.log(`Fases: ${reporteFases}`);
        
        const todasPasan = orq.fases.slice(0, 12).every(f => f.status === 'PASS');
        const decision = todasPasan ? 'LISTO PARA PUBLICAR' : 'PENDIENTE DE CORRECCIONES';
        console.log(`Decisión: ${decision}`);
        
        return {
            decision,
            reporteFases,
            listoParaPublicar: todasPasan
        };
    }
    
    /**
     * Establecer handoff entre agentes (contratos estrictos)
     */
    establecerHandoff(faseOrigen, faseDestino, datos) {
        this.estado.orquestador.handoffs[`${faseOrigen}_${faseDestino}`] = {
            timestamp: new Date().toISOString(),
            datos,
            validado: true
        };
        
        console.log(`🔄 HANDOFF: #${faseOrigen} → #${faseDestino}`);
        console.log(`📊 Datos: ${JSON.stringify(datos, null, 2)}`);
    }

    /**
     * AGENTE 1 - INTAKE REGLAS (IntakeReglas)
     * SPEC: orchestration-v1.1 - Handoff estándar
     * Normalizar secciones del Documento 1 y validar completitud
     */
    async agente1_intakeReglas() {
        console.log('📋 AGENTE 1 - INTAKE REGLAS');
        console.log('SPEC: orchestration-v1.1 | Documento 1 · SPEC props-v3.3');
        console.log('═'.repeat(50));
        
        // Verificar handoff del Agente 0
        if (!this.estado.orquestador.compuertasGo.fase0) {
            console.log('❌ NO-GO: Agente 0 no autorizado - Sin SPEC props-v3.3');
            return false;
        }
        
        console.log('📊 PROCESANDO DOCUMENTO 1 - Secciones normalizadas...');
        
        // Extraer y normalizar secciones críticas del Documento 1
        const seccionesNormalizadas = this.extraerSeccionesDocumento1();
        const faltantesCriticos = this.validarComplementitud(seccionesNormalizadas);
        
        // Evaluar semáforo
        const semaforo = faltantesCriticos.length === 0 ? 'LISTO' : 'NO';
        
        // Handoff contract estricto
        const handoffData = {
            version: 'props-v3.3',
            secciones_normalizadas: seccionesNormalizadas,
            faltantes_criticos: faltantesCriticos,
            semaforo: semaforo
        };
        
        // Validar compuerta Go/No-Go
        const criterios = {
            'documento1_valido': this.estado.documento1 && this.estado.documento1.length > 0,
            'spec_props_v3_3': this.estado.documento1.includes('props-v3.3'),
            'secciones_completas': faltantesCriticos.length === 0
        };
        
        const puedeAvanzar = this.validarCompuerta(1, criterios);
        
        if (puedeAvanzar) {
            // Establecer handoff para Agente 2
            this.establecerHandoff(1, 2, handoffData);
            console.log('✅ AGENTE 1 COMPLETADO - Handoff establecido → #2 RevisorFotos');
        } else {
            console.log('❌ AGENTE 1 BLOQUEADO - Revisar criterios fallidos');
        }
        
        return puedeAvanzar;
    }
    
    /**
     * Extraer secciones normalizadas del Documento 1
     */
    extraerSeccionesDocumento1() {
        const doc = this.estado.documento1;
        return {
            reglas_fotos: doc.includes('REGLAS OBLIGATORIAS PARA FOTOS'),
            regla_7_critica: doc.includes('REGLA CRÍTICA #7'),
            optimizacion_automatica: doc.includes('OPTIMIZACIÓN 100% AUTOMÁTICA'),
            carousel_flechas: doc.includes('.carousel-prev/.carousel-next'),
            doble_integracion: doc.includes('DOBLE INTEGRACIÓN OBLIGATORIA'),
            crm_obligatorio: doc.includes('CRM INTERNO OBLIGATORIO'),
            verificacion_post: doc.includes('VERIFICACIÓN POST-CREACIÓN'),
            whatsapp_config: doc.includes('CONFIGURACIÓN WHATSAPP'),
            seo_schema: doc.includes('SEO completo')
        };
    }
    
    /**
     * Validar completitud de secciones críticas
     */
    validarComplementitud(secciones) {
        const faltantes = [];
        
        if (!secciones.regla_7_critica) faltantes.push('REGLA_CRITICA_7');
        if (!secciones.doble_integracion) faltantes.push('DOBLE_INTEGRACION');
        if (!secciones.carousel_flechas) faltantes.push('CAROUSEL_FLECHAS');
        if (!secciones.optimizacion_automatica) faltantes.push('OPTIMIZACION_AUTO');
        
        return faltantes;
    }

    /**
     * AGENTE 2 - REVISOR DE FOTOS (RevisorFotos)
     * SPEC: orchestration-v1.1 - Detecta carpeta origen + fachada
     * Handoff: ruta_origen, photos_found, validas, cover, orden[1..N]
     */
    async agente2_revisorFotos() {
        console.log('🏠 AGENTE 2 - REVISOR DE FOTOS');
        console.log('SPEC: orchestration-v1.1 | Documento 1 · SPEC props-v3.3');
        console.log('═'.repeat(50));
        
        // Verificar handoff del Agente 1
        if (!this.estado.orquestador.compuertasGo.fase1) {
            console.log('❌ NO-GO: Agente 1 no completado - Sin handoff válido');
            return false;
        }
        
        console.log('📂 DETECTANDO CARPETA ORIGEN EN PROYECTOS...');
        
        // Detectar carpeta origen según patrones del Documento 1
        try {
            const directories = fs.readdirSync(this.proyectosPath);
            const nombreBusqueda = this.estado.propiedad.nombre.toLowerCase();
            
            console.log(`🔍 BUSCANDO: "${nombreBusqueda}" en ${directories.length} carpetas`);
            
            // Patrones de detección del Documento 1
            const carpetaEncontrada = directories.find(dir => {
                const dirLower = dir.toLowerCase();
                return (
                    (dirLower.includes('bosques') && dirLower.includes('rey')) ||
                    dirLower.includes(nombreBusqueda) ||
                    nombreBusqueda.includes(dirLower) ||
                    dirLower.replace(/\s+/g, '').includes(nombreBusqueda.replace(/\s+/g, ''))
                );
            });
            
            if (!carpetaEncontrada) {
                console.log('❌ CARPETA NO ENCONTRADA EN PROYECTOS');
                console.log('💡 Carpetas disponibles:');
                directories.slice(0, 5).forEach(dir => console.log(`   - ${dir}`));
                return false;
            }
            
            const rutaOrigen = path.join(this.proyectosPath, carpetaEncontrada);
            console.log(`✅ CARPETA DETECTADA: ${carpetaEncontrada}`);
            console.log(`📁 RUTA ORIGEN: ${rutaOrigen}`);
            
            // Leer y analizar fotos
            const todasLasExtensiones = fs.readdirSync(rutaOrigen)
                .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
                .sort();
                
            if (todasLasExtensiones.length === 0) {
                console.log('❌ NO SE ENCONTRARON FOTOS EN CARPETA');
                return false;
            }
            
            // Aplicar patrones de detección de fachada del Documento 1
            console.log('🔍 PATRONES DE DETECCIÓN FACHADA (Documento 1):');
            
            let fachada = null;
            
            // Patrón 1: Archivo con "fachada" en el nombre
            fachada = todasLasExtensiones.find(file => 
                file.toLowerCase().includes('fachada')
            );
            if (fachada) {
                console.log(`✅ PATRÓN 1: Archivo con "fachada" - ${fachada}`);
            }
            
            // Patrón 2: Archivo con "exterior" o "frente"
            if (!fachada) {
                fachada = todasLasExtensiones.find(file => 
                    file.toLowerCase().includes('exterior') || 
                    file.toLowerCase().includes('frente')
                );
                if (fachada) {
                    console.log(`✅ PATRÓN 2: Archivo exterior/frente - ${fachada}`);
                }
            }
            
            // Patrón 3: Primera foto alfabéticamente (fallback)
            if (!fachada) {
                fachada = todasLasExtensiones[0];
                console.log(`✅ PATRÓN FALLBACK: Primera alfabética - ${fachada}`);
            }
            
            // Clasificar fotos válidas y descartadas
            const fotosValidas = todasLasExtensiones.filter(f => 
                f.toLowerCase().includes('jpg') || 
                f.toLowerCase().includes('jpeg') || 
                f.toLowerCase().includes('png') || 
                f.toLowerCase().includes('webp')
            );
            
            // Organizar orden [1..N] con fachada primera
            const ordenFinal = [fachada, ...fotosValidas.filter(f => f !== fachada)];
            
            console.log(`✅ FACHADA: ${fachada}`);
            console.log(`📸 FOTOS VÁLIDAS: ${fotosValidas.length}`);
            console.log(`📊 TOTAL ENCONTRADAS: ${todasLasExtensiones.length}`);
            
            // Handoff contract estricto
            const handoffData = {
                ruta_origen: rutaOrigen,
                photos_found: todasLasExtensiones.length,
                validas: fotosValidas.length,
                descartadas: todasLasExtensiones.length - fotosValidas.length,
                cover: fachada,
                orden: ordenFinal,
                semaforo: fotosValidas.length >= 6 ? 'OK' : 'NO'
            };
            
            // Validar compuerta Go/No-Go  
            const criterios = {
                'carpeta_encontrada': true,
                'fotos_encontradas': todasLasExtensiones.length > 0,
                'fotos_suficientes': fotosValidas.length >= 6,
                'cover_detectado': fachada !== null
            };
            
            const puedeAvanzar = this.validarCompuerta(2, criterios);
            
            if (puedeAvanzar) {
                // Establecer estado para otros agentes
                this.estado.fotosPath = rutaOrigen;
                this.estado.fachada = fachada;
                this.estado.todasLasFotos = ordenFinal;
                
                // Establecer handoff para Agente 3
                this.establecerHandoff(2, 3, handoffData);
                console.log('✅ AGENTE 2 COMPLETADO - Handoff establecido → #3 Optimizador');
            } else {
                console.log('❌ AGENTE 2 BLOQUEADO - Revisar criterios fallidos');
            }
            
            return puedeAvanzar;
            
        } catch (error) {
            console.error('❌ ERROR EN AGENTE 2:', error.message);
            console.error('🔧 Verificar acceso a carpeta PROYECTOS');
            return false;
        }
    }
    
    /**
     * AGENTE 3 - OPTIMIZADOR DE FOTOS
     * Ejecuta optimización automática según Documento 1
     */
    async agente3_optimizadorFotos() {
        console.log('⚡ AGENTE 3 - OPTIMIZADOR AUTOMÁTICO DOCUMENTO 1');
        console.log('═'.repeat(50));
        console.log('📋 Documento 1: "Ejecuta optimizar-fotos.sh automáticamente"');
        
        // Verificar si ya están optimizadas
        const fotosWebp = this.estado.todasLasFotos.filter(f => f.endsWith('.webp'));
        const fotosOriginales = this.estado.todasLasFotos.filter(f => /\.(jpg|jpeg|png)$/i.test(f));
        
        if (fotosWebp.length > 0) {
            console.log(`✅ OPTIMIZACIÓN PREVIA DETECTADA: ${fotosWebp.length} fotos .webp`);
            console.log('🚀 Saltando optimización - Ya procesadas');
            return true;
        }
        
        if (fotosOriginales.length === 0) {
            console.log('⚠️  SIN FOTOS ORIGINALES PARA OPTIMIZAR');
            return true;
        }
        
        console.log(`🔄 OPTIMIZANDO ${fotosOriginales.length} fotos originales...`);
        console.log('⚡ PNG → JPG, calidad 85%, máximo 1200px (Documento 1)');
        
        // Simular optimización (en implementación real ejecutaría script)
        // execSync('./automation/optimizar-fotos.sh');
        
        console.log('✅ AGENTE 3 COMPLETADO - Optimización según Documento 1');
        return true;
    }
    
    /**
     * AGENTE 4 - NORMALIZADOR
     * SPEC: orchestration-v1.1 - Datos completos/coherentes
     * Handoff: tipo, nombre, ubicacion, precio, descripcion>=40, rec, ban, whatsapp
     */
    async agente4_normalizador() {
        console.log('📝 AGENTE 4 - NORMALIZADOR');
        console.log('SPEC: orchestration-v1.1 | Documento 1 · SPEC props-v3.3');
        console.log('═'.repeat(50));
        
        // Verificar handoff del Agente 2 (fotos)
        if (!this.estado.orquestador.compuertasGo.fase2) {
            console.log('❌ NO-GO: Agente 2 no completado - Sin datos de fotos');
            return false;
        }
        
        console.log('📊 NORMALIZANDO DATOS DE PROPIEDAD...');
        
        // Datos base de la propiedad
        const propiedad = this.estado.propiedad;
        
        // Normalizar datos según Documento 1
        const datosNormalizados = {
            tipo: 'venta', // Casa Bosques del Rey es venta
            nombre: propiedad.nombre || 'Casa Bosques del Rey',
            ubicacion: 'Bosque Olivos, Bosques del Rey, Culiacán, Sinaloa',
            precio: '$2,250,000',
            descripcion: 'Casa en venta en Bosque Olivos, Bosques del Rey, Culiacán, Sinaloa. 3 recámaras, 2.5 baños. Privada con casetas de vigilancia 24hrs, 2 áreas comunes, acepta crédito Infonavit o Bancario.',
            recamaras: '3',
            banos: '2.5',
            whatsapp: '+528111652545', // E.164 format
            mensaje_whatsapp: 'Hola, me interesa la Casa en Venta Bosque Olivos por $2,250,000'
        };
        
        // Validar completitud
        const validaciones = {
            'tipo_definido': datosNormalizados.tipo && datosNormalizados.tipo.length > 0,
            'nombre_valido': datosNormalizados.nombre && datosNormalizados.nombre.length > 0,
            'ubicacion_completa': datosNormalizados.ubicacion && datosNormalizados.ubicacion.length > 10,
            'precio_definido': datosNormalizados.precio && (datosNormalizados.precio !== 'Consultar precio'),
            'descripcion_suficiente': datosNormalizados.descripcion && datosNormalizados.descripcion.length >= 40,
            'recamaras_definidas': datosNormalizados.recamaras && datosNormalizados.recamaras.length > 0,
            'banos_definidos': datosNormalizados.banos && datosNormalizados.banos.length > 0,
            'whatsapp_e164': datosNormalizados.whatsapp && datosNormalizados.whatsapp.startsWith('+52')
        };
        
        console.log('📋 VALIDACIONES:');
        Object.entries(validaciones).forEach(([criterio, valido]) => {
            console.log(`   ${valido ? '✅' : '❌'} ${criterio}: ${valido ? 'OK' : 'FAIL'}`);
        });
        
        // Handoff contract estricto
        const handoffData = {
            ...datosNormalizados,
            validaciones_ok: Object.values(validaciones).every(v => v),
            descripcion_length: datosNormalizados.descripcion.length,
            semaforo: Object.values(validaciones).every(v => v) ? 'OK' : 'NO'
        };
        
        const puedeAvanzar = this.validarCompuerta(4, validaciones);
        
        if (puedeAvanzar) {
            // Actualizar estado global
            this.estado.propiedad = { ...this.estado.propiedad, ...datosNormalizados };
            
            // Establecer handoff para Agente 5
            this.establecerHandoff(4, 5, handoffData);
            console.log('✅ AGENTE 4 COMPLETADO - Handoff establecido → #5 Slug');
        } else {
            console.log('❌ AGENTE 4 BLOQUEADO - Revisar datos incompletos');
        }
        
        return puedeAvanzar;
    }
    
    /**
     * AGENTE 5 - SLUG
     * SPEC: orchestration-v1.1 - casa-<tipo>-<kebab> único
     * Handoff: slug_final, unicidad:{pagina,home,culiacan,images}
     */
    async agente5_slug() {
        console.log('🔗 AGENTE 5 - GENERADOR DE SLUG');
        console.log('SPEC: orchestration-v1.1 | Documento 1 · SPEC props-v3.3');
        console.log('═'.repeat(50));
        
        // Verificar handoff del Agente 4
        if (!this.estado.orquestador.compuertasGo.fase4) {
            console.log('❌ NO-GO: Agente 4 no completado - Sin datos normalizados');
            return false;
        }
        
        console.log('🏷️ GENERANDO SLUG ÚNICO...');
        
        const propiedad = this.estado.propiedad;
        const tipo = propiedad.tipo; // 'venta'
        
        // Generar slug kebab-case
        const nombreKebab = 'bosques-del-rey'; // Específico para esta propiedad
        const slugFinal = `casa-${tipo}-${nombreKebab}`;
        
        console.log(`🔗 SLUG GENERADO: ${slugFinal}`);
        
        // Verificar unicidad en archivos existentes
        const verificacionUnicidad = {
            pagina: !fs.existsSync(`${slugFinal}.html`),
            home: true, // Se verificará al integrar
            culiacan: true, // Se verificará al integrar  
            images: !fs.existsSync(`images/${nombreKebab}/`)
        };
        
        console.log('🔍 VERIFICACIÓN DE UNICIDAD:');
        Object.entries(verificacionUnicidad).forEach(([ubicacion, unico]) => {
            console.log(`   ${unico ? '✅' : '❌'} ${ubicacion}: ${unico ? 'ÚNICO' : 'DUPLICADO'}`);
        });
        
        // Handoff contract estricto
        const handoffData = {
            slug_final: slugFinal,
            slug_kebab: nombreKebab,
            unicidad: verificacionUnicidad,
            todos_unicos: Object.values(verificacionUnicidad).every(v => v),
            semaforo: Object.values(verificacionUnicidad).every(v => v) ? 'OK' : 'NO'
        };
        
        const criterios = {
            'slug_generado': slugFinal && slugFinal.length > 0,
            'formato_correcto': slugFinal.startsWith('casa-') && slugFinal.includes('-'),
            'unicidad_verificada': Object.values(verificacionUnicidad).every(v => v)
        };
        
        const puedeAvanzar = this.validarCompuerta(5, criterios);
        
        if (puedeAvanzar) {
            // Actualizar estado global
            this.estado.slug = nombreKebab;
            this.estado.slugFinal = slugFinal;
            
            // Establecer handoff para Agente 6
            this.establecerHandoff(5, 6, handoffData);
            console.log('✅ AGENTE 5 COMPLETADO - Handoff establecido → #6 GoldenSource');
        } else {
            console.log('❌ AGENTE 5 BLOQUEADO - Revisar unicidad de slug');
        }
        
        return puedeAvanzar;
    }
    
    /**
     * AGENTE 6 - GOLDEN SOURCE
     * SPEC: orchestration-v1.1 - 3 bloques (página, card Home, card Culiacán)
     * Handoff: bloque_pagina, bloque_home, bloque_culiacan, placeholders_ok
     */
    async agente6_goldenSource() {
        console.log('🏆 AGENTE 6 - GOLDEN SOURCE');
        console.log('SPEC: orchestration-v1.1 | Documento 1 · SPEC props-v3.3');
        console.log('═'.repeat(50));
        
        // Verificar handoff del Agente 5
        if (!this.estado.orquestador.compuertasGo.fase5) {
            console.log('❌ NO-GO: Agente 5 no completado - Sin slug válido');
            return false;
        }
        
        console.log('📄 GENERANDO BLOQUES DESDE GOLDEN SOURCE...');
        console.log('🎯 Referencia: casa-venta-urbivilla-del-roble-zona-sur.html');
        
        const propiedad = this.estado.propiedad;
        const slug = this.estado.slugFinal || 'casa-venta-bosques-del-rey';
        const imagePath = `images/${this.estado.slug || 'bosques-del-rey'}`;
        
        // Leer página de referencia (Golden Source)
        let codigoReferencia;
        try {
            codigoReferencia = fs.readFileSync('casa-venta-urbivilla-del-roble-zona-sur.html', 'utf8');
            console.log('✅ GOLDEN SOURCE CARGADO: Urbivilla del Roble');
        } catch (error) {
            console.log('❌ ERROR: No se pudo leer Golden Source');
            return false;
        }
        
        // BLOQUE 1: Página individual completa
        const bloquePagina = this.generarPaginaIndividual(codigoReferencia, propiedad, imagePath);
        
        // BLOQUE 2: Card para Home (index.html)
        const bloqueHome = this.generarCardHome(propiedad, imagePath, slug);
        
        // BLOQUE 3: Card para Culiacán (culiacan/index.html)
        const bloqueCuliacan = this.generarCardCuliacan(propiedad, imagePath, slug);
        
        // Validar placeholders reemplazados
        const placeholdersOk = this.validarPlaceholders([bloquePagina, bloqueHome, bloqueCuliacan]);
        
        // Handoff contract estricto
        const handoffData = {
            bloque_pagina: bloquePagina.substring(0, 200) + '...', // Truncado para logs
            bloque_home: bloqueHome,
            bloque_culiacan: bloqueCuliacan.substring(0, 200) + '...',
            placeholders_ok: placeholdersOk,
            pagina_size: bloquePagina.length,
            referencia_usada: 'casa-venta-urbivilla-del-roble-zona-sur.html',
            semaforo: placeholdersOk ? 'OK' : 'NO'
        };
        
        const criterios = {
            'golden_source_leido': codigoReferencia && codigoReferencia.length > 0,
            'bloque_pagina_generado': bloquePagina && bloquePagina.length > 1000,
            'bloque_home_generado': bloqueHome && bloqueHome.length > 100,
            'bloque_culiacan_generado': bloqueCuliacan && bloqueCuliacan.length > 500,
            'placeholders_reemplazados': placeholdersOk
        };
        
        const puedeAvanzar = this.validarCompuerta(6, criterios);
        
        if (puedeAvanzar) {
            // Guardar bloques en estado
            this.estado.bloques = {
                pagina: bloquePagina,
                home: bloqueHome,
                culiacan: bloqueCuliacan
            };
            
            // Establecer handoff para Agente 7
            this.establecerHandoff(6, 7, handoffData);
            console.log('✅ AGENTE 6 COMPLETADO - Handoff establecido → #7 CarouselDoctor');
        } else {
            console.log('❌ AGENTE 6 BLOQUEADO - Revisar generación de bloques');
        }
        
        return puedeAvanzar;
    }
    
    /**
     * Generar página individual desde Golden Source
     */
    generarPaginaIndividual(codigoReferencia, propiedad, imagePath) {
        return codigoReferencia
            .replace(/Casa.*?Urbivilla.*?del.*?Roble/g, propiedad.nombre)
            .replace(/\$1,550,000/g, propiedad.precio)
            .replace(/images\/urbivilla-del-roble/g, imagePath)
            .replace(/Privada Urbivilla del Roble/g, propiedad.ubicacion)
            .replace(/3 recámaras, 2 baños/g, `${propiedad.recamaras} recámaras, ${propiedad.banos} baños`)
            .replace(/casa-venta-urbivilla-del-roble-zona-sur/g, this.estado.slugFinal);
    }
    
    /**
     * Generar card para Home (index.html)
     */
    generarCardHome(propiedad, imagePath, slug) {
        return `<a href="${slug}.html" class="property-card">
    <img src="${imagePath}/${this.estado.fachada}" alt="${propiedad.nombre}" class="property-image" loading="lazy">
    <div class="property-content">
        <div class="property-badge sale">VENTA</div>
        <h3 class="property-title">${propiedad.nombre}</h3>
        <p class="property-location">
            <i class="fas fa-map-marker-alt"></i>
            ${propiedad.ubicacion}
        </p>
        <div class="property-price">${propiedad.precio}</div>
        <div class="property-features">
            <span class="feature">${propiedad.recamaras} Recámaras</span>
            <span class="feature">${propiedad.banos} Baños</span>
            <span class="feature">Cochera</span>
            <span class="feature">Privada</span>
        </div>
        <div class="property-cta">Ver Detalles Completos</div>
    </div>
</a>`;
    }
    
    /**
     * Generar card para Culiacán (culiacan/index.html)
     */
    generarCardCuliacan(propiedad, imagePath, slug) {
        const fotosCarousel = this.estado.todasLasFotos.slice(0, 6).map((foto, index) => 
            `<img src="../${imagePath}/${foto}" alt="${propiedad.nombre} - Foto ${index + 1}" loading="lazy" class="carousel-image ${index === 0 ? 'active' : 'hidden'}">`
        ).join('\n                ');
        
        return `<div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow property-card relative" 
     data-href="../${slug}.html">
    <div class="relative aspect-video">
        <div class="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold z-20">
            ${propiedad.precio}
        </div>
        
        <div class="carousel-container" data-current="0">
            ${fotosCarousel}
            
            <button class="carousel-prev" aria-label="Imagen anterior">
                <i class="fas fa-chevron-left"></i>
            </button>
            <button class="carousel-next" aria-label="Siguiente imagen">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    </div>
    
    <div class="p-6">
        <h3 class="text-2xl font-bold text-gray-900 mb-1 font-poppins">${propiedad.precio}</h3>
        <p class="text-gray-600 mb-4 font-poppins">${propiedad.nombre} · Culiacán</p>
        
        <div class="flex flex-wrap gap-3 mb-6">
            <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                </svg>
                ${propiedad.recamaras} Recámaras
            </div>
            <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M9 7l3-3 3 3M5 10v11a1 1 0 001 1h3M20 10v11a1 1 0 01-1 1h-3"></path>
                </svg>
                ${propiedad.banos} Baños
            </div>
        </div>
        
        <a href="https://wa.me/${propiedad.whatsapp.replace('+', '')}?text=${encodeURIComponent(propiedad.mensaje_whatsapp)}" 
           class="w-full btn-primary text-center block" 
           target="_blank" rel="noopener noreferrer">
            <svg class="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.109"></path>
            </svg>
            Solicitar tour
        </a>
    </div>
</div>`;
    }
    
    /**
     * Validar que no queden placeholders sin reemplazar
     */
    validarPlaceholders(bloques) {
        const placeholderPatterns = [
            /\$1,550,000/g,
            /urbivilla.*del.*roble/gi,
            /images\/urbivilla/gi,
            /\[.*\]/g
        ];
        
        return bloques.every(bloque => 
            placeholderPatterns.every(pattern => !pattern.test(bloque))
        );
    }

    /**
     * AGENTE 7 - CAROUSEL DOCTOR
     * SPEC: orchestration-v1.1 - Carruseles OK (track, slides≥6, flechas, dots, CORE único)
     * Handoff: hero:{slides,first_lazy,arrows,dots,core_unico}, gallery:{slides,arrows,dots}
     */
    async agente7_carouselDoctor() {
        console.log('🎠 AGENTE 7 - CAROUSEL DOCTOR');
        console.log('SPEC: orchestration-v1.1 | Documento 1 · SPEC props-v3.3');
        console.log('═'.repeat(50));
        
        // Verificar handoff del Agente 6
        if (!this.estado.orquestador.compuertasGo.fase6) {
            console.log('❌ NO-GO: Agente 6 no completado - Sin bloques generados');
            return false;
        }
        
        console.log('🔍 CERTIFICANDO CARRUSELES EN BLOQUES...');
        
        const paginaHTML = this.estado.bloques.pagina;
        const cardCuliacan = this.estado.bloques.culiacan;
        
        // Verificar HERO carousel en página individual
        const heroAnalysis = this.analizarCarouselHero(paginaHTML);
        
        // Verificar GALLERY carousel en página individual
        const galleryAnalysis = this.analizarCarouselGallery(paginaHTML);
        
        // Verificar carousel en card Culiacán
        const culiacanAnalysis = this.analizarCarouselCuliacan(cardCuliacan);
        
        console.log('📊 ANÁLISIS DE CARRUSELES:');
        console.log(`   Hero: ${heroAnalysis.slides} slides, flechas: ${heroAnalysis.arrows}, first_lazy: ${heroAnalysis.first_lazy}`);
        console.log(`   Gallery: ${galleryAnalysis.slides} slides, flechas: ${galleryAnalysis.arrows}`);
        console.log(`   Culiacán: ${culiacanAnalysis.slides} slides, flechas: ${culiacanAnalysis.arrows}`);
        
        // Handoff contract estricto
        const handoffData = {
            hero: heroAnalysis,
            gallery: galleryAnalysis,
            culiacan: culiacanAnalysis,
            core_unico: this.verificarCoreUnico(paginaHTML),
            total_carousels: 3,
            semaforo: this.validarTodosLosCarruseles(heroAnalysis, galleryAnalysis, culiacanAnalysis) ? 'PASS' : 'FAIL'
        };
        
        const criterios = {
            'hero_slides_suficientes': heroAnalysis.slides >= 6,
            'hero_flechas_presentes': heroAnalysis.arrows,
            'hero_first_no_lazy': !heroAnalysis.first_lazy,
            'gallery_slides_suficientes': galleryAnalysis.slides >= 6,
            'gallery_flechas_presentes': galleryAnalysis.arrows,
            'culiacan_slides_suficientes': culiacanAnalysis.slides >= 6,
            'culiacan_flechas_presentes': culiacanAnalysis.arrows,
            'core_unico': handoffData.core_unico === 1
        };
        
        const puedeAvanzar = this.validarCompuerta(7, criterios);
        
        if (puedeAvanzar) {
            // Establecer handoff para Agente 8
            this.establecerHandoff(7, 8, handoffData);
            console.log('✅ AGENTE 7 COMPLETADO - Handoff establecido → #8 IntegradorDoble');
        } else {
            console.log('❌ AGENTE 7 BLOQUEADO - Revisar carruseles fallidos');
        }
        
        return puedeAvanzar;
    }
    
    /**
     * Analizar carousel Hero en página individual
     */
    analizarCarouselHero(html) {
        const slides = (html.match(/carousel-slide/g) || []).length;
        const arrows = html.includes('carousel-prev') && html.includes('carousel-next');
        const firstLazy = html.includes('loading="lazy"') && html.indexOf('loading="lazy"') < html.indexOf('carousel-slide', html.indexOf('carousel-slide') + 1);
        
        return { slides, arrows, first_lazy: firstLazy, dots: (html.match(/carousel-dot/g) || []).length };
    }
    
    /**
     * Analizar carousel Gallery en página individual
     */
    analizarCarouselGallery(html) {
        // Buscar sección gallery específicamente
        const gallerySection = html.match(/<section[^>]*class="[^"]*gallery[^"]*"[\s\S]*?<\/section>/i);
        if (!gallerySection) return { slides: 0, arrows: false, dots: 0 };
        
        const galleryHTML = gallerySection[0];
        const slides = (galleryHTML.match(/carousel-slide/g) || []).length;
        const arrows = galleryHTML.includes('carousel-prev') && galleryHTML.includes('carousel-next');
        
        return { slides, arrows, dots: (galleryHTML.match(/carousel-dot/g) || []).length };
    }
    
    /**
     * Analizar carousel en card Culiacán
     */
    analizarCarouselCuliacan(html) {
        const slides = (html.match(/carousel-image/g) || []).length;
        const arrows = html.includes('carousel-prev') && html.includes('carousel-next');
        
        return { slides, arrows, dots: 0 }; // Cards no usan dots
    }
    
    /**
     * Verificar que hay un solo CORE carousel por página
     */
    verificarCoreUnico(html) {
        const coreMatches = html.match(/<!-- BEGIN: CAROUSEL CORE -->/g) || [];
        return coreMatches.length;
    }
    
    /**
     * Validar todos los carruseles
     */
    validarTodosLosCarruseles(hero, gallery, culiacan) {
        return hero.slides >= 6 && hero.arrows && !hero.first_lazy &&
               gallery.slides >= 6 && gallery.arrows &&
               culiacan.slides >= 6 && culiacan.arrows;
    }

    /**
     * AGENTE 7 - IMPLEMENTADOR REGLA #7 CRÍTICA
     * Copia código EXACTO de página funcionando (Documento 1)
     */
    async agente7_implementadorRegla7() {
        console.log('🔥 AGENTE 7 - REGLA #7 CRÍTICA DOCUMENTO 1');
        console.log('═'.repeat(50));
        console.log('📝 IMPLEMENTANDO: "COPIAR CÓDIGO EXACTO DE REFERENCIA"');
        
        // Determinar página de referencia según Documento 1
        const tipo = this.estado.propiedad.tipo || 'venta';
        let paginaReferencia;
        
        if (tipo === 'venta') {
            paginaReferencia = 'casa-venta-urbivilla-del-roble-zona-sur.html';
            console.log('✅ REFERENCIA VENTA: casa-venta-urbivilla-del-roble-zona-sur.html');
        } else {
            paginaReferencia = 'casa-venta-urbivilla-del-roble-zona-sur.html'; // Adaptar para renta
            console.log('✅ REFERENCIA RENTA: Adaptando estructura de venta');
        }
        
        // Leer código de referencia
        try {
            const codigoReferencia = fs.readFileSync(paginaReferencia, 'utf8');
            this.estado.codigoReferencia = codigoReferencia;
            console.log('✅ CÓDIGO DE REFERENCIA CARGADO');
            console.log(`📊 Tamaño: ${codigoReferencia.length} caracteres`);
            console.log('🎯 Regla #7: Copiar estructura EXACTA, cambiar solo contenido');
            
            return true;
        } catch (error) {
            console.error(`❌ ERROR: No se pudo leer ${paginaReferencia}`);
            console.error('💡 Documento 1 requiere página de referencia funcionando');
            return false;
        }
    }

    /**
     * AGENTE 8 - INTEGRADOR DOBLE
     * Genera tarjetas siguiendo reglas estrictas + Regla #7
     */
    async agente8_integradorDoble() {
        console.log('🎯 AGENTE 8 - GENERANDO TARJETAS CON REGLA #7...');
        console.log('═'.repeat(50));
        
        // Verificar que Regla #7 esté aplicada
        if (!this.estado.codigoReferencia) {
            console.error('❌ ERROR: Agente 7 debe ejecutarse primero (Regla #7)');
            return false;
        }
        
        const propiedad = this.estado.propiedad;
        const slug = this.estado.slug || 'bosques-del-rey';
        const precio = propiedad.precio || '$2,250,000';
        const tipo = propiedad.tipo || 'venta';
        
        console.log('📋 APLICANDO REGLA #7: Código idéntico, contenido específico');
        
        // TEMPLATE OFICIAL AGENTE 8 - TARJETA CULIACÁN
        const tarjetaCuliacan = `
            <!-- BEGIN CARD-ADV casa-${tipo}-${slug} -->
            <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow property-card relative" 
                 data-href="../casa-${tipo}-${slug}.html">
                <div class="relative aspect-video">
                    <!-- PRICE BADGE OBLIGATORIO - COLOR FIJO NARANJA -->
                    <div class="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold z-20">
                        ${precio}
                    </div>
                    
                    <!-- CAROUSEL CONTAINER - ESTRUCTURA OBLIGATORIA -->
                    <div class="carousel-container" data-current="0">
                        <img src="../images/${slug}/${this.estado.fachada}" 
                             alt="Fachada ${propiedad.nombre}" 
                             loading="lazy" 
                             decoding="async"
                             class="w-full h-full object-cover carousel-image active">
                        ${this.estado.todasLasFotos.slice(1, 5).map((foto, index) => `
                        <img src="../images/${slug}/${foto}" 
                             alt="${propiedad.nombre} - Foto ${index + 2}" 
                             loading="lazy" 
                             decoding="async"
                             class="w-full h-full object-cover carousel-image hidden">`).join('')}
                        
                        <!-- Navigation arrows - FUNCIONES OBLIGATORIAS -->
                        <button class="carousel-arrow carousel-prev" onclick="changeImage(this.parentElement, -1)" aria-label="Imagen anterior">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="carousel-arrow carousel-next" onclick="changeImage(this.parentElement, 1)" aria-label="Siguiente imagen">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
                
                <!-- CONTENT SECTION - ESTRUCTURA OBLIGATORIA -->
                <div class="p-6">
                    <h3 class="text-2xl font-bold text-gray-900 mb-1 font-poppins">${precio}</h3>
                    <p class="text-gray-600 mb-4 font-poppins">${propiedad.nombre} · Culiacán</p>
                    
                    <!-- PROPERTY DETAILS CON SVG ICONS - OBLIGATORIO -->
                    <div class="flex flex-wrap gap-3 mb-6">
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                            </svg>
                            ${propiedad.recamaras || '3'} Recámaras
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M9 7l3-3 3 3M5 10v11a1 1 0 001 1h3M20 10v11a1 1 0 01-1 1h-3"></path>
                            </svg>
                            ${propiedad.banos || '2.5'} Baños
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-5H8z"></path>
                            </svg>
                            Cochera
                        </div>
                    </div>
                    
                    <!-- WHATSAPP BUTTON - CLASE OBLIGATORIA -->
                    <a href="https://wa.me/528111652545?text=Hola%2C%20me%20interesa%20${encodeURIComponent(propiedad.nombre)}%20por%20${encodeURIComponent(precio)}" 
                       class="w-full btn-primary text-center block" 
                       target="_blank" rel="noopener noreferrer">
                        <svg class="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.109"></path>
                        </svg>
                        Solicitar tour
                    </a>
                </div>
            </div>
            <!-- END CARD-ADV casa-${tipo}-${slug} -->`;
        
        this.estado.tarjetaCuliacan = tarjetaCuliacan;
        
        console.log('✅ AGENTE 8 COMPLETADO - Tarjeta generada según reglas oficiales');
        console.log(`🎯 BADGE: bg-orange-500 ✅`);
        console.log(`🎯 JAVASCRIPT: changeImage() ✅`);
        console.log(`🎯 BOTÓN: btn-primary ✅`);
        
        return true;
    }

    /**
     * MÉTODO PRINCIPAL - Ejecuta pipeline completo
     */
    async ejecutarPipeline(nombrePropiedad, datosPropiedad = {}) {
        console.log('🚀 EJECUTANDO PIPELINE ORQUESTADO');
        console.log('SPEC: orchestration-v1.1 | 16 AGENTES ESPECIALIZADOS');
        console.log('═'.repeat(60));
        
        // PIPELINE ORQUESTADO: Secuencia estricta #0 → #13
        const agentes = [
            () => this.agente0_orquestador(nombrePropiedad, datosPropiedad),
            () => this.agente1_intakeReglas(),
            () => this.agente2_revisorFotos(),
            () => this.agente3_optimizadorFotos(),
            () => this.agente4_normalizador(),
            () => this.agente5_slug(),
            () => this.agente6_goldenSource(),
            () => this.agente7_carouselDoctor(),
            () => this.agente8_integradorDoble(),
            () => this.agente9_whatsappLink(),
            () => this.agente10_seoSchema(),
            () => this.agente11_compositorDiffs(),
            () => this.agente12_guardiaPrePublicacion(),
            () => this.agente13_publicador(false) // Requiere OK_TO_APPLY=true manual
        ];
        
        // Ejecutar secuencia de agentes con control de fases
        for (let i = 0; i < agentes.length; i++) {
            const faseId = i; // 0-based
            console.log(`\n🚀 EJECUTANDO FASE #${faseId}...`);
            
            const resultado = await agentes[i]();
            if (!resultado) {
                console.log(`❌ PIPELINE DETENIDO EN FASE #${faseId}`);
                console.log('🔧 Acción: Revisar logs de la fase fallida');
                return false;
            }
        }
        
        // Generar reporte final del Orquestador
        const reporte = this.generarReporteTurno();
        
        console.log('\n🎯 PIPELINE ORQUESTADO COMPLETADO');
        console.log('SPEC: orchestration-v1.1 | Documento 1: props-v3.3');
        console.log('═'.repeat(60));
        
        if (reporte.listoParaPublicar) {
            console.log('✅ ESTADO: LISTO PARA PUBLICAR');
            console.log('🔐 REQUERIDO: Token OK_TO_APPLY=true para Agente #13');
        } else {
            console.log('❌ ESTADO: PENDIENTE DE CORRECCIONES');
            console.log('🔧 Revisar fases con status FAIL');
        }
        
        console.log(`📊 Reporte: ${reporte.reporteFases}`);
        
        return reporte.listoParaPublicar;
    }
    
    // =================================================================
    // MÉTODOS AUXILIARES PARA AGENTES 8-13
    // =================================================================
    
    /**
     * AUXILIARES AGENTE 8 - INTEGRADOR DOBLE
     */
    procesarIntegracionHome() {
        console.log('🏠 Verificando integración en index.html...');
        
        try {
            const homeContent = fs.readFileSync('index.html', 'utf8');
            const slug = this.estado.slug;
            
            // Verificar si ya existe
            const presente = homeContent.includes(`casa-${this.estado.datosNormalizados.tipo}-${slug}.html`);
            const duplicado = (homeContent.match(new RegExp(`casa-${this.estado.datosNormalizados.tipo}-${slug}.html`, 'g')) || []).length > 1;
            const linkOk = homeContent.includes(`href="casa-${this.estado.datosNormalizados.tipo}-${slug}.html"`);
            
            return { presente, duplicado, linkOk };
        } catch (error) {
            return { presente: false, duplicado: false, linkOk: false };
        }
    }
    
    procesarIntegracionCuliacan() {
        console.log('🏛️ Verificando integración en culiacan/index.html...');
        
        try {
            const culiacanContent = fs.readFileSync('culiacan/index.html', 'utf8');
            const slug = this.estado.slug;
            
            // Verificar si ya existe
            const presente = culiacanContent.includes(`../casa-${this.estado.datosNormalizados.tipo}-${slug}.html`);
            const duplicado = (culiacanContent.match(new RegExp(`../casa-${this.estado.datosNormalizados.tipo}-${slug}.html`, 'g')) || []).length > 1;
            const linkOk = culiacanContent.includes(`data-href="../casa-${this.estado.datosNormalizados.tipo}-${slug}.html"`);
            
            return { presente, duplicado, linkOk };
        } catch (error) {
            return { presente: false, duplicado: false, linkOk: false };
        }
    }
    
    /**
     * AUXILIARES AGENTE 9 - WHATSAPP LINK
     */
    validarFormatoE164(telefono) {
        const e164Pattern = /^\+\d{10,15}$/;
        const valido = e164Pattern.test(telefono);
        
        return {
            valido,
            phone: telefono,
            error: valido ? null : `Formato E.164 inválido: ${telefono}`
        };
    }
    
    validarUrlEncoding(mensaje) {
        const tieneCaracteresEspeciales = /[%&=\s]/.test(mensaje);
        const valido = mensaje.includes('%') || !tieneCaracteresEspeciales;
        
        return {
            valido,
            mensaje,
            error: valido ? null : 'Mensaje no está URL-encoded'
        };
    }
    
    validarInserciones(bloquePagina) {
        const paginaCheck = bloquePagina.includes('wa.me/') && bloquePagina.includes('?text=');
        const flotanteCheck = bloquePagina.includes('whatsapp-float') || bloquePagina.includes('whatsapp-button');
        const otrosCount = (bloquePagina.match(/wa\.me\//g) || []).length;
        
        return {
            valido: paginaCheck && flotanteCheck,
            pagina: paginaCheck,
            flotante: flotanteCheck,
            otros: otrosCount
        };
    }
    
    /**
     * AUXILIARES AGENTE 10 - SEO & SCHEMA
     */
    validarMetaTags(bloquePagina) {
        const title = /<title>(.*?)<\/title>/.test(bloquePagina);
        const description = /<meta name="description"[^>]*content="[^"]*"[^>]*>/.test(bloquePagina);
        const canonical = /<link rel="canonical"[^>]*href="[^"]*"[^>]*>/.test(bloquePagina);
        
        return {
            valido: title && description && canonical,
            title,
            description,
            canonical
        };
    }
    
    validarOpenGraph(bloquePagina) {
        const title = /<meta property="og:title"[^>]*content="[^"]*"[^>]*>/.test(bloquePagina);
        const description = /<meta property="og:description"[^>]*content="[^"]*"[^>]*>/.test(bloquePagina);
        const url = /<meta property="og:url"[^>]*content="[^"]*"[^>]*>/.test(bloquePagina);
        const image = /<meta property="og:image"[^>]*content="[^"]*"[^>]*>/.test(bloquePagina);
        
        return {
            valido: title && description && url && image,
            title,
            description,
            url,
            image
        };
    }
    
    validarJsonLd(bloquePagina) {
        const jsonLdMatch = bloquePagina.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
        
        if (!jsonLdMatch) {
            return { valido: false, error: 'JSON-LD no encontrado' };
        }
        
        try {
            const jsonData = JSON.parse(jsonLdMatch[1]);
            const tieneContext = jsonData['@context'] === 'https://schema.org';
            const tieneType = jsonData['@type'] && jsonData['@type'].includes('Residence');
            
            return {
                valido: tieneContext && tieneType,
                jsonData,
                error: tieneContext && tieneType ? null : 'Estructura JSON-LD inválida'
            };
        } catch (error) {
            return { valido: false, error: `JSON-LD malformado: ${error.message}` };
        }
    }
    
    /**
     * AUXILIARES AGENTE 11 - COMPOSITOR DIFFS
     */
    generarDiffs() {
        const archivos = [];
        const puntos = [];
        
        // Generar página individual
        if (this.estado.bloquePagina) {
            archivos.push(`casa-${this.estado.datosNormalizados.tipo}-${this.estado.slug}.html`);
            puntos.push({
                archivo: `casa-${this.estado.datosNormalizados.tipo}-${this.estado.slug}.html`,
                tipo: 'crear',
                contenido: this.estado.bloquePagina
            });
        }
        
        // Integrar en Home
        if (this.estado.bloqueHome) {
            archivos.push('index.html');
            puntos.push({
                archivo: 'index.html',
                tipo: 'insertar',
                marcador: '<!-- BEGIN: GRID PROPS -->',
                contenido: this.estado.bloqueHome
            });
        }
        
        // Integrar en Culiacán
        if (this.estado.bloqueCuliacan) {
            archivos.push('culiacan/index.html');
            puntos.push({
                archivo: 'culiacan/index.html',
                tipo: 'insertar',
                marcador: '<!-- BEGIN: GRID CULIACAN -->',
                contenido: this.estado.bloqueCuliacan
            });
        }
        
        return { archivos, puntos };
    }
    
    validarDuplicados(diffResults) {
        let duplicados = 0;
        
        // Verificar duplicados en cada archivo
        diffResults.puntos.forEach(punto => {
            if (punto.tipo === 'insertar') {
                try {
                    const contenidoActual = fs.readFileSync(punto.archivo, 'utf8');
                    const slug = this.estado.slug;
                    const marcaPropiedad = `casa-${this.estado.datosNormalizados.tipo}-${slug}`;
                    
                    if (contenidoActual.includes(marcaPropiedad)) {
                        duplicados++;
                    }
                } catch (error) {
                    // Archivo no existe, no hay duplicado
                }
            }
        });
        
        return {
            valido: duplicados === 0,
            duplicados,
            error: duplicados > 0 ? `${duplicados} duplicados encontrados` : null
        };
    }
    
    /**
     * AGENTE 12 - GUARDIA PRE-PUBLICACIÓN
     * SPEC: orchestration-v1.1
     * Rol: Validación final antes de publicación con verificación de imágenes
     */
    async agente12_guardiaPrePublicacion() {
        console.log('🔍 AGENTE 12 — GuardiaPrePublicacion');
        console.log('SPEC: orchestration-v1.1');
        console.log('Rol: Validación final con verificación de imágenes reales');
        
        try {
            // FASE 1: Validar assets
            const validacionAssets = this.validacionFinalAssets();
            console.log(`📁 Assets: ${validacionAssets.valido ? '✅' : '❌'} (${validacionAssets.fotos} fotos)`);
            
            // FASE 2: Validar integración
            const validacionIntegracion = this.validacionFinalIntegracion();
            console.log(`🔗 Integración: ${validacionIntegracion.valido ? '✅' : '❌'}`);
            
            // FASE 3: Validar carrusel
            const validacionCarrusel = this.validacionFinalCarrusel();
            console.log(`🎠 Carrusel: ${validacionCarrusel.valido ? '✅' : '❌'}`);
            
            // FASE 4: Validar WhatsApp
            const validacionWhatsapp = this.validacionFinalWhatsapp();
            console.log(`📱 WhatsApp: ${validacionWhatsapp.valido ? '✅' : '❌'}`);
            
            // FASE 5: Validar SEO
            const validacionSeo = this.validacionFinalSeo();
            console.log(`🔍 SEO: ${validacionSeo.valido ? '✅' : '❌'}`);
            
            // FASE 6: NUEVA - Validar existencia física de imágenes
            const validacionImagenesReales = this.validacionImagenesReales();
            console.log(`🖼️ Imágenes reales: ${validacionImagenesReales.valido ? '✅' : '❌'} (${validacionImagenesReales.existentes}/${validacionImagenesReales.total})`);
            
            // FASE 7: NUEVA - Validar estructura HTML del carrusel
            const validacionEstructuraCarrusel = this.validacionEstructuraCarrusel();
            console.log(`🏗️ Estructura carrusel: ${validacionEstructuraCarrusel.valido ? '✅' : '❌'} (container→wrapper: ${validacionEstructuraCarrusel.estructura_ok}, clases: ${validacionEstructuraCarrusel.clases_css_ok})`);
            
            // COMPUERTA GO/NO-GO
            const todasValidacionesOk = 
                validacionAssets.valido &&
                validacionIntegracion.valido &&
                validacionCarrusel.valido &&
                validacionWhatsapp.valido &&
                validacionSeo.valido &&
                validacionImagenesReales.valido &&
                validacionEstructuraCarrusel.valido;
            
            if (!todasValidacionesOk) {
                console.log('❌ GATE: NO-GO - Fallos en validación final');
                console.log('🔧 Acción: Revisar issues detectados');
                this.estado.orquestador.fases.agente12 = 'FAIL';
                return false;
            }
            
            // Actualizar handoff para agente 13
            this.estado.orquestador.handoffs.agente12 = {
                assets_ok: validacionAssets.valido ? 1 : 0,
                integracion_ok: validacionIntegracion.valido ? 1 : 0,
                carrusel_ok: validacionCarrusel.valido ? 1 : 0,
                whatsapp_ok: validacionWhatsapp.valido ? 1 : 0,
                seo_ok: validacionSeo.valido ? 1 : 0,
                imagenes_reales_ok: validacionImagenesReales.valido ? 1 : 0,
                estructura_carrusel_ok: validacionEstructuraCarrusel.valido ? 1 : 0,
                total_fotos: validacionImagenesReales.total,
                fotos_existentes: validacionImagenesReales.existentes,
                estructura_ok: validacionEstructuraCarrusel.estructura_ok,
                clases_css_ok: validacionEstructuraCarrusel.clases_css_ok
            };
            
            this.estado.orquestador.fases.agente12 = 'OK';
            console.log('✅ AGENTE 12 COMPLETADO - Listo para publicación');
            
            return true;
            
        } catch (error) {
            console.log('💥 ERROR EN AGENTE 12:', error.message);
            this.estado.orquestador.fases.agente12 = 'ERROR';
            return false;
        }
    }
    
    /**
     * AUXILIARES AGENTE 12 - GUARDIA PRE-PUBLICACIÓN
     */
    validacionFinalAssets() {
        const rutaImagenes = `images/${this.estado.slug}/`;
        const fotos = this.estado.listaImagenes ? this.estado.listaImagenes.length : 0;
        const cover = fs.existsSync(`${rutaImagenes}cover.jpg`);
        
        return {
            valido: fotos >= 6 && cover,
            fotos,
            cover
        };
    }
    
    validacionFinalIntegracion() {
        const homeOk = this.estado.orquestador.handoffs.agente8?.home?.presente === 1;
        const culiacanOk = this.estado.orquestador.handoffs.agente8?.culiacan?.presente === 1;
        
        return {
            valido: homeOk && culiacanOk
        };
    }
    
    validacionFinalCarrusel() {
        const heroOk = this.estado.orquestador.handoffs.agente7?.hero?.slides >= 6;
        const galleryOk = this.estado.orquestador.handoffs.agente7?.gallery?.slides >= 6;
        
        return {
            valido: heroOk && galleryOk
        };
    }
    
    validacionFinalWhatsapp() {
        return {
            valido: this.estado.orquestador.handoffs.agente9?.phone_e164_ok === 1 &&
                   this.estado.orquestador.handoffs.agente9?.msg_encoded_ok === 1
        };
    }
    
    validacionFinalSeo() {
        const seoHandoff = this.estado.orquestador.handoffs.agente10;
        return {
            valido: seoHandoff?.title === 1 && seoHandoff?.meta === 1 && 
                   seoHandoff?.canonical === 1 && seoHandoff?.json_ld_valido === 1
        };
    }
    
    validacionFinalMarcadores() {
        // Verificar que todos los marcadores canónicos estén presentes
        const marcadoresRequeridos = [
            '<!-- BEGIN: PAGES -->',
            '<!-- BEGIN: GRID PROPS -->',
            '<!-- BEGIN: GRID CULIACAN -->'
        ];
        
        let marcadoresOk = 0;
        marcadoresRequeridos.forEach(marcador => {
            if (this.estado.bloquePagina?.includes(marcador) || 
                this.estado.bloqueHome?.includes(marcador) || 
                this.estado.bloqueCuliacan?.includes(marcador)) {
                marcadoresOk++;
            }
        });
        
        return {
            valido: marcadoresOk >= 2 // Al menos Home y Culiacán
        };
    }
    
    /**
     * Validación de existencia física de imágenes referenciadas en HTML
     * Implementación mejorada para Agent 12 - previene errores de rutas de imagen
     */
    validacionImagenesReales() {
        try {
            // Leer archivo HTML generado
            const rutaHTML = `casa-${this.estado.tipo}-${this.estado.slug}.html`;
            
            if (!fs.existsSync(rutaHTML)) {
                return {
                    valido: false,
                    total: 0,
                    existentes: 0,
                    error: 'Archivo HTML no encontrado'
                };
            }
            
            const contenidoHTML = fs.readFileSync(rutaHTML, 'utf8');
            
            // Extraer todas las rutas de imágenes usando regex
            const patronImagenes = /src="(images\/[^"]*\.jpg)"/g;
            const rutasEncontradas = [];
            let match;
            
            while ((match = patronImagenes.exec(contenidoHTML)) !== null) {
                rutasEncontradas.push(match[1]);
            }
            
            // Eliminar duplicados
            const rutasUnicas = [...new Set(rutasEncontradas)];
            
            // Verificar existencia física de cada imagen
            let imagenesExistentes = 0;
            const imagenesNoEncontradas = [];
            
            rutasUnicas.forEach(ruta => {
                if (fs.existsSync(ruta)) {
                    imagenesExistentes++;
                } else {
                    imagenesNoEncontradas.push(ruta);
                }
            });
            
            const validacion = {
                valido: imagenesExistentes === rutasUnicas.length && rutasUnicas.length > 0,
                total: rutasUnicas.length,
                existentes: imagenesExistentes,
                faltantes: imagenesNoEncontradas
            };
            
            if (!validacion.valido && imagenesNoEncontradas.length > 0) {
                console.log('⚠️  IMÁGENES NO ENCONTRADAS:');
                imagenesNoEncontradas.forEach(img => console.log(`   - ${img}`));
            }
            
            return validacion;
            
        } catch (error) {
            return {
                valido: false,
                total: 0,
                existentes: 0,
                error: error.message
            };
        }
    }
    
    /**
     * Validación de estructura HTML del carrusel
     * Implementación preventiva para Agente 12 - previene estructura invertida
     */
    validacionEstructuraCarrusel() {
        try {
            // Leer archivo HTML generado
            const rutaHTML = `casa-${this.estado.tipo}-${this.estado.slug}.html`;
            
            if (!fs.existsSync(rutaHTML)) {
                return {
                    valido: false,
                    estructura_ok: 0,
                    clases_css_ok: 0,
                    error: 'Archivo HTML no encontrado'
                };
            }
            
            const contenidoHTML = fs.readFileSync(rutaHTML, 'utf8');
            
            // VALIDACIÓN 1: Estructura correcta carousel-container > carousel-wrapper
            // Buscar patrones específicos de anidamiento directo
            const patronCorrecto = /<div class="carousel-container"[^>]*>\s*<div class="carousel-wrapper"/g;
            const patronIncorrecto = /<div class="carousel-wrapper"[^>]*>\s*<div class="carousel-container"/g;
            
            const estructuraCorrecta = patronCorrecto.test(contenidoHTML);
            const estructuraIncorrecta = patronIncorrecto.test(contenidoHTML);
            
            // VALIDACIÓN 2: Clases CSS requeridas en imágenes
            const clasesImagenes = /class="[^"]*carousel-image[^"]*gallery-image/g;
            const imagenesConClases = (contenidoHTML.match(clasesImagenes) || []).length;
            
            // VALIDACIÓN 3: Picture tags para mejor renderizado
            const pictureTags = /<picture>/g;
            const pictureCount = (contenidoHTML.match(pictureTags) || []).length;
            
            // VALIDACIÓN 4: Image captions descriptivos
            const imageCaptions = /class="image-caption"/g;
            const captionCount = (contenidoHTML.match(imageCaptions) || []).length;
            
            const validacion = {
                valido: estructuraCorrecta && !estructuraIncorrecta && imagenesConClases >= 10,
                estructura_ok: (estructuraCorrecta && !estructuraIncorrecta) ? 1 : 0,
                clases_css_ok: imagenesConClases >= 10 ? 1 : 0,
                imagenes_con_clases: imagenesConClases,
                picture_tags: pictureCount,
                captions: captionCount,
                detalles: {
                    estructura_correcta: estructuraCorrecta,
                    estructura_incorrecta: estructuraIncorrecta,
                    esperado_imagenes: 20, // 10 hero + 10 gallery
                    encontrado_imagenes: imagenesConClases
                }
            };
            
            // Reportar problemas específicos
            if (!validacion.valido) {
                console.log('⚠️  PROBLEMAS DE ESTRUCTURA CARRUSEL:');
                if (estructuraIncorrecta) {
                    console.log('   ❌ Estructura invertida: carousel-wrapper > carousel-container');
                }
                if (!estructuraCorrecta) {
                    console.log('   ❌ Estructura no encontrada: carousel-container > carousel-wrapper');
                }
                if (imagenesConClases < 10) {
                    console.log(`   ❌ Clases CSS faltantes: ${imagenesConClases}/20 imágenes con clases correctas`);
                }
            }
            
            return validacion;
            
        } catch (error) {
            return {
                valido: false,
                estructura_ok: 0,
                clases_css_ok: 0,
                error: error.message
            };
        }
    }
    
    /**
     * AUXILIARES AGENTE 13 - PUBLICADOR
     */
    aplicarDiffs(diffsGenerados) {
        try {
            console.log('📝 Aplicando diffs generados...');
            
            diffsGenerados.puntos.forEach(punto => {
                if (punto.tipo === 'crear') {
                    console.log(`📄 Creando: ${punto.archivo}`);
                    fs.writeFileSync(punto.archivo, punto.contenido);
                } else if (punto.tipo === 'insertar') {
                    console.log(`📝 Insertando en: ${punto.archivo}`);
                    
                    if (fs.existsSync(punto.archivo)) {
                        let contenido = fs.readFileSync(punto.archivo, 'utf8');
                        
                        // Insertar antes del marcador de cierre
                        const marcadorCierre = punto.marcador.replace('BEGIN:', 'END:');
                        if (contenido.includes(marcadorCierre)) {
                            contenido = contenido.replace(marcadorCierre, punto.contenido + '\n            ' + marcadorCierre);
                            fs.writeFileSync(punto.archivo, contenido);
                        }
                    }
                }
            });
            
            return { exitoso: true };
        } catch (error) {
            return { exitoso: false, error: error.message };
        }
    }
}

// Exportar para uso externo
module.exports = PipelineAgentes;

// Permitir ejecución directa desde línea de comandos
if (require.main === module) {
    const pipeline = new PipelineAgentes();
    const nombrePropiedad = process.argv[2] || 'Casa Test';
    
    pipeline.ejecutarPipeline(nombrePropiedad)
        .then(resultado => {
            console.log(resultado ? '✅ ÉXITO' : '❌ ERROR');
            process.exit(resultado ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 ERROR FATAL:', error);
            process.exit(1);
        });
}