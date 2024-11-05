import * as fs from "fs";
import * as path from "path";
export default class FileUtils {
    /**
     * This function writes a file to file system with default content
     * @param ext
     * @returns Promise
     */
    static async fsWriteFile(ext: string) {
        console.log("Current directory is: " + __dirname);
        var dir = "../../";
        // if (process.env.CI ? true : false) dir = "../../../";
        // else dir = "../../";
        console.log("Previous directory is: " + path.join(__dirname, "../"));
        return new Promise((resolve) => {
            if (!fs.existsSync(path.join(__dirname, dir, "/Test Files"))) {
                // If it doesn't exist, create the directory
                fs.mkdirSync(path.join(__dirname, dir, "/Test Files"));
            }
            fs.writeFile(
                path.join(
                    __dirname,
                    dir,
                    "/Test Files/test" + Date.now() + ext
                ),
                "SIMS Finance Test File Content " + Date.now(),
                function (err) {
                    if (err) {
                        resolve(null);
                    }
                }
            );
            resolve("File created");
        });
    }
    /**
     * This function returns the latest file name from provided directory
     * @param dirPath
     * @returns latestFile.name
     */
    static getNewestFileNameInDir(dirPath: string): string | null {
        const files = fs.readdirSync(path.join(__dirname, "../../", dirPath));

        if (files.length === 0) {
            console.log("No files in the directory");
            return null;
        }

        const latestFile = files
            .map((fileName) => ({
                name: fileName,
                time: fs.statSync(path.join(dirPath, fileName)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time)[0];

        return latestFile ? latestFile.name : null;
    }
    /**
     * This function is for unzipping file from provided directory
     * @param directory
     * @returns
     */
    static async unzipFile(directory) {
        return new Promise((resolve) => {
            console.log("Into unzip file");
            console.log("directory:" + directory);
            const decompress = require("decompress");
            if (!fs.existsSync(path.join(__dirname, "/PDFDownloads"))) {
                // If it doesn't exist, create the directory
                fs.mkdirSync(path.join(__dirname, "/PDFDownloads"));
            }
            decompress(directory, __dirname + "/unzip" + Date.now().toString())
                .then((files) => {
                    resolve(files);
                })
                .catch((error) => {
                    console.log(error);
                });
        });
    }
}
