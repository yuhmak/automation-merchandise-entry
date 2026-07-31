function generateAppleStyleEmail(entry) {
    const itemsHTML = entry.items.map(item => `
        <tr style="border-bottom: 1px solid #E8E8ED;">
            <td style="padding: 12px 16px; color: #1D1D1F; font-family: monospace;">${item.Numero || '-'}</td>
            <td style="padding: 12px 16px; color: #1D1D1F;">${item.Descripcion || '-'}</td>
            <td style="padding: 12px 16px; color: #1D1D1F; text-align: right; font-weight: 500;">${item.Cantidad || '0'}</td>
            <td style="padding: 12px 16px; color: #86868B; text-align: right;">${item.Pendiente || '0'}</td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body
    style="margin: 0; padding: 40px 20px; background-color: #F5F5F7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table width="100%" max-width="800" cellpadding="0" cellspacing="0"
        style="margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.04);">
        <tr>
            <td style="background-color: #00a8d6; padding: 32px 40px 20px 40px; text-align: center;">
                <img src="https://ofertas.yuhmak.com/anchor//assets/upload/img/1750355619.png" alt="YUHMAK" width="160"
                    style="display: block; margin: 0 auto;">
            </td>
        </tr>
        <tr>
            <td style="padding: 40px 40px 20px 40px;">
                <h2
                    style="margin: 0 0 8px 0; color: #1D1D1F; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">
                    Entrada de Mercancía Registrada</h2>
                <p style="margin: 0; color: #86868B; font-size: 15px; line-height: 1.5;">
                    Se informa el ingreso de mercancía correspondiente a la <strong>División Hogar</strong>.
                </p>
            </td>
        </tr>
        <tr>
            <td style="padding: 0 40px 20px 40px;">
                <table width="100%" cellpadding="12" cellspacing="0"
                    style="background-color: #FBFBFD; border-radius: 8px; font-size: 14px;">
                    <tr>
                        <td width="50%" style="color: #86868B;">Tipo de Documento: <br><strong
                                style="color: #1D1D1F;">${entry.Tipo_de_Documento_de_Compras || '-'}</strong></td>
                        <td width="50%" style="color: #86868B;">N° Doc. Compra: <br><strong
                                style="color: #1D1D1F;">${entry["Nº_Documento_de_Compras"] || '-'}</strong></td>
                    </tr>
                    <tr>
                        <td width="50%" style="color: #86868B;">Fecha Contabilización: <br><strong
                                style="color: #1D1D1F;">${entry.Fecha_de_Contabilizacion || '-'}</strong></td>
                        <td width="50%" style="color: #86868B;">Fecha de Entrega: <br><strong
                                style="color: #1D1D1F;">${entry.Fecha_de_Entrega || '-'}</strong></td>
                    </tr>
                    <tr>
                        <td colspan="2" style="color: #86868B;">Proveedor: <br><strong
                                style="color: #1D1D1F;">${entry["Nº_de_Proveedor"] || ''} - ${entry.Nombre_del_Proveedor
                                || 'No especificado'}</strong></td>
                    </tr>
                    <tr>
                        <td width="50%" style="color: #86868B;">N° Entrada: <br><strong
                                style="color: #1D1D1F;">${entry["Nº_Entrada_de_Mercancias"] || '-'}</strong></td>
                        <td width="50%" style="color: #86868B;">Almacén Receptor: <br><strong
                                style="color: #1D1D1F;">${entry["Nº_Almacen_Receptor"] || '-'}</strong></td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding: 20px 40px 10px 40px;">
                <h3 style="margin: 0; color: #1D1D1F; font-size: 18px; font-weight: 600;">Detalle de Artículos</h3>
            </td>
        </tr>
        <tr>
            <td style="padding: 0 40px 40px 40px;">
                <table width="100%" cellpadding="0" cellspacing="0"
                    style="border-collapse: collapse; font-size: 13px; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 2px solid #D2D2D7;">
                            <th style="padding: 12px 16px; color: #86868B; font-weight: 500;">Código</th>
                            <th style="padding: 12px 16px; color: #86868B; font-weight: 500;">Descripción</th>
                            <th style="padding: 12px 16px; color: #86868B; font-weight: 500; text-align: right;">
                                Cantidad</th>
                            <th style="padding: 12px 16px; color: #86868B; font-weight: 500; text-align: right;">
                                Pendiente</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
            </td>
        </tr>
        <tr>
            <td
                style="padding: 24px 40px; background-color: #F5F5F7; text-align: center; border-top: 1px solid #E8E8ED;">
                <p style="margin: 0; color: #86868B; font-size: 12px;">
                    Este es un mensaje automático generado por <strong>IT Yuhmak</strong>.<br>Por favor, no responda a
                    este correo electrónico.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

module.exports = { generateAppleStyleEmail };
