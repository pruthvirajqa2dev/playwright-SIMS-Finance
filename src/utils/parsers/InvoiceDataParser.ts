import { ExcelHandler } from "../ExcelHandler";
export interface InvoiceRow {
    costCentre: string;
    quantity: number;
    unitPrice: number;
    vatCode: string;
    vatPercent: number;
    total: number;
}

import InvoiceCalc from "../InvoiceCalc";
/**
 *
 * InvoiceDataParser.ts
 * Utility class for parsing invoice data from Excel sheets.
 * @module InvoiceDataParser
 * @version 1.0.0
 * This module provides methods to read and parse invoice data from Excel sheets,
 * including cost centres, quantities, unit prices, VAT codes, and total amounts.
 * It is designed to be used in a Node.js environment.
 * @example
 * import { InvoiceDataParser } from './InvoiceDataParser';
 * const excelHandler = new ExcelHandler('path/to/excel/file.xlsx');
 * const parser = new InvoiceDataParser(excelHandler);
 * const invoiceRows = parser.parse('InvoiceSheet');
 * console.log(invoiceRows);
 * @author Pruthviraj
 * This class provides methods to read and parse invoice data from Excel sheets,
 * including cost centres, quantities, unit prices, VAT codes, and total amounts.
 * It is designed to be used in a Node.js environment.
 */
export class InvoiceDataParser {
    constructor(private handler: ExcelHandler) {}

    parse(sheetName: string): InvoiceRow[] {
        const data = this.handler.readSheet(sheetName);
        if (!data || data.length < 2) return [];

        const rows: InvoiceRow[] = [];

        for (let i = 1; i < data.length; i++) {
            const row = data[i];

            const costCentre = (row[0] ?? "").toString().trim();
            const quantity = Number(row[1]) || 0;
            const unitPrice = Number(row[2]) || 0;
            const vatCode = (row[3] ?? "").toString().trim();
            const vatPercent = InvoiceCalc.calcVatPercent(vatCode) ?? 0;

            const total = quantity * unitPrice * (1 + vatPercent / 100);

            rows.push({
                costCentre,
                quantity,
                unitPrice,
                vatCode,
                vatPercent,
                total: parseFloat(total.toFixed(2))
            });
        }

        return rows;
    }
}
