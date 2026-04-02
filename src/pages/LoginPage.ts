import HomePage from "./HomePage";
import BasePage from "./BasePage";
import * as fs from "fs";
import * as path from "path";
import { TestInfo } from "@playwright/test";
/**
 * @author: @pruthvirajqa2dev
 * SIMS Finance Login page class with locators
 */
/**
 * Represents the login page of the application.
 * Extends the BasePage class to inherit common page functionalities.
 */
export default class LoginPage extends BasePage {
    //Locators
    private readonly usernameInputLocator = ".username";
    private readonly passwordInputLocator = ".password";
    private readonly loginBtnLocator = ".go_button";

    //Actions
    /**
     * Fills in the username and password fields on the login page.
     *
     * @param username - The username to be entered.
     * @param password - The password to be entered.
     */
    async fillUsernameAndPassword(username: string, password: string) {
        console.log(`Filling username: ${username}`);
        await this.page.locator(this.usernameInputLocator).fill(username);
        await this.page.locator(this.passwordInputLocator).fill(password);
    }

    /**
     * Logs in to the application using the provided username and password.
     * Takes a screenshot of the login page and saves it to the specified path.
     *
     * @param username - The username to be used for login.
     * @param password - The password to be used for login.
     * @param testInfo - Information about the current test, used for logging and screenshot paths.
     * @returns A promise that resolves to an instance of the HomePage class.
     */
    async login(
        [username, password]: [string, string],
        testInfo: TestInfo
    ): Promise<HomePage> {
        await this.navigateTo("/");
        await this.fillUsernameAndPassword(username, password);

        // console.log("Path is " + this.screenshotPath + "/" + testInfo.title);
        // if (
        //     !fs.existsSync(path.join(this.screenshotPath, "/", testInfo.title))
        // ) {
        //     fs.mkdirSync(path.join(this.screenshotPath, "/", testInfo.title), {
        //         recursive: true
        //     });
        // }
        // await this.page.screenshot({
        //     path: this.screenshotPath + "/Login.png"
        // });

        const homepage: HomePage = await this.clickLoginBtn(testInfo);
        return homepage;
    }
    async externalLogin(
        [username, password]: [string, string],
        testInfo: TestInfo
    ): Promise<HomePage> {
        await this.navigateTo("https://uat-v2.pecuniam-online.co.uk");
        await this.fillUsernameAndPassword(username, password);

        // console.log("Path is " + this.screenshotPath + "/" + testInfo.title);
        // if (
        //     !fs.existsSync(path.join(this.screenshotPath, "/", testInfo.title))
        // ) {
        //     fs.mkdirSync(path.join(this.screenshotPath, "/", testInfo.title), {
        //         recursive: true
        //     });
        // }
        // await this.page.screenshot({
        //     path: this.screenshotPath + "/Login.png"
        // });

        const homepage: HomePage = await this.clickLoginBtn(testInfo);
        return homepage;
    }

    /**
     * Clicks the login button on the login page.
     * Handles any errors that occur during the click action.
     *
     * @param testInfo - Information about the current test, used for logging and navigation.
     * @returns A promise that resolves to an instance of the HomePage class.
     */
    async clickLoginBtn(testInfo: any): Promise<HomePage> {
        await this.page
            .locator(this.loginBtnLocator)
            .click()
            .catch((error) => {
                console.error(`Error clicking login button: ${error}`);
                throw error;
            });

        const homePage = new HomePage(this.page, testInfo);
        return homePage;
    }
}
