import BasePage from "./BasePage";
import elementAttributes from "../data/elementAttributes.json";
import expectedTexts from "../data/expectedTexts.json";
import { expect, Page } from "@playwright/test";
// <reference lib="dom"/>

/**
 * @author: @pruthvirajqa2dev
 * This page class is for XQuery SIMS_TB_SCHOOL screen related page elements and actions on them
 */
export default class XQuerySIMS_TB_SCHOOL extends BasePage {
    //Locators and Texts
    private readonly pageHeadingText = "XQUERY - SIMS Trial Balance School";
    private readonly _prominentText =
        "SIMS_TB_SCHOOL-SIMS Trial Balance School";
    public get prominentText() {
        return this._prominentText;
    }
    private readonly yearDropdownLocator = "#p_ye_ar";
    private readonly periodDropdownLocator = "#p_period";
    private readonly executeBtnLocator = "#execute_in_eseries";
    _submitBtnLocator = "#submit_button";
    _submitBtnLocatorDistribute = "#distribute_via_workflow";

    public get submitBtnLocator() {
        return this._submitBtnLocator;
    }
    public set submitBtnLocator(value) {
        this._submitBtnLocator = value;
    }
    private readonly _xqueryTitleLocator = ".TITLE_XQ";
    public get xqueryTitleLocator() {
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
        await expect(
            this.isHeadingVisibleByText(this.pageHeadingText)
        ).toBeTruthy();
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
    async selectYearAndPeriod(year, period) {
        await this.selectOption(this.yearDropdownLocator, year);
        await this.selectOption(this.periodDropdownLocator, period);
    }
    /**
     *
     */
    async clickExecuteBtn() {
        await this.click(this.executeBtnLocator);
    }
    async expectTitleToBeVisible() {
        await this.expectElementToBeVisible(this.xqueryTitleLocator);
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
            new RegExp(expectedTexts.expectedYear)
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
}
