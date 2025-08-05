import BasePage from "../BasePage";
import elementAttributes from "../../data/elementAttributes.json";
import roles from "../../data/playwrightHTMLRoles.json";
import labels from "../../data/labels.json";
import { expect } from "@playwright/test";

/**
 * @author: @pruthvirajqa2dev
 * This page class is for RSS570 screen related page elements and actions on them
 */
/**
 * Represents the RSS570 page, which extends the BasePage class.
 * This class contains locators, texts, and actions specific to the RSS570 page.
 *
 * @class
 * @extends BasePage
 *
 * @property {string} pageHeadingText - The text of the page heading.
 * @property {string} supplierOrNominalSortInputLocator - The locator for the supplier or nominal sort input field.
 * @property {string} currnecyCheckBoxLocator - The locator for the currency check box.
 * @property {string} _outstandingAccrualsText - The text for outstanding accruals.
 *
 * @method get outstandingAccrualsText - Gets the text for outstanding accruals.
 * @method expectPageElementsVisibilityOnLoad - Verifies that key page elements are visible after loading.
 * @method fillSupplierOrNominalSortInput - Fills the supplier or nominal sort input field with the given option and verifies it.
 * @method checkCurrencyCheckBox - Checks the currency check box and verifies it.
 */
export default class RSS570 extends BasePage {
    //Locators and Texts
    private readonly pageHeadingText = "RSS570 - Outstanding Accruals";
    private readonly supplierOrNominalSortInputLocator = "#supplier_or_normal";
    private readonly currnecyCheckBoxLocator = "#currency_control_0";
    //Actions
    /**
     * @author: @pruthvirajqa2dev
     * This methods verifies key page elements are visible after loading
     */
    async expectPageElementsVisibilityOnLoad() {
        //Page Heading
        expect(this.isHeadingVisibleByText(this.pageHeadingText)).toBeTruthy();
        await expect(
            await this.getByRole(roles.headingRole, {
                name: labels.outstandingAccrualsLbl,
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
