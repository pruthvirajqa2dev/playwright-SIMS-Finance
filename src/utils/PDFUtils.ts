import { Download } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import pdf from "pdf-parse";
import FileUtils from "./FileUtils";
/**
 * PDFUtils.ts
 * Utility class for handling PDF files.
 * @module PDFUtils
 * @version 1.0.0
 * This module provides methods to read PDF content, unzip downloaded ZIP files,
 * and read the latest PDF from the latest unzipped directory.
 * It is designed to be used in a Node.js environment.
 * @example
 * import PDFUtils from './PDFUtils';
 * const pdfContent = await PDFUtils.readPDF('path/to/pdf/file.pdf');
 * console.log(pdfContent);
 * @author Pruthviraj
 * This class provides methods to read PDF content, unzip downloaded ZIP files,
 * and read the latest PDF from the latest unzipped directory.
 */
export default class PDFUtils {
    /**
     * Read PDF content from provided pdfPath
     * @param pdfPath
     * @returns
     */
    static async readPDF(pdfPath: string): Promise<string> {
        return new Promise((resolve) => {
            const filePath = path.resolve(pdfPath);
            const dataBuffer = fs.readFileSync(filePath);
            pdf(dataBuffer).then((data) => {
                resolve(data.text);
            });
        });
    }
    static async unzipDownloadedZip(download: Download) {
        const downloadDirPath = `${process.cwd()}/PDFDownloads/`;
        const downloadedZipFileName = download.suggestedFilename();
        console.log(`Zip Filename: ${downloadedZipFileName}`);
        const filePath = downloadDirPath + downloadedZipFileName;
        await download.saveAs(filePath);

        await FileUtils.unzipFile(
            path.join(downloadDirPath, downloadedZipFileName)
        );
    }
    static async readLatestPDFFromLatestUnzipDir(
        dir: string
    ): Promise<string | null> {
        // const dir = process.cwd() + "/PDFDownloads/unzip*/";
        const filePattern: string = "*.PDF";
        // Get latest file name
        const fileName = await FileUtils.latestFileNameLookup(
            dir + filePattern
        );
        console.log("PDF File name is: " + fileName);
        const pdfData: any = await PDFUtils.readPDF(fileName);
        console.log("PDF data from " + fileName + " : " + pdfData);
        if (pdfData !== "") {
            return pdfData;
        } else return null;
    }
    static async testDownloadAndUnzipPDF() {
        // Wait for the PDF to download
        const downloadDirPath = process.cwd() + "/PDFDownloads/";
        const downloadedZipFileName = "RSS570-2200.zip";
        // const downloadedZipFileName = download.suggestedFilename();
        // await download.saveAs(filePath);

        await FileUtils.unzipFile(
            path.join(downloadDirPath, downloadedZipFileName)
        ); //get zip file name
        // Latest PDF file name

        console.log("Zip Filename: " + downloadedZipFileName);
        // console.log("Path: " + path.join(downloadDirPath, unzipDirPathRegEx));
        const pdfFileName = await FileUtils.latestFileNameLookup(
            process.cwd() + "/PDFDownloads/unzip*/*.PDF"
        );
        console.log("PDF File name is: " + pdfFileName);
        const data: any = await PDFUtils.readPDF(pdfFileName);
        console.log("PDF data from " + pdfFileName + " : " + data);
        // Extract text from the PDF
    }
}
