import { expect, Page } from "@playwright/test";
import exp from "constants";
import BasePage from "./BasePage";
/**
 * @author: @pruthvirajqa2dev
 * Home page class for SIMS Finance Home page elements
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
    private readonly searchResult = ".ui-menu-item-wrapper";
    private readonly profileMenuDropdown = "#esr_user_profile_menu";
    private readonly logoutLabel = "Click to Logout";

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
     * This function enters search criteria into the search textbox
     * @param search
     */
    async fillSearchOptions(search: string) {
        await this.page
            .locator(this.recentHistorySearchInputLocator)
            .fill(search);
    }
    /**
     * This function clicks first search option displayed on the search list
     */
    async clickSearchOptionInList() {
        await this.page.locator(this.searchResult).first().click();
    }
    /**
     *This function clicks on profile menu
     */
    async clickProfileMenu() {
        await this.page
            .locator(this.profileMenuDropdown)
            .click()
            .catch((error) => {
                console.error(`Error clicking profile menu dropdown: ${error}`);
                throw error;
            });
    }
    async clickLogoutLabel() {
        await this.page
            .getByLabel(this.logoutLabel)
            .click()
            .catch((error) => {
                console.error(`Error clicking logout label: ${error}`);
                throw error;
            });
    }
    async logout() {
        await this.clickProfileMenu();
        await this.clickLogoutLabel();
    }

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
}
