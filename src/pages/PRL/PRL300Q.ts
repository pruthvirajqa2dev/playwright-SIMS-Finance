import BasePage from "../BasePage";
import { expect } from "@playwright/test";
import expectedTexts from "../../data/expectedTexts.json";
import labels from "../../data/labels.json";
import logger from "../../logging/logger";
// <reference lib="dom"/>

/**
 * @author: @pruthvirajqa2dev
 * This page class is for PRL300Q screen related page elements and actions on them
 */
/**
 * This class represents the PRL300Q page, which handles the functionality related to Invoices/Credit Notes.
 * It extends the BasePage class and provides methods to interact with various elements on the PRL300Q page.
 *
 * @class PRL300Q
 * @extends {BasePage}
 *
 * @property {string} pageHeadingText - The heading text of the page.
 * @property {string} expectedDialogTitle - The expected title of the dialog.
 * @property {string} nonPurchaseOrderInvoiceRadioBtnLocator - The locator for the Non Purchase Order Invoice radio button.
 * @property {string} _selectBtnLocator - The locator for the select button.
 * @property {string} _supplierIconLocator - The locator for the supplier icon.
 * @property {string} supplierColumnLocator - The locator for the supplier column.
 * @property {string} _supplierTextOnOrderDetailsScreenLocator - The locator for the supplier text on the order details screen.
 * @property {string} _invoiceDateOnOrderDetailsScreenLocator - The locator for the invoice date on the order details screen.
 * @property {string} _headerDetailLabel - The locator for the header detail label.
 * @property {string} notificationMessageOnOrderDetailsLocator - The locator for the notification message on the order details screen.
 * @property {string} invoiceTotalOnOrderDetailsScreenLocator - The locator for the invoice total on the order details screen.
 * @property {string} invoiceVATOnOrderDetailsScreenLocator - The locator for the invoice VAT on the order details screen.
 * @property {string} invoiceReferenceOnOrderDetailsScreenLocator - The locator for the invoice reference on the order details screen.
 * @property {string} descriptionInputLocator - The locator for the description input.
 * @property {string} costCenterLookupIconLocator - The locator for the cost center lookup icon.
 * @property {string} costCenterLookupPopupLocator - The locator for the cost center lookup popup.
 * @property {string} costCenterColumnLocator - The locator for the cost center column.
 * @property {string} ledgerCodeLookupIconLocator - The locator for the ledger code lookup icon.
 * @property {string} fundCodeLookupIconLocator - The locator for the fund code lookup icon.
 * @property {string} quantityInputLocator - The locator for the quantity input.
 * @property {string} unitPriceInputLocator - The locator for the unit price input.
 * @property {string} vatCodeIconLocator - The locator for the VAT code icon.
 * @property {string} vatCodeColumnLocator - The locator for the VAT code column.
 * @property {string} calculatedVatValueOnLineDetailsScreenLocator - The locator for the calculated VAT value on the line details screen.
 * @property {string} selectSupplierOnSupplierScreenBtnLocator - The locator for the select supplier button on the supplier screen.
 * @property {string} calculatedTotalInvoiceTextLocator - The locator for the calculated total invoice text.
 * @property {string} _saveBtnLocator - The locator for the save button.
 * @property {string} quantityOnLineGridScreenLocator - The locator for the quantity on the line grid screen.
 * @property {string} unitPriceOnLineGridScreenLocator - The locator for the unit price on the line grid screen.
 * @property {string} netInvoiceOnLineGridScreenLocator - The locator for the net invoice on the line grid screen.
 * @property {string} vatAmountOnLineGridScreenLocator - The locator for the VAT amount on the line grid screen.
 * @property {string} vatCodeOnLineGridScreenLocator - The locator for the VAT code on the line grid screen.
 * @property {string} _finishAndSaveBtnLocator - The locator for the finish and save button.
 * @property {string} errorPromptMessageLocator - The locator for the error prompt message.
 * @property {string} okBtnOnMsgBoxLocator - The locator for the OK button on the message box.
 * @property {string} totalValueLocator - The locator for the total value.
 * @property {string} summartDetailsTitleLocator - The locator for the summary details title.
 * @property {string} totalVatLocator - The locator for the total VAT.
 * @property {string} okBtnOnDetailsScreenLocator - The locator for the OK button on the details screen.
 *
 * @method expectPageElementsVisibilityOnLoad - Verifies that key page elements are visible after loading.
 * @method checkNonPurchaseOrderInvoiceRadioBtn - Checks the Non Purchase Order Invoice radio button.
 * @method clickSelectForSupplierName - Clicks the select button for the provided supplier name.
 * @method verifySupplierTextOnOrderDetailsScreen - Verifies the supplier text on the order details screen.
 * @method fillInvoiceDateOnOrderDetailsScreen - Fills the invoice date on the order details screen.
 * @method fillInvoiceFiguresOnOrderDetailsScreen - Fills the invoice total and invoice VAT on the order details screen.
 * @method fillInvoiceReferenceOnOrderDetailsScreen - Fills the invoice reference on the order details screen.
 * @method addLineDetails - Adds line details including description, cost center, ledger code, and fund code.
 * @method selectCostCenter - Selects the cost center from the lookup popup.
 * @method selectFirstLedgerCodeAndFundCode - Selects the first ledger code and fund code.
 * @method fillQuantityAndUnitPrice - Fills the quantity and unit price.
 * @method selectVatCode - Selects the VAT code.
 * @method expectVatValueToBeCalculated - Expects the VAT value to be calculated.
 * @method expectTotalInvoiceValueToBeCalculated - Expects the total invoice value to be calculated.
 * @method compareQuantityAndUnitPriceOnLineGrid - Compares the quantity and unit price on the line grid.
 * @method compareLineGridDetails - Compares the line grid details including net invoice and VAT amount.
 * @method compareVatCodeOnLineGrid - Compares the VAT code on the line grid.
 * @method dismissErrorPrompt - Dismisses the error prompt if visible.
 * @method expectOrderDetailsScreenToBeVisible - Verifies that the order details screen is visible and checks the VAT amount.
 */
