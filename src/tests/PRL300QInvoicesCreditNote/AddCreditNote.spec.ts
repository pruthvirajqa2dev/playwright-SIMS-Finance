import test, { expect, Page, TestInfo } from "@playwright/test";
import LoginPage from "../../pages/LoginPage";
import HomePage from "../../pages/HomePage";
import ENV from "../../config/env";
import expectedTexts from "../../data/expectedTexts.json";
import paths from "../../data/paths.json";
import logger from "../../logging/logger";
import PRL300Q from "../../pages/PRL/PRL300Q";
import FileUtils from "../../utils/FileUtils";
import InvoiceCalc from "../../utils/InvoiceCalc";
import labels from "../../data/labels.json";
import { ExcelHandler } from "../../utils/excel/ExcelHandler";
import { InvoiceDataParser } from "../../utils/parsers/InvoiceDataParser";

/**
 *Function to login to the application
 *
 * @param page
 * @param testInfo
 * @returns
 */

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
/**
 *   * Test Suite: Add Credit Note
 * Description: This test suite is designed to test the functionality of adding a credit note in the application.
 * Pre-requisites: Ensure that the test environment is set up with the necessary configurations and data.
 * Test Steps:
 * 1. Login to the application using valid credentials.
 * 2. Navigate to the PRL300Q screen.
 * 3. Select the school ID and document type as "Credit Note".
 * 4. Click on the search button to retrieve suppliers.
 * 5. For each supplier accepting BACS payment method, add a credit note with the following details:
 *     - Select a cost centre.
 *     - Generate a random quantity and unit price.
 *     - Calculate the VAT code and amount.
 *     - Fill in the invoice date and figures.
 *     - Fill in the credit note reference.
 *     - Add line details with the selected cost centre, quantity, unit price, and VAT code.
 * 6. Save the credit note and verify that it is successfully added.
 *
 * @remarks
 * This test suite is part of the PRL300QInvoicesCreditNote module and is designed to ensure that the credit note functionality works as expected.
 *
 * @module AddCreditNote.spec.ts
 *  * @author Pruthviraj
 *  * @date 2023-10-01
 *  * @version 1.0
 *
 *
 *  */
