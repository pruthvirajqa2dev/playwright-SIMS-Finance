import BasePage from "./BasePage";
import elementAttributes from "../data/elementAttributes.json";
import expectedTexts from "../data/expectedTexts.json";
import { expect, Page } from "@playwright/test";
// <reference lib="dom"/>

/**
 * @author: @pruthvirajqa2dev
 * This page class is for RSS310Q screen related page elements and actions on them
 */
export default class RSS310Q extends BasePage {
    //Locators and Texts
    private readonly pageHeadingText = "RSS310Q - Purchase Orders";
    private readonly searchBtnLocator = "#search_button";
    private readonly viewBtnListLocator = ".esr_multibutton:contains('View')";
    // private readonly viewBtnListLocator = "div[id*=esr_breadcrumb]";

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
}
