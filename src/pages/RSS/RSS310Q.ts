import BasePage from "../BasePage";
import expectedTexts from "../../data/expectedTexts.json";
import labels from "../../data/labels.json";
import roles from "../../data/roles.json";
import elementAttr from "../../data/elementAttributes.json";
import { expect } from "@playwright/test";
import FileUtils from "../../utils/FileUtils";
import path from "path";
import * as XLSX from "xlsx";
import {
    getRandomAmount,
    getRandomIntegerAmount,
    VAT_CODES
} from "../../utils/models/Purchase Orders/dataGenerator";
import {
    getLedgerOptions,
    getFundOptions
} from "../../utils/GL Code Helper/glCodehelper";
import { ExcelHandler, SheetData } from "../../utils/Excel/ExcelHandler";

/**
 * @author: @pruthvirajqa2dev
 * This page class is for RSS310Q screen related page elements and actions on them
 */
/**
 * Represents the RSS310Q page object model.
 * This class provides methods to interact with and verify elements on the RSS310Q - Purchase Orders page.
 *
 * @extends BasePage
 *
 * @remarks
 * This class includes methods to:
 * - Verify the visibility of key page elements upon loading.
 * - Click a random "View" button after ensuring the order number column is sorted in ascending order.
 * - Verify breadcrumbs based on a randomly selected order number.
 * - Upload an attachment and verify its details.
 * - Verify uploaded attachments on the attachments dialog.
 * - Click the "OK" button on the attachment details dialog.
 * - Click the "Close" button on the attachments dialog.
 *
 * @example
 * ```typescript
 * const rss310QPage = new RSS310Q();
 * await rss310QPage.expectPageElementsVisibilityOnLoad();
 * const [orderNumbers, randomIndex] = await rss310QPage.clickRandomViewButton();
 * await rss310QPage.verifyBreadcrumbs([orderNumbers, randomIndex]);
 * const uploadedFileName = await rss310QPage.uploadAttachment();
 * await rss310QPage.verifyAttachmentDetails(uploadedFileName);
 * await rss310QPage.clickOkOnAttachementDetails();
 * await rss310QPage.verifyUploadedAttachmentsOnAttachmentsDialog(uploadedFileName);
 * await rss310QPage.clickCloseBtn();
 * ```
 *
 * @author Pruthviraj Pardeshi
 */
export default class RSS310Q extends BasePage {
    //Locators and Texts
    private readonly pageHeadingText = "RSS310Q - Purchase Orders";
    private readonly orderNoColumnHeaderLocator = "th[id=ORD_NO]";
    private readonly orderNoColumnValuesLocator = "td[axes*='ORD_NO']";
    private readonly upSortIconLocator = "fa-sort-amount-up";
    private readonly downSortIconLocator = "fa-sort-amount-down";

    _okBtnLocator: string = "#ok";
    private readonly fileTitleLocator = "#file_title";
    private readonly fileNameLocator = "#filename";
    private readonly uploadAttachmentBtnLocator = "#esr_attach_button";
    private readonly documentTitleColoumn = "[axes='DOCUMENT_TITLE']";
    private readonly fileExtColoumn = "[axes='FILE_EXT']";
    private readonly savedDateColoumn = "[axes='SAVED_DATE']";
    _closeBtnLocator = "#esr_close_button";
    private readonly costCentreLookupIconLocator = "img#c1_part_code_lookup";
    private readonly costCentreCodeColumnLocator = "[axes='C1_PART_CODE']";
    private readonly selectButtonLocator = "button[aria-label='Select code']";
    private readonly _descrColumnLocator = "[axes='DESCR']";
    public get descrColumnLocator() {
        return this._descrColumnLocator;
    }