test.describe(
    "Add Credit Note " + `${process.env.test_env}`.toUpperCase(),
    () => {
        //Test case 1
        test("Add Credit Note ", async ({ page }, testInfo) => {
            const documentType: string = "Credit Note";
            test.info().annotations.push({
                type: "Add Credit Note ",
                description:
                    "This test is for testing Add Credit Note " + ENV.USERID!
            });
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
            var screen = expectedTexts.PRL300Q;

            const prl300q: PRL300Q =
                await test.step(`Go to the screen ${screen}`, async () => {
                    await homepage.clickHamburgerMenuButton();
                    await homepage.goToScreenUsingRecentHistory(screen);
                    return new PRL300Q(page, testInfo);
                });
            logger.info(`Navigate to screen ${screen}`);

            await test.step("Verify valid page elements are visible", async () => {
                await prl300q.expectPageElementsVisibilityOnLoad();
            });

            await test.step("Select school Id and click on search", async () => {
                if (ENV.USERID! == "FINDIR99D130") {
                    await prl300q.selectSchoolId(
                        expectedTexts.expectedSchoolName
                    );
                }
                await prl300q.selectDocumentType(labels.creditNoteLbl);
                await prl300q.clickSearchBtn();
            });

            await test.step("Get the list of all the suppliers with payment method BACS and add invoices for the same", async () => {
                const fileName = await FileUtils.latestFileNameLookup(
                    `${process.cwd()}/Test Files/BACS*.TXT`
                );
                console.log(
                    "filename=" +
                        fileName.split("\\")[fileName.split("\\").length - 1]
                );
                const fileContent = await FileUtils.readFileAsync(fileName);
                console.log("fileContent=" + fileContent);

                const suppliersAcceptingBACS = fileContent.split(",");
                expect(suppliersAcceptingBACS.length).toBeGreaterThan(0);

                logger.info(
                    `Suppliers accepting BACS payment method are: ${suppliersAcceptingBACS}`
                );
                const invoiceReferencesMap = new Map();
                function addValueToKey(key, value) {
                    if (!invoiceReferencesMap.has(key)) {
                        invoiceReferencesMap.set(key, []);
                    }
                    invoiceReferencesMap.get(key).push(value);
                    logger.info(
                        `Key-value- ${key}:${invoiceReferencesMap.get(key)}`
                    );
                }
                const countOfUniqueSuppliers = 1;
                const countOfInvoicesPerSupplier = 1;
                //Handler and parser for invoice data
                const invoiceHandler = new ExcelHandler(
                    paths.invoiceDataFilePath
                );
                const invoiceParser = new InvoiceDataParser(invoiceHandler);
                const invoiceData = invoiceParser.parse(
                    paths.invoiceDataSheetName
                );

                for (
                    let counter = 0;
                    counter < countOfUniqueSuppliers;
                    counter++
                ) {
                    for (let i = 0; i < countOfInvoicesPerSupplier; i++) {
                        const costCentre =
                            invoiceData[
                                Math.floor(Math.random() * invoiceData.length)
                            ].costCentre;

                        logger.info("Cost Centre: " + costCentre);
                        const randomQuantity =
                            invoiceData[
                                Math.floor(Math.random() * invoiceData.length)
                            ].quantity;

                        logger.info("Quantity: " + randomQuantity);

                        const randomUnitPrice =
                            invoiceData[
                                Math.floor(Math.random() * invoiceData.length)
                            ].unitPrice;
                        logger.info("Unit Price: " + randomUnitPrice);

                        const randomVatCode =
                            invoiceData[
                                Math.floor(Math.random() * invoiceData.length)
                            ].vatCode;
                        logger.info("Vat Code: " + randomVatCode);

                        const randomVatPercent =
                            InvoiceCalc.calcVatPercent(randomVatCode) ?? 0;
                        logger.info("Vat Percent: " + randomVatPercent);

                        let netInvoice = parseFloat(
                            String(
                                Math.floor(
                                    randomQuantity * randomUnitPrice * 100
                                ) / 100
                            )
                        );
                        logger.info("Net Invoice: " + netInvoice);
                        const vatAmount =
                            Math.round(
                                ((netInvoice * randomVatPercent) / 100) * 100
                            ) / 100;
                        logger.info("VAT Amount: " + vatAmount);
                        const expectedTotalInvoiceValue =
                            Math.floor((netInvoice + vatAmount) * 100) / 100;
                        logger.info(
                            "Total Invoice Value: " + expectedTotalInvoiceValue
                        );
                        await prl300q.clickEsrMultiBtnUsingText(
                            expectedTexts.newText
                        );
                        logger.info("Click new button with dropdown");

                        logger.info("Checking credit note radio button");
                        await prl300q.checkCreditNoteRadioBtn();

                        await prl300q.click(prl300q.selectBtnLocator);

                        await prl300q.click(prl300q.supplierIconLocator);
                        logger.info(
                            "Double clicking supplier " +
                                suppliersAcceptingBACS[i] +
                                " from lookup popup"
                        );
                        await prl300q.clickSelectForSupplierName(
                            suppliersAcceptingBACS[i]
                        );
                        const numberOfLines = 1;
                        logger.info(
                            "Selecting supplier and verifying supplier text"
                        );
                        await prl300q.verifySupplierTextOnOrderDetailsScreen(
                            suppliersAcceptingBACS[i]
                        );
                        // await page.waitForLoadState("load");
                        await prl300q.fillInvoiceDateOnOrderDetailsScreen();

                        await prl300q.fillInvoiceFiguresOnOrderDetailsScreen(
                            (
                                expectedTotalInvoiceValue * numberOfLines
                            ).toString(),
                            (vatAmount * numberOfLines).toString()
                        );
                        logger.info("Filled invoice date and figures");

                        if (documentType == "Invoice") {
                            const documentReference: string =
                                expectedTexts.referenceStringInvoice +
                                Math.floor(Math.random() * 1000000) +
                                counter.toString();
                            logger.info(
                                "Invoice Reference: " + documentReference
                            );
                            await prl300q.fillInvoiceReferenceOnOrderDetailsScreen(
                                documentReference
                            );
                            addValueToKey(
                                "invoiceRef" + i.toString(),
                                documentReference
                            );
                        } else if (documentType == "Credit Note") {
                            const documentReference: string =
                                expectedTexts.referenceStringCreditNote +
                                Math.floor(Math.random() * 1000000) +
                                counter.toString();
                            logger.info(
                                "Credit Note Reference: " + documentReference
                            );
                            await prl300q.fillInvoiceReferenceOnOrderDetailsScreen(
                                documentReference
                            );
                            addValueToKey(
                                "invoiceRef" + i.toString(),
                                documentReference
                            );
                        }

                        //***************Line Details screen******************
                        for (let j = 0; j < numberOfLines; j++) {
                            await page.waitForLoadState("load");
                            await prl300q.addLineDetails(costCentre);
                            await prl300q.fillQuantityAndUnitPrice(
                                randomQuantity.toString(),
                                randomUnitPrice.toString()
                            );
                            await prl300q.selectVatCode(randomVatCode);
                            await prl300q.click(prl300q.saveBtnLocator);
                        }
                        await prl300q.click(prl300q.finishAndSaveBtnLocator);

                        await prl300q.dismissErrorPrompt();
                        await prl300q.expectOrderDetailsScreenToBeVisible(
                            vatAmount
                        );
                    }
                }
            });
        });
    }
);
