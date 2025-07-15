export interface SchoolEntry {
    name: string;
    amount: number;
    period: string;
}
/**
 * YearEndData.ts
 * Interface representing the structure of year-end data.
 * This interface defines the properties for cost centres, ledger codes, descriptions,
 * screens, and school entries.
 * @module YearEndData
 * @version 1.0.0
 * This module provides a TypeScript interface for year-end data,
 * including cost centres, ledger codes, descriptions, screens, and school entries.
 * It is designed to be used in a Node.js environment.
 * @example
 * import { YearEndData } from './YearEndData';
 * const yearEndData: YearEndData = {
 *    costCentre: 'CC001',
 *   ledgerCode: 'L001',
 *  description: 'Year-end expenses',
 * screen: 'YearEndScreen',
 * copyThis: 'Copy this data',
 * schools: [
 *     { name: 'School A', amount: 1000, period: '2023-12' },
 *    { name: 'School B', amount: 2000, period: '2023-12' }
 * ]
 * };
 * @author Pruthviraj
 * This interface defines the structure of year-end data,
 * including cost centres, ledger codes, descriptions, screens, and school entries.
 * It is designed to be used in a Node.js environment.
 * @see SchoolEntry
 * This interface represents the structure of year-end data,
 * including cost centres, ledger codes, descriptions, screens, and school entries.
 * * @typedef {Object} YearEndData
 * @property {string} costCentre - The cost centre identifier.
 * @property {string} ledgerCode - The ledger code associated with the cost centre.
 * @property {string} description - A description of the year-end data.
 * @property {string} screen - The screen identifier for the year-end data.
 * @property {string} copyThis - A string to be copied, typically used for reference.
 * * @property {SchoolEntry[]} schools - An array of school entries associated with the year-end data.
 * * @typedef {Object} SchoolEntry
 * * @property {string} name - The name of the school.
 * * @property {number} amount - The amount associated with the school entry.
 * * @property {string} period - The period for which the amount is applicable.
 * * This interface is used to structure year-end data for processing and reporting purposes.
 * * @see SchoolEntry
 * This interface represents the structure of school entries within year-end data,
 * including the school name, amount, and period.
 */
export interface YearEndData {
    costCentre: string;
    ledgerCode: string;
    description: string;
    screen: string;
    copyThis: string;
    schools: SchoolEntry[];
}
