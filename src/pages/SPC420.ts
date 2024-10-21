import { expect, Page } from "@playwright/test";
import HomePage from "./HomePage";
import BasePage from "./BasePage";
import * as fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import expectedTexts from "../data/expectedTexts.json";
// <reference lib="dom"/>

/**
 * @author: @pruthvirajqa2dev
 * This page class is for SPC420 screen related page elements and actions on them
 */
export default class SPC420 extends BasePage {
    //Locators and Texts
    private readonly pageHeadingText = "SPC420 - File Manager";
    private readonly serverDirectoriesText = "Server Directories";
    private readonly packageDetailsText = "Package Details";
    private readonly direcotoryDetailsText = "Directory Details";
    private readonly spc420TreeItemWithDynTextLocator = '.esr_tree>>text="%"';
    private readonly spc420SubTreeItemWithDynTextLocator =
        '.esr_tree_open>>text="%"';
    private readonly downArrowLocator =
        '.fa-angle-down[data-control_type="TREE_IMAGE"]';
    private readonly pkgDirLocator = '[data-alias="PACKAGE_DIR"]';
    private readonly uploadFileBtnRoleName = "Click to Upload File";
    private readonly uploadBtnLocator = "Upload";

    private readonly uploadFileText = "Upload File";
    private readonly browseForFileLocator = "Browse for a file";
    private readonly okBtnLocator = "OK";
    private readonly fileCreatedText = "File created";
    private readonly uploadedFileNameLocator = ".dhx_list-item--name";
    private readonly uploadedFileNameOnUFDialogLocator = "#physical_file";
    private readonly fileNameOnUFDialogLocator = "#rep_name";
    private readonly successMarkLocator = "*[class^=dhx_item--success-mark]";
    private readonly schoolIdOnUploadedFileDetailsTableLocator =
        '[axes="COMPANY_ID"] > div';
    private readonly fileNameOnUploadedFileDetailsTableLocator =
        '[axes="REP_NAME"] > div';
    private readonly extOnUploadedFileDetailsTableLocator = '[axes="EXT"]>div';
    //*[class^=dhx_item--success-mark]

    //Actions
    /**
     * @author: @pruthvirajqa2dev
     * This methods verifies key page elements are visible after loading
     */
    async expectPageElementsVisibilityOnLoad() {
        //Page Heading
        await this.isHeadingVisibleByText(this.pageHeadingText);
        //Server Directories heading
        await this.isHeadingVisibleByText(this.serverDirectoriesText);
        //Package details heading
        await this.isHeadingVisibleByText(this.packageDetailsText);
    }
    /**
     * @author: @pruthvirajqa2dev
     * This function clicks the subdirectory in the given directory, if it is already open.
     * Else it double clicks the directory and then clicks the subdirectory on screen spc420
     * @param dir
     * @param subdir
     */
    async clickSubDirectoryInDirectory(dir: string, subdir: string) {
        if (await this.page.locator(this.downArrowLocator).isVisible()) {
            const dirLocator = await this.page.locator(
                this.spc420TreeItemWithDynTextLocator.replace("%", dir)
            );
            await expect(dirLocator).toBeVisible();
        } else {
            await this.page
                .locator(
                    this.spc420TreeItemWithDynTextLocator.replace("%", dir)
                )
                .dblclick();
            const dirLocator = await this.page.locator(
                this.spc420TreeItemWithDynTextLocator.replace("%", dir)
            );
            await expect(dirLocator).toBeVisible();
        }
        const subDirLocator = await this.page.locator(
            this.spc420SubTreeItemWithDynTextLocator.replace("%", subdir)
        );
        await expect(subDirLocator).toBeVisible;
        await subDirLocator.click();
    }
    /**
     *
     */
    async verifySubDirectoryOpened(dir: string, subdir: string) {
        //Sub Directory Heading
        await this.isHeadingVisibleByText(this.direcotoryDetailsText);
        const pkgDirLocator = this.page.locator(this.pkgDirLocator);
        const packageName = dir.split(" ")[0] + "_" + subdir;
        await expect(pkgDirLocator).toContainText(packageName);
    }

    /**
     * Function to upload file using fileChooser class in Playwright
     */
    async uploadFile() {
        await this.clickButtonUsingRole(this.uploadFileBtnRoleName);
        await this.expectElementToHaveText(
            this.dialogTitleLocator,
            this.uploadFileText
        );
        const resolution = await this.fsWriteFile(".TXT");
        await expect(resolution).toBe(this.fileCreatedText);
        const newestFileName: string | null = this.getNewestFileNameInDir(
            this.testFileDir
        );
        // Start waiting for file chooser before clicking. Note no await.
        const fileChooserPromise = this.page.waitForEvent("filechooser");
        await this.clickButtonUsingRole(this.uploadBtnLocator);
        await this.clickButtonUsingRole(this.browseForFileLocator);
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(
            path.join(this.testFileDir + newestFileName!)
        );

        await expect(
            this.page.locator(this.uploadedFileNameLocator),
            "Check if uploaded file name is correct"
        ).toContainText(newestFileName!);
        await expect(
            this.page.locator(this.successMarkLocator),
            "Checking if Success Mark (✔) is visible"
        ).toBeVisible();
        await this.clickButtonUsingRole(this.okBtnLocator);
        const fileName = newestFileName?.split(".")[0].toUpperCase();
        const fileExt = newestFileName?.split(".")[1].toUpperCase();

        await expect(
            this.page.locator(this.uploadedFileNameOnUFDialogLocator)
        ).toHaveValue(newestFileName!.toUpperCase());
        await expect(
            this.page.locator(this.fileNameOnUFDialogLocator)
        ).toHaveValue(fileName!);
    }
    async verifyUploadedFileDetailsOnTableRecord() {
        await this.expectElementToHaveText(
            this.schoolIdOnUploadedFileDetailsTableLocator,
            expectedTexts.expectedSchoolID
        );
        const newestFileName: string | null = this.getNewestFileNameInDir(
            this.testFileDir
        );
        const fileName = newestFileName?.split(".")[0].toUpperCase();
        const fileExt = newestFileName?.split(".")[1].toUpperCase();
        await this.expectElementToHaveText(
            this.fileNameOnUploadedFileDetailsTableLocator,
            fileName!.toUpperCase()
        );
        await this.expectElementToHaveText(
            this.extOnUploadedFileDetailsTableLocator,
            fileExt!.toUpperCase()
        );
        //fileNameOnUploadedFileDetailsTableLocator
    }
}
