import BasePage from "../BasePage";
import { expect } from "@playwright/test";
// <reference lib="dom"/>

/**
 * @author: @pruthvirajqa2dev
 * This page class is for PRL210 screen related page elements and actions on them
 */
/**
 * Represents the PRL210 page, which is part of the Purchase Ledger Suppliers module.
 * This class provides methods to interact with various elements on the PRL210 page.
 *
 * @extends BasePage
 *
 * @remarks
 * This class includes methods to verify the visibility of key page elements,
 * retrieve supplier elements, interact with the Contact Details and Payment Details tabs,
 * and get supplier name and payment method details.
 *
 * @example
 * const prl210Page = new PRL210();
 * await prl210Page.expectPageElementsVisibilityOnLoad();
 * const suppliers = await prl210Page.getSuppliersElements();
 * await prl210Page.clickContactDetailsTabCard();
 * const supplierName = await prl210Page.getSupplierNameFromDetails();
 *
 * @author @pruthvirajqa2dev
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
