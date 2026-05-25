/**
 * generate-blueprint-docx.js
 * Converts FRAMEWORK-BLUEPRINT.md to a formatted Word document.
 * Usage: node scripts/generate-blueprint-docx.js
 * Output: FRAMEWORK-BLUEPRINT.docx
 */

const fs = require("fs");
const path = require("path");
const {
    Document,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    BorderStyle,
    AlignmentType,
    WidthType,
    ShadingType,
    Packer,
    ExternalHyperlink,
    convertInchesToTwip,
    LevelFormat,
    NumberingLevel,
    AbstractNumbering,
    Numbering,
} = require("docx");

// ─── Colour constants ─────────────────────────────────────────────────────────
const BLUE_HEADING = "1F3864"; // dark navy for H1
const MID_BLUE = "2E5FA3"; // medium blue for H2
const TEAL = "2E75B6"; // teal for H3/H4
const CODE_BG = "F2F2F2"; // light grey for code blocks
const TABLE_HEADER_BG = "D9E2F3"; // light blue for table headers
const TABLE_ALT_BG = "EEF3FA"; // alternate row
const WHITE = "FFFFFF";
const DARK_TEXT = "1A1A1A";

// ─── Font helpers ─────────────────────────────────────────────────────────────
const BODY_FONT = "Calibri";
const CODE_FONT = "Courier New";
const BODY_SIZE = 22; // half-points (= 11pt)
const CODE_SIZE = 18; // 9pt

// ─── Paragraph styles ─────────────────────────────────────────────────────────
function heading1(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 160 },
        border: { bottom: { color: BLUE_HEADING, size: 6, style: BorderStyle.SINGLE } },
        children: [
            new TextRun({
                text,
                bold: true,
                color: BLUE_HEADING,
                size: 36,
                font: BODY_FONT,
            }),
        ],
    });
}

function heading2(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 320, after: 120 },
        children: [
            new TextRun({
                text,
                bold: true,
                color: MID_BLUE,
                size: 28,
                font: BODY_FONT,
            }),
        ],
    });
}

function heading3(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 240, after: 80 },
        children: [
            new TextRun({
                text,
                bold: true,
                color: TEAL,
                size: 24,
                font: BODY_FONT,
            }),
        ],
    });
}

function heading4(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_4,
        spacing: { before: 160, after: 60 },
        children: [
            new TextRun({
                text,
                bold: true,
                color: TEAL,
                size: 22,
                font: BODY_FONT,
            }),
        ],
    });
}

function bodyPara(runs, opts = {}) {
    return new Paragraph({
        spacing: { before: 60, after: 80 },
        indent: opts.indent ? { left: convertInchesToTwip(opts.indent) } : undefined,
        children: runs,
    });
}

function codePara(text) {
    return new Paragraph({
        spacing: { before: 40, after: 40 },
        shading: { type: ShadingType.CLEAR, fill: CODE_BG },
        indent: { left: convertInchesToTwip(0.3), right: convertInchesToTwip(0.3) },
        border: {
            left: { color: "999999", size: 12, style: BorderStyle.SINGLE },
        },
        children: [
            new TextRun({
                text,
                font: CODE_FONT,
                size: CODE_SIZE,
                color: "333333",
            }),
        ],
    });
}

function bulletPara(text, level = 0) {
    const indent = 0.4 + level * 0.3;
    return new Paragraph({
        spacing: { before: 40, after: 40 },
        indent: { left: convertInchesToTwip(indent), hanging: convertInchesToTwip(0.2) },
        children: [
            new TextRun({ text: "• ", font: BODY_FONT, size: BODY_SIZE, bold: true }),
            new TextRun({ text, font: BODY_FONT, size: BODY_SIZE, color: DARK_TEXT }),
        ],
    });
}

function makeTextRuns(inlineText) {
    // Handle **bold** and `code` inline markers
    const runs = [];
    const parts = inlineText.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    for (const part of parts) {
        if (part.startsWith("**") && part.endsWith("**")) {
            runs.push(new TextRun({ text: part.slice(2, -2), bold: true, font: BODY_FONT, size: BODY_SIZE, color: DARK_TEXT }));
        } else if (part.startsWith("`") && part.endsWith("`")) {
            runs.push(new TextRun({ text: part.slice(1, -1), font: CODE_FONT, size: CODE_SIZE, shading: { type: ShadingType.CLEAR, fill: CODE_BG }, color: "333333" }));
        } else if (part.length > 0) {
            runs.push(new TextRun({ text: part, font: BODY_FONT, size: BODY_SIZE, color: DARK_TEXT }));
        }
    }
    return runs;
}

