import BasePage from "./BasePage";
import elementAttributes from "../data/elementAttributes.json";
import expectedTexts from "../data/expectedTexts.json";
import { expect, Page } from "@playwright/test";
import FileUtils from "../utils/FileUtils";
import path from "path";
// <reference lib="dom"/>

/**
 * @author: @pruthvirajqa2dev
 * This page class is for RSS310Q screen related page elements and actions on them
 */
export default class RSS310Q extends BasePage {
    //Locators and Texts
    private readonly pageHeadingText = "RSS310Q - Purchase Orders";
    private readonly searchBtnLocator = "#search_button";
    _okBtnLocator: string = "#ok";
    private readonly fileTitleLocator = "#file_title";
    private readonly fileNameLocator = "#filename";
    private readonly uploadAttachmentBtnLocator = "#esr_attach_button";
    private readonly documentTitleColoumn = "[axes='DOCUMENT_TITLE']";
    private readonly fileExtColoumn = "[axes='FILE_EXT']";
    private readonly savedDateColoumn = "[axes='SAVED_DATE']";
    _closeBtnLocator = "#esr_close_button";
    // [axes="DOCUMENT_TITLE"]
    //Actions
    /**
     * @author: @pruthvirajqa2dev
     * This methods verifies key page elements are visible after loading
     */
    async expectPageElementsVisibilityOnLoad() {
        //Page Heading
        await expect(
            this.isHeadingVisibleByText(this.pageHeadingText)
        ).toBeTruthy();
    }
    /**
     *
     */
    async clickSearchBtn() {
        await this.click(this.searchBtnLocator);
    }
    /**
     *
     * @returns
     */
    async clickRandomViewButton(): Promise<number> {
        if (await this.page.locator(this.downArrowLocator).isVisible()) {
            await this.page
                .locator(this.sortableGridLocator)
                .locator("..")
                .filter({ hasText: expectedTexts.expectedOrderNumberText })
                .dblclick();
        }
        const random = Math.floor(Math.random() * 9) + 1;
        console.log("Random number is: " + random);
        await this.page
            .locator(this.btnElementListLocator)
            .filter({ hasText: "View" })
            .nth(random - 1)
            .click();
        return random;
    }
    /**
     *
     * @param random
     */
    async verifyBreadcrumbs(random: number) {
        const paddedString = random.toString().padStart(9, "0");
        console.log("paddedString:" + paddedString);
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
            expectedTexts.expectedHeaderDetailsText + " (" + paddedString + ")"
        );
    }
    /**
     *
     * @returns
     */
    async uploadAttachment() {
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