export default class PRL300Q extends BasePage {
    //Locators and Texts
    private readonly pageHeadingText = "PRL300Q - Invoices/Credit Notes";
    private readonly expectedDialogTitle = "Invoice/Credit Note";
    private readonly nonPurchaseOrderInvoiceRadioBtnLocator = "#invoice_type2";
    private readonly creditNoteRadioBtnLocator = "#invoice_type3";
    private readonly _selectBtnLocator = "#select_button";
    public get selectBtnLocator() {
        return this._selectBtnLocator;
    }
    private readonly _supplierIconLocator = "#supplier_icon";
    public get supplierIconLocator() {
        return this._supplierIconLocator;
    }
    private readonly supplierColumnLocator = "[axes='SUPP_NAME']";
    private readonly _supplierTextOnOrderDetailsScreenLocator =
        "span[for='supplier']";
    public get supplierTextOnOrderDetailsScreenLocator() {
        return this._supplierTextOnOrderDetailsScreenLocator;
    }
    private readonly _invoiceDateOnOrderDetailsScreenLocator =
        "[data-alias='DOC_DATE']";
    public get invoiceDateOnOrderDetailsScreenLocator() {
        return this._invoiceDateOnOrderDetailsScreenLocator;
    }
    private readonly _headerDetailLabel = ".esr_container_label";
    public get headerDetailLabel() {
        return this._headerDetailLabel;
    }
    private readonly notificationMessageOnOrderDetailsLocator =
        ".ui-pnotify-text";
    private readonly invoiceTotalOnOrderDetailsScreenLocator = "#tot_value";
    private readonly invoiceVATOnOrderDetailsScreenLocator = "#tot_vat";
    private readonly invoiceReferenceOnOrderDetailsScreenLocator =
        "#supp_own_ref";
    //Invoice Line Details Dialog elements
    private readonly descriptionInputLocator = "#narr_desc";
    private readonly costCenterLookupIconLocator = "#c1_part_code_lookup";

    private readonly costCenterLookupPopupLocator =
        "[data-esr-clean-page='glcodepartlookup']";
    private readonly costCenterColumnLocator = "[axes='DESCR']";
    private readonly ledgerCodeLookupIconLocator = "#e1_part_code_lookup";
    private readonly fundCodeLookupIconLocator = "#e2_part_code_lookup";
    private readonly quantityInputLocator = "input#line_quantity";
    private readonly unitPriceInputLocator = "input#unit_price";

