# SIMS-Finance (Playwright Non-Cucumber)

A robust end-to-end test automation framework for the **SIMS-Finance** application, built using [Playwright](https://playwright.dev/). This project aims to deliver reliable and maintainable automated tests for web-based workflows.

---

## **Table of Contents**

-   [Features](#features)
-   [Prerequisites](#prerequisites)
-   [Setup Instructions](#setup-instructions)
-   [Running the Tests](#running-the-tests)
-   [Folder Structure](#folder-structure)
-   [Future Enhancements](#future-enhancements)

---

## **Features**

-   Built with Playwright for fast, reliable, and cross-browser testing.
-   Leveraging Page Object Model
-   Comprehensive configuration via `playwright.config.js`.
-   Modular and scalable structure, with support for adding new tests easily.
-   Environment support for running tests across multiple setups (e.g., dev, staging, production).
-   Headed and headless execution modes for efficient testing.
-   Potential integration with reporting tools like Allure.
-   **Linters for Code Quality**:
    -   Integrated ESLint to ensure consistent and high-quality JavaScript/TypeScript code.
    -   Configured Prettier for automated code formatting.

---

## **Prerequisites**

Before running the tests, ensure that the following are installed:

1. **Node.js** (version 16.x or higher)
    - [Download Node.js](https://nodejs.org/)
2. **Playwright**:
    - Installed via `npm install` (steps below).
3. A modern code editor like [Visual Studio Code](https://code.visualstudio.com/).

---

## **Setup Instructions**

1. **Clone the repository**:
    ```bash
    git clone https://github.com/pruthvirajqa2dev/playwright-SIMS-Finance.git
    cd playwright-SIMS-Finance
    ```
2. **Install dependencies**: Run the following command to install required packages:

```bash
npm install
```

3. **Configure the environment**: 

-   Update the playwright.config.js file with the appropriate baseURL for your application.
-   If environment variables are needed, create a .env file at the root of the project with the required key-value pairs.

---

## **Running the Tests**

1. **Run all tests**:

```bash
npx playwright test
```

2. **Run tests in a specific file**:

```bash
npx playwright test tests/filename.spec.js
```

3. **Run tests in headed mode**:

```bash
npx playwright test --headed
```

4. **Generate a detailed report:**

```bash
npx playwright show-report
```

---

## **Folder Structure**

```plaintext
SIMS-Finance--pw-non-cucumber/
│
├── playwright.yml          # yml configuration for github actions workflow jobs
├── src/tests/              # Contains all test files
│   ├── login.spec.js       # Example test case
│   ├── finance.spec.js     # Finance module tests
│
├── src/pages/                  # Page Object Model (POM) files
│   ├── LoginPage.js        # Encapsulates login-related actions
│   ├── FinancePage.js      # Encapsulates finance-specific actions
│
├── src/utils/                  # Utilities for common functions
│   ├── PDFUtils.js         # Reusable methods for handling PDF content
│   ├── FileUtils.js        # Reusable methods for handling File operations
│
├── .prettierrc.json        # Prettier configuration
├── playwright.config.js    # Playwright configuration
├── package.json            # Node.js dependencies and scripts
├── .gitignore              # Ignored files and folders
└── README.md               # Project documentation
```

---

## **Future Enhancements**

1. Implement advanced test coverage for edge cases and error scenarios.

---

## **Contributing**

Contributions are welcome! To contribute:

-   Fork this repository.
-   Create a new branch for your feature/bug fix.
-   Commit your changes with meaningful commit messages.
-   Submit a pull request with a description of the changes.
