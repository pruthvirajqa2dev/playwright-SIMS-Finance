import { expect } from "@playwright/test";
import BasePage from "./BasePage";
/**
 * @author: @pruthvirajqa2dev
 * Home page class for SIMS Finance Home page elements
 */
/**
 * Represents the HomePage class which extends the BasePage.
 * This class contains locators and actions specific to the Home Page of the application.
 *
 * @class HomePage
 * @extends {BasePage}
 *
 * @property {string} pageHeadingText - The text for the page heading.
 * @property {string} newsMessageHeadingText - The text for the news message heading.
 * @property {string} userMessageHeadingText - The text for the user message heading.
 * @property {string} tasksHeadingText - The text for the tasks heading.
 * @property {string} hamburgerMenuBtnLocator - The locator for the hamburger menu button.
 * @property {string} recentHistorySearchInputLocator - The locator for the recent history search input.
 * @property {string} searchResultLocator - The locator for the search result.
 * @property {string} profileMenuDropdownLocator - The locator for the profile menu dropdown.
 * @property {string} logoutLabel - The label text for the logout option.
 * @property {string} menusLocator - The locator for the menus.
 * @property {string} filterInputLocator - The locator for the filter input.
 * @property {string} filterBtnLocator - The locator for the filter button.
 * @property {string} filteredMenuItemLocator - The locator for the filtered menu item.
 * @property {string} helpLinkLocator - The locator for the help link.
 *
 * @method expectPageElementsVisibilityOnLoad - Verifies key page elements are visible after loading.
 * @method clickHamburgerMenuButton - Clicks on the hamburger menu button.
 * @method goToScreenUsingMenusOption - Navigates to a screen using the menus option.
 * @param {string} screen - The screen to navigate to.
 * @method createDynamicScreenNameRegex - Creates a dynamic regex for screen names.
 * @param {string} baseText - The base text to create the regex from.
 * @returns {RegExp} - The generated regex.
 * @method clickScreenLocator - Clicks on a screen locator.
 * @param {string} screen - The screen to click on.
 * @method fillSearchOptions - Enters search criteria into the search textbox.
 * @param {string} search - The search criteria.
 * @method clickSearchOptionInList - Clicks the first search option displayed on the search list.
 * @method clickProfileMenu - Clicks on the profile menu.
 * @method clickLogoutLabel - Clicks on the logout label.
 * @method logout - Logs out the user.
 * @method verifyVisibilityYesNoButton - Verifies the visibility of Yes and No buttons.
 * @method clickyesBtnLocator - Clicks the Yes button.
 * @method clickHelpLink - Clicks on the help link.
 */
export default class HomePage extends BasePage {
    //Locators
    private readonly pageHeadingText = "SIMS Finance";
    private readonly newsMessageHeadingText = "News Messages";
    private readonly userMessageHeadingText = "User Messages";
    private readonly tasksHeadingText = "Tasks";
    private readonly hamburgerMenuBtnLocator = "#banner_navigation_navigate";
    private readonly recentHistorySearchInputLocator =
        "input[type='text']:visible";
    private readonly searchResultLocator = ".ui-menu-item-wrapper";
    private readonly profileMenuDropdownLocator = "#esr_user_profile_menu";
    private readonly logoutLabel = "Click to Logout";
    private readonly menusLocator = "[name*='_esr_nav_ESR_NAV_PANE']";
    private readonly filterInputLocator =
        "input[placeholder='type here to filter...']";
    private readonly filterBtnLocator = "#esr_tree_filter_button";
    private readonly filteredMenuItemLocator =
        "div.esr_tree_selectable[name*=_esr_nav_ESR_MENUS_TREE_]";
    private readonly helpLinkLocator = "[aria-label=Help]";
    private readonly recentHistoryMenuOptionLocator =
        "[aria-label='Your Last 20 Accessed Options']";
    //Constructor