// ─── Table builder ─────────────────────────────────────────────────────────────
function makeTable(headerRow, dataRows) {
    function cell(text, isHeader = false, isAlt = false) {
        const fill = isHeader ? TABLE_HEADER_BG : isAlt ? TABLE_ALT_BG : WHITE;
        return new TableCell({
            shading: { type: ShadingType.CLEAR, fill },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            borders: {
                top: { color: "AAAAAA", size: 4, style: BorderStyle.SINGLE },
                bottom: { color: "AAAAAA", size: 4, style: BorderStyle.SINGLE },
                left: { color: "AAAAAA", size: 4, style: BorderStyle.SINGLE },
                right: { color: "AAAAAA", size: 4, style: BorderStyle.SINGLE },
            },
            children: [
                new Paragraph({
                    spacing: { before: 0, after: 0 },
                    children: [
                        new TextRun({
                            text: text.trim(),
                            bold: isHeader,
                            font: isHeader ? BODY_FONT : CODE_FONT.includes("Courier") ? BODY_FONT : BODY_FONT,
                            size: BODY_SIZE,
                            color: DARK_TEXT,
                        }),
                    ],
                }),
            ],
        });
    }

    const rows = [
        new TableRow({
            tableHeader: true,
            children: headerRow.map((h) => cell(h, true)),
        }),
        ...dataRows.map((row, i) =>
            new TableRow({
                children: row.map((c) => cell(c, false, i % 2 === 1)),
            })
        ),
    ];

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        margins: { top: 120, bottom: 200 },
        rows,
    });
}

