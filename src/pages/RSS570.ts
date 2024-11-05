import BasePage from "./BasePage";
import elementAttributes from "../data/elementAttributes.json";
import expectedTexts from "../data/expectedTexts.json";
import { expect, Page } from "@playwright/test";
// <reference lib="dom"/>

/**
 * @author: @pruthvirajqa2dev
 * This page class is for SPC420 screen related page elements and actions on them
 */
export default class RSS570 extends BasePage {
    //Locators and Texts
    private readonly pageHeadingText = "RSS570 - Outstanding Accruals";
    private readonly supplierOrNominalSortInputLocator = "#supplier_or_normal";
    private readonly currnecyCheckBoxLocator = "#currency_control_0";
    private readonly outstandingAccrualsText = "Outstanding Accruals";
    private readonly reportLocator = "#spc_rep_0";
    private readonly saveAllBtnLocator = "#save_all";

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
    /**
     * This function is for waiting for green icon to be visible
     */
    async expectGreenIconToBeVisible() {
        await expect(this.page.locator(this.greenIconLocator)).toBeInViewport();
    }
    /**
     * This function is for checking if PDF is generated with extension on RSS570
     */
    async verifyPDFGeneratedWithExtOnRSS570() {
        await Promise.all([
            this.expectElementToContainText(
                this.reportLocator,
                expectedTexts.RSS570
            ),
            this.expectElementToContainText(
                this.reportLocator,
                this.outstandingAccrualsText
            ),
            this.expectElementToContainText(
                this.reportLocator,
                expectedTexts.PDFExt
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
     * This function is for clicking report button
     */
    async clickReportButton() {
        return await this.click(this.reportLocator);
    }
    async verifyPDFTabTitle(actualTitle) {
        await expect(actualTitle).toBe("rss570.fileopen");
        //("");
    }
}
