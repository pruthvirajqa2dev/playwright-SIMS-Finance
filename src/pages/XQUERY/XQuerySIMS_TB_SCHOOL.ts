import BasePage from "../BasePage";
import expectedTexts from "../../data/expectedTexts.json";
import { expect, Page } from "@playwright/test";

// <reference lib="dom"/>

/**
 * @author: @pruthvirajqa2dev
 * This page class is for XQuery SIMS_TB_SCHOOL screen related page elements and actions on them
 */
/**
 * Represents the XQuerySIMS_TB_SCHOOL page.
 * This class provides methods to interact with and verify elements on the XQuerySIMS_TB_SCHOOL page.
 *
 * @extends BasePage
 *
 * @property {string} pageHeadingText - The text of the page heading.
 * @property {string} _prominentText - The prominent text on the page.
 * @property {string} prominentText - Getter for the prominent text.
 * @property {string} yearDropdownLocator - The locator for the year dropdown.
 * @property {string} periodDropdownLocator - The locator for the period dropdown.
 * @property {string} executeBtnLocator - The locator for the execute button.
 * @property {string} _submitBtnLocator - The locator for the submit button.
 * @property {string} _submitBtnLocatorDistribute - The locator for the distribute via workflow button.
 * @property {string} submitBtnLocator - Getter and setter for the submit button locator.
 * @property {string} _xqueryTitleLocator - The locator for the XQuery title.
 * @property {string} xqueryTitleLocator - Getter for the XQuery title locator.
 * @property {string} xquerySchoolIdIconLocator - The locator for the school ID icon.
 * @property {string} xquerySchoolIdLocator - The locator for the school ID input.
 * @property {string} _closeBtnLocator - The locator for the close button.
 * @property {string} emailInputLocator - The locator for the email input.
 * @property {string} _okBtnLocator - The locator for the OK button.
 * @property {string} subjectInputLocator - The locator for the subject input.
 * @property {string} timeInputLocator - The locator for the time input.
 *
 * @method expectPageElementsVisibilityOnLoad - Verifies that key page elements are visible after loading.
 * @method clickSubmitBtn - Clicks the submit button.
 * @method selectYearAndPeriod - Selects the specified year and period.
 * @method clickExecuteBtn - Clicks the execute button.
 * @method expectTitleToBeVisible - Verifies that the XQuery title is visible.
 * @method selectSchoolId - Selects the specified school ID.
 * @method clickCloseBtnOnNewTab - Clicks the close button on a new tab.
 * @method assertionsOnNewTab - Performs assertions on a new tab.
 * @method clickSubmitBtnDistribute - Clicks the distribute via workflow button.
 * @method fillEmailAddress - Fills in the email address.
 * @method assertSubjectAndTime - Asserts the subject and time.
 */
export default class XQuerySIMS_TB_SCHOOL extends BasePage {
    //Locators and Texts
    private readonly pageHeadingText = "XQUERY - SIMS Trial Balance School";
    private readonly _prominentText = "Parameters"; //SIMS_TB_SCHOOL-SIMS Trial Balance School //Parameters
    public get prominentText(): string {
        return this._prominentText;
    }
    private readonly yearDropdownLocator = "#p_ye_ar";
    private readonly periodDropdownLocator = "#p_period";
    private readonly executeBtnLocator = "#execute_in_eseries";
    _submitBtnLocator = "#submit_button";
    _submitBtnLocatorDistribute = "#distribute_via_workflow";

    public get submitBtnLocator(): string {
        return this._submitBtnLocator;
    }
    public set submitBtnLocator(value) {
        this._submitBtnLocator = value;
    }
    private readonly _xqueryTitleLocator = ".TITLE_XQ";
    public get xqueryTitleLocator(): string {
        return this._xqueryTitleLocator;
    }
    private readonly xquerySchoolIdIconLocator = "#p_comp_icon";
    private readonly xquerySchoolIdLocator = "input#p_comp";
    _closeBtnLocator = ".esr_mainbutton[value='Close']";
    private readonly emailInputLocator = "#email_address";
    _okBtnLocator = "#ok_button";
    private readonly subjectInputLocator = "#subject";
    private readonly timeInputLocator = "#time";

