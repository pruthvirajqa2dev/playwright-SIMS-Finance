import { expect } from "@playwright/test";
import BasePage from "./BasePage";
import path from "path";
import expectedTexts from "../data/expectedTexts.json";
import FileUtils from "../utils/FileUtils";
// <reference lib="dom"/>

/**
 * @author: @pruthvirajqa2dev
 * This page class is for SPC420 screen related page elements and actions on them
 */
/**
 * @class SPC420
 * @extends BasePage
 * @classdesc This class represents the SPC420 page and provides methods to interact with its elements and perform actions.
 *
 * @property {string} pageHeadingText - The text for the page heading.
 * @property {string} serverDirectoriesText - The text for the server directories heading.
 * @property {string} packageDetailsText - The text for the package details heading.
 * @property {string} direcotoryDetailsText - The text for the directory details heading.
 * @property {string} spc420TreeItemWithDynTextLocator - The locator for tree items with dynamic text.
 * @property {string} spc420SubTreeItemWithDynTextLocator - The locator for sub-tree items with dynamic text.
 * @property {string} _downArrowLocator - The locator for the down arrow icon.
 * @property {string} pkgDirLocator - The locator for the package directory.
 * @property {string} uploadFileBtnRoleName - The role name for the upload file button.
 * @property {string} uploadBtnLocator - The locator for the upload button.
 * @property {string} uploadFileText - The text for the upload file dialog.
 * @property {string} okBtnText - The text for the OK button.
 * @property {string} uploadedFileNameLocator - The locator for the uploaded file name.
 * @property {string} uploadedFileNameOnUFDialogLocator - The locator for the uploaded file name on the upload file dialog.
 * @property {string} fileNameOnUFDialogLocator - The locator for the file name on the upload file dialog.
 * @property {string} schoolIdOnUploadedFileDetailsTableLocator - The locator for the school ID on the uploaded file details table.
 * @property {string} fileNameOnUploadedFileDetailsTableLocator - The locator for the file name on the uploaded file details table.
 * @property {string} extOnUploadedFileDetailsTableLocator - The locator for the file extension on the uploaded file details table.
 * @property {string} viewDropdownOnTableLocator - The locator for the view dropdown on the table.
 *
 * @method expectPageElementsVisibilityOnLoad - Verifies that key page elements are visible after loading.
 * @method clickSubDirectoryInDirectory - Clicks the subdirectory in the given directory, if it is already open. Else it double clicks the directory and then clicks the subdirectory.
 * @param {string} dir - The directory name.
 * @param {string} subdir - The subdirectory name.
 *
 * @method verifySubDirectoryOpened - Verifies that the subdirectory is opened.
 * @param {string} dir - The directory name.
 * @param {string} subdir - The subdirectory name.
 *
 * @method uploadFile - Uploads a file using the fileChooser class in Playwright.
 * @returns {Promise<string>} - The directory and file name with extension.
 *
 * @method verifyUploadedFileDetailsOnTableRecord - Verifies the uploaded file details on the table record.
 * @param {string} createdDirAndFileNameWithExt - The created directory and file name with extension.
 *
 * @method deleteUploadedFile - Deletes the uploaded file.
 * @param {string} createdFileNameWithExt - The created file name with extension.
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
    _downArrowLocator = '.fa-angle-down[data-control_type="TREE_IMAGE"]';
    private readonly pkgDirLocator = '[data-alias="PACKAGE_DIR"]';
    private readonly uploadFileBtnRoleName = "Click to Upload File";
    private readonly uploadBtnLocator = "Upload";

    private readonly uploadFileText = "Upload File";
    private readonly okBtnText = "OK";
    private readonly uploadedFileNameLocator = ".dhx_list-item--name";
    private readonly uploadedFileNameOnUFDialogLocator = "#physical_file";
    private readonly fileNameOnUFDialogLocator = "#rep_name";
    private readonly schoolIdOnUploadedFileDetailsTableLocator =
        '[axes="COMPANY_ID"] > div';
    private readonly fileNameOnUploadedFileDetailsTableLocator =
        '[axes="REP_NAME"] > div';
    private readonly extOnUploadedFileDetailsTableLocator = '[axes="EXT"]>div';
    private readonly viewDropdownOnTableLocator = ".multibutton_content > a";
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
        expect(subDirLocator).toBeVisible;
        await subDirLocator.click();
    }
    /**
     *
     * @param dir
     * @param subdir
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
     * @returns
     */
    async uploadFile(): Promise<string> {
        await this.clickButtonUsingRole(this.uploadFileBtnRoleName);
        await this.expectElementToHaveText(
            this.dialogTitleLocator,
            this.uploadFileText
        );
        const ext = ".TXT";
        const dirAndFileNameWithExt: string | null =
            await FileUtils.fsWriteFile(ext);

        // Start waiting for file chooser before clicking. Note no await.
        const fileChooserPromise = this.page.waitForEvent("filechooser");
        await this.clickButtonUsingRole(this.uploadBtnLocator);
        await this.clickButtonUsingRole(this.browseForFileLocator);
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(
            path.join(process.cwd() + "/" + dirAndFileNameWithExt!)
        );
        console.log("dirAndFileNameWithExt=" + dirAndFileNameWithExt);
        var fileNameWithExt: string = dirAndFileNameWithExt!.split("/")[1];
        console.log("fileNameWithExt=" + fileNameWithExt);
        await expect(
            this.page.locator(this.uploadedFileNameLocator),
            "Check if uploaded file name is correct"
        ).toContainText(fileNameWithExt!);
        await expect(
            this.page.locator(this.successMarkLocator),
            "Checking if Success Mark (✔) is visible"
        ).toBeVisible();

        await this.clickButtonUsingRole(this.okBtnText);
        const fileName = fileNameWithExt!.split(".")[0].toUpperCase();
        console.log("fileName=" + fileName);
        await expect(
            this.page.locator(this.uploadedFileNameOnUFDialogLocator)
        ).toHaveValue(fileNameWithExt!.toUpperCase());
        await expect(
            this.page.locator(this.fileNameOnUFDialogLocator)
        ).toHaveValue(fileName!);
        return dirAndFileNameWithExt!;
    }
    /**
     *
     * @param createdDirAndFileNameWithExt
     */
    async verifyUploadedFileDetailsOnTableRecord(
        createdDirAndFileNameWithExt: string
    ) {
        await this.expectElementToHaveText(
            this.schoolIdOnUploadedFileDetailsTableLocator,
            expectedTexts.expectedSchoolID
        );
        console.log(
            "Created filename with extension:" + createdDirAndFileNameWithExt
        );
        var fileName = createdDirAndFileNameWithExt
            .split("/")[1]
            .split(".")[0]
            .toUpperCase();
        const fileExt = createdDirAndFileNameWithExt
            .split(".")[1]
            .toUpperCase();
        await this.expectElementToHaveText(
            this.fileNameOnUploadedFileDetailsTableLocator,
            fileName!.toUpperCase()
        );
        await this.expectElementToHaveText(
            this.extOnUploadedFileDetailsTableLocator,
            fileExt!.toUpperCase()
        );
    }
    /**
     *
     * @param createdFileNameWithExt
     */
    async deleteUploadedFile(createdFileNameWithExt: string) {
        await this.click(this.viewDropdownOnTableLocator);
        await (await this.getByRole("menuitem", { name: "Delete" })).click();
        await this.checkIfDialogExistsWithTitle(expectedTexts.deleteFileText);
        console.log(
            "Deleting filename with extension:" + createdFileNameWithExt
        );
        var fileName = createdFileNameWithExt
            .split("/")[1]
            .split(".")[0]
            .toUpperCase();
        console.log("fileName=" + fileName);
        await this.expectElementToContainText(
            this.esrPromptTextLocator,
            fileName!.toUpperCase()
        );
        await this.click(this.yesBtnLocator);
    }
}
