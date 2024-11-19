import HomePage from "./HomePage";
import BasePage from "./BasePage";
import * as fs from "fs";
import * as path from "path";
import { TestInfo } from "@playwright/test";
/**
 * @author: @pruthvirajqa2dev
 * SIMS Finance Login page class with locators
 */
export default class LoginPage extends BasePage {
    //Locators
    private readonly usernameInputLocator = ".username";
    private readonly passwordInputLocator = ".password";
    private readonly loginBtnLocator = ".go_button";

    //Actions
    /**
     *
     * @param username
     * @param password
     */
    async fillUsernameAndPassword(username: string, password: string) {
        await this.page.locator(this.usernameInputLocator).fill(username);
        await this.page.locator(this.passwordInputLocator).fill(password);
    }
    /**
     *
     * @param username
     * @param password
     * @param testInfo
     * @returns
     */
    async login(
        username: string,
        password: string,
        testInfo: TestInfo
    ): Promise<HomePage> {
        await this.navigateTo("/");
        await this.fillUsernameAndPassword(username, password);

        console.log("Path is " + this.screenshotPath + "/" + testInfo.title);
        if (
            !fs.existsSync(path.join(this.screenshotPath, "/", testInfo.title))
        ) {
            fs.mkdirSync(path.join(this.screenshotPath, "/", testInfo.title), {
                recursive: true
            });
        }
        await this.page.screenshot({
            path: this.screenshotPath + "/Login.png"
        });

        const homepage: HomePage = await this.clickLoginBtn(testInfo);
        return homepage;
    }
    /**
     *
     * @param testInfo
     * @returns
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
