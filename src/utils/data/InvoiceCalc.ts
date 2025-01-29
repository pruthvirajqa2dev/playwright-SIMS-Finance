export default class InvoiceCalc {
    static readonly costCentreArr = [
        "ESFA Grants",
        "Pupil Premium",
        "NCTL Grants",
        "LA Grants",
        "Catering",
        "Lettings",
        "Music Lessons",
        "Services of Staff"
        // "Donations"
        // "Capital Funding"
    ];
    static readonly quantArr = [1.2, 2.3, 3.4, 4.5, 5.6, 6.7, 7.8, 8.9, 9.1];
    static readonly unitPriceArr = [
        120.12, 230.23, 340.34, 450.45, 560.56, 670.67, 780.78
    ];
    static readonly vatCodeArr = ["EXM", "NON", "RED", "STD", "ZER"];

    static calcVatPercent(vatCode): number {
        let vatPercent;
        switch (vatCode) {
            case "EXM":
            case "NON":
            case "ZER":
                vatPercent = 0;
                break;
            case "RED":
                vatPercent = 5;
                break;
            case "STD":
                vatPercent = 20;
                break;
            default:
                vatPercent = undefined;
                break;
        }
        return vatPercent;
    }
}
