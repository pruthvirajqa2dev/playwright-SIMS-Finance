import BasePage from "../BasePage";

/**
 * @author: @pruthvirajqa2dev
 * This page class is for CMS370Q screen related page elements and actions on them
 */

export default class CMS370Q extends BasePage {
    //Locators and Texts
    private readonly pageHeadingText = "CMS370Q - Payment Entry";
    //Actions
    /**
     * @author: @pruthvirajqa2dev
     * This methods verifies key page elements are visible after loading
     */
    async expectPageElementsVisibilityOnLoad() {
        //Page Heading
        await this.isHeadingVisibleByText(this.pageHeadingText);
    }
}
