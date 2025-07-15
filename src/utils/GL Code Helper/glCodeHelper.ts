// lookupHelpers.ts
import RSS310Q from "../../pages/RSS/RSS310Q";
import expectedTexts from "../../data/expectedTexts.json";

export async function getLedgerOptions(
    page: any
): Promise<{ code: string; description: string }[]> {
    const rss310q = new RSS310Q(page, "");

    const autoLedgerCode = await page
        .locator(rss310q.ledgerCodeInputLocator)
        .textContent();
    const autoLedgerDesc = await page
        .locator(rss310q.ledgerCodeDescriptionInputLocator)
        .textContent();

    if (autoLedgerCode?.trim()) {
        return [
            {
                code: autoLedgerCode.trim(),
                description: autoLedgerDesc?.trim() || ""
            }
        ];
    }

    await rss310q.click(rss310q.ledgerCodeLookupIconLocator);
    await rss310q.checkIfDialogExistsWithTitle(
        expectedTexts.expectedLedgerLookupDialogTitle
    );

    const codeMatrix = await rss310q.extractTableColumnForExcel(
        rss310q.ledgerCodeColumnLocator
    );
    const descrMatrix = await rss310q.extractTableColumnForExcel(
        rss310q.descrColumnLocator
    );

    const codes = codeMatrix.map((row) => row[0]);
    const descriptions = descrMatrix.map((row) => row[0]);

    return codes.map((code, i) => ({
        code,
        description: descriptions[i] || ""
    }));
}

export async function getFundOptions(
    page: any
): Promise<{ code: string; description: string }[]> {
    const rss310q = new RSS310Q(page, "");

    const autoFundCode = await page
        .locator(rss310q.fundCodeInputLocator)
        .textContent();
    const autoFundDesc = await page
        .locator(rss310q.fundCodeDescriptionInputLocator)
        .textContent();

    if (autoFundCode?.trim()) {
        return [
            {
                code: autoFundCode.trim(),
                description: autoFundDesc?.trim() || ""
            }
        ];
    }

    await rss310q.click(rss310q.fundCodeLookupIconLocator);
    await rss310q.checkIfDialogExistsWithTitle(
        expectedTexts.expectedFundCodeLookup
    );

    const codeMatrix = await rss310q.extractTableColumnForExcel(
        rss310q.fundCodeColumnLocator
    );
    const descrMatrix = await rss310q.extractTableColumnForExcel(
        rss310q.descrColumnLocator
    );

    const codes = codeMatrix.map((row) => row[0]);
    const descriptions = descrMatrix.map((row) => row[0]);

    return codes.map((code, i) => ({
        code,
        description: descriptions[i] || ""
    }));
}
