/**
 * SISTEMA DE NOTIFICACIONES - WhatsApp + Email
 *
 * Envía notificaciones cuando el scraper detecta cambios
 */

const nodemailer = require('nodemailer');
const https = require('https');

// =============== CONFIGURACIÓN ===============
const CONFIG = {
    // Email (usando Gmail)
    EMAIL: {
        FROM: 'hector.palazuelos@gmail.com',     // Tu email de Gmail
        TO: 'hector.palazuelos@gmail.com',       // Email destino
        PASSWORD: 'gmdiyvljttmegfsu',            // App Password de Gmail (no tu contraseña normal)
        ENABLED: false                            // DESACTIVADO - Problemas de conexión con Gmail
    },

    // WhatsApp (usando CallMeBot API - GRATIS)
    WHATSAPP: {
        PHONE: '5216671631231',                   // Tu número con código país (actualizado)
        API_KEY: '4713370',                       // API Key obtenido de CallMeBot
        ENABLED: true                             // ACTIVADO - WhatsApp + Email
    }
};

/**
 * Enviar email con Gmail
 */
async function sendEmail(subject, message) {
    if (!CONFIG.EMAIL.ENABLED) {
        console.log('📧 Email desactivado en config');
        return;
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: CONFIG.EMAIL.FROM,
                pass: CONFIG.EMAIL.PASSWORD
            }
        });

        const mailOptions = {
            from: CONFIG.EMAIL.FROM,
            to: CONFIG.EMAIL.TO,
            subject: subject,
            text: message,
            html: message.replace(/\n/g, '<br>')
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Email enviado correctamente');
    } catch (error) {
        console.error('❌ Error enviando email:', error.message);
    }
}

/**
 * Enviar WhatsApp usando CallMeBot (GRATIS)
 */
function sendWhatsApp(message) {
    if (!CONFIG.WHATSAPP.ENABLED) {
        console.log('📱 WhatsApp desactivado en config');
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const encodedMessage = encodeURIComponent(message);
        const url = `https://api.callmebot.com/whatsapp.php?phone=${CONFIG.WHATSAPP.PHONE}&text=${encodedMessage}&apikey=${CONFIG.WHATSAPP.API_KEY}`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ WhatsApp enviado correctamente');
                    resolve(data);
                } else {
                    console.error('❌ Error enviando WhatsApp:', res.statusCode, data);
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        }).on('error', (error) => {
            console.error('❌ Error enviando WhatsApp:', error.message);
            reject(error);
        });
    });
}

/**
 * Enviar notificación de cambios detectados
 */
async function notifyChanges(stats) {
    const { nuevas, eliminadas, total, nuevasDetalle, eliminadasDetalle } = stats;

    if (nuevas === 0 && eliminadas === 0) {
        console.log('ℹ️ No hay cambios, no se envían notificaciones');
        return;
    }

    const emoji_nuevas = nuevas > 0 ? '✨' : '';
    const emoji_eliminadas = eliminadas > 0 ? '❌' : '';

    // Mensaje corto para WhatsApp
    const messageShort = `🏠 *Inmuebles24 Monitor*\n\n${emoji_nuevas} Nuevas: ${nuevas}\n${emoji_eliminadas} Eliminadas: ${eliminadas}\n📊 Total: ${total}\n\n⏰ ${new Date().toLocaleString('es-MX')}`;

    // Generar listas detalladas
    let nuevasTexto = '';
    if (nuevasDetalle && nuevasDetalle.length > 0) {
        nuevasTexto = '\n\n✨ PROPIEDADES NUEVAS:\n' + nuevasDetalle.map((p, i) =>
            `${i + 1}. ${p.title}\n   💰 ${p.price}\n   🔗 ${p.url}`
        ).join('\n\n');
    }

    let eliminadasTexto = '';
    if (eliminadasDetalle && eliminadasDetalle.length > 0) {
        eliminadasTexto = '\n\n❌ PROPIEDADES ELIMINADAS:\n' + eliminadasDetalle.map((p, i) =>
            `${i + 1}. ${p.title}\n   💰 ${p.price}\n   🔗 ${p.url}`
        ).join('\n\n');
    }

    // Mensaje largo para Email
    const messageLong = `
🏠 INMUEBLES24 - REPORTE DE CAMBIOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${emoji_nuevas} PROPIEDADES NUEVAS: ${nuevas}
${emoji_eliminadas} PROPIEDADES ELIMINADAS: ${eliminadas}
📊 TOTAL ACTUAL: ${total}

⏰ Fecha: ${new Date().toLocaleString('es-MX')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${nuevasTexto}
${eliminadasTexto}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para ver el histórico completo, revisa el archivo:
inmuebles24-culiacan-historico.json

Hector es Bienes Raíces
    `.trim();

    console.log('\n📤 Enviando notificaciones...\n');

    // Enviar WhatsApp (promesa)
    const whatsappPromise = sendWhatsApp(messageShort);

    // Enviar Email (promesa)
    const emailPromise = sendEmail(
        `🏠 Inmuebles24: ${nuevas} nuevas, ${eliminadas} eliminadas`,
        messageLong
    );

    // Esperar ambas notificaciones
    await Promise.all([whatsappPromise, emailPromise]);

    console.log('\n✅ Notificaciones procesadas\n');
}

// =============== EXPORTAR ===============
module.exports = { sendEmail, sendWhatsApp, notifyChanges };

// =============== TEST (si se ejecuta directamente) ===============
if (require.main === module) {
    console.log('🧪 Modo TEST - Enviando notificaciones de prueba...\n');

    notifyChanges({
        nuevas: 5,
        eliminadas: 2,
        total: 303
    }).then(() => {
        console.log('\n✅ Test completado');
        process.exit(0);
    }).catch((error) => {
        console.error('\n❌ Test falló:', error);
        process.exit(1);
    });
}