    private readonly _fundCodeColumnLocator = "[axes='E2_PART_CODE']";
    public get fundCodeColumnLocator() {
        return this._fundCodeColumnLocator;
    }
    private readonly _ledgerCodeColumnLocator = "[axes='E1_PART_CODE']";
    public get ledgerCodeColumnLocator() {
        return this._ledgerCodeColumnLocator;
    }
    private readonly nextPageButtonLocator =
        "*[data-uid$=glcodepartlookup_GL_CODE_PART_GRID_next]";
    private readonly _costCentreInputLocator = "#c1_part_code";
    public get costCentreInputLocator() {
        return this._costCentreInputLocator;
    }
    private readonly _ledgerCodeInputLocator = "#e1_part_code";
    public get ledgerCodeInputLocator() {
        return this._ledgerCodeInputLocator;
    }
    private readonly _ledgerCodeDescriptionInputLocator =
        "[for='e1_part_code'][type='descr']";
    public get ledgerCodeDescriptionInputLocator() {
        return this._ledgerCodeDescriptionInputLocator;
    }
    private readonly _fundCodeInputLocator = "#e2_part_code";
    public get fundCodeInputLocator() {
        return this._fundCodeInputLocator;
    }
    private readonly _fundCodeDescriptionInputLocator =
        "[for='e2_part_code'][type='descr']";
    public get fundCodeDescriptionInputLocator() {
        return this._fundCodeDescriptionInputLocator;
    }
    private readonly _ledgerCodeLookupIconLocator = "#e1_part_code_lookup";
    public get ledgerCodeLookupIconLocator() {
        return this._ledgerCodeLookupIconLocator;
    }
    private readonly _fundCodeLookupIconLocator = "#e2_part_code_lookup";
    public get fundCodeLookupIconLocator() {
        return this._fundCodeLookupIconLocator;
    }

    private readonly purchaseOrderNumberLocator =
        "label[data-alias='ORDER_NO_0']";
    private readonly closeBtnOnDialogLocator = "button[title='Close']";
    private readonly vatCodeLocator = "#vat_code";
    // private readonly costCentreCodeLocator =""

    //Actions
    /**
     * @author: @pruthvirajqa2dev
     * This methods verifies key page elements are visible after loading
     */
    async expectPageElementsVisibilityOnLoad() {
        //Page Heading
        expect(this.isHeadingVisibleByText(this.pageHeadingText)).toBeTruthy();
    }