    //Actions
    /**
     * @author: @pruthvirajqa2dev
     * This methods verifies key page elements are visible after loading
     */
    async expectPageElementsVisibilityOnLoad() {
        //Page Heading
        expect(this.isHeadingVisibleByText(this.pageHeadingText)).toBeTruthy();
        await expect(
            this.page.getByRole("heading", {
                name: this.prominentText,
                exact: true
            })
        ).toBeVisible();
    }

    /**
     * Click on Submit button
     */
    async clickSubmitBtn() {
        await this.page.locator(this.submitBtnLocator).click();
    }
    /**
     *
     * @param year
     * @param period
     */
    async selectYearAndPeriod(year: string, period: string) {
        await this.selectOption(this.yearDropdownLocator, year);
        await this.selectOption(this.periodDropdownLocator, period);
    }
    /**
     *
     */
    async clickExecuteBtn() {
        await this.click(this.executeBtnLocator);
    }
    /**
     *
     */
    async expectTitleToBeVisible() {
        await this.expectElementToBeVisibleUsingLocator(
            this.xqueryTitleLocator
        );
    }
    /**
     * This function selects school id provided
     * @param schoolId
     */
    override async selectSchoolId(schoolId: string) {
        //Click
        await this.click(this.xquerySchoolIdIconLocator);

        //School ID Dialog check
        await this.checkIfDialogExistsWithTitle(
            expectedTexts.expectedSelectSchoolDialogTitle
        );

        //Click select button for school id
        const schoolDescrEle = this.page.locator(
            this.selectBtnForSchoolLocator.replace("%", schoolId!)
        );
        await schoolDescrEle.first().click();
        await this.expectElementToHaveValue(
            this.xquerySchoolIdLocator,
            expectedTexts.expectedSchoolID
        );
    }
    /**
     *
     * @param newTab
     */
    async clickCloseBtnOnNewTab(newTab: Page) {
        await newTab.locator(this.closeBtnLocator).click();
    }
    /**
     *
     * @param newTab
     */
    async assertionsOnNewTab(newTab: Page) {
        const newTabTitleElement = newTab.locator(this.xqueryTitleLocator);
        await expect(newTabTitleElement).toBeVisible();
        await expect(newTabTitleElement).toContainText(
            expectedTexts.expectedSchoolID
        );
        await expect(newTabTitleElement).toContainText(
            expectedTexts.expectedSchoolName
        );
        await expect(newTabTitleElement).toContainText(
            expectedTexts.expectedPeriod
        );
        await expect(newTabTitleElement).toContainText(
            expectedTexts.expectedYear
        );
    }
    /**
     *
     */
    async clickSubmitBtnDistribute() {
        this.click(this._submitBtnLocatorDistribute);
    }
    /**
     *
     */
    async fillEmailAddress() {
        await this.fill(this.emailInputLocator, expectedTexts.expectedEmailId);
    }
    /**
     *
     */
    async assertSubjectAndTime() {
        await this.expectElementToHaveAttributeWithValue(
            this.subjectInputLocator,
            "value",
            new RegExp(expectedTexts.expectedYearTB)
        );
        await this.expectElementToHaveAttributeWithValue(
            this.subjectInputLocator,
            "value",
            new RegExp(expectedTexts.expectedPeriod)
        );
        await this.expectElementToHaveAttributeWithValue(
            this.subjectInputLocator,
            "value",
            new RegExp(expectedTexts.expectedSchoolID)
        );
        await this.expectElementToHaveAttributeWithValue(
            this.timeInputLocator,
            "value",
            new RegExp(new Date().toLocaleDateString("en-GB"))
        );
    }
    async getSubjectInputValue(): Promise<string> {
        const input = this.page.locator(this.subjectInputLocator);
        return await input.inputValue();
    }
}
