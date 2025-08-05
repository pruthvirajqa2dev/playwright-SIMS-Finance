import logger from "../../logging/logger";
import BasePage from "../BasePage";
import { expect } from "@playwright/test";
import labels from "../../data/labels.json";
import elementAttributes from "../../data/elementAttributes.json";
import roles from "../../data/playwrightHTMLRoles.json";

/**
 * @author: @pruthvirajqa2dev
 * This page class is for PRL614Q screen related page elements and actions on them
 */
/**
 * Represents the PRL614Q page object model.
 * This class provides methods to interact with and verify elements on the PRL614Q page.
 *
 * @extends BasePage
 *
 * @remarks
 * The PRL614Q page is related to the Purchase Ledger Suppliers.
 *
 * @example
 * ```typescript
 * const prl614qPage = new PRL614Q();
 * await prl614qPage.expectPageElementsVisibilityOnLoad();
 * await prl614qPage.clickBACSFileDate();
 * await prl614qPage.sortTheRecordsWithBACSFileDate();
 * await prl614qPage.checkForEnteredConfirmedStatus();
 * await prl614qPage.fillNarrativeInputAndVerify("Sample Narrative");
 * await prl614qPage.selectAllTxns();
 * await prl614qPage.clickNextBtn();
 * await prl614qPage.verifyNewBalanceNegativePrompt("Negative Balance Prompt");
 * await prl614qPage.verifySupplierNamesOnBACSRunStep2(["Supplier1", "Supplier2"], 2);
 * ```
 *
 * @author @pruthvirajqa2dev
 */
export default class PRL614Q extends BasePage {
    //Locators and Texts
    private readonly pageHeadingText = "PRL614Q - Purchase Ledger Suppliers";
    private readonly BACSFileDateText = "BACS File Date";
    private readonly statusColumnValuesLocator = "td[axes*='STATUS']";
    private readonly enteredNotConfirmedText = "Entered/Not Confirmed";
    private readonly statusColumnValuesHeader = "th[id*='STATUS']";
    private readonly bacsFileDateColumnValuesHeaderLocator =
        "th[id*='BACS_FILE_DATE']";
    private readonly narrativeInputLocator = "textarea#run_narr";
    private readonly _refreshBtnLocator = "#refresh";
    public get refreshBtnLocator() {
        return this._refreshBtnLocator;
    }
    private readonly _processingControlLocator = "#processing_controls";
    public get processingControlLocator() {
        return this._processingControlLocator;
    }
    private readonly _supplierNameLocator = "[axes='SUPP_NAME'] > div";
    public get supplierNameLocator() {
        return this._supplierNameLocator;
    }
    private readonly selectAllCheckboxLocator =
        "*[id^=esr_grid_column_row_check_all]";
    private readonly nextButtonLocator = "button#next_button";
    private readonly newBalanceNegativePromptLocator =
        "*[id$=PRL614Q0_esr_prompt] > div";
    private readonly _printReportBtnLocator = "#print_report";
    public get printReportBtnLocator() {
        return this._printReportBtnLocator;
    }
    //
    //Actions
    /**
     * @author: @pruthvirajqa2dev
     * This methods verifies key page elements are visible after loading
     */
    async expectPageElementsVisibilityOnLoad() {
        expect(this.isHeadingVisibleByText(this.pageHeadingText)).toBeTruthy();
    }

    /**
     * @author: @pruthvirajqa2dev
     */
    async clickBACSFileDate() {
        await this.clickElementByText(labels.bacsFileDateLbl);
    }
    /**
     *@description This method is used to sort the records with BACS File Date
     */
    async sortTheRecordsWithBACSFileDate() {
        var bacsFileDateColumnValuesHeader = this.page.locator(
            this.bacsFileDateColumnValuesHeaderLocator
        );
        await bacsFileDateColumnValuesHeader.click({ force: true }); // First click
        // Function to check if the column is sorted in ascending order
        var isAscending = async (): Promise<boolean> => {
            var sortIcon = this.page.locator(this.sortIconLocator).first();
            const iconClass =
                (
                    await sortIcon.getAttribute(elementAttributes.classAttr)
                )?.trim() || "";
            return iconClass?.includes(this.upArrowLocator) ?? false;
        };
        // Function to check if the column is sorted in descending order
        var isDescending = async (): Promise<boolean> => {
            var sortIcon = this.page.locator(this.sortIconLocator).first();
            const iconClass =
                (
                    await sortIcon.getAttribute(elementAttributes.classAttr)
                )?.trim() || "";
            return iconClass?.includes(this.downArrowLocator) ?? false;
        };

        // Ensure the column is sorted in ascending order
        if (!(await isDescending())) {
            await bacsFileDateColumnValuesHeader.click({ force: true }); // First click
            if (await isAscending()) {
                await bacsFileDateColumnValuesHeader.click({ force: true }); // Second click if initially sorted ascending
            }
        }
    }

    async checkForEnteredConfirmedStatus() {
        await expect(
            this.page
                .locator(this.statusColumnValuesLocator)
                .filter({ hasText: this.enteredNotConfirmedText })
        ).not.toBeVisible();
    }
    /**
     *
     * @param narrative
     */
    async fillNarrativeInputAndVerify(narrative: string) {
        await this.fill(this.narrativeInputLocator, narrative);
        (
            await this.getByRole(roles.headingRole, {
                name: labels.submissionParametersLbl
            })
        ).click();
        await expect(
            this.page.locator(this.narrativeInputLocator)
        ).toHaveAttribute(elementAttributes.dataOriginalValAttr, narrative);
    }
    /**
     * @description This method is used to select all the transaction rows
     */
    async selectAllTxns() {
        await this.check(this.selectAllCheckboxLocator);
    }

    /**
     *
     */
    async clickNextBtn() {
        await this.click(this.nextButtonLocator);
    }
    /**
     *
     * @param newBalanceNegativeText
     */
    async verifyNewBalanceNegativePrompt(newBalanceNegativeText: string) {
        await this.expectElementToContainText(
            this.newBalanceNegativePromptLocator,
            newBalanceNegativeText
        );
    }
    /**
     *
     * @param listOfSuppliers
     * @param countOfUniqueSuppliers
     */
    async verifySupplierNamesOnBACSRunStep2(
        listOfSuppliers: string[],
        countOfUniqueSuppliers: number
    ) {
        for (let i = 0; i < countOfUniqueSuppliers; i++) {
            logger.info("Validating supplier names on step 2");
            await expect(
                this.page.locator(this.supplierNameLocator).nth(i)
            ).toHaveText(listOfSuppliers[i]);
        }
    }
}