    private readonly vatCodeIconLocator = "i#vat_code_icon";
    private readonly vatCodeColumnLocator = "[axes='VACODE'] > div";
    private readonly calculatedVatValueOnLineDetailsScreenLocator =
        "#vat_value";
    private readonly selectSupplierOnSupplierScreenBtnLocator = "#esr_action";
    private readonly calculatedTotalInvoiceTextLocator =
        "input#total_line_value";
    private readonly _saveBtnLocator = "[data-originalvalue='Save']";
    public get saveBtnLocator() {
        return this._saveBtnLocator;
    }
    private readonly quantityOnLineGridScreenLocator =
        "[axes='LINE_QUANTITY'] > div";
    private readonly unitPriceOnLineGridScreenLocator =
        "[axes='UNIT_PRICE'] > div";
    private readonly netInvoiceOnLineGridScreenLocator =
        "[axes='VAT_EXCLUSIVE'] > div";
    private readonly vatAmountOnLineGridScreenLocator =
        "[axes='VAT_VALUE'] > div";

    private readonly vatCodeOnLineGridScreenLocator = "[axes='VAT_CODE'] > div";
    private readonly _finishAndSaveBtnLocator =
        "[data-originalvalue='Finish & Save']";
    public get finishAndSaveBtnLocator() {
        return this._finishAndSaveBtnLocator;
    }

    private readonly errorPromptMessageLocator =
        "*[id$=esr_mb_PRL300Q0_esr_prompt] > div";
    private readonly okBtnOnMsgBoxLocator = "#esr_messagebox_ok";
    private readonly totalValueLocator = "#tot_value";
    private readonly summartDetailsTitleLocator = "*[id*=summary_details]";
    private readonly totalVatLocator = "#tot_vat";
    private readonly okBtnOnDetailsScreenLocator = "#ok_button";

