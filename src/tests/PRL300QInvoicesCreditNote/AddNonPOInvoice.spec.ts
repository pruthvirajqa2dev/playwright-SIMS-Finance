import test, { expect, Page, TestInfo } from "@playwright/test";
import LoginPage from "../../pages/LoginPage";
import HomePage from "../../pages/HomePage";
import ENV from "../../config/env";
import expectedTexts from "../../data/expectedTexts.json";
import paths from "../../data/paths.json";
import logger from "../../logging/logger";
import PRL300Q from "../../pages/PRL/PRL300Q";
import FileUtils from "../../utils/FileUtils";
import { InvoiceDataParser } from "../../utils/parsers/InvoiceDataParser";
import { ExcelHandler } from "../../utils/ExcelHandler";
import InvoiceCalc from "../../utils/InvoiceCalc";
/**
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
 * Test suite for adding Purchase Order Invoices
 * @group PRL300Q
 * @group Invoices
 * @group NonPurchasePOInvoice
 *
 * This test suite is designed to test the functionality of adding Non Purchase Order Invoices
 *
 * It includes the following steps:
 * 1. Login to the application
 * 2. Navigate to the PRL300Q screen
 * 3. Search for suppliers accepting BACS payment method
 * 4. Add invoices for the suppliers
 * 5. Verify the invoice details
 * 6. Validate the invoice totals and VAT amounts
 * 7. Ensure the invoice is saved successfully
 * 8. Dismiss any error prompts
 * 9. Verify the order details screen is displayed with the correct VAT amount
 * 10. Log the invoice references for future reference
 * 11. Ensure the test passes with all assertions met
 * @remarks
 * This test suite is part of the PRL300Q Invoices Credit Note tests and is designed to ensure that Non Purchase Order Invoices can be added successfully.
 * It includes various checks and validations to ensure the functionality works as expected.
 * @author Pruthviraj
 * @version 1.0
 * @since 2023-10-01
 * @description
 * This test suite is designed to test the functionality of adding Non Purchase Order Invoices in the PRL300Q screen.
 * It includes steps to log in, navigate to the screen, search for suppliers, add invoices, and verify the details.
 * It also includes validations for invoice totals and VAT amounts, ensuring the invoice is saved successfully, and dismissing any error prompts.
 * The test suite logs the invoice references for future reference and ensures that all assertions are met for a successful test run.
 *
 * @example
 * ```typescript
 * import { test } from '@playwright/test';
 *   import PRL300Q from '../../pages/PRL/PRL300Q';
 *   import InvoiceCalc from '../../utils/data/InvoiceCalc';
 *   test.describe('Non Purchase PO Invoice Tests', () => {
 *   test('Add Non Purchase Order Invoice', async ({ page }, testInfo) => {
 *   const prl300q = new PRL300Q(page, testInfo);
 *   await prl300q.addNonPurchaseOrderInvoice();
 *  });
 *  });
 * ```
 */
test.describe(
    "Non purchase PO Invoice " + `${process.env.test_env}`.toUpperCase(),
    () => {
        //Test case 1
        test("Non purchase PO Invoice ", async ({ page }, testInfo) => {
            const documentType = "Invoice";
            test.info().annotations.push({
                type: "Non purchase PO Invoice ",
                description:
                    "This test is for testing Non purchase PO Invoice " +
                    ENV.USERID!
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

                        if (
                            expectedTexts.invoiceType ==
                            "Non Purchase Order Invoice"
                        ) {
                            logger.info(
                                "Checking non purchase order invoice radio button"
                            );
                            await prl300q.checkNonPurchaseOrderInvoiceRadioBtn();
                        }
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
                        const numberOfLines = 1; // Assuming 1 line for simplicity
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