// ─── Markdown parser ──────────────────────────────────────────────────────────
function parseMarkdown(md) {
    const elements = [];
    const lines = md.split("\n");
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // H1
        if (/^# /.test(line)) {
            elements.push(heading1(line.replace(/^# /, "").trim()));
            i++;
            continue;
        }
        // H2
        if (/^## /.test(line)) {
            elements.push(heading2(line.replace(/^## /, "").trim()));
            i++;
            continue;
        }
        // H3
        if (/^### /.test(line)) {
            elements.push(heading3(line.replace(/^### /, "").trim()));
            i++;
            continue;
        }
        // H4
        if (/^#### /.test(line)) {
            elements.push(heading4(line.replace(/^#### /, "").trim()));
            i++;
            continue;
        }

        // Horizontal rule
        if (/^---+$/.test(line.trim())) {
            elements.push(new Paragraph({
                border: { bottom: { color: "CCCCCC", size: 4, style: BorderStyle.SINGLE } },
                spacing: { before: 200, after: 200 },
                children: [],
            }));
            i++;
            continue;
        }

        // Code block
        if (/^```/.test(line)) {
            const codeLines = [];
            i++; // skip opening ```
            while (i < lines.length && !/^```/.test(lines[i])) {
                codeLines.push(lines[i]);
                i++;
            }
            i++; // skip closing ```
            if (codeLines.length > 0) {
                for (const cl of codeLines) {
                    elements.push(codePara(cl || " "));
                }
                elements.push(new Paragraph({ spacing: { before: 0, after: 60 }, children: [] }));
            }
            continue;
        }

        // Table
        if (/^\|/.test(line)) {
            const tableLines = [];
            while (i < lines.length && /^\|/.test(lines[i])) {
                tableLines.push(lines[i]);
                i++;
            }
            if (tableLines.length >= 2) {
                const headerCells = tableLines[0]
                    .split("|")
                    .slice(1, -1)
                    .map((c) => c.trim());
                const dataLinesRaw = tableLines.slice(2); // skip separator
                const dataRows = dataLinesRaw.map((row) =>
                    row
                        .split("|")
                        .slice(1, -1)
                        .map((c) => c.trim())
                );
                // Filter out rows that are just dashes (separator leakage)
                const cleanData = dataRows.filter(
                    (row) => !row.every((c) => /^[-: ]+$/.test(c))
                );
                elements.push(makeTable(headerCells, cleanData));
                elements.push(new Paragraph({ spacing: { before: 0, after: 120 }, children: [] }));
            }
            continue;
        }

        // Bullet / list
        if (/^(\s*)[-*] /.test(line)) {
            const match = line.match(/^(\s*)[-*] (.*)/);
            const level = Math.floor((match[1] || "").length / 2);
            const text = match[2].replace(/\*\*/g, ""); // strip bold markers for bullets
            elements.push(bulletPara(text, level));
            i++;
            continue;
        }

        // Numbered list
        if (/^\d+\. /.test(line)) {
            const text = line.replace(/^\d+\. /, "").replace(/\*\*/g, "");
            elements.push(bulletPara(text, 0));
            i++;
            continue;
        }

        // Blank line
        if (line.trim() === "") {
            i++;
            continue;
        }

        // Blockquote (> Warning)
        if (/^> /.test(line)) {
            const text = line.replace(/^> /, "");
            elements.push(new Paragraph({
                spacing: { before: 80, after: 80 },
                shading: { type: ShadingType.CLEAR, fill: "FFF9E6" },
                border: { left: { color: "F0AD4E", size: 16, style: BorderStyle.SINGLE } },
                indent: { left: convertInchesToTwip(0.3) },
                children: makeTextRuns(text.replace(/^⚠️\s*/, "⚠️  ")),
            }));
            i++;
            continue;
        }

        // Regular paragraph (including inline code/bold)
        if (line.trim()) {
            elements.push(bodyPara(makeTextRuns(line.trim())));
        }
        i++;
    }

    return elements;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    const blueprintPath = path.join(process.cwd(), "FRAMEWORK-BLUEPRINT.md");
    const outputPath = path.join(process.cwd(), "FRAMEWORK-BLUEPRINT.docx");

    if (!fs.existsSync(blueprintPath)) {
        console.error("ERROR: FRAMEWORK-BLUEPRINT.md not found in", process.cwd());
        process.exit(1);
    }

    const md = fs.readFileSync(blueprintPath, "utf-8");
    console.log("Parsing FRAMEWORK-BLUEPRINT.md...");
    const elements = parseMarkdown(md);
    console.log(`  → ${elements.length} document elements generated`);

    const doc = new Document({
        creator: "Playwright SIMS Finance Framework",
        title: "SIMS Finance — Playwright Automation Framework Blueprint",
        description: "Architecture, design decisions, and recreation guide for the Playwright SIMS Finance test automation framework.",
        styles: {
            default: {
                document: {
                    run: {
                        font: BODY_FONT,
                        size: BODY_SIZE,
                        color: DARK_TEXT,
                    },
                },
            },
        },
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: convertInchesToTwip(1),
                            right: convertInchesToTwip(1),
                            bottom: convertInchesToTwip(1),
                            left: convertInchesToTwip(1.2),
                        },
                    },
                },
                children: [
                    // Cover page area
                    new Paragraph({ spacing: { before: 1200, after: 200 }, children: [] }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 0, after: 200 },
                        children: [
                            new TextRun({
                                text: "SIMS Finance",
                                bold: true,
                                size: 52,
                                color: BLUE_HEADING,
                                font: BODY_FONT,
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 0, after: 100 },
                        children: [
                            new TextRun({
                                text: "Playwright Automation Framework Blueprint",
                                size: 36,
                                color: MID_BLUE,
                                font: BODY_FONT,
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 0, after: 800 },
                        children: [
                            new TextRun({
                                text: `Generated: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
                                size: 22,
                                color: "666666",
                                font: BODY_FONT,
                            }),
                        ],
                    }),
                    new Paragraph({
                        border: { bottom: { color: BLUE_HEADING, size: 8, style: BorderStyle.SINGLE } },
                        spacing: { before: 0, after: 600 },
                        children: [],
                    }),
                    // Blueprint content
                    ...elements,
                ],
            },
        ],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
    console.log(`\n✅  Word document generated: ${outputPath}`);
    console.log(`   Size: ${(buffer.length / 1024).toFixed(0)} KB`);
}

main().catch((err) => {
    console.error("ERROR generating docx:", err.message);
    process.exit(1);
});