    //Actions
    /**
     * @author: @pruthvirajqa2dev
     * This methods verifies key page elements are visible after loading
     */
    async expectPageElementsVisibilityOnLoad() {
        expect(this.isHeadingVisibleByText(this.pageHeadingText)).toBeTruthy();
    }
    /**
     * @description This method is used to check the Non Purchase Order Invoice Radio Button
     */
    async checkNonPurchaseOrderInvoiceRadioBtn() {
        await this.checkAndVerify(this.nonPurchaseOrderInvoiceRadioBtnLocator);
    }
    /**
     * @description This method is used to check the Non Purchase Order Invoice Radio Button
     */
    async checkCreditNoteRadioBtn() {
        await this.checkAndVerify(this.creditNoteRadioBtnLocator);
    }
    /**
     * @description This method is used to click the select button for provided supplier
     */
    async clickSelectForSupplierName(supplier: string) {
        await this.page
            .locator(this.supplierColumnLocator)
            .filter({ hasText: supplier })
            .locator("..")
            .locator(this.selectSupplierOnSupplierScreenBtnLocator)
            .first()
            .click();
    }
    /**
     * @description This method is used to verify the Supplier text on Order Details Screen
     */
    async verifySupplierTextOnOrderDetailsScreen(supplier: string) {
        await expect(
            this.page.locator(this.supplierTextOnOrderDetailsScreenLocator)
        ).toHaveText(supplier);
    }
    /**
     * @description This method is used to fill the Invoice Date on Order Details Screen
     */
    async fillInvoiceDateOnOrderDetailsScreen() {
        for (let i = 0; i < 2; i++) {
            logger.info("Clicking on header details");
            await this.page
                .locator(this.headerDetailLabel)
                .filter({ hasText: labels.headerDetailsLbl })
                .click();
        }
        logger.info("Filling invoice date");
        logger.info(
            "Clicking on invoice date : " +
                this.invoiceDateOnOrderDetailsScreenLocator
        );
        await this.fill(
            this.invoiceDateOnOrderDetailsScreenLocator,
            expectedTexts.invoiceDate
        );
        logger.info("Clicking on header details");
        await this.page
            .locator(this.headerDetailLabel)
            .filter({ hasText: labels.headerDetailsLbl })
            .click();
        logger.info(
            "Expecting notification message to contain period and year"
        );
        await expect(
            this.page.locator(this.notificationMessageOnOrderDetailsLocator)
        ).toContainText(expectedTexts.expectedPeriodAndYear);
    }
    /**
     * @description This method is used to fill the Invoice Total and Invoice VAT on Order Details Screen
     */
    async fillInvoiceFiguresOnOrderDetailsScreen(
        invoiceTotal: string,
        VAT: string
    ) {
        await this.fill(
            this.invoiceTotalOnOrderDetailsScreenLocator,
            invoiceTotal
        );
        await this.fill(this.invoiceVATOnOrderDetailsScreenLocator, VAT);
    }
    /**
     *
     */
    async fillInvoiceReferenceOnOrderDetailsScreen(invoiceReference) {
        await this.fill(
            this.invoiceReferenceOnOrderDetailsScreenLocator,
            invoiceReference
        );
    }
    /**
     *
     */
    async addLineDetails(costCenter: string) {
        await this.clickEsrMultiBtnUsingText(expectedTexts.expectedAddText);
        await this.verifyDialogTitle(this.expectedDialogTitle);
        //Line details
        await this.fill(
            this.descriptionInputLocator,
            "DESC" + Math.floor(Math.random() * 1000000)
        );
        await this.selectCostCenter(costCenter);
        await this.selectFirstLedgerCodeAndFundCode();
    }
    /**
     *
     */
    async selectCostCenter(costCenter: string) {
        await this.click(this.costCenterLookupIconLocator);
        await expect(
            this.page.locator(this.costCenterLookupPopupLocator)
        ).toBeVisible();
        await this.dblClickRecordFromLookupPopup(
            this.costCenterColumnLocator,
            costCenter
        );
    }
    /**
     *
     */
    async selectFirstLedgerCodeAndFundCode() {
        logger.info("Selecting on ledger code lookup");
        // this.clickElementByText(this.expectedDialogTitle);
        await this.click(this.ledgerCodeLookupIconLocator);
        await this.clickEsrMultiBtnUsingText(expectedTexts.selectText);

        logger.info("Selecting on fund code lookup");
        await this.clickElementByText(this.expectedDialogTitle);
        await this.click(this.fundCodeLookupIconLocator);
        await this.clickEsrMultiBtnUsingText(expectedTexts.selectText);
    }
    /**
     * @param quantity
     * @param unitPrice
     */
    async fillQuantityAndUnitPrice(quantity: string, unitPrice: string) {
        logger.info(
            "Filling quantity and unit price: " + quantity + " & " + unitPrice
        );
        //Quantity
        await this.scrollToElementUsingHandle(this.quantityInputLocator);
        await this.fill(this.quantityInputLocator, quantity);
        logger.info("Clicking on heading button");
        this.clickElementByText(this.expectedDialogTitle);
        //Unit price
        await this.scrollToElementUsingHandle(this.unitPriceInputLocator);
        await this.fill(this.unitPriceInputLocator, unitPrice);
        logger.info("Clicking on heading button");
        this.clickElementByText(this.expectedDialogTitle);
    }
    /**
     *
     * @param vatCode
     */
    async selectVatCode(vatCode: string) {
        logger.info("Selecting vat code: " + vatCode);
        await this.scrollToElementUsingHandle(this.vatCodeIconLocator);
        await this.click(this.vatCodeIconLocator);
        await this.dblClickRecordFromLookupPopup(
            this.vatCodeColumnLocator,
            vatCode
        );
        // this.clickElementByText(this.expectedDialogTitle);
    }
    /**
     *
     * @param vatAmount
     */
    async expectVatValueToBeCalculated(vatAmount: string) {
        logger.info("Expecting calculated vat value");
        await this.scrollToElementUsingHandle(
            this.calculatedVatValueOnLineDetailsScreenLocator
        );
        await this.expectElementToContainValue(
            this.calculatedVatValueOnLineDetailsScreenLocator,
            vatAmount
        );
    }
    /**
     *
     * @param totalInvoice
     */
    async expectTotalInvoiceValueToBeCalculated(totalInvoice: string) {
        logger.info("Expecting calculated Total invoice value");
        await this.scrollToElementUsingHandle(
            this.calculatedTotalInvoiceTextLocator
        );
        logger.info("Expected total invoice value: " + totalInvoice);
        await this.expectElementToContainValue(
            this.calculatedTotalInvoiceTextLocator,
            totalInvoice
        );
    }

