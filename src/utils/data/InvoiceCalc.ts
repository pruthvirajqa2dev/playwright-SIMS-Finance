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
    static readonly costCentreArr = [
        "ESFA Grants",
        "Pupil Premium",
        "NCTL Grants",
        "LA Grants",
        "Catering",
        "Lettings",
        "Music Lessons",
        "Services of Staff"
        // "Donations"
        // "Capital Funding"
    ];
    // static readonly quantArr = [1.2, 2.3, 3.4, 4.5, 5.6, 6.7, 7.8, 8.9, 9.1];
    static readonly quantArr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    // static readonly unitPriceArr = [
    //     120.12, 230.23, 340.34, 450.45, 560.56, 670.67, 780.78
    // ];
    static readonly unitPriceArr = [120, 230, 340, 450, 560, 670, 780];
    static readonly vatCodeArr = ["EXM", "NON", "RED", "STD", "ZER"];

    static calcVatPercent(vatCode): number {
        let vatPercent;
        switch (vatCode) {
            case "EXM":
            case "NON":
            case "ZER":
                vatPercent = 0;
                break;
            case "RED":
                vatPercent = 5;
                break;
            case "STD":
                vatPercent = 20;
                break;
            default:
                vatPercent = undefined;
                break;
        }
        return vatPercent;
    }
}
