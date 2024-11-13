import BasePage from "./BasePage";
import elementAttributes from "../data/elementAttributes.json";
import expectedTexts from "../data/expectedTexts.json";
import { expect, Page } from "@playwright/test";
// <reference lib="dom"/>

/**
 * @author: @pruthvirajqa2dev
 * This page class is for NML510 screen related page elements and actions on them
 */
export default class NML510 extends BasePage {
    //Locators and Texts
    private readonly pageHeadingText = "NML510 - Trial Balance Report";
    private readonly _trialBalanceText = "Trial Balance by Cost Centre";
    public get trialBalanceText() {
        return this._trialBalanceText;
    }
    _submitBtnLocator = "#submit_button";
    public get submitBtnLocator() {
        return this._submitBtnLocator;
    }
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
     * Click on Submit button
     */
    async clickSubmitBtn() {
        await this.page.locator(this.submitBtnLocator).click();
    }
}
