var fs = require("fs");
var path = require("path");
var FileManager = /** @class */ (function () {
    function FileManager(folderName, fileName) {
        // Initialize folder and file paths
        this.folderPath = path.join(__dirname, folderName);
        this.filePath = path.join(this.folderPath, fileName);
        // Create folder if it doesn't exist
        if (!fs.existsSync(this.folderPath)) {
            fs.mkdirSync(this.folderPath, { recursive: true });
            console.log("Folder created at: ".concat(this.folderPath));
        }
    }
    FileManager.prototype.writeContent = function (content) {
        fs.writeFileSync(this.filePath, content, { encoding: "utf-8" });
        console.log("Content written to file: ".concat(this.filePath));
    };
    FileManager.prototype.readContent = function () {
        if (!fs.existsSync(this.filePath)) {
            throw new Error("File does not exist");
        }
        var content = fs.readFileSync(this.filePath, { encoding: "utf-8" });
        console.log("Content read from file: ".concat(content));
        return content;
    };
    return FileManager;
}());
// Usage example
var fileManager = new FileManager("data", "example.txt");
// Write content to file
fileManager.writeContent("Hello, this is a sample content.");
// Read and print content from file
var content = fileManager.readContent();
console.log("File content: ".concat(content));
