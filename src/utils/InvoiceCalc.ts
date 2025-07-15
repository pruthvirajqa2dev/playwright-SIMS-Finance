/**
 * InvoiceCalc.ts
 * Utility class for invoice calculations and VAT handling.
 * @module InvoiceCalc
 * @version 1.0.0
 *
 *  This module provides static methods and constants for handling invoice calculations,
 *  including cost centres, quantities, unit prices, and VAT codes.
 *  It is designed to be used in a Node.js environment.
 * @example
 *  import InvoiceCalc from './InvoiceCalc';
 *  const vatPercent = InvoiceCalc.calcVatPercent('STD');
 *  console.log(`VAT Percent: ${vatPercent}%`);
 *  @author Pruthviraj
 *
 */
export default class InvoiceCalc {
    // utils/invoiceUtils.ts
    private static vatCodeMap: Record<string, number> = {
        EXM: 0,
        NON: 0,
        ZER: 0,
        RED: 5,
        STD: 20
    };

    public static calcVatPercent(vatCode: string): number {
        return this.vatCodeMap[vatCode] ?? 0;
    }
}
