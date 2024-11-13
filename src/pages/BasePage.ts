import base, { expect, Page } from "@playwright/test";
import expectedTexts from "../data/expectedTexts.json";
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
    public readonly testFileDir = "/Test Files/*.TXT";
    private readonly schoolIdIconLocator = "#company_id_icon";
    private readonly schoolIdLocator = "input#company_id";
    private readonly multipleDialogTitleLocator = "*[id^=ui-id]";
    private readonly selectBtnForSchoolLocator =
        "td:right-of(td[axes='COMP_DESC']:has-text('%'))>button[aria-label='Click to Select Record']";
    private readonly _yesBtnLocator = "#esr_messagebox_yes";
    private readonly _esrPromptTextLocator = "div[id*=esr_prompt]";
    public get yesBtnLocator() {
        return this._yesBtnLocator;
    }
    public get esrPromptTextLocator() {
        return this._esrPromptTextLocator;
    }
    private readonly _noBtnLocator = "#esr_messagebox_no";
    public get noBtnLocator() {
        return this._noBtnLocator;
    }
    private readonly _submitBtnLocator = "#submit";
    private readonly _submitBtnLocator1 = "#submit_button";
    public get submitBtnLocator() {
        return this._submitBtnLocator;
    }
    public get submitBtnLocator1() {
        return this._submitBtnLocator1;
    }
    private readonly _okBtnLocator = "#btn_ok";
    public get okBtnLocator() {
        return this._okBtnLocator;
    }
    private readonly _greenIconLocator = '.faicon > i[style*="color:green"]';
    public get greenIconLocator() {
        return this._greenIconLocator;
    }
    private readonly _reportLocator = "#spc_rep_0";
    public get reportLocator() {
        return this._reportLocator;
    }
    private readonly _secondReportLocator = "#spc_rep_1";
    public get secondReportLocator() {
        return this._secondReportLocator;
    }
    private readonly _saveAllBtnLocator = "#save_all";
    public get saveAllBtnLocator() {
        return this._saveAllBtnLocator;
    }

    private readonly _closeBtnLocator = "#btn_close";
    public get closeBtnLocator() {
        return this._closeBtnLocator;
    }
    private readonly pdfIconLocator =
        "div[style*='background-image : url(/staticcontent/images/core/ui/16_16/pdf.png);']";
    screenshotPath =
        "test-results/Postchecks/RunOn" +
        new Date().toLocaleDateString("en-GB").replaceAll("/", "") +
        "/" +
        "Hour " +
        new Date().getHours();
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
        await this.page.locator(locator).first().click();
    }
    async check(locator: string) {
        await this.page.check(locator);
    }
    async checkAndVerify(locator: string) {
        await this.check(locator);
        await expect(await this.page.isChecked(locator)).toBeTruthy();
    }

    async fill(locator: string, text: string) {
        await this.page.locator(locator).fill(text, { force: true });
    }

    async fillTextAndVerify(locator: string, text: string) {
        // Fill text
        await this.fill(locator, text);
        //Verify Text filled
        await this.expectElementToContainText(locator, text);
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
    async expectElementToContainText(locator: string, text: string) {
        await expect(
            this.page.locator(locator).first(),
            "Check if page element contains text :" + text
        ).toContainText(text);
    }
    async expectElementToHaveValue(locator: string, value: string) {
        await expect(
            this.page.locator(locator).first(),
            "Check if page element has value :" + value
        ).toHaveValue(value);
    }
    /**
     * This function checks if a provided attribute with provided value is present in the element locator by provided locator
     * @param locator
     * @param attr
     * @param value
     */
    async expectElementToHaveAttributeWithValue(
        locator: string,
        attr: string,
        value: string
    ) {
        await expect(
            this.page.locator(locator).first(),
            "Check if page element has attr :" + attr + " with value " + value
        ).toHaveAttribute(attr, value);
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
     * This function clicks the heading on page located by provided text
     * @param headingText
     * @returns
     */
    async clickHeadingByText(headingText: string) {
        await (await this.getByRole("heading", { name: headingText })).click();
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
    /**
     * Click submit button on page
     */
    async clickSubmitBtn() {
        await this.page.locator(this.submitBtnLocator).click();
    }
    /**
     * Click ok button on page
     */
    async clickOkBtn() {
        await this.page.locator(this.okBtnLocator).click();
    }
    /**
     * This function is for waiting for green icon to be visible
     */
    async expectGreenIconToBeVisible() {
        await expect(this.page.locator(this.greenIconLocator)).toBeInViewport();
    }
    async expectTextNotToBeNull(text: string | null) {
        expect(text).not.toBeNull();
    }
    /**
     * This function is for checking if PDF is generated with extension on RSS570
     */
    async verifyPDFGeneratedWithExtOnScreen(
        screen: string,
        expectedText: string
    ) {
        await Promise.all([
            this.expectElementToContainText(this.reportLocator, screen),
            this.expectElementToContainText(this.reportLocator, expectedText),
            this.expectElementToContainText(
                this.reportLocator,
                expectedTexts.PDFExt
            )
        ]);
    }
    /**
     * This function is for checking if PDF is generated with extension on RSS570
     */
    async verifyExcelGeneratedWithExtOnScreen(
        screen: string,
        expectedText: string
    ) {
        await Promise.all([
            this.expectElementToContainText(this.secondReportLocator, screen),
            this.expectElementToContainText(
                this.secondReportLocator,
                expectedText
            ),
            this.expectElementToContainText(
                this.secondReportLocator,
                expectedTexts.XLSXExt
            )
        ]);
    }
    /**
     * This function is for clicking save all button
     */
    async clickSaveAllButton() {
        await this.click(this.saveAllBtnLocator);
    }

    async waitForPdfIconLocator() {
        await this.expectElementToBeVisible(this.pdfIconLocator);
    }
}
