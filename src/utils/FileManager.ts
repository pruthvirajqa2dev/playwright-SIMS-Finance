const fs = require("fs");
const path = require("path");
/**
 * FileManager.ts
 * Utility class for managing file operations such as reading and writing content to files.
 * @module FileManager
 * @version 1.0.0
 * This module provides methods to create a folder, write content to a file,
 * and read content from a file in a Node.js environment.
 * @example
 * import FileManager from './FileManager';
 * const fileManager = new FileManager('data', 'example.txt');
 * // fileManager.writeContent('Hello, World!');
 * const content = fileManager.readContent();
 * console.log(content);
 * @author Pruthviraj
 * This class provides methods to create a folder, write content to a file,
 * and read content from a file in a Node.js environment.
 * @see {@link https://nodejs.org/api/fs.html | Node.js fs module}
 * * @see {@link https://nodejs.org/api/path.html | Node.js path module}
 * * @see {@link https://www.npmjs.com/package/fs | fs package}
 * * * @see {@link https://www.npmjs.com/package/path | path package}
 * * * @see {@link https://www.npmjs.com/package/node | node package}
 * * @see {@link https://www.npmjs.com/package/typescript | typescript package}
 */
class FileManager {
    private folderPath: string;
    private filePath: string;

    constructor(folderName: string, fileName: string) {
        // Initialize folder and file paths
        this.folderPath = path.join(__dirname, folderName);
        this.filePath = path.join(this.folderPath, fileName);

        // Create folder if it doesn't exist
        if (!fs.existsSync(this.folderPath)) {
            fs.mkdirSync(this.folderPath, { recursive: true });
            console.log(`Folder created at: ${this.folderPath}`);
        }
    }

    writeContent(content: string): void {
        fs.writeFileSync(this.filePath, content, { encoding: "utf-8" });
        console.log(`Content written to file: ${this.filePath}`);
    }

    readContent(): string {
        if (!fs.existsSync(this.filePath)) {
            throw new Error("File does not exist");
        }

        const content = fs.readFileSync(this.filePath, { encoding: "utf-8" });
        console.log(`Content read from file: ${content}`);
        return content;
    }
}
const timestamp = String(
    "" +
        new Date().getDate() +
        new Date().getMonth() +
        new Date().getHours() +
        new Date().getMinutes()
);
// Usage example
const fileManager = new FileManager("data", "example.txt");

// Write content to file
fileManager.writeContent("Hello, this is a sample content.");

// Read and print content from file
const content = fileManager.readContent();
console.log(`File content: ${content}`);
