import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
import fsPromise from "fs/promises";
import expectedTexts from "../data/expectedTexts.json";
import logger from "../logging/logger";
/**
 * Utility class for file operations.
 * Provides methods to read, write, unzip files, and manage directories.
 * @module FileUtils
 * @version 1.0.0
 * This module provides methods to read and write files, unzip files,
 * and manage directories in a Node.js environment.
 * @example
 * import FileUtils from './FileUtils';
 * const filePath = 'path/to/file.txt';
 * const content = 'Hello, World!';
 * await FileUtils.writeFileAsync(filePath, content);
 * const fileContent = await FileUtils.readFileAsync(filePath);
 * console.log(fileContent);
 * @author Pruthviraj
 * This class provides methods to read and write files, unzip files,
 * and manage directories in a Node.js environment.
 * * @see {@link https://nodejs.org/api/fs.html | Node.js fs module}
 * * @see {@link https://www.npmjs.com/package/glob | glob package}
 * * @see {@link https://www.npmjs.com/package/decompress | decompress package}
 * * @see {@link https://www.npmjs.com/package/expectedTexts | expectedTexts.json}
 * * @see {@link https://www.npmjs.com/package/logger | logger module}
 * * @see {@link https://www.npmjs.com/package/fs/promises | fs/promises module}
 * * @see {@link https://www.npmjs.com/package/path | path module}
 * * @see {@link https://www.npmjs.com/package/fs | fs module}
 */
export default class FileUtils {
    private static readonly pdfDownloadLocation = "/PDFDownloads";
    /**
     *
     * @param filePath
     * @param content
     * @returns
     */
    static async writeFileAsync(filePath, content): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, content, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
    /**
     *
     * @param filePath
     * @returns
     */
    static async readFileAsync(filePath): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, "utf-8", (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }
    /**
     * This function writes a file to file system with default content
     * @param ext
     * @returns Promise
     */
    static async fsWriteFile(ext: string): Promise<string | null> {
        return new Promise((resolve) => {
            const dir = process.cwd() + "/" + expectedTexts.testFileDir + "/";
            console.log("Writing file in: " + dir);
            if (!fs.existsSync(path.join(dir))) {
                // If it doesn't exist, create the directory
                fs.mkdirSync(path.join(dir));
            }
            const fileNameWithExt: string = "test" + Date.now() + ext;
            fs.writeFile(
                path.join(dir + fileNameWithExt),
                "SIMS Finance Test File Content " + Date.now(),
                function (err) {
                    if (err) {
                        resolve(null);
                    }
                }
            );
            resolve(expectedTexts.testFileDir + "/" + fileNameWithExt);
        });
    }
    /**
     * This function is for unzipping file from provided directory
     * @param directory
     * @returns
     */
    static async unzipFile(directory: string) {
        return new Promise((resolve) => {
            console.log("Into unzip file");
            console.log("directory:" + directory);
            const decompress = require("decompress");
            if (
                !fs.existsSync(
                    path.join(process.cwd(), this.pdfDownloadLocation)
                )
            ) {
                // If it doesn't exist, create the directory
                fs.mkdirSync(
                    path.join(process.cwd(), this.pdfDownloadLocation)
                );
            }
            const unzipLocation =
                process.cwd() +
                this.pdfDownloadLocation +
                "/unzip" +
                Date.now().toString();

            console.log("Unzipping in: " + unzipLocation);
            decompress(directory, unzipLocation)
                .then((files: unknown) => {
                    resolve(files);
                })
                .catch((error: any) => {
                    console.log(error);
                });
        });
    }
    async deleteDirectoryRecursive(directoryPath: string): Promise<void> {
        try {
            const entries = await fsPromise.readdir(directoryPath, {
                withFileTypes: true
            });

            for (const entry of entries) {
                const entryPath = path.join(directoryPath, entry.name);

                if (entry.isDirectory()) {
                    await this.deleteDirectoryRecursive(entryPath);
                } else {
                    await fsPromise.unlink(entryPath);
                }
            }

            await fsPromise.rmdir(directoryPath);
        } catch (error) {
            console.error(`Error deleting directory ${directoryPath}:`, error);
            throw error;
        }
    }
    static async latestFileNameLookup(directory: string): Promise<string> {
        logger.info(
            `Looking up latest file name using directory: ${directory}`
        );
        return new Promise((resolve) => {
            const newestFile = glob
                .sync(directory)
                .map((name) => ({ name, ctime: fs.statSync(name).ctime }))
                .sort((a, b) => b.ctime.getTime() - a.ctime.getTime())[0].name;

            logger.info(`Returning ${newestFile} from directory`);
            resolve(newestFile);
        });
    }
}
