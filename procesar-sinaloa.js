const XLSX = require('xlsx');
const fs = require('fs');

// Leer archivo original
const workbook = XLSX.readFile('/Users/hectorpc/Downloads/Sinaloa.xls');
const worksheet = workbook.Sheets['Sinaloa'];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('📊 Total registros en archivo Sinaloa:', data.length);

// Filtrar solo Culiacán
const culiacanData = data.filter(row => {
  const municipio = (row.D_mnpio || '').toString().toLowerCase();
  return municipio.includes('culiacán') || municipio.includes('culiacan');
});

console.log('📍 Registros de Culiacán encontrados:', culiacanData.length);

// Filtrar SOLO Colonias y Fraccionamientos (eliminar rancherías, pueblos, ejidos, etc.)
const culiacanFiltrado = culiacanData.filter(row => {
  const tipo = row.d_tipo_asenta || '';
  return tipo === 'Colonia' || tipo === 'Fraccionamiento';
});

console.log('🔍 Después de filtrar solo Colonias y Fraccionamientos:', culiacanFiltrado.length);

// Contar por tipo (usando datos filtrados)
const colonias = culiacanFiltrado.filter(r => r.d_tipo_asenta === 'Colonia');
const fraccionamientos = culiacanFiltrado.filter(r => r.d_tipo_asenta === 'Fraccionamiento');

console.log('  - Colonias:', colonias.length);
console.log('  - Fraccionamientos:', fraccionamientos.length);

// Crear array limpio para Excel (SOLO Colonias y Fraccionamientos)
const excelData = culiacanFiltrado.map(row => ({
  'Tipo': row.d_tipo_asenta || '',
  'Nombre': row.d_asenta || '',
  'Código Postal': row.d_codigo || '',
  'Ciudad': row.d_ciudad || '',
  'Municipio': row.D_mnpio || '',
  'Zona': row.d_zona || ''
}));

// Crear nuevo workbook
const newWorkbook = XLSX.utils.book_new();
const newWorksheet = XLSX.utils.json_to_sheet(excelData);

// Agregar hoja
XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Culiacán');

// Guardar en escritorio
const desktopPath = '/Users/hectorpc/Desktop/colonias y fraccionamientos culiacan.xlsx';
XLSX.writeFile(newWorkbook, desktopPath);

console.log('');
console.log('✅ Archivo creado exitosamente en:');
console.log('   ' + desktopPath);
console.log('');
console.log('📋 Primeros 10 registros del archivo generado:');
excelData.slice(0, 10).forEach((row, i) => {
  console.log(`  [${i+1}] ${row.Tipo}: ${row.Nombre} (CP: ${row['Código Postal']})`);
});

console.log('');
console.log('📊 Resumen final:');
console.log(`  ✅ Total en Excel: ${excelData.length} registros`);
console.log(`  ✅ Solo Colonias y Fraccionamientos de Culiacán`);
console.log(`  ❌ Eliminados: Rancherías, Pueblos, Ejidos y otros (${culiacanData.length - culiacanFiltrado.length} registros)`);