    /**
     *
     */
    async compareQuantityAndUnitPriceOnLineGrid(
        expectedQuantity: Number,
        expectedUnitPrice: Number
    ) {
        logger.info("Quantity: " + expectedQuantity);
        logger.info("Unit Price: " + expectedUnitPrice);
        const actualQuantity = await this.page
            .locator(this.quantityOnLineGridScreenLocator)
            .first()
            .innerText();
        expect(actualQuantity).toEqual(expectedQuantity.toFixed(2).toString());
        let actualUnitPrice = await this.page
            .locator(this.unitPriceOnLineGridScreenLocator)
            .first()
            .innerText();
        actualUnitPrice = Number(actualUnitPrice).toFixed(2);
        expect(actualUnitPrice).toEqual(
            expectedUnitPrice.toFixed(2).toString()
        );
    }
    /**
     *
     * @param netInvoice
     * @param vatAmount
     */
    async compareLineGridDetails(netInvoice: number, vatAmount: number) {
        logger.info("Net Invoice: " + netInvoice);
        logger.info("VAT Amount: " + vatAmount);
        //Net Invoice
        const actualNetInvoice = await this.page
            .locator(this.netInvoiceOnLineGridScreenLocator)
            .first()
            .innerText();
        expect(actualNetInvoice).toEqual(
            Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(netInvoice)
        );
        //VAT Amount
        const actualVatValue = await this.page
            .locator(this.vatAmountOnLineGridScreenLocator)
            .first()
            .innerText();
        expect(actualVatValue).toEqual(
            vatAmount != 0
                ? Intl.NumberFormat("en-US", {
                      minimumFractionDigits: 2
                  }).format(vatAmount)
                : "0.00"
        );
    }
    /**
     *
     * @param vatCode
     */
    async compareVatCodeOnLineGrid(vatCode: string) {
        logger.info("VAT Code: " + vatCode);
        const actualVatCode = await this.page
            .locator(this.vatCodeOnLineGridScreenLocator)
            .first()
            .innerText();
        expect(actualVatCode).toEqual(vatCode);
    }
    /**
     *
     */
    async dismissErrorPrompt() {
        // Error prompt message
        if (
            await this.page
                .locator(this.errorPromptMessageLocator)
                .isVisible({ timeout: 10000 })
        ) {
            expect(
                this.page.locator(this.errorPromptMessageLocator)
            ).toHaveText(expectedTexts.errorPromptMessage);
        }
        // Ok Button message box
        if (
            await this.page
                .locator(this.okBtnOnMsgBoxLocator)
                .isVisible({ timeout: 10000 })
        ) {
            await this.click(this.okBtnOnMsgBoxLocator);
        }
        if (
            await this.page
                .locator(this.netInvoiceOnLineGridScreenLocator)
                .isVisible()
        ) {
            const text = await this.page
                .locator(this.netInvoiceOnLineGridScreenLocator)
                .innerText();
            await this.fill(this.totalValueLocator, text);
            await this.click(this.finishAndSaveBtnLocator);
        }
    }
    /**
     *  @description This method is used to verify the Summary Details Title
     */
    async expectOrderDetailsScreenToBeVisible(vatAmount: number) {
        await expect(
            this.page.locator(this.summartDetailsTitleLocator).first()
        ).toBeVisible();
        logger.info("VAT Amount: " + vatAmount);
        //VAT Amount
        const actualVatValue = await this.page
            .locator(this.totalVatLocator)
            .first()
            .innerText();
        expect(actualVatValue).toEqual(
            vatAmount != 0
                ? Intl.NumberFormat("en-US", {
                      minimumFractionDigits: 2
                  }).format(vatAmount)
                : "0.00"
        );
        await this.click(this.okBtnOnDetailsScreenLocator);
    }
    /**
     * @description This method is used to select document type
     * @param documentType
     */
    async selectDocumentType(documentType: string) {
        await this.page
            .getByLabel(labels.documentTypeLbl)
            .selectOption(documentType);
    }
}
