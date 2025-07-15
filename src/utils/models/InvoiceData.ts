// models/InvoiceData.ts
/**
 * InvoiceData.ts
 * Utility interface for invoice data rows.
 * @module InvoiceData
 * @version 1.0.0
 * This module defines the structure of an invoice row,
 * including cost centres, quantities, unit prices, VAT codes, VAT percentages, and total amounts.
 * It is designed to be used in a Node.js environment.
 * * @example
 * import { InvoiceRow } from './InvoiceData';
 * const invoiceRow: InvoiceRow = {
 *     costCentre: 'CC001',
 *    quantity: 10,
 *   unitPrice: 50.0,
 *  vatCode: 'STD',
 * vatPercent: 20,
 * total: 600.0
 * };
 * @author Pruthviraj
 * This interface defines the structure of an invoice row,
 * including cost centres, quantities, unit prices, VAT codes, VAT percentages, and total amounts.
 * * It is designed to be used in a Node.js environment.
 * @see InvoiceCalc
 * This interface represents the structure of an invoice row,
 * including cost centres, quantities, unit prices, VAT codes, VAT percentages, and total amounts.
 * * @typedef {Object} InvoiceRow
 * @property {string} costCentre - The cost centre identifier.
 *  * @property {number} quantity - The quantity of items in the invoice row.
 * @property {number} unitPrice - The unit price of the items in the invoice row.
 * * @property {string} vatCode - The VAT code applicable to the invoice row.
 * @property {number} vatPercent - The VAT percentage applicable to the invoice row.
 * * @property {number} total - The total amount for the invoice row, including VAT.
 */
export interface InvoiceRow {
    costCentre: string;
    quantity: number;
    unitPrice: number;
    vatCode: string;
    vatPercent: number;
    total: number;
}
