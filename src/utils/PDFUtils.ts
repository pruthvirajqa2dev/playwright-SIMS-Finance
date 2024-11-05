import * as fs from "fs";
import * as path from "path";
const pdf = require("pdf-parse");
export default class PDFUtils {
    /**
     * Read PDF content from provided pdfPath
     * @param pdfPath
     * @returns
     */
    static async readPDF(pdfPath) {
        return new Promise((resolve) => {
            const filePath = path.resolve(pdfPath);
            const dataBuffer = fs.readFileSync(filePath);
            pdf(dataBuffer).then(function (data) {
                resolve(data);
            });
        });
    }
}
