import BasePage from "./BasePage";
import elementAttributes from "../data/elementAttributes.json";
import { expect } from "@playwright/test";
// <reference lib="dom"/>

/**
 * @author: @pruthvirajqa2dev
 * This page class is for PRL210 screen related page elements and actions on them
 */
export default class PRL210 extends BasePage {
    //Locators and Texts
    private readonly pageHeadingText = "PRL210 - Purchase Ledger Suppliers";
    private readonly supplierLocator =
        "[data-internal-ref] > [axes='SUPPLIER']";
    private readonly contactDetailsText = "Contact Details";
    private readonly paymentDetailsText = "Payment Details";
    private readonly supplierNameLocator = "#supp_name";
    private readonly paymentMethodLocator = "#pay_method_0";
    private readonly cancelBtnLocator = "#cancel_button";
    //Actions
    /**
     * @author: @pruthvirajqa2dev
     * This methods verifies key page elements are visible after loading
     */
    async expectPageElementsVisibilityOnLoad() {
        expect(this.isHeadingVisibleByText(this.pageHeadingText)).toBeTruthy();
    }
    /**
     *
     *
     */
    async getSuppliersElements() {
        await this.page.waitForLoadState("load");
        return await this.page.locator(this.supplierLocator).all();
    }
    /**
     *
     */
    async clickContactDetailsTabCard() {
        await (await this.getByText(this.contactDetailsText)).nth(0).click();
    }
    /**
     *
     */
    async clickPaymentDetailsTabCard() {
        await (await this.getByText(this.paymentDetailsText)).nth(0).click();
    }

    /**
     *
     * @returns
     */
    async getSupplierNameFromDetails() {
        return await this.page.locator(this.supplierNameLocator).inputValue();
    }
    /**
     *
     * @returns
     */
    async getPaymentMethod() {
        return await this.page.locator(this.paymentMethodLocator).inputValue();
    }
    /**
     *
     */
    async clickCancelButton() {
        await this.click(this.cancelBtnLocator);
    }
}
