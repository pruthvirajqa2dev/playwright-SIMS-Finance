import base, { expect, Locator, Page } from "@playwright/test";
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
    public get dialogTitleLocator(): string {
        return this._dialogTitleLocator;
    }
    private readonly _dialogContentLocator = "#control_span_esr_prompt";
    public get dialogContentLocator(): string {
        return this._dialogContentLocator;
    }
    public readonly testFileDir = "/Test Files/*.TXT";
    private readonly schoolIdIconLocator = "#company_id_icon";
    private readonly schoolIdLocator = "input#company_id";
    private readonly multipleDialogTitleLocator = "*[id^=ui-id]";
    private readonly _selectBtnForSchoolLocator =
        "td:right-of(td[axes='COMP_DESC']:has-text('%'))>button[aria-label='Click to Select Record']";
    public get selectBtnForSchoolLocator(): string {
        return this._selectBtnForSchoolLocator;
    }
    private readonly _yesBtnLocator = "#esr_messagebox_yes";
    private readonly _esrPromptTextLocator = "div[id*=esr_prompt]";
    public get yesBtnLocator(): string {
        return this._yesBtnLocator;
    }
    public get esrPromptTextLocator(): string {
        return this._esrPromptTextLocator;
    }
    private readonly _noBtnLocator = "#esr_messagebox_no";
    public get noBtnLocator(): string {
        return this._noBtnLocator;
    }
    protected _submitBtnLocator = "#submit";
    protected _submitBtnLocator1 = "#submit_button";
    public get submitBtnLocator(): string {
        return this._submitBtnLocator;
    }
    public get submitBtnLocator1(): string {
        return this._submitBtnLocator1;
    }
    protected _okBtnLocator = "#btn_ok";
    public get okBtnLocator(): string {
        return this._okBtnLocator;
    }
    private readonly _greenIconLocator = '.faicon > i[style*="color:green"]';
    public get greenIconLocator(): string {
        return this._greenIconLocator;
    }
    private readonly _reportLocator = "#spc_rep_0";
    public get reportLocator(): string {
        return this._reportLocator;
    }
    private readonly _secondReportLocator = "#spc_rep_1";
    public get secondReportLocator(): string {
        return this._secondReportLocator;
    }
    private readonly _saveAllBtnLocator = "#save_all";
    public get saveAllBtnLocator(): string {
        return this._saveAllBtnLocator;
    }

    protected _closeBtnLocator = "#btn_close";
    public get closeBtnLocator(): string {
        return this._closeBtnLocator;
    }
    private readonly _breadcrumbLocator = "div[id*=esr_breadcrumb]";
    public get breadcrumbLocator(): string {
        return this._breadcrumbLocator;
    }
    private readonly _attachmentBtnLocator = "#esr_attachment_manager";
    public get attachmentBtnLocator(): string {
        return this._attachmentBtnLocator;
    }
    private readonly _btnElementListLocator = "div.esr_multibutton";
    public get btnElementListLocator(): string {
        return this._btnElementListLocator;
    }
    private readonly _multiBtnLocator = ".multibutton_content";
    public get multiBtnLocator(): string {
        return this._multiBtnLocator;
    }
    private readonly _commonDhxBtnLocator = ".dhx_button";
    public get commonDhxBtnLocator(): string {
        return this._commonDhxBtnLocator;
    }
    private readonly pdfIconLocator =
        "div[style*='background-image : url(/staticcontent/images/core/ui/16_16/pdf.png);']";
    private readonly _browseForFileLocator = "Browse for a file";
    public get browseForFileLocator(): string {
        return this._browseForFileLocator;
    }
    private readonly _fileNameAfterUploadLocator = ".dhx_list-item--name";
    public get fileNameAfterUploadLocator(): string {
        return this._fileNameAfterUploadLocator;
    }
    private readonly _successMarkLocator = "*[class^=dhx_item--success-mark]";
    public get successMarkLocator(): string {
        return this._successMarkLocator;
    }
    private readonly _upArrowLocator = ".fa-sort-amount-up";
    public get upArrowLocator(): string {
        return this._upArrowLocator;
    }
    protected _downArrowLocator = ".fa-sort-amount-down";
    public get downArrowLocator(): string {
        return this._downArrowLocator;
    }
    private readonly _sortableGridLocator = ".esr_grid_sort_span ";
    public get sortableGridLocator(): string {
        return this._sortableGridLocator;
    }
    screenshotPath =
        "test-results/Postchecks/RunOn" +
        new Date().toLocaleDateString("en-GB").replace(/\//g, "") +
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
    /**
     *
     */
    async navigateBack() {
        await this.page.goBack();
    }
    /**
     *
     */
    async navigateForward() {
        await this.page.goForward();
    }

    // Common element interaction methods
    /**
     *
     * @param locator
     */
    async click(locator: string) {
        await this.page.locator(locator).first().click();
    }
    /**
     *
     * @param locator
     */
    async check(locator: string) {
        await this.page.check(locator);
    }
    /**
     *
     * @param locator
     */
    async checkAndVerify(locator: string) {
        await this.check(locator);
        await expect(await this.page.isChecked(locator)).toBeTruthy();
    }
    /**
     *
     * @param locator
     * @param text
     */
    async fill(locator: string, text: string) {
        await this.page.locator(locator).fill(text, { force: true });
    }
    /**
     *
     * @param locator
     * @param text
     */
    async fillTextAndVerify(locator: string, text: string) {
        // Fill text
        await this.fill(locator, text);
        //Verify Text filled
        await this.expectElementToContainText(locator, text);
    }
    /**
     *
     * @param locator
     * @param value
     */
    async selectOption(locator: string, value: string) {
        await this.page.locator(locator).selectOption(value);
    }

    // Advanced element interaction methods
    /**
     *
     * @param role
     * @param options
     * @returns
     */
    async getByRole(
        role,
        options?: { name?: string; hidden?: boolean; exact?: boolean }
    ): Promise<Locator> {
        return this.page.getByRole(role, options);
    }
    /**
     *
     * @param label
     * @returns
     */
    async getByLabel(label: string): Promise<Locator> {
        return this.page.getByLabel(label);
    }
    /**
     *
     * @param placeholder
     * @returns
     */
    async getByPlaceholder(placeholder: string): Promise<Locator> {
        return this.page.getByPlaceholder(placeholder);
    }
    /**
     *
     * @param altText
     * @returns Promise<Locator>
     */
    async getByAltText(altText: string): Promise<Locator> {
        return this.page.getByAltText(altText);
    }
    /**
     *This function returns located element using provided text
     * @param text
     * @returns
     */
    async getByText(text: string): Promise<Locator> {
        return await this.page.getByText(text);
    }

    // Assertions
    /**
     *
     * @param locator
     */
    async expectElementToBeVisibleUsingLocator(locator: string) {
        await expect(this.page.locator(locator)).toBeVisible();
    }
    /**
     *
     * @param locator
     */
    async expectElementToBeHidden(locator: string) {
        await expect(this.page.locator(locator)).toBeHidden();
    }
    /**
     *
     * @param locator
     * @param text
     */
    async expectElementToHaveText(locator: string, text: string) {
        await expect(
            this.page.locator(locator).first(),
            "Check if page element has text :" + text
        ).toHaveText(text);
    }
    /**
     *
     * @param locator
     * @param text
     */
    async expectElementToContainText(locator: string, text: string) {
        await expect(
            this.page.locator(locator).first(),
            "Check if page element contains text :" + text
        ).toContainText(text);
    }
    /**
     *
     * @param locator
     * @param value
     */
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
        value
    ) {
        await expect(
            this.page.locator(locator).first(),
            "Check if page element has attr :" + attr + " with value " + value
        ).toHaveAttribute(attr, value);
    }

    // Additional methods (as needed)
    /**
     *
     * @param path
     */
    async screenshot(path: string) {
        await this.page.screenshot({ path });
    }
    /**
     *
     * @returns
     */
    async getURL(): Promise<string> {
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
    async isHeadingVisibleByText(headingText: string): Promise<boolean> {
        return (
            await this.getByRole("heading", { name: headingText })
        ).isVisible();
    }
    /**
     * This function clicks the heading on page located by provided text
     * @param headingText
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
        await this.expectElementToBeVisibleUsingLocator(locator);
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
        await expect(this.page.locator(this.greenIconLocator)).toBeInViewport({
            timeout: 120000
        });
    }
    /**
     *
     * @param text
     */
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
    /**
     *
     */
    async waitForPdfIconLocator() {
        await this.expectElementToBeVisibleUsingLocator(this.pdfIconLocator);
    }
    /**
     *
     * @param page
     * @param url
     */
    async verifyPageURL(page: Page, url) {
        expect(page.url()).toContain(url);
    }
}
