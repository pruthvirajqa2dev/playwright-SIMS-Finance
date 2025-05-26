import BasePage from "../BasePage";
import { expect } from "@playwright/test";
// <reference lib="dom"/>

/**
 * @author: @pruthvirajqa2dev
 * This page class is for NML510 screen related page elements and actions on them
 */
/**
 * Represents the NML510 page, which is a Trial Balance Report page.
 * This class extends the BasePage and provides locators, texts, and actions specific to the NML510 page.
 *
 * @remarks
 * This class includes methods to verify the visibility of key page elements upon loading and to interact with the submit button.
 *
 * @example
 * ```typescript
 * const nml510Page = new NML510();
 * await nml510Page.expectPageElementsVisibilityOnLoad();
 * await nml510Page.clickSubmitBtn();
 * ```
 *
 * @author @pruthvirajqa2dev
 */
export default class NML510 extends BasePage {
    //Locators and Texts
    private readonly pageHeadingText = "NML510 - Trial Balance Report";
    private readonly _trialBalanceText = "Trial Balance by Cost Centre";
    public get trialBalanceText(): string {
        return this._trialBalanceText;
    }
    _submitBtnLocator = "#submit_button";
    public get submitBtnLocator(): string {
        return this._submitBtnLocator;
    }
    //Actions
    /**
     * @author: @pruthvirajqa2dev
     * This methods verifies key page elements are visible after loading
     */
    async expectPageElementsVisibilityOnLoad() {
        //Page Heading
        expect(this.isHeadingVisibleByText(this.pageHeadingText)).toBeTruthy();
    }

    /**
     * Click on Submit button
     */
    async clickSubmitBtn() {
        await this.page.locator(this.submitBtnLocator).click();
    }
}
