#!/usr/bin/env node

// Script automático para crear Casa Privada La Perla Premium
const { spawn } = require('child_process');

const respuestas = [
    'venta',
    'Casa en venta Privada La Perla Premium',
    'Sector Perisur',
    '$3,400,000',
    'Excelente casa en exclusiva Privada La Perla Premium ubicada en sector Perisur. Cuenta con 3 recámaras, 3.5 baños, sala, comedor y cocina equipada. Frente a parque y área común con acceso controlado, seguridad 24/7, alberca y área de juegos.',
    '3',
    '3.5',
    'Cocina equipada',
    'Área de lavado',
    'Pasillo lateral',
    'Frente a parque y área común',
    'Cochera p/2 carros',
    'Acceso controlado y seguridad 24/7',
    'Área común con alberca',
    'Área de juegos',
    '', // Terminar extras
    'casa en venta privada la perla premium',
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