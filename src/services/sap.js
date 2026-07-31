const axios = require('axios');
const https = require('https');
const logger = require('../utils/logger');

class SapService {
    constructor() {
        const agent = new https.Agent({ rejectUnauthorized: false });

        this.client = axios.create({
            baseURL: process.env.API_BASE_URL,
            httpsAgent: agent,
            timeout: 15000,
        });

        this.cookies = '';
    }

    async _withRetry(fn, retries = 3, delay = 2000) {
        for (let i = 1; i <= retries; i++) {
            try {
                return await fn();
            } catch (err) {
                if (i === retries) throw err;
                await logger.info(`Intento fallido en SAP. Reintentando en ${delay}ms... (Intento ${i} de ${retries})`);
                await new Promise(res => setTimeout(res, delay));
            }
        }
    }

    _parseOData(rawData) {
        if (Array.isArray(rawData)) return rawData;
        if (Array.isArray(rawData?.value)) return rawData.value;
        if (Array.isArray(rawData?.value?.value)) return rawData.value.value;
        if (Array.isArray(rawData?.d?.results)) return rawData.d.results;
        return [];
    }

    async login() {
        await logger.info('Iniciando autenticación en SAP Service Layer...');
        const response = await this._withRetry(() =>
            this.client.post('/Login', {
                CompanyDB: process.env.SAP_COMPANYDB,
                UserName: process.env.SAP_USER,
                Password: process.env.SAP_PASSWORD
            })
        );

        const setCookieHeader = response.headers['set-cookie'];
        if (setCookieHeader) {
            this.cookies = setCookieHeader.map(c => c.split(';')[0]).join('; ');
        } else {
            this.cookies = `B1SESSION=${response.data.SessionId};`;
        }
        await logger.info('Login exitoso. Sesión establecida.');
    }

    async getMerchandiseEntries() {
        await logger.info('Consultando endpoint YUH_ENTRADA_PROVEEDORES...');

        const response = await this._withRetry(() =>
            this.client.get('/sml.svc/YUH_ENTRADA_PROVEEDORES', {
                headers: { 'Cookie': this.cookies }
            })
        );

        const data = this._parseOData(response.data);
        await logger.info(`Se obtuvieron ${data.length} líneas de artículos desde SAP.`);
        return data;
    }

    async updateVoucher(docEntry) {
        await logger.info(`Actualizando U_VoucherSancor para el DocEntry: ${docEntry}...`);

        await this._withRetry(() =>
            this.client.patch(`/PurchaseDeliveryNotes(${docEntry})`,
                { U_VoucherSancor: 'Si' },
                {
                    headers: {
                        'Cookie': this.cookies,
                        'Content-Type': 'application/json'
                    }
                }
            )
        );

        await logger.info(`DocEntry ${docEntry} actualizado a 'Si' correctamente.`);
    }

    async logout() {
        if (!this.cookies) return;

        try {
            await logger.info('Ejecutando Logout en SAP...');
            await this.client.post('/Logout', {}, {
                headers: { 'Cookie': this.cookies }
            });
            this.cookies = '';
            await logger.info('Logout exitoso. Sesión liberada.');
        } catch (error) {
            await logger.error('Error al realizar Logout en SAP.', error);
        }
    }
}

module.exports = SapService;
