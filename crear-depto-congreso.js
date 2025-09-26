#!/usr/bin/env node

// Script automático para crear Departamento Congreso en Renta
const { spawn } = require('child_process');

const respuestas = [
    'renta',
    'Departamento en renta Álamos-Tec Monterrey',
    'Zona Álamos-Tec, Monterrey',
    '$13,500/mes',
    'Moderno y cómodo departamento en la zona álamos-tec de monterrey, con 2 recámaras, sala, comedor, cocina integral, 2 baños completos con vanity en mármol y madera, canceles en regaderas, aire acondicionado en todas las áreas, closets, cuarto de lavado, 2 cajones de estacionamiento techado, acceso controlado con sistema de vigilancia, excelente ubicación cerca de Costco, La Ceiba, bancos, Cinépolis, gimnasios, restaurantes, Tec de Monterrey.',
    '2',
    '2',
    'Cocina integral',
    'Aire acondicionado en todas las áreas',
    'Closets',
    'Cuarto de lavado',
    '2 cajones de estacionamiento techado',
    'Acceso controlado con sistema de vigilancia',
    'Cerca de Costco, La Ceiba, bancos',
    'Cerca de Cinépolis, gimnasios, restaurantes',
    'Cerca del Tec de Monterrey',
    'Vanity en mármol y madera',
    'Canceles en regaderas',
    '100 m² área construida',
    '', // Terminar extras
    'departamento congreso',
    '' // WhatsApp default
];

const agente = spawn('node', ['/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad/agente-constructor-paginas.js'], {
    stdio: ['pipe', 'inherit', 'inherit']
});

let indiceRespuesta = 0;

// Enviar respuestas con delay
function enviarRespuesta() {
    if (indiceRespuesta < respuestas.length) {
        const respuesta = respuestas[indiceRespuesta];
        console.log(`Enviando: ${respuesta}`);
        agente.stdin.write(respuesta + '\n');
        indiceRespuesta++;
        
        // Delay entre respuestas
        setTimeout(enviarRespuesta, 1000);
    }
}

// Iniciar después de un pequeño delay
setTimeout(enviarRespuesta, 2000);

agente.on('close', (code) => {
    console.log(`Proceso terminado con código: ${code}`);
});