require('dotenv').config();
const nodemailer = require('nodemailer');
const axios = require('axios');
const https = require('https');
const fs = require('fs').promises;
const path = require('path');

const LOCK_FILE = path.join(__dirname, 'job.lock');
const LOCK_TTL = 10 * 60 * 1000;

const agent = new https.Agent({ rejectUnauthorized: false });

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function writeLog(message) {
    const timestamp = new Date().toISOString();
    await fs.appendFile('automation.log', `[${timestamp}] ${message}\n`);
}

async function acquireLock() {
    try {
        await fs.writeFile(
            LOCK_FILE,
            JSON.stringify({
                pid: process.pid,
                timestamp: Date.now()
            }),
            { flag: 'wx' }
        );
        return true;
    } catch (err) {
        try {
            const data = await fs.readFile(LOCK_FILE, 'utf-8');
            const lock = JSON.parse(data);

            const isExpired = (Date.now() - lock.timestamp) > LOCK_TTL;

            if (isExpired) {
                await writeLog(`Lock zombie detectado (PID ${lock.pid}), eliminando...`);
                await fs.unlink(LOCK_FILE);
                return await acquireLock();
            }

            return false;
        } catch (e) {
            await writeLog('Lock corrupto detectado, eliminando...');
            await fs.unlink(LOCK_FILE);
            return await acquireLock();
        }
    }
}

async function releaseLock() {
    try {
        await fs.unlink(LOCK_FILE);
    } catch { }
}

async function withRetry(fn, retries = 3, delay = 2000) {
    for (let i = 1; i <= retries; i++) {
        try {
            return await fn();
        } catch (err) {
            if (i === retries) throw err;
            await new Promise(res => setTimeout(res, delay));
        }
    }
}