    /**
     *
     * @returns
     */
    async clickRandomViewButton(): Promise<[string[], number]> {
        var orderNoColumnHeader = this.page.locator(
            this.orderNoColumnHeaderLocator
        );
        // Function to check if the column is sorted in ascending order
        var isAscending = async (): Promise<boolean> => {
            var sortIcon = this.page.locator(this.sortIconLocator).first();
            const iconClass =
                (await sortIcon.getAttribute(elementAttr.classAttr))?.trim() ||
                "";
            return iconClass?.includes(this.upSortIconLocator) ?? false;
        };
        // Function to check if the column is sorted in descending order
        var isDescending = async (): Promise<boolean> => {
            var sortIcon = this.page.locator(this.sortIconLocator).first();
            const iconClass =
                (await sortIcon.getAttribute(elementAttr.classAttr))?.trim() ||
                "";
            return iconClass?.includes(this.downSortIconLocator) ?? false;
        };
        // Ensure the column is sorted in ascending order
        if (!(await isAscending())) {
            await orderNoColumnHeader.click({ force: true }); // First click
            await this.page.waitForTimeout(3000);
            if (await isDescending()) {
                await orderNoColumnHeader.click({ force: true }); // Second click if initially sorted descending
                await this.page.waitForTimeout(3000);
            }
        }
        // Verify the column is now sorted in ascending order
        expect(await isAscending()).toBeTruthy();
        // Perform your next action
        console.log(
            "Column is sorted in ascending order. Proceeding with next steps..."
        );
        const random = Math.floor(Math.random() * 9);
        console.log("Random index is: " + random);
        const orderNumberValue: string[] = await this.page
            .locator(this.orderNoColumnValuesLocator)
            .allTextContents();
        await this.page
            .locator(this.btnElementListLocator)
            .filter({ hasText: labels.viewLbl })
            .nth(random)
            .click();
        return [orderNumberValue, random];
    }
    /**
     *
     * @param random
     */
    async verifyBreadcrumbs(random: [string[], number]) {
        const paddedString = random[0][random[1]].toString().padStart(9, "0");
        console.log("paddedString:" + paddedString.trim());
        const breadcrumbs = await this.page
            .locator(this.breadcrumbLocator)
            .allTextContents();

        expect(breadcrumbs).toContainEqual(
            expectedTexts.expectedSearchCriteriaText
        );
        expect(breadcrumbs).toContainEqual(
            expectedTexts.expectedHeaderResultsText
        );
        expect(breadcrumbs).toContainEqual(
            expectedTexts.expectedHeaderDetailsText +
                " (" +
                paddedString.trim() +
                ")"
        );
    }
    /**
     *
     * @returns
     */
    async uploadAttachment(): Promise<string> {
        //CLick attachments icon
        await this.click(this.attachmentBtnLocator);
        //Verify dialog
        await this.checkIfDialogExistsWithTitle(
            expectedTexts.exepctedAttachmentsDialogText
        );
        //Click add file
        await this.page
            .locator(this.multiBtnLocator)
            .filter({ hasText: expectedTexts.addFileText })
            .click();
        const ext = ".DOCX";
        const dirAndFileNameWithExt: string | null =
            await FileUtils.fsWriteFile(ext);

        // Start waiting for file chooser before clicking. Note no await.
        const fileChooserPromise = this.page.waitForEvent("filechooser");
        //await this.clickButtonUsingRole(this.browseForFileLocator);
        await this.page
            .locator(this.commonDhxBtnLocator)
            .filter({ hasText: labels.browseForAFileLbl })
            .dblclick();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(
            path.join(process.cwd() + "/" + dirAndFileNameWithExt!)
        );
        console.log("dirAndFileNameWithExt=" + dirAndFileNameWithExt);
        var fileNameWithExt: string = dirAndFileNameWithExt!.split("/")[1];
        console.log("fileNameWithExt=" + fileNameWithExt);
        await expect(
            this.page.locator(this.fileNameAfterUploadLocator)
        ).toContainText(fileNameWithExt);
        await this.expectElementToBeVisibleUsingLocator(
            this.successMarkLocator
        );
        await this.click(this._okBtnLocator);
        return fileNameWithExt;
    }
    /**
     *
     * @param uploadedFileName
     */
    async verifyAttachmentDetails(uploadedFileName: string) {
        //Verify dialog
        await this.checkIfDialogExistsWithTitle(
            expectedTexts.exepctedAttachmentDetailsDialogText
        );
        const splitFileName = uploadedFileName.split(".");

        //Assert filename
        await this.expectElementToHaveValue(
            this.fileTitleLocator,
            splitFileName[0]
        );
        await this.expectElementToContainText(
            this.fileNameLocator,
            uploadedFileName
        );
    }
    /**
     *
     */
    async clickOkOnAttachementDetails() {
        await this.click(this.uploadAttachmentBtnLocator);
    }
    /**
     *
     * @param uploadedFileName
     */
    async verifyUploadedAttachmentsOnAttachmentsDialog(
        uploadedFileName: string
    ) {
        const splitFileName = uploadedFileName.split(".");
        //Verify dialog
        await this.checkIfDialogExistsWithTitle(
            expectedTexts.exepctedAttachmentsDialogText
        );

        await this.page
            .locator(this.sortableGridLocator)
            .locator("..")
            .filter({ hasText: expectedTexts.savedDateText })
            .dblclick();

        await expect(
            this.page
                .locator(this.documentTitleColoumn)
                .filter({ hasText: splitFileName[0] })
        ).toBeVisible();
        const extension = await this.page
            .locator(this.fileExtColoumn)
            .first()
            .textContent();
        expect(extension).toContain(splitFileName[1].toLowerCase());
        const savedDate = await this.page
            .locator(this.savedDateColoumn)
            .first()
            .textContent();
        expect(savedDate).toContain(new Date().toLocaleDateString("en-GB"));
    }
    /**
     *
     */
    async clickCloseBtn() {
        await this.click(this._closeBtnLocator);
    }
    async clickNewMultiBtn() {
        await this.clickEsrMultiBtnUsingText(labels.newlbl);
    }
    async enterSupplierId(supplierId: string) {
        await (
            await this.getByRole(roles.textboxRole, {
                name: labels.supplierLbl,
                exact: true
            })
        ).fill(supplierId);
        await (await this.getByHeading(labels.headerDetailsLbl)).click();
    }

