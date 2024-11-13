import BasePage from "./BasePage";
import elementAttributes from "../data/elementAttributes.json";
import { expect, Page } from "@playwright/test";
// <reference lib="dom"/>

/**
 * @author: @pruthvirajqa2dev
 * This page class is for RSS570 screen related page elements and actions on them
 */
export default class RSS570 extends BasePage {
    //Locators and Texts
    private readonly pageHeadingText = "RSS570 - Outstanding Accruals";
    private readonly supplierOrNominalSortInputLocator = "#supplier_or_normal";
    private readonly currnecyCheckBoxLocator = "#currency_control_0";
    private readonly _outstandingAccrualsText = "Outstanding Accruals";
    public get outstandingAccrualsText() {
        return this._outstandingAccrualsText;
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
        await expect(
            this.page.getByRole("heading", {
                name: this.outstandingAccrualsText,
                exact: true
            })
        ).toBeVisible();
    }
    /** Fill the text box with the option and verify if it is filled
     *
     * @param option
     */
    async fillSupplierOrNominalSortInput(option: string) {
        await this.click(this.supplierOrNominalSortInputLocator);
        // Fill text and verify
        await this.fill(this.supplierOrNominalSortInputLocator, option);
        await this.clickHeadingByText(this.pageHeadingText);
        await this.expectElementToHaveAttributeWithValue(
            this.supplierOrNominalSortInputLocator,
            elementAttributes.dataTextAttr,
            option
        );
    }
    /**
     * This function is for checking the currency check box
     */
    async checkCurrencyCheckBox() {
        await this.checkAndVerify(this.currnecyCheckBoxLocator);
    }
}
