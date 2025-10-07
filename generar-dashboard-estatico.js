#!/usr/bin/env node

/**
 * Generar dashboard estático con datos embebidos
 * Para evitar problemas de CORS y carga de archivos externos
 */

const fs = require('fs');
const path = require('path');

const snapshotPath = 'snapshots-propiedades/snapshot-https---propiedades-com-culiacan-residencial-venta.json';
const templatePath = 'monitor-dashboard.html';
const outputPath = 'monitor-dashboard-data.html';

console.log('📊 Generando dashboard estático con datos embebidos...\n');

// Leer snapshot
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
console.log(`✅ Snapshot cargado: ${snapshot.total} propiedades`);

// Leer template
let template = fs.readFileSync(templatePath, 'utf-8');
console.log('✅ Template cargado');

// Embeber datos en el HTML
const dataScript = `
    <script>
        // Datos embebidos directamente en el HTML
        const EMBEDDED_DATA = ${JSON.stringify(snapshot, null, 2)};

        // Cargar datos del snapshot embebido
        async function loadMonitorData() {
            try {
                console.log('Cargando datos embebidos...');
                const data = EMBEDDED_DATA;
                console.log('Datos cargados:', data);

                // Actualizar stats
                document.getElementById('totalProps').textContent = data.total || 0;

                const lastUpdate = new Date(data.fecha);
                document.getElementById('lastUpdate').textContent = lastUpdate.toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                // Crear timeline
                createTimeline(data);

                // Mostrar propiedades (primeras 20, ordenadas por fecha)
                const sortedProps = data.propiedades
                    .sort((a, b) => {
                        if (!a.date || a.date === 'N/A') return 1;
                        if (!b.date || b.date === 'N/A') return -1;
                        return b.date.localeCompare(a.date);
                    });

                showProperties(sortedProps.slice(0, 20));

            } catch (error) {
                console.error('Error cargando datos:', error);
                showNoData();
            }
        }
`;

// Reemplazar el script de carga
template = template.replace(
    /<script>\s*\/\/ Cargar datos del snapshot[\s\S]*?async function loadMonitorData\(\) \{[\s\S]*?}\s*<\/script>/,
    dataScript + '</script>'
);

// Guardar dashboard estático
fs.writeFileSync(outputPath, template);

console.log(`✅ Dashboard estático generado: ${outputPath}\n`);
console.log('📝 Próximo paso:');
console.log('   1. git add monitor-dashboard-data.html');
console.log('   2. git commit -m "Add: Dashboard con datos embebidos"');
console.log('   3. git push');
console.log('\n🌐 URL: https://casasenventa.info/monitor-dashboard-data.html\n');
