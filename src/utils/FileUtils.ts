import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
import fsPromise from "fs/promises";
import expectedTexts from "../data/expectedTexts.json";
import logger from "../logging/logger";

export default class FileUtils {
    private static readonly pdfDownloadLocation = "/PDFDownloads";
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
