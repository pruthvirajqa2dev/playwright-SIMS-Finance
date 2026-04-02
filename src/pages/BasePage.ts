import base, { expect, Locator, Page } from "@playwright/test";
import expectedTexts from "../data/expectedTexts.json";
import logger from "../logging/logger";
import { waitForEmailWithPreciseTime } from "../utils/GmailUtils";
/**
 * @author: @pruthvirajqa2dev
 * Base page class to inherit basic page functionality
 */
/**
 * The `BasePage` class serves as an abstract base class for all page objects in the application.
 * It provides common locators and methods for interacting with web elements and performing actions on the page.
 *
 * @abstract
 */
export default abstract class BasePage {
    protected page: Page;
    protected testInfo: any;
    //Constructor
    constructor(page: Page, testInfo: any) {
        this.page = page;
        this.testInfo = testInfo;
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
    private readonly _attachmentBtnLocator = "#esr_attachments_button";
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

    private readonly _sortIconLocator = "span.esr_grid_sort_span.fa";
    public get sortIconLocator(): string {
        return this._sortIconLocator;
    }

    private readonly _searchBtnLocator = "#search_button";
    public get searchBtnLocator() {
        return this._searchBtnLocator;
    }
    private readonly esrMsgBoxOkBtnLocator = "#esr_messagebox_ok";
    protected readonly summaryBtnLabel = "Summary";

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
    async dblClick(locator: string) {
        await this.page.locator(locator).first().dblclick();
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
        expect(await this.page.isChecked(locator)).toBeTruthy();
    }
    /**
     *
     * @param locator
     * @param text
     */
    async fill(locator: string, text: string) {
        await this.page.locator(locator).click();
        await this.page.locator(locator).fill(text, { force: true });
    }
    /**
     *
     * @param locator
     * @param text
     */
    async fillTextAndVerify(locator: string, text: string) {
        // Fill text
        logger.info(`Fill text ${text} in locator ${locator}`);
        await this.fill(locator, text);
        //Verify Text filled
        logger.info(`Expecting text ${text} in locator ${locator}`);
        await this.expectElementToContainText(locator, text);
    }
    /**
     *
     * @param locator
     * @param text
     */
    async fillTextAndVerifyValue(locator: string, value: string) {
        // Fill text
        logger.info(`Fill text ${value} in locator ${locator}`);
        await this.fill(locator, value);
        //Verify Text filled
        logger.info(`Expecting value ${value} in locator ${locator}`);
        await this.expectElementToContainText(locator, value);
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
        role: any,
        options?: { name?: string; hidden?: boolean; exact?: boolean }
    ): Promise<Locator> {
        return this.page.getByRole(role, options);
    }
    /**
     *
     * @param label
     * @returns
     */
    async getByLabel(
        label: string,
        options?: { name?: string; hidden?: boolean; exact?: boolean }
    ): Promise<Locator> {
        return this.page.getByLabel(label, options);
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
        return await this.page.getByText(text, { exact: true });
    }
    /**
     * This function returns located element using provided heading
     * @param heading
     * @returns
     */
    async getByHeading(heading: string): Promise<Locator> {
        return this.page.getByRole("heading", { name: heading, exact: true });
    }

    async getByLocator(locator: string): Promise<Locator> {
        return this.page.locator(locator);
    }
    // Assertions
    /**
     *
     * @param locator
     */
    async expectElementToBeVisibleUsingLocator(
        locator: string,
        p0?: { timeout: number }
    ) {
        if (typeof p0 !== "undefined") {
            await expect(this.page.locator(locator).first()).toBeVisible(p0);
        } else {
            await expect(this.page.locator(locator).first()).toBeVisible();
        }
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
        value: string
    ) {
        await expect(
            this.page.locator(locator).first(),
            "Check if page element has attr :" + attr + " with value " + value
        ).toHaveAttribute(attr, value);
    }
    /**
     *
     * @param locator
     * @param value
     */
    async expectElementToContainValue(locator: string, value: string) {
        const actualText = await this.page
            .locator(locator)
            .first()
            .inputValue();
        const actualValue = parseFloat(actualText);
        const expectedValue = parseFloat(value);
        console.log(
            `Actual Value: ${actualValue} Expected Value: ${expectedValue}`
        );
        expect(
            parseFloat(Math.abs(actualValue - expectedValue).toPrecision(2))
        ).toBeLessThanOrEqual(0.01);
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
     *
     * @param text
     */
    async clickElementByText(text: string) {
        await (await this.getByText(text)).click();
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
     * This function wraps the function to enter Text using role
     * @param value
     */
    async enterToTextBoxUsingRole(name: string, value: string) {
        await this.page
            .getByRole("textbox", {
                name: name,
                exact: true
            })
            .fill(value);
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
        if (process.env.TEST_ENV === "TRAINING") {
            await Promise.all([
                this.expectElementToContainText(
                    this.secondReportLocator,
                    screen
                ),
                this.expectElementToContainText(
                    this.secondReportLocator,
                    expectedText
                ),
                this.expectElementToContainText(
                    this.secondReportLocator,
                    expectedTexts.PDFExt
                )
            ]);
        } else {
            await Promise.all([
                this.expectElementToContainText(this.reportLocator, screen),
                this.expectElementToContainText(
                    this.reportLocator,
                    expectedText
                ),
                this.expectElementToContainText(
                    this.reportLocator,
                    expectedTexts.PDFExt
                )
            ]);
        }
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
    async verifyPageURL(page: Page, url: any) {
        expect(page.url()).toContain(url);
    }
    /**
     *@description This function is for clicking search button
     */
    async clickSearchBtn() {
        await this.click(this.searchBtnLocator);
    }
    /**
     *
     * @param text
     * @description
     */
    async clickEsrMultiBtnUsingText(text: string) {
        await this.page
            .locator(this.btnElementListLocator)
            .filter({ hasText: text })
            .first()
            .click();
    }
    /**
     *
     * @param title
     */
    async verifyDialogTitle(title: string) {
        await expect(
            this.page.locator(this._dialogTitleLocator).first()
        ).toHaveText(title);
    }

    /**
     * @description This method is used to double click the record using text
     */
    async dblClickRecordFromLookupPopup(recordLocator: string, text: string) {
        await this.page
            .locator(recordLocator)
            .filter({ hasText: text })
            .dblclick();
    }
    /**
     *
     * @param locator
     */
    async scrollToElementUsingHandle(locator: string) {
        const elementHandle = await this.page.locator(locator).elementHandle();
        await elementHandle?.scrollIntoViewIfNeeded();
    }
    /**
     *
     */
    async verifyVisibilityYesNoButton() {
        await expect(
            this.page.locator(this.yesBtnLocator),
            "Expect yes button to be visible"
        ).toBeVisible();
        await expect(
            this.page.locator(this.noBtnLocator),
            "Expect no button to be visible"
        ).toBeVisible();
    }
    /**
     *
     */
    async clickYesBtnLocator() {
        await this.verifyVisibilityYesNoButton();
        await this.page
            .locator(this.yesBtnLocator)
            .click()
            .catch((error) => {
                console.error(`Error clicking yes button: ${error}`);
                throw error;
            });
    }
    /**
     *
     */
    async clickMsgBoxOkBtn() {
        await this.page
            .locator(this.esrMsgBoxOkBtnLocator)
            .click()
            .catch((error) => {
                console.error(`Error clicking ok button: ${error}`);
                throw error;
            });
    }
    /**
     *
     * @param expectedSender
     * @param expectedEmailSubject
     * @param actionTime
     * @returns
     */
    async verifyEmailSent(
        expectedSender: any,
        expectedEmailSubject: any,
        actionTime: any
    ) {
        const emailReceived = await waitForEmailWithPreciseTime(
            expectedSender,
            expectedEmailSubject,
            120,
            5,
            actionTime
        );
        expect(emailReceived).toBeTruthy();
        return emailReceived;
    }
}
