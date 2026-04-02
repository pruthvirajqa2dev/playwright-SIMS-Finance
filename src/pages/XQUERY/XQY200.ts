import BasePage from "../BasePage";
import expectedTexts from "../../data/expectedTexts.json";
import { expect, Page } from "@playwright/test";

/**
 * @author: @pruthvirajqa2dev
 * This page class is for XQuery SIMS_PERIODS screen related page elements and actions on them
 */
/**
 * Represents the XQY200 page.
 * This class provides methods to interact with and verify elements on the XQY200 page.
 *
 * @extends BasePage
 *
 * @property {string} pageHeadingText - The text of the page heading.
 *
 *
 * @method expectPageElementsVisibilityOnLoad - Verifies that key page elements are visible after loading.
 *
 */
export default class XQY200 extends BasePage {
    //Locators and Texts
    private readonly pageHeadingText = "XQY200 - XQuery Builder";

    //Actions
    /**
     * @author: @pruthvirajqa2dev
     * This methods verifies key page elements are visible after loading
     */
    async expectPageElementsVisibilityOnLoad() {
        //Page Heading
        expect(this.isHeadingVisibleByText(this.pageHeadingText)).toBeTruthy();
    }
}
