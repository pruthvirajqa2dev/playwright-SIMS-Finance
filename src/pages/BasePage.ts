import test, { expect, Locator, Page } from "@playwright/test";
import { error } from "console";
import * as fs from "fs";
import expectedTexts from "../data/expectedTexts.json";
import * as path from "path";
/**
 * @author: @pruthvirajqa2dev
 * Base page class to inherit basic page functionality
 */
export default abstract class BasePage {
    protected page: Page;
    //Constructor
    constructor(page: Page, testInfo) {
        this.page = page;
    }
    //Locators
    private readonly _dialogTitleLocator = ".ui-dialog-title";
    public get dialogTitleLocator() {
        return this._dialogTitleLocator;
    }
    private readonly _dialogContentLocator = "#control_span_esr_prompt";
    public get dialogContentLocator() {
        return this._dialogContentLocator;
    }
    public readonly testFileDir = "./Test Files/";
    private readonly schoolIdIconLocator = "#company_id_icon";
    private readonly schoolIdLocator = "input#company_id";
    private readonly multipleDialogTitleLocator = "*[id^=ui-id]";
    private readonly selectBtnForSchoolLocator =
        "td:right-of(td[axes='COMP_DESC']:has-text('%'))>button[aria-label='Click to Select Record']";
    //Actions

    // Common navigation methods
    /**
     * This function is for navigating to provided resource/endpoint
     * @param url
     */
    async navigateTo(url: string) {
        await this.page.goto(url);
    }

    async navigateBack() {
        await this.page.goBack();
    }

    async navigateForward() {
        await this.page.goForward();
    }

    // Common element interaction methods
    async click(locator: string) {
        await this.page.locator(locator).click();
    }

    async fill(locator: string, text: string) {
        await this.page.locator(locator).fill(text);
    }

    async selectOption(locator: string, value: string) {
        await this.page.locator(locator).selectOption(value);
    }

    // Advanced element interaction methods
    async getByRole(
        role,
        options?: { name?: string; hidden?: boolean; exact?: boolean }
    ) {
        return this.page.getByRole(role, options);
    }

    async getByLabel(label: string) {
        return this.page.getByLabel(label);
    }

    async getByPlaceholder(placeholder: string) {
        return this.page.getByPlaceholder(placeholder);
    }

    async getByAltText(altText: string) {
        return this.page.getByAltText(altText);
    }
    /**
     *This function returns located element using provided text
     * @param text
     * @returns
     */
    async getByText(text: string) {
        return await this.page.getByText(text);
    }

    // Assertions
    async expectElementToBeVisible(locator: string) {
        await expect(this.page.locator(locator)).toBeVisible();
    }

    async expectElementToBeHidden(locator: string) {
        await expect(this.page.locator(locator)).toBeHidden();
    }

    async expectElementToHaveText(locator: string, text: string) {
        await expect(
            this.page.locator(locator).first(),
            "Check if page element has text :" + text
        ).toHaveText(text);
    }
    async expectElementToHaveValue(locator: string, value: string) {
        await expect(
            this.page.locator(locator).first(),
            "Check if page element has value :" + value
        ).toHaveValue(value);
    }

    // Additional methods (as needed)
    async screenshot(path: string) {
        await this.page.screenshot({ path });
    }

    async getURL() {
        return this.page.url();
    }

    /**
     * This function verifies current URL is the provided URL
     * @param url
     */
    async verifyURL(url: string) {
        await expect(this.page.url()).toBe(url);
    }

    /**
     * This function returns boolean whether the heading is visible on page located by provided text
     * @param headingText
     * @returns
     */
    async isHeadingVisibleByText(headingText: string) {
        return (
            await this.getByRole("heading", { name: headingText })
        ).isVisible();
    }
    /**
     * This function writes a file to file system with default content
     * @param ext
     * @returns Promise
     */
    async fsWriteFile(ext: string) {
        console.log("Current directory is: " + __dirname);
        var dir;
        if (process.env.CI ? true : false) dir = "../../../";
        else dir = "../../";
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
    getNewestFileNameInDir(dirPath: string): string | null {
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
     * This function wraps the function to find the element using role
     * @param name
     */
    async clickButtonUsingRole(name: string) {
        await this.page
            .getByRole("button", {
                name: name,
                exact: true
            })
            .click();
    }
    /**
     * This function checks if the dialog with provided title exists on the page
     * @param title
     */
    async checkIfDialogExistsWithTitle(title: string) {
        const locator: string =
            this.multipleDialogTitleLocator + '>>text="' + title + '"';
        await this.expectElementToBeVisible(locator);
    }
    /**
     * This function selects school id provided
     * @param schoolId
     */
    async selectSchoolId(schoolId: string) {
        //Click
        await this.click(this.schoolIdIconLocator);

        //School ID Dialog check
        const expectedDialogText = expectedTexts.expectedSchoolIDDialogTitle;
        await this.checkIfDialogExistsWithTitle(expectedDialogText);

        //Click select button for school id
        const schoolDescrEle = this.page.locator(
            this.selectBtnForSchoolLocator.replace("%", schoolId!)
        );
        await schoolDescrEle.first().click();
        await this.expectElementToHaveValue(
            this.schoolIdLocator,
            expectedTexts.expectedSchoolID
        );
    }
    // async;
}
