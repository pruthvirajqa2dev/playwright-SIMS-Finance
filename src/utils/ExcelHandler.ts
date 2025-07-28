import * as XLSX from "xlsx";
import * as fs from "fs";

export type SheetData = any[][];
/**
 * ExcelHandler.ts
 * Utility class for handling Excel files using the XLSX library.
 * @module ExcelHandler
 * @version 1.0.0
 * * This module provides methods to read and write Excel sheets, cells, and validate cell addresses.
 *  It is designed to be used in a Node.js environment.
 * * @example
 * import { ExcelHandler } from './ExcelHandler';
 * const excelHandler = new ExcelHandler('path/to/excel/file.xlsx');
 * const sheetData = excelHandler.readSheet('Sheet1');
 *
 * @author Pruthviraj
 *
 * This class provides methods to read and write Excel sheets, cells, and validate cell addresses.
 */
export class ExcelHandler {
    private workbook: XLSX.WorkBook;

    constructor(filePath?: string) {
        if (filePath && fs.existsSync(filePath)) {
            this.workbook = XLSX.readFile(filePath);
        } else {
            this.workbook = XLSX.utils.book_new();
        }
    }

    private isValidCellAddress(address: string): boolean {
        return /^[A-Z]+[1-9][0-9]*$/.test(address);
    }

    sheetExists(sheetName: string): boolean {
        return !!this.workbook.Sheets[sheetName];
    }

    readSheet(sheetName: string): SheetData | null {
        try {
            const sheet = this.workbook.Sheets[sheetName];
            return sheet
                ? XLSX.utils.sheet_to_json(sheet, { header: 1 })
                : null;
        } catch (error) {
            console.error(`Error reading sheet "${sheetName}":`, error);
            return null;
        }
    }

    writeSheet(sheetName: string, data: SheetData, overwrite = false): void {
        try {
            if (overwrite && this.sheetExists(sheetName)) {
                delete this.workbook.Sheets[sheetName];
                const index = this.workbook.SheetNames.indexOf(sheetName);
                if (index !== -1) this.workbook.SheetNames.splice(index, 1);
            }
            const sheet = XLSX.utils.aoa_to_sheet(data);
            XLSX.utils.book_append_sheet(this.workbook, sheet, sheetName);
        } catch (error) {
            console.error(`Error writing sheet "${sheetName}":`, error);
        }
    }

    readCell(sheetName: string, cellAddress: string): any | null {
        if (!this.isValidCellAddress(cellAddress)) {
            console.warn(`Invalid cell address: ${cellAddress}`);
            return null;
        }
        try {
            const sheet = this.workbook.Sheets[sheetName];
            return sheet && sheet[cellAddress] ? sheet[cellAddress].v : null;
        } catch (error) {
            console.error(
                `Error reading cell ${cellAddress} in "${sheetName}":`,
                error
            );
            return null;
        }
    }

    writeCell(sheetName: string, cellAddress: string, value: any): void {
        if (!this.isValidCellAddress(cellAddress)) {
            console.warn(`Invalid cell address: ${cellAddress}`);
            return;
        }
        try {
            let sheet = this.workbook.Sheets[sheetName];
            if (!sheet) {
                sheet = XLSX.utils.aoa_to_sheet([]);
                XLSX.utils.book_append_sheet(this.workbook, sheet, sheetName);
            }
            sheet[cellAddress] = { v: value };
        } catch (error) {
            console.error(
                `Error writing cell ${cellAddress} in "${sheetName}":`,
                error
            );
        }
    }

    saveToFile(filePath: string): void {
        try {
            XLSX.writeFile(this.workbook, filePath);
        } catch (error) {
            console.error(`Error saving workbook to "${filePath}":`, error);
        }
    }

    getRandomRowAsObject(data: SheetData | null): Record<string, any> | null {
        if (!data || data.length < 2) return null;

        const [headers, ...rows] = data;
        const randomIndex = Math.floor(Math.random() * rows.length);
        const row = rows[randomIndex];

        const rowObject: Record<string, any> = {};
        headers.forEach((key, i) => {
            rowObject[key] = row[i];
        });

        return rowObject;
    }
}