    async clickNewLineBtn() {
        await (
            await this.getByRole(roles.btnRole, { name: labels.newlbl })
        ).scrollIntoViewIfNeeded();
        await (
            await this.getByRole(roles.btnRole, { name: labels.newlbl })
        ).click();
    }
    async clickCloseBtnOnDialog() {
        await this.click(this.closeBtnOnDialogLocator);
    }
    async enterLineDetails() {
        await this.clickFreeFormatBtn();
        await (
            await this.getByLabel(labels.descriptionLbl, { exact: true })
        ).fill(expectedTexts.expectedDescription);
        await (
            await this.getByLabel(labels.quantityLbl, { exact: true })
        ).fill("1");
        const randomAmt = await getRandomAmount(100, 999);
        const randomIndex = await getRandomIntegerAmount(0, 4);
        console.log("Entering amount in Unit price:" + randomAmt);
        console.log("Index for vatcode:" + randomIndex);
        await (
            await this.getByLabel(labels.unitPriceLbl, { exact: true })
        ).fill(randomAmt.toString());
        await (
            await this.getByLocator(this.vatCodeLocator)
        ).selectOption(VAT_CODES[randomIndex]);
        const excelHandler = new ExcelHandler(
            expectedTexts.glCodeExcelWorkBookNameRead
        );
        const sheetData = excelHandler.readSheet(
            expectedTexts.glCodeExcelSheetNameRead
        );
        console.log("sheetdata:" + sheetData);
        const randomRow: Record<string, any> | null =
            excelHandler.getRandomRowAsObject(sheetData);
        console.log(
            "Random costCentreCodeHeader:" +
                randomRow?.[expectedTexts.costCentreCodeHeader]
        );
        console.log(
            "Random ledgerCodeHeader:" +
                randomRow?.[expectedTexts.ledgerCodeHeader]
        );
        console.log(
            "Random fundCodeHeader:" + randomRow?.[expectedTexts.fundCodeHeader]
        );
        await (
            await this.getByLabel(labels.costCentreLbl, { exact: true })
        ).fill(randomRow?.[expectedTexts.costCentreCodeHeader]);
        await (
            await this.getByRole(roles.headingRole, {
                name: labels.productDetailsLbl
            })
        ).click();
        await (
            await this.getByLabel(labels.ledgerLbl, { exact: true })
        ).fill(randomRow?.[expectedTexts.ledgerCodeHeader]);
        await (
            await this.getByRole(roles.headingRole, {
                name: labels.productDetailsLbl
            })
        ).click();
        await this.page.keyboard.press("Tab");
        await (
            await this.getByLabel(labels.fundCodeLbl, { exact: true })
        ).fill(randomRow?.[expectedTexts.fundCodeHeader]);
        await (
            await this.getByRole(roles.headingRole, {
                name: labels.productDetailsLbl
            })
        ).click();
        await (
            await this.getByRole(roles.btnRole, {
                name: labels.saveLbl,
                exact: true
            })
        ).click();
        return randomRow;
    }
    async clickFreeFormatBtn() {
        await (await this.getByText(labels.freeFormatLbl)).click();
    }
    async verifyLineDetails(enteredRow: Record<string, any> | null) {
        await expect(
            await this.getByLabel(expectedTexts.expectedGLCodeLabel, {
                exact: true
            })
        ).toContainText(enteredRow?.[expectedTexts.costCentreCodeHeader]);
        await expect(
            await this.getByLabel(expectedTexts.expectedGLCodeLabel, {
                exact: true
            })
        ).toContainText(enteredRow?.[expectedTexts.ledgerCodeHeader]);
        await expect(
            await this.getByLabel(expectedTexts.expectedGLCodeLabel, {
                exact: true
            })
        ).toContainText(enteredRow?.[expectedTexts.fundCodeHeader]);
    }
    async extractGLCode() {
        await this.extractCostCentre();
    }
    async extractCostCentre() {
        await this.click(this.costCentreLookupIconLocator);
        await this.checkIfDialogExistsWithTitle(
            expectedTexts.expectedCostCentreDialogTitle
        );

        const glCodeRows: string[][] = [
            [
                "Cost Centre Code",
                "Cost Centre Description",
                "Ledger Code",
                "Ledger Description",
                "Fund Code",
                "Fund Description"
            ]
        ];
        const pageCount = 1;
        for (let i = 0; i < pageCount; i++) {
            const costCenterCode = await this.extractTableColumnForExcel(
                this.costCentreCodeColumnLocator
            );
            const costCenterDescr = await this.extractTableColumnForExcel(
                this.descrColumnLocator
            );
            const costCenterCodes = costCenterCode.map((row) => row[0]);
            const costCenterDescrs = costCenterDescr.map((row) => row[0]);
            for (let i = 0; i < costCenterCode.length; i++) {
                if (i != 0) await this.click(this.costCentreLookupIconLocator);
                await (await this.getByLocator(this.selectButtonLocator))
                    .nth(i)
                    .click();

                const ledgerCodeOption = await getLedgerOptions(this.page);
                console.log("Got the ledger Code list");
                var ledgerCount = 0;
                for (const ledger of ledgerCodeOption) {
                    console.log("Attempt " + ledgerCount);
                    if (ledgerCount != 0) {
                        await this.page.waitForLoadState();
                        await this.click(this.ledgerCodeLookupIconLocator);
                    }
                    await (await this.getByLocator(this.selectButtonLocator))
                        .nth(ledgerCount++)
                        .click();
                    const fundCodeOptions = await getFundOptions(this.page);
                    var fundCount = 0;
                    for (const fund of fundCodeOptions) {
                        await (
                            await this.getByLocator(this.selectButtonLocator)
                        )
                            .nth(fundCount++)
                            .click();
                        glCodeRows.push([
                            costCenterCodes[i],
                            costCenterDescrs[i],
                            ledger.code,
                            ledger.description,
                            fund.code,
                            fund.description
                        ]);
                    }
                }
            }

            // const isLastPage = i === 5;
            // if (!isLastPage) {
            //     await this.click(this.nextPageButtonLocator);
            // }
        }
        console.log(glCodeRows);
        // Create worksheet and workbook
        const worksheet = XLSX.utils.aoa_to_sheet(glCodeRows);
        const workbook = XLSX.utils.book_new();
        const today = new Date();
        const formattedDate = today.toISOString().split("T")[0];
        XLSX.utils.book_append_sheet(workbook, worksheet, formattedDate);

        // Write to file
        XLSX.writeFile(workbook, expectedTexts.glCodeExcelWorkBookNameWrite);
    }
    async extractTableColumnForExcel(
        columnLocator: string
    ): Promise<string[][]> {
        let data = await (
            await this.getByLocator(columnLocator)
        ).allTextContents();
        const cleanedData = data.map((text) => text.trim());
        console.log(cleanedData);

        const dataToExcel = cleanedData.map((data) => [data]);

        return dataToExcel;
    }
    async extractCostCentreCode() {
        let codes = await (
            await this.getByLocator(this.costCentreCodeColumnLocator)
        ).allTextContents();
        const cleanedCodes = codes.map((text) => text.trim());
        console.log(cleanedCodes);

        const dataToExcel = cleanedCodes.map((code) => [code]);
        dataToExcel.unshift(["Cost Centre Code"]);
        return dataToExcel;
    }
    async extractCostCentreDescription() {
        let descr = await (
            await this.getByLocator(this.descrColumnLocator)
        ).allTextContents();
        const cleanedDescr = descr.map((text) => text.trim());
        console.log(cleanedDescr);

        const dataToExcel = cleanedDescr.map((code) => [code]);
        dataToExcel.unshift(["Description"]);
        return dataToExcel;
    }
    async clickSummaryBtn() {
        await this.clickButtonUsingRole(this.summaryBtnLabel);
    }
    async enterEmailAddress(emailAddress: string) {
        await (
            await this.getByLabel(labels.emailAddressLbl, {
                exact: true
            })
        ).fill(emailAddress);
    }
    async clickCompleteOrderBtn() {
        await this.clickButtonUsingRole(labels.completeOrderLbl);
    }

    async getOrderNumber(): Promise<string | null> {
        return (
            await this.getByLocator(this.purchaseOrderNumberLocator)
        ).textContent();
    }
    async getExpectedSubject() {
        const orderNumber = await this.getOrderNumber();
        const staticText1 = expectedTexts.expectedStaticSubjectText1;
        const staticText2 = expectedTexts.expectedStaticSubjectText2;
        const expectedSubject =
            staticText1 +
            expectedTexts.expectedSchoolName +
            staticText2 +
            expectedTexts.expectedSchoolID +
            " / " +
            orderNumber;
        return expectedSubject;
    }
}
