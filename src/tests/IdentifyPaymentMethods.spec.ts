import test, { expect, Page, TestInfo } from "@playwright/test";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import ENV from "../config/env";
import expectedTexts from "../data/expectedTexts.json";
import PRL210 from "../pages/PRL210";
import logger from "../logging/logger";
import * as fs from "fs";
import path from "path";
import PDFUtils from "../utils/PDFUtils";
import FileUtils from "../utils/FileUtils";

async function login(page: Page, testInfo: TestInfo) {
    const loginPage = new LoginPage(page, testInfo);
    //Login using username and password
    const homepage: HomePage = await loginPage.login(
        ENV.USERID!,
        ENV.PASSWORD!,
        testInfo
    );

    return homepage;
}
test.describe(
    "Identify payment methods on " + `${process.env.test_env}`.toUpperCase(),
    () => {
        //Test case 1
        test("Identify payment methods", async ({ page }, testInfo) => {
            test.info().annotations.push({
                type: "Identify payment methods",
                description:
                    "This test is for performing identification of payment methods for supplier in a tenant for user " +
                    ENV.USERID!
            });
            const chequeOrBacs = "BACS";
            //Login
            const homepage =
                await test.step(`Login using ${ENV.USERID!}`, async () => {
                    return await login(page, testInfo);
                });
            logger.info("Login to the application");

            await test.step(`Expect home page elements visible on Load`, async () => {
                const filePath = testInfo.outputPath(
                    homepage.screenshotPath,
                    "/Homepage.png"
                );
                await page.screenshot({
                    path: filePath
                });
                testInfo.attachments.push({
                    name: "screenshot",
                    path: filePath,
                    contentType: "image/png"
                });
                await homepage.expectPageElementsVisibilityOnLoad();
                logger.info("Home Page elements visibility verified on load");
            });
            const screen = expectedTexts.PRL210;
            const prl210 =
                await test.step(`Go to the screen ${screen}`, async () => {
                    await homepage.clickHamburgerMenuButton();
                    await homepage.goToScreenUsingMenusOption(screen);
                    return new PRL210(page, testInfo);
                });
            logger.info(`Navigate to screen ${screen}`);

            await test.step("Verify valid page elements are visible", async () => {
                await prl210.expectPageElementsVisibilityOnLoad();
            });
            let count = 0;
            await test.step("", async () => {
                const mapOfSuppliers = new Map();
                function addValueToKey(key, value) {
                    if (!mapOfSuppliers.has(key)) {
                        mapOfSuppliers.set(key, []);
                    }
                    mapOfSuppliers.get(key).push(value);
                    logger.info(`Key-value- ${key}:${mapOfSuppliers.get(key)}`);
                }
                const suppliers = await prl210.getSuppliersElements();
                let supplierCount = suppliers.length;
                logger.info(`Total Supplier Count=${supplierCount}`);
                if (supplierCount === 1) {
                    return 0;
                }
                let iterator = 0;
                let suppList: string[] = [];
                for (const supplier of suppliers) {
                    await supplier.dblclick();
                    await prl210.clickContactDetailsTabCard();
                    const supplierName: string | null =
                        await prl210.getSupplierNameFromDetails();
                    logger.info(`Supplier Name: ${supplierName}`);
                    await prl210.clickPaymentDetailsTabCard();
                    const paymentMethod: string | null =
                        await prl210.getPaymentMethod();
                    logger.info(
                        `Payment Methods ${iterator} : ${paymentMethod}`
                    );
                    if (paymentMethod.trim() === chequeOrBacs) {
                        addValueToKey(paymentMethod.trim(), supplierName);
                        count++;
                    }
                    logger.info(`Iteration ${iterator++}`);
                    page.waitForLoadState("load");
                    await prl210.clickCancelButton();
                    if (count == 1) {
                        break;
                    }
                }
                suppList = Array.from(mapOfSuppliers.values()).flat();
                logger.info(`supplist:${suppList}`);
                for (const supplier of suppList) {
                    logger.info(`Supplier: ${supplier}`);
                }
                const timestamp = String(
                    "" +
                        new Date().getDate() +
                        new Date().getMonth() +
                        new Date().getHours() +
                        new Date().getMinutes()
                );
                // const unzipDir = process.cwd() + "/PDFDownloads/unzip*/";

                // await PDFUtils.readLatestPDFFromLatestUnzipDir(unzipDir);
                const dir = path.join(process.cwd(), expectedTexts.testFileDir);
                // `${process.cwd()}/${expectedTexts.testFileDir}/`;
                fs.writeFile(
                    `${dir}/${chequeOrBacs + timestamp}.TXT`,
                    suppList.toString(),
                    (err) => {
                        `Error while creating a file ${err}`;
                    }
                );
                // const fullPath = path.join(
                //     __dirname,
                //     "../../",
                //     expectedTexts.testFileDir,
                //     filePath
                // );
                // logger.info(`fullpath: ${fullPath}`);

                // const fileName = await FileUtils.latestFileNameLookup(
                //     `${dir}/${chequeOrBacs + timestamp}.TXT`
                // );
                const filePath = `${dir}/${chequeOrBacs + timestamp}.TXT`;
                const resolvedFilePath = path.resolve(filePath);
                if (!fs.existsSync(resolvedFilePath)) {
                    console.error(
                        `File does not exist at path: ${resolvedFilePath}`
                    );
                } else {
                    const fileContent = fs.readFileSync(
                        resolvedFilePath,
                        "utf-8"
                    );
                    console.log(fileContent);
                }
                // const dataBuffer = fs.readFileSync(resolvedFilePath);
                // logger.info(dataBuffer);
                logger.info(`Current Working Directory:${process.cwd()}`);
                logger.info(`Current __dirname:${__dirname}`);

                if (!fs.existsSync(filePath)) {
                    logger.error(`File does not exist at path: ${filePath}`);
                } else {
                    logger.info("File exists. Attempting to read...");
                    try {
                        const fileContent = fs.readFileSync(filePath);
                        logger.info(
                            `File content:\n${fileContent.toString("hex")}`
                        );
                    } catch (error) {
                        logger.error(`Error reading file: ${error.message}`);
                    }
                }

                // const readFileContent: string = await PDFUtils.readPDF(
                //     `${dir}/${chequeOrBacs + timestamp}.TXT`
                // );
                // const arr: string[] = readFileContent.split(",");
                // logger.info(`Content: ${arr.length}`);
            });
        });
    }
);
