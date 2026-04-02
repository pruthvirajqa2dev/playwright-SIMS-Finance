import test, { expect, Page, TestInfo } from "@playwright/test";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import ENV from "../config/env";
import expectedTexts from "../data/expectedTexts.json";
import paths from "../data/paths.json";
import PRL614Q from "../pages/PRL/PRL614Q";
import logger from "../logging/logger";
import PRL300Q from "../pages/PRL/PRL300Q";
import FileUtils from "../utils/FileUtils";
import InvoiceCalc from "../utils/InvoiceCalc";
import { ExcelHandler } from "../utils/ExcelHandler";
import { InvoiceDataParser } from "../utils/parsers/InvoiceDataParser";

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
test.describe("BACS Run " + `${process.env.TEST_ENV}`.toUpperCase(), () => {
    //Test case 1
    test("BACS Payment Run", async ({ page }, testInfo) => {
        test.info().annotations.push({
            type: "BACS Payment Run",
            description:
                "This test is for performing BACS Payment Run in a tenant for user " +
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
        var screen = expectedTexts.PRL614Q;

        var prl614q: PRL614Q =
            await test.step(`Go to the screen ${screen}`, async () => {
                await homepage.clickHamburgerMenuButton();
                await homepage.goToScreenUsingMenusOption(screen);
                return new PRL614Q(page, testInfo);
            });
        logger.info(`Navigate to screen ${screen}`);

        await test.step("Verify valid page elements are visible", async () => {
            await prl614q.expectPageElementsVisibilityOnLoad();
        });
        await test.step("Sort the records with BACS Date file to get the latest record first", async () => {
            await prl614q.sortTheRecordsWithBACSFileDate(); //Click once for Descending order
        });
        await test.step("Check if BACS Run with Entered/Confirmed Status is not present", async () => {
            await prl614q.checkForEnteredConfirmedStatus();
        });

        screen = expectedTexts.PRL300Q;

        const prl300q: PRL300Q =
            await test.step(`Go to the screen ${screen}`, async () => {
                await homepage.clickHamburgerMenuButton();
                await homepage.goToScreenUsingMenusOption(screen);
                return new PRL300Q(page, testInfo);
            });
        logger.info(`Navigate to screen ${screen}`);

        await test.step("Verify valid page elements are visible", async () => {
            await prl300q.expectPageElementsVisibilityOnLoad();
        });
        await test.step("Select school Id and click on search", async () => {
            await prl300q.selectSchoolId(expectedTexts.expectedSchoolName);
            await prl300q.clickSearchBtn();
        });

        await test.step("Get the list of all the suppliers with payment method BACS and add invoices fot the same", async () => {
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
            const countOfUniqueSuppliers = 3;
            const countOfInvoicesPerSupplier = 10;
            //Handler and parser for invoice data
            const invoiceHandler = new ExcelHandler(paths.invoiceDataFilePath);
            const invoiceParser = new InvoiceDataParser(invoiceHandler);
            const invoiceData = invoiceParser.parse(paths.invoiceDataSheetName);
            for (let counter = 0; counter < countOfUniqueSuppliers; counter++) {
                for (let i = 0; i < countOfInvoicesPerSupplier; i++) {
                    let randomIndex;
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
                            Math.floor(randomQuantity * randomUnitPrice * 100) /
                                100
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

                    logger.info(
                        "Selecting supplier and verifying supplier text"
                    );
                    await prl300q.verifySupplierTextOnOrderDetailsScreen(
                        suppliersAcceptingBACS[i]
                    );
                    // await page.waitForLoadState("load");
                    await prl300q.fillInvoiceDateOnOrderDetailsScreen();

                    await prl300q.fillInvoiceFiguresOnOrderDetailsScreen(
                        expectedTotalInvoiceValue.toString(),
                        vatAmount.toString()
                    );
                    logger.info("Filled invoice date and figures");

                    const invoiceReference: string =
                        "INV" +
                        Math.floor(Math.random() * 1000000) +
                        counter.toString();
                    logger.info("Invoice Reference: " + invoiceReference);
                    await prl300q.fillInvoiceReferenceOnOrderDetailsScreen(
                        invoiceReference
                    );
                    addValueToKey(
                        "invoiceRef" + i.toString(),
                        invoiceReference
                    );

                    //***************Line Details screen******************
                    await prl300q.addLineDetails(costCentre);
                    await prl300q.fillQuantityAndUnitPrice(
                        randomQuantity.toString(),
                        randomUnitPrice.toString()
                    );
                    await prl300q.selectVatCode(randomVatCode);
                    const expectedVatAmount = String(
                        vatAmount !== 0
                            ? Intl.NumberFormat("en-US", {
                                  minimumFractionDigits: 2
                              }).format((vatAmount * 100) / 100)
                            : "0.00"
                    );
                    await prl300q.expectVatValueToBeCalculated(
                        expectedVatAmount.toString()
                    );
                    await prl300q.expectTotalInvoiceValueToBeCalculated(
                        expectedTotalInvoiceValue.toString()
                    );
                    await prl300q.click(prl300q.saveBtnLocator);
                    await prl300q.compareQuantityAndUnitPriceOnLineGrid(
                        randomQuantity,
                        randomUnitPrice
                    );
                    await prl300q.compareLineGridDetails(netInvoice, vatAmount);
                    await prl300q.compareVatCodeOnLineGrid(randomVatCode);
                    await prl300q.click(prl300q.finishAndSaveBtnLocator);

                    await prl300q.dismissErrorPrompt();
                    await prl300q.expectOrderDetailsScreenToBeVisible(
                        vatAmount
                    );
                }
            }
        });
        var screen = expectedTexts.PRL614Q;
        var prl614q =
            await test.step(`Go to the screen ${screen}`, async () => {
                await homepage.clickHamburgerMenuButton();
                await homepage.goToScreenUsingMenusOption(screen);
                logger.info(`Navigate to screen ${screen}`);
                return new PRL614Q(page, testInfo);
            });
        await test.step(`Create new BACS run`, async () => {
            logger.info(`Click on new button`);
            await prl614q.clickEsrMultiBtnUsingText(expectedTexts.newText);
            logger.info(`Select School ID and click on search button`);

            await prl614q.selectSchoolId(expectedTexts.expectedSchoolName);
            await page.waitForLoadState("load");
            logger.info(`Fill narrative`);

            const narrative =
                "TestNarrBACSRun" +
                new Date().getHours() +
                new Date().getMinutes();
            await prl614q.fillNarrativeInputAndVerify(narrative);
            (
                await prl614q.getByRole("heading", {
                    name: "Submission Parameters"
                })
            ).click();
            logger.info(`Double click on refresh button`);

            await prl614q.click(prl614q.refreshBtnLocator);
            logger.info(`Please wait dialog box`);

            await prl614q.checkIfDialogExistsWithTitle(
                expectedTexts.pleaseWaitText
            );
            await prl614q.expectElementToContainText(
                prl614q.processingControlLocator,
                expectedTexts.pendingText
            );
            await prl614q.expectElementToBeVisibleUsingLocator(
                prl614q.supplierNameLocator,
                { timeout: 120000 }
            );
            logger.info(`Selecting all txn`);
            await prl614q.selectAllTxns();

            logger.info(`Click next btn`);

            await prl614q.clickNextBtn();
            await prl614q.checkIfDialogExistsWithTitle(
                expectedTexts.recordSelectionText
            );
            logger.info(`New balance prompt`);

            await prl614q.verifyNewBalanceNegativePrompt(
                expectedTexts.newBalanceNegativeText
            );
            logger.info(`Click yes button`);

            await prl614q.clickYesBtnLocator();
            await prl614q.checkIfDialogExistsWithTitle(
                expectedTexts.recordSelectionText
            );
            logger.info(`Click ok button`);

            await prl614q.clickMsgBoxOkBtn();
            // await prl614q.verifySupplierNamesOnBACSRunStep2(
            //     suppliersAcceptingBACS,countOfUniqueSuppliers
            // );
        });
    });
});