    //Actions
    /**
     * This methods verifies key page elements are visible after loading
     */
    async expectPageElementsVisibilityOnLoad() {
        //Page Heading
        const pageHeading = this.page.getByRole("heading", {
            name: this.pageHeadingText,
            exact: true
        });
        await expect(pageHeading).toBeVisible();

        //News message heading
        const newsMessageHeading = this.page.getByRole("heading", {
            name: this.newsMessageHeadingText,
            exact: true
        });
        expect(newsMessageHeading).toBeVisible();

        //User message heading
        const userMessageHeading = this.page.getByRole("heading", {
            name: this.userMessageHeadingText,
            exact: true
        });
        expect(userMessageHeading).toBeVisible();

        //Task heading
        const tasksHeading = this.page
            .locator("h3")
            .filter({ hasText: this.tasksHeadingText });
        expect(tasksHeading).toBeVisible();
    }
    /**
     * This function clicks on Hamburger menu button
     */
    async clickHamburgerMenuButton() {
        await this.page.locator(this.hamburgerMenuBtnLocator).click();
    }
    /**
     *@param screen
     */
    async goToScreenUsingMenusOption(screen: string) {
        await this.click(this.menusLocator);
        await this.fill(this.filterInputLocator, screen);
        await this.click(this.filterBtnLocator);
        await this.clickScreenLocator(screen);
    }
    /**
     * Navigates to a specified screen using the recent history menu.
     *
     * @param screen - The name of the screen to navigate to.
     *
     * This method performs the following steps:
     * 1. Clicks on the recent history menu option.
     * 2. Fills the search options with the provided screen name.
     * 3. Clicks on the locator corresponding to the specified screen.
     *
     * Ensure that the locators and screen name are correctly configured before calling this method.
     */
    async goToScreenUsingRecentHistory(screen: string) {
        await this.click(this.recentHistoryMenuOptionLocator);
        await this.fillSearchOptions(screen);
        await this.clickSearchOptionInList();
    }
    /**
     *
     * @param baseText
     * @returns
     */
    createDynamicScreenNameRegex(baseText: string): RegExp {
        // Escape any special characters in baseText, then build the regex
        const escapedBaseText = baseText.replace(
            /[.*+?^=!:${}()|\[\]\/\\]/g,
            "\\$&"
        );
        const regexPattern = `${escapedBaseText} \\s*-?\\s*.*`; // Match anything after baseText
        return new RegExp(regexPattern, "i"); // Case-insensitive regex
    }
    /**
     *
     * @param screen
     */
    async clickScreenLocator(screen: string) {
        await this.page
            .locator(this.filteredMenuItemLocator)
            .filter({ hasText: this.createDynamicScreenNameRegex(screen) })
            .first()
            .click();
    }
    /**
     * This function enters search criteria into the search textbox
     * @param search ***UNUSED***
     */
    async fillSearchOptions(search: string) {
        await this.page
            .locator(this.recentHistorySearchInputLocator)
            .fill(search);
    }
    /**
     * This function clicks first search option displayed on the search list ***UNUSED***
     */
    async clickSearchOptionInList() {
        await this.page.locator(this.searchResultLocator).first().click();
    }
    /**
     *This function clicks on profile menu
     */
    async clickProfileMenu() {
        await this.page
            .locator(this.profileMenuDropdownLocator)
            .click()
            .catch((error) => {
                console.error(`Error clicking profile menu dropdown: ${error}`);
                throw error;
            });
    }
    /**
     *
     */
    async clickLogoutLabel() {
        await this.page
            .getByLabel(this.logoutLabel)
            .click()
            .catch((error) => {
                console.error(`Error clicking logout label: ${error}`);
                throw error;
            });
    }
    /**
     *
     */
    async logout() {
        await this.clickProfileMenu();
        await this.clickLogoutLabel();
    }
    /**
     *
     */
    async verifyVisibilityYesNoButton() {
        await expect(
            this.page.locator(this.yesBtnLocator),
            "Expect yes button to be visible"
        ).toBeVisible();
        await expect(
            this.page.locator(this.noBtnLocator),
            "Expect no button to be visible"
        ).toBeVisible();
    }
    /**
     *
     */
    async clickyesBtnLocator() {
        await this.verifyVisibilityYesNoButton();
        await this.page
            .locator(this.yesBtnLocator)
            .click()
            .catch((error) => {
                console.error(`Error clicking yes button: ${error}`);
                throw error;
            });
    }
    /**
     *
     */
    async clickHelpLink() {
        await this.click(this.helpLinkLocator);
    }
}