async function automationMerchandiseEntry() {
    const hasLock = await acquireLock();

    if (!hasLock) {
        console.log('Ya hay una ejecución en curso. Saliendo...');
        return;
    }

    try {
        await writeLog('Inicio automatización');

        const axiosInstance = axios.create({
            httpsAgent: agent,
            timeout: 15000
        });

        const loginResponse = await withRetry(() =>
            axiosInstance.post(`${process.env.API_BASE_URL}/Login`, {
                CompanyDB: process.env.SAP_COMPANYDB,
                UserName: process.env.SAP_USER,
                Password: process.env.SAP_PASSWORD,
            })
        );

        const B1SESSION = loginResponse.data.SessionId;
        if (!B1SESSION) throw new Error('No se pudo obtener B1SESSION');

        const response = await withRetry(() =>
            axiosInstance.get(`${process.env.API_BASE_URL}/sml.svc/YUH_ENTRADA_PROVEEDORES`, {
                headers: { Cookie: `B1SESSION=${B1SESSION};` }
            })
        );

        let rawData = response.data;

        if (Array.isArray(rawData)) {
        } else if (Array.isArray(rawData.value)) {
            rawData = rawData.value;
        } else if (rawData.value && Array.isArray(rawData.value.value)) {
            rawData = rawData.value.value;
        } else if (rawData.d && Array.isArray(rawData.d.results)) {
            rawData = rawData.d.results;
        } else {
            throw new Error('Respuesta inválida del endpoint');
        }

        const grouped = Object.values(
            rawData.reduce((acc, item) => {
                const key = item.DocEntry_Entrada_de_Mercancias;

                if (!acc[key]) {
                    acc[key] = { ...item, items: [] };
                }

                acc[key].items.push({
                    Numero: item["Numero_de_Artículo"],
                    Descripcion: item["Descripcion_del_Articulo"],
                    Cantidad: item["Cantidad_Ingresada"],
                    Pendiente: item["OpenQty"]
                });

                return acc;
            }, {})
        );

        await writeLog(`Entradas agrupadas: ${grouped.length}`);

        const recipients = [
            process.env.EMAIL_RECIPIENT1,
            process.env.EMAIL_RECIPIENT2,
            process.env.EMAIL_RECIPIENT3,
            process.env.EMAIL_RECIPIENT4,
            process.env.EMAIL_RECIPIENT5,
            process.env.EMAIL_RECIPIENT6,
            process.env.EMAIL_RECIPIENT7
        ].filter(Boolean);

        for (const entry of grouped) {
            try {
                const itemsHTML = entry.items.map(item => `
                    <tr>
                        <td>${item.Numero}</td>
                        <td>${item.Descripcion}</td>
                        <td>${item.Cantidad}</td>
                        <td>${item.Pendiente}</td>
                    </tr>
                `).join('');

                await withRetry(() =>
                    transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: recipients.join(','),
                        subject: `Entrada de mercancía ${entry.DocEntry_Entrada_de_Mercancias} ${entry.Nº_Documento_de_Compras} - Hogar`,
                        html: `<html>
<head>
    <meta charset="utf-8">
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif;">
    <table width="900" cellpadding="0" cellspacing="0"
        style="background-color:#ffffff; margin-top:20px; border-collapse:collapse; margin-left: auto; margin-right: auto;">
        <tr>
            <td style="background-color:#00a8d6; padding:20px; text-align:center;">
                <img src="https://ofertas.yuhmak.com/anchor//assets/upload/img/1750355619.png" alt="YUHMAK" width="300"
                    style="display:block; margin:auto;">
            </td>
        </tr>
        <tr>
            <td style="padding:20px; text-align:center;">
                <h2 style="margin:0; color:#002f43;">Notificación de Entrada de Mercancía</h2>
            </td>
        </tr>
        <tr>
            <td style="padding:0 30px 20px 30px; color:#333;">
                <p>Estimado/a,</p>
                <p>Se informa que se ha registrado una <strong>entrada de mercancía</strong> correspondiente a la
                    división hogar, con el siguiente detalle:</p>
            </td>
        </tr>
        <tr>
            <td style="padding:0 30px;">
                <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse; font-size:14px;">
                    <tr style="background-color:#f0f0f0;">
                        <td><strong>Tipo de documento</strong></td>
                        <td>${entry.Tipo_de_Documento_de_Compras}</td>
                    </tr>
                    <tr>
                        <td><strong>N° Documento de compra</strong></td>
                        <td>${entry["Nº_Documento_de_Compras"]}</td>
                    </tr>
                    <tr style="background-color:#f0f0f0;">
                        <td><strong>Fecha de pedido</strong></td>
                        <td>${entry.Fecha_de_Contabilizacion}</td>
                    </tr>
                    <tr>
                        <td><strong>Fecha de entrega</strong></td>
                        <td>${entry.Fecha_de_Entrega}</td>
                    </tr>
                    <tr style="background-color:#f0f0f0;">
                        <td><strong>Proveedor</strong></td>
                        <td>${entry["Nº_de_Proveedor"]} - ${entry.Nombre_del_Proveedor}</td>
                    </tr>
                    <tr>
                        <td><strong>Entrada de mercancía</strong></td>
                        <td>N° ${entry["Nº_Entrada_de_Mercancias"]}</td>
                    </tr>
                    <tr style="background-color:#f0f0f0;">
                        <td><strong>Almacén receptor</strong></td>
                        <td>${entry["Nº_Almacen_Receptor"]}</td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding:20px 30px;">
                <h3 style="margin-bottom:10px; color:#002f43;">Detalle de artículos</h3>
                <table width="100%" cellpadding="8" cellspacing="0"
                    style="border-collapse:collapse; font-size:14px; border:1px solid #ddd;">
                    <tr style="background-color:#00a8d6; color:#ffffff;">
                        <td><strong>Código</strong></td>
                        <td><strong>Descripción</strong></td>
                        <td><strong>Cantidad</strong></td>
                        <td><strong>Pendiente</strong></td>
                    </tr>
                    ${itemsHTML}
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding:20px 30px; font-size:12px; color:#666;">
                <p>Este es un mensaje automático generado por el sector IT. Por favor, no responder a este correo.</p>
                <p>Atentamente,<br><strong>IT Yuhmak</strong></p>
            </td>
        </tr>
    </table>
</body>
</html>
                        `
                    })
                );

                await withRetry(() =>
                    axiosInstance.patch(
                        `${process.env.API_BASE_URL}/PurchaseDeliveryNotes(${entry.DocEntry_Entrada_de_Mercancias})`,
                        { U_VoucherSancor: 'Si' },
                        {
                            headers: {
                                Cookie: `B1SESSION=${B1SESSION};`,
                                'Content-Type': 'application/json'
                            }
                        }
                    )
                );

                await writeLog(`OK DocEntry ${entry.DocEntry_Entrada_de_Mercancias}`);
            } catch (err) {
                await writeLog(`ERROR DocEntry ${entry.DocEntry_Entrada_de_Mercancias}: ${err.message}`);
            }
        }
        await writeLog('Fin OK');
    } catch (err) {
        await writeLog(`ERROR GENERAL: ${err.message}`);
        throw err;
    } finally {
        await releaseLock();
    }
}

async function runContinuously() {
    while (true) {
        try {
            console.log('Iniciando ciclo de ejecución...');
            await automationMerchandiseEntry();
        } catch (err) {
            console.error('Error en el ciclo:', err.message);
        }
        
        const minutes = 10;
        console.log(`Esperando ${minutes} minutos para la próxima ejecución...`);
        await new Promise(resolve => setTimeout(resolve, minutes * 60 * 1000));
    }
}

runContinuously();

process.on('unhandledRejection', async (err) => {
    await writeLog(`UNHANDLED: ${err.message}`);
});

process.on('uncaughtException', async (err) => {
    await writeLog(`UNCAUGHT: ${err.message}`);
});
