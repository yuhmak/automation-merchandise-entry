const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SapService = require('./services/sap');
const { sendMerchandiseEmail } = require('./services/mailer');
const { generateAppleStyleEmail } = require('./templates/email');
const logger = require('./utils/logger');

async function runAutomation() {
    const sap = new SapService();

    try {
        await logger.info('=== INICIO AUTOMATIZACIÓN: Entrada Mercadería Hogar ===');
        await sap.login();

        const rawData = await sap.getMerchandiseEntries();

        if (rawData.length === 0) {
            await logger.info('No hay nuevas entradas de mercadería pendientes para notificar.');
            return;
        }

        const groupedEntries = Object.values(
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

        await logger.info(`Se agruparon los artículos en ${groupedEntries.length} documentos (DocEntries).`);

        for (const entry of groupedEntries) {
            const docEntry = entry.DocEntry_Entrada_de_Mercancias;

            try {
                await logger.info(`--- Procesando DocEntry: ${docEntry} ---`);

                const subject = `Entrada de mercancía ${docEntry} ${entry.Nº_Documento_de_Compras || ''} - Hogar`;
                const htmlContent = generateAppleStyleEmail(entry);

                await sendMerchandiseEmail(subject, htmlContent);
                await sap.updateVoucher(docEntry);

                await logger.info(`DocEntry ${docEntry} completado con éxito.`);
            } catch (entryError) {
                await logger.error(`Error procesando DocEntry ${docEntry}. Se saltará al siguiente.`, entryError);
            }
        }

        await logger.info('=== FIN AUTOMATIZACIÓN: Ciclo completado ===');

    } catch (error) {
        await logger.error('=== ERROR CRÍTICO EN LA AUTOMATIZACIÓN ===', error);
        process.exitCode = 1;
    } finally {
        await sap.logout();
    }
}

runAutomation();