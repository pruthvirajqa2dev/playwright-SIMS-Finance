import BasePage from "../BasePage";
import expectedTexts from "../../data/expectedTexts.json";
import { expect } from "@playwright/test";
import FileUtils from "../../utils/FileUtils";
import path from "path";
// <reference lib="dom"/>

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
        // Define the selector for the column header and its sort icon
        var orderNoColumnHeader = this.page.locator(
            this.orderNoColumnHeaderLocator
        );
        // Function to check if the column is sorted in ascending order
        var isAscending = async (): Promise<boolean> => {
            var sortIcon = this.page.locator(this.sortIconLocator).first();
            const iconClass =
                (await sortIcon.getAttribute("class"))?.trim() || "";
            return iconClass?.includes(this.upSortIconLocator) ?? false;
        };
        // Function to check if the column is sorted in descending order
        var isDescending = async (): Promise<boolean> => {
            var sortIcon = this.page.locator(this.sortIconLocator).first();
            const iconClass =
                (await sortIcon.getAttribute("class"))?.trim() || "";
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
            .filter({ hasText: "View" })
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
            .filter({ hasText: this.browseForFileLocator })
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
}
