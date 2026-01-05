export type PurchaseOrderLine = {
    suppliersItemReference: string;
    description: string;
    quantity: string;
    unitPrice: string;
    discount: string;
    vatCode: string;
    glCode: glCode;
    deliveryDate: string;
};
export type glCode = {
    costCentreCode: string;
    ledgerCode: string;
    fundCode: string;
};
export const VAT_CODES = [
    "EXM - Exempt",
    "NON - Non Business",
    "RED - Reduced Rate",
    "STD - Standard Rate",
    "ZER - Zero Rated"
];
export async function getRandomAmount(
    min: number,
    max: number
): Promise<number> {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}
export async function getRandomIntegerAmount(
    min: number,
    max: number
): Promise<number> {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//EXM - Exempt
//NON - Non Business
//RED - Reduced Rate
//STD - Standard Rate
//ZER - Zero Rated
