# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Post-Deployment-Tests/PostChecksTests.spec.ts >> Postchecks on environment:UAT >> RSS310Q - Attachments @shard2
- Location: src/tests/Post-Deployment-Tests/PostChecksTests.spec.ts:445:13

# Error details

```
Test timeout of 200000ms exceeded.
```

```
Error: locator.click: Test timeout of 200000ms exceeded.
Call log:
  - waiting for locator('[aria-label=\'Your Last 20 Accessed Options\']').first()
    - locator resolved to <li tabindex="0" data-tag="1" data-tipped="true" form="sid9522_esr_nav" data-control_owner_id="" data-page_name="esr_nav" data-type="NAVIGATIONPANE" name="sid9522_esr_nav_ESR_NAV_PANE" data-control_owner="NAVIGATIONPANE" class="navigation_section_selected_li" onblur="esr_ControlBlur(this, event);" onclick="esr_ControlClick(this, event);" onfocus="esr_ControlFocus(this, event);" id="sid9522_esr_nav_ESR_NAV_PANE_HISTORY" aria-label="Your Last 20 Accessed Options" onchange="esr_ControlChange(this, ev…>…</li>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - element is outside of the viewport
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - element is outside of the viewport
    - retrying click action
      - waiting 100ms
    376 × waiting for element to be visible, enabled and stable
        - element is visible, enabled and stable
        - scrolling into view if needed
        - done scrolling
        - element is outside of the viewport
      - retrying click action
        - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic "Click here to show the navigation panel" [ref=e7] [cursor=pointer]: 
        - generic "Click here to navigate to your homepage" [ref=e8] [cursor=pointer]
      - heading "SIMS Finance" [level=2] [ref=e10]
      - text: 
      - generic [ref=e12]:
        - heading "SIMS Finance Demo Site 130" [level=3] [ref=e13]
        - generic [ref=e14] [cursor=pointer]: 
        - text: 
        - generic [ref=e15] [cursor=pointer]:
          - generic [ref=e16]:  
          - text: Finance Director
          - generic [ref=e17]: 
    - text:   
  - generic [ref=e20]:
    - generic [ref=e22]:
      - generic [ref=e24]:
        - button "Quick Launch" [active] [ref=e31] [cursor=pointer]:
          - generic [ref=e33]: 
        - text: 
        - button "Spaces" [ref=e40] [cursor=pointer]:
          - generic [ref=e42]: 
        - text: 
        - button "Recent History" [ref=e49] [cursor=pointer]:
          - generic [ref=e51]: 
        - text:     
        - button "Favourites" [ref=e58] [cursor=pointer]:
          - generic [ref=e60]: 
        - text:    
        - generic: 
      - generic [ref=e62] [cursor=pointer]:
        - generic [ref=e63]: 
        - generic [ref=e64]: 
    - generic [ref=e66]:
      - generic [ref=e68]:
        - text: 
        - list [ref=e70]:
          - generic [ref=e72]:
            - generic [ref=e75]: 
            - generic [ref=e76]: Last successful login was Friday, 04-Sept-2026 13:32:36.
        - text: 
      - table [ref=e77]:
        - rowgroup [ref=e78]:
          - row "News Messages No News Messages Found User Messages No User Messages Found Tasks Refresh this module 'ADM017' 2 Tasks  View 2 View  Overdue 0 Due Soon 0 Upcoming Priority Tasks Overdue  Q Credit Notes Requiring Authorisation Credit Note CRNBEFORE for Eastern Water Authority for -£123.00 requires Authorisation by you. Overdue  Q Credit Notes Requiring Authorisation Credit Note CRDN00001 for GLS for -£3513.51 requires Authorisation by you.  View All Task Summary More  Q Credit Notes Requiring Authorisation (2) Favourites NML400 - Accounts Master/Transaction Enquiry - Green Abbey School RSS310Q - Purchase Orders" [ref=e79]:
            - cell "News Messages No News Messages Found User Messages No User Messages Found Tasks Refresh this module 'ADM017' 2 Tasks  View 2 View  Overdue 0 Due Soon 0 Upcoming Priority Tasks Overdue  Q Credit Notes Requiring Authorisation Credit Note CRNBEFORE for Eastern Water Authority for -£123.00 requires Authorisation by you. Overdue  Q Credit Notes Requiring Authorisation Credit Note CRDN00001 for GLS for -£3513.51 requires Authorisation by you.  View All Task Summary More  Q Credit Notes Requiring Authorisation (2)" [ref=e80]:
              - list [ref=e82]:
                - listitem [ref=e83]:
                  - heading "News Messages" [level=3] [ref=e85]
                  - generic [ref=e94]: No News Messages Found
                - listitem [ref=e95]:
                  - heading "User Messages" [level=3] [ref=e97]
                  - generic [ref=e106]: No User Messages Found
                - listitem [ref=e107]:
                  - generic [ref=e108]:
                    - heading "Tasks" [level=3] [ref=e109]
                    - generic "Refresh this module 'ADM017'" [ref=e111] [cursor=pointer]: 
                  - generic [ref=e114]:
                    - table [ref=e116]:
                      - rowgroup [ref=e117]:
                        - row "2 Tasks  View 2 View  Overdue 0 Due Soon 0 Upcoming" [ref=e118]:
                          - cell "2 Tasks  View" [ref=e119]:
                            - generic [ref=e124]:
                              - generic [ref=e128]:
                                - heading "2" [level=1] [ref=e129]
                                - heading "Tasks" [level=5] [ref=e130]
                              - generic [ref=e132]:
                                - generic [ref=e134]: 
                                - generic [ref=e135]: View
                          - cell "2 View  Overdue 0 Due Soon 0 Upcoming" [ref=e136]:
                            - generic [ref=e141]:
                              - generic [ref=e142]:
                                - heading "2" [level=5] [ref=e145]
                                - generic [ref=e146]:
                                  - generic [ref=e147]:
                                    - heading "View" [level=5] [ref=e148]
                                    - generic [ref=e149]: 
                                  - generic [ref=e150]: Overdue
                              - generic [ref=e151]:
                                - heading "0" [level=5] [ref=e154]
                                - generic [ref=e156]: Due Soon
                              - generic [ref=e157]:
                                - heading "0" [level=5] [ref=e160]
                                - generic [ref=e162]: Upcoming
                    - table [ref=e165]:
                      - rowgroup [ref=e166]:
                        - row "Priority Tasks" [ref=e167]:
                          - cell "Priority Tasks" [ref=e168]:
                            - generic [ref=e170]: Priority Tasks 
                    - generic [ref=e171]:
                      - generic [ref=e175]:
                        - generic [ref=e176]:
                          - generic [ref=e178]:
                            - generic [ref=e180]: 
                            - heading "Overdue" [level=5] [ref=e181]
                          - generic [ref=e182]:
                            - generic [ref=e184]: 
                            - generic [ref=e185]:
                              - text: Q Credit Notes Requiring Authorisation
                              - text: Credit Note CRNBEFORE for Eastern Water Authority for -£123.00 requires Authorisation by you.
                        - generic [ref=e186]:
                          - generic [ref=e188]:
                            - generic [ref=e190]: 
                            - heading "Overdue" [level=5] [ref=e191]
                          - generic [ref=e192]:
                            - generic [ref=e194]: 
                            - generic [ref=e195]:
                              - text: Q Credit Notes Requiring Authorisation
                              - text: Credit Note CRDN00001 for GLS for -£3513.51 requires Authorisation by you.
                      - generic [ref=e202]:
                        - generic [ref=e204]: 
                        - generic [ref=e205]: View All
                    - table [ref=e208]:
                      - rowgroup [ref=e209]:
                        - row "Task Summary" [ref=e210]:
                          - cell "Task Summary" [ref=e211]:
                            - generic [ref=e213]: Task Summary 
                    - table [ref=e216]:
                      - rowgroup [ref=e217]:
                        - row "More  Q Credit Notes Requiring Authorisation (2)" [ref=e218]:
                          - cell [ref=e219]:
                            - generic [ref=e223]:  􏀭
                          - cell "More  Q Credit Notes Requiring Authorisation (2)" [ref=e224]:
                            - generic [ref=e226]:
                              - generic [ref=e227]:
                                - heading "More" [level=5] [ref=e228]
                                - generic [ref=e229]: 
                              - generic [ref=e230]: Q Credit Notes Requiring Authorisation (2)
                              - text: 
            - cell "Favourites NML400 - Accounts Master/Transaction Enquiry - Green Abbey School RSS310Q - Purchase Orders" [ref=e231]:
              - list [ref=e233]:
                - listitem [ref=e234]:
                  - heading "Favourites" [level=3] [ref=e236]
                  - generic [ref=e244]:
                    - generic [ref=e245]:
                      - generic [ref=e248]: 
                      - generic [ref=e250]: NML400 - Accounts Master/Transaction Enquiry - Green Abbey School
                    - generic [ref=e251]:
                      - generic [ref=e254]: 
                      - generic [ref=e256]: RSS310Q - Purchase Orders
  - status [ref=e257]
  - dialog [ref=e258]:
    - button " Close" [ref=e261] [cursor=pointer]:
      - generic [ref=e262]: 
      - text: Close
    - generic [ref=e265]:
      - table [ref=e267]:
        - rowgroup [ref=e268]:
          - row "Type to filter menus or enter Option Id to launch. Click to open a new browser window" [ref=e269]:
            - cell "Type to filter menus or enter Option Id to launch." [ref=e270]:
              - generic [ref=e276]:
                - generic [ref=e277]: Launch
                - generic [ref=e278]:
                  - textbox "Type to filter menus or enter Option Id to launch." [ref=e279]:
                    - /placeholder: type here to search for options...
                  - text: 
            - cell "Click to open a new browser window" [ref=e280]:
              - table [ref=e283]:
                - rowgroup [ref=e284]:
                  - row "Click to open a new browser window" [ref=e285]:
                    - cell "Click to open a new browser window" [ref=e286]:
                      - generic [ref=e288]:
                        - link "Click to open a new browser window" [ref=e289] [cursor=pointer]:
                          - /url: "#"
                          - text: New Window
                        - text: 
      - table [ref=e291]:
        - rowgroup [ref=e292]:
          - row "Menus Your Last 20 Accessed Options Favourites Homepages Tools Crystal AND XQuery Reports you have access to by Security Group Business Intelligence Your last 10 Submitted Documents Your last 10 Submitted Jobs Tasks that require your attention User Details Help AND About User Documentation NML510 - Trial Balance Report (Standard) RSS310Q - Purchase Orders XQUERY - SIMS Trial Balance School SPC420 - File Manager RSS570 - Outstanding Accruals CMS570 - Bank Reconciliation Report XQUERY - SIMS Package Periods BDM710Q - SIMS Personnel Data Upload SPC400 - SPC Job Enquiry PRL614Q - BACS Processing SPC411 - Report Viewer (User) NML630 - Period End SIM850 - Period End Report RSS820 - Period End Update CMS800 - Period End Update FAM800 - Depreciation Processing PRL800 - Period End Update SLS800 - Period End Update FAM804 - Period End Update NML400 - Account Enquiry" [ref=e293]:
            - cell "Menus Your Last 20 Accessed Options Favourites Homepages Tools Crystal AND XQuery Reports you have access to by Security Group Business Intelligence Your last 10 Submitted Documents Your last 10 Submitted Jobs Tasks that require your attention User Details Help AND About User Documentation" [ref=e294]:
              - list [ref=e298]:
                - listitem [ref=e299]:
                  - generic [ref=e301]: 
                  - link "Menus" [ref=e302] [cursor=pointer]:
                    - /url: "#"
                - listitem "Your Last 20 Accessed Options" [ref=e303]:
                  - generic [ref=e305]: 
                  - link "Your Last 20 Accessed Options" [ref=e306] [cursor=pointer]:
                    - /url: "#"
                    - text: Recent History
                  - text: 
                - listitem [ref=e307]:
                  - generic [ref=e309]: 
                  - link "Favourites" [ref=e310] [cursor=pointer]:
                    - /url: "#"
                - listitem [ref=e311]:
                  - generic [ref=e313]: 
                  - link "Homepages" [ref=e314] [cursor=pointer]:
                    - /url: "#"
                - listitem [ref=e315]:
                  - generic [ref=e317]: 
                  - link "Tools" [ref=e318] [cursor=pointer]:
                    - /url: "#"
                - listitem "Crystal AND XQuery Reports you have access to by Security Group" [ref=e319]:
                  - generic [ref=e321]: 
                  - link "Crystal AND XQuery Reports you have access to by Security Group" [ref=e322] [cursor=pointer]:
                    - /url: "#"
                    - text: Reports
                - listitem "Business Intelligence" [ref=e323]:
                  - generic [ref=e325]: 
                  - link "Business Intelligence" [ref=e326] [cursor=pointer]:
                    - /url: "#"
                    - text: IBI
                - listitem "Your last 10 Submitted Documents" [ref=e327]:
                  - generic [ref=e329]: 
                  - link "Your last 10 Submitted Documents" [ref=e330] [cursor=pointer]:
                    - /url: "#"
                    - text: Document Updates
                - listitem "Your last 10 Submitted Jobs" [ref=e331]:
                  - generic [ref=e333]: 
                  - link "Your last 10 Submitted Jobs" [ref=e334] [cursor=pointer]:
                    - /url: "#"
                    - text: Job Controller
                - listitem "Tasks that require your attention" [ref=e335]:
                  - generic [ref=e337]: 
                  - link "Tasks that require your attention" [ref=e338] [cursor=pointer]:
                    - /url: "#"
                    - text: Tasks
                - listitem [ref=e339]:
                  - generic [ref=e341]: 
                  - link "User Details" [ref=e342] [cursor=pointer]:
                    - /url: "#"
                - listitem "Help AND About" [ref=e343]:
                  - generic [ref=e345]: 
                  - link "Help AND About" [ref=e346] [cursor=pointer]:
                    - /url: "#"
                    - text: Help
                - listitem [ref=e347]:
                  - generic [ref=e349]: 
                  - link "User Documentation" [ref=e350] [cursor=pointer]:
                    - /url: "#"
            - cell "NML510 - Trial Balance Report (Standard) RSS310Q - Purchase Orders XQUERY - SIMS Trial Balance School SPC420 - File Manager RSS570 - Outstanding Accruals CMS570 - Bank Reconciliation Report XQUERY - SIMS Package Periods BDM710Q - SIMS Personnel Data Upload SPC400 - SPC Job Enquiry PRL614Q - BACS Processing SPC411 - Report Viewer (User) NML630 - Period End SIM850 - Period End Report RSS820 - Period End Update CMS800 - Period End Update FAM800 - Depreciation Processing PRL800 - Period End Update SLS800 - Period End Update FAM804 - Period End Update NML400 - Account Enquiry" [ref=e352]:
              - generic [ref=e361]:
                - generic [ref=e362]:
                  - generic [ref=e365]: 
                  - generic [ref=e367]: NML510 - Trial Balance Report (Standard)
                - generic [ref=e368]:
                  - generic [ref=e371]: 
                  - generic [ref=e373]: RSS310Q - Purchase Orders
                - generic [ref=e374]:
                  - generic [ref=e377]: 
                  - generic [ref=e379]: XQUERY - SIMS Trial Balance School
                - generic [ref=e380]:
                  - generic [ref=e383]: 
                  - generic [ref=e385]: SPC420 - File Manager
                - generic [ref=e386]:
                  - generic [ref=e389]: 
                  - generic [ref=e391]: RSS570 - Outstanding Accruals
                - generic [ref=e392]:
                  - generic [ref=e395]: 
                  - generic [ref=e397]: CMS570 - Bank Reconciliation Report
                - generic [ref=e398]:
                  - generic [ref=e401]: 
                  - generic [ref=e403]: XQUERY - SIMS Package Periods
                - generic [ref=e404]:
                  - generic [ref=e407]: 
                  - generic [ref=e409]: BDM710Q - SIMS Personnel Data Upload
                - generic [ref=e410]:
                  - generic [ref=e413]: 
                  - generic "SPC400 - SPC Job Enquiry" [ref=e415]: SPC400 - Job Enquiry
                - generic [ref=e416]:
                  - generic [ref=e419]: 
                  - generic [ref=e421]: PRL614Q - BACS Processing
                - generic [ref=e422]:
                  - generic [ref=e425]: 
                  - generic [ref=e427]: SPC411 - Report Viewer (User)
                - generic [ref=e428]:
                  - generic [ref=e431]: 
                  - generic [ref=e433]: NML630 - Period End
                - generic [ref=e434]:
                  - generic [ref=e437]: 
                  - generic [ref=e439]: SIM850 - Period End Report
                - generic [ref=e440]:
                  - generic [ref=e443]: 
                  - generic [ref=e445]: RSS820 - Period End Update
                - generic [ref=e446]:
                  - generic [ref=e449]: 
                  - generic [ref=e451]: CMS800 - Period End Update
                - generic [ref=e452]:
                  - generic [ref=e455]: 
                  - generic [ref=e457]: FAM800 - Depreciation Processing
                - generic [ref=e458]:
                  - generic [ref=e461]: 
                  - generic [ref=e463]: PRL800 - Period End Update
                - generic [ref=e464]:
                  - generic [ref=e467]: 
                  - generic [ref=e469]: SLS800 - Period End Update
                - generic [ref=e470]:
                  - generic [ref=e473]: 
                  - generic [ref=e475]: FAM804 - Period End Update
                - generic [ref=e476]:
                  - generic [ref=e479]: 
                  - generic [ref=e481]: NML400 - Account Enquiry
      - table [ref=e485]:
        - rowgroup [ref=e486]:
          - row "Launch Options In New Window" [ref=e487]:
            - cell [ref=e488]
            - cell "Launch Options In New Window" [ref=e489]:
              - generic [ref=e490]: Launch Options In New Window
            - cell "Launch Options In New Window" [ref=e491]:
              - generic [ref=e493]:
                - checkbox "Launch Options In New Window" [ref=e494] [cursor=pointer]: 
                - text: 
  - status [ref=e496]
```

# Test source

```ts
  77  |     private readonly _saveAllBtnLocator = "#save_all";
  78  |     public get saveAllBtnLocator(): string {
  79  |         return this._saveAllBtnLocator;
  80  |     }
  81  | 
  82  |     protected _closeBtnLocator = "#btn_close";
  83  |     public get closeBtnLocator(): string {
  84  |         return this._closeBtnLocator;
  85  |     }
  86  |     private readonly _breadcrumbLocator = "div[id*=esr_breadcrumb]";
  87  |     public get breadcrumbLocator(): string {
  88  |         return this._breadcrumbLocator;
  89  |     }
  90  |     private readonly _attachmentBtnLocator = "#esr_attachments_button";
  91  |     public get attachmentBtnLocator(): string {
  92  |         return this._attachmentBtnLocator;
  93  |     }
  94  |     private readonly _btnElementListLocator = "div.esr_multibutton";
  95  |     public get btnElementListLocator(): string {
  96  |         return this._btnElementListLocator;
  97  |     }
  98  |     private readonly _multiBtnLocator = ".multibutton_content";
  99  |     public get multiBtnLocator(): string {
  100 |         return this._multiBtnLocator;
  101 |     }
  102 |     private readonly _commonDhxBtnLocator = ".dhx_button";
  103 |     public get commonDhxBtnLocator(): string {
  104 |         return this._commonDhxBtnLocator;
  105 |     }
  106 |     private readonly pdfIconLocator =
  107 |         "div[style*='background-image : url(/staticcontent/images/core/ui/16_16/pdf.png);']";
  108 | 
  109 |     private readonly _fileNameAfterUploadLocator = ".dhx_list-item--name";
  110 |     public get fileNameAfterUploadLocator(): string {
  111 |         return this._fileNameAfterUploadLocator;
  112 |     }
  113 |     private readonly _successMarkLocator = "*[class^=dhx_item--success-mark]";
  114 |     public get successMarkLocator(): string {
  115 |         return this._successMarkLocator;
  116 |     }
  117 |     private readonly _upArrowLocator = ".fa-sort-amount-up";
  118 |     public get upArrowLocator(): string {
  119 |         return this._upArrowLocator;
  120 |     }
  121 |     protected _downArrowLocator = ".fa-sort-amount-down";
  122 |     public get downArrowLocator(): string {
  123 |         return this._downArrowLocator;
  124 |     }
  125 |     private readonly _sortableGridLocator = ".esr_grid_sort_span ";
  126 |     public get sortableGridLocator(): string {
  127 |         return this._sortableGridLocator;
  128 |     }
  129 | 
  130 |     private readonly _sortIconLocator = "span.esr_grid_sort_span.fa";
  131 |     public get sortIconLocator(): string {
  132 |         return this._sortIconLocator;
  133 |     }
  134 | 
  135 |     private readonly _searchBtnLocator = "#search_button";
  136 |     public get searchBtnLocator() {
  137 |         return this._searchBtnLocator;
  138 |     }
  139 |     private readonly esrMsgBoxOkBtnLocator = "#esr_messagebox_ok";
  140 |     protected readonly summaryBtnLabel = "Summary";
  141 | 
  142 |     screenshotPath =
  143 |         "test-results/Postchecks/RunOn" +
  144 |         new Date().toLocaleDateString("en-GB").replace(/\//g, "") +
  145 |         "/" +
  146 |         "Hour " +
  147 |         new Date().getHours();
  148 |     //Actions
  149 | 
  150 |     // Common navigation methods
  151 |     /**
  152 |      * This function is for navigating to provided resource/endpoint
  153 |      * @param url
  154 |      */
  155 |     async navigateTo(url: string) {
  156 |         await this.page.goto(url);
  157 |     }
  158 |     /**
  159 |      *
  160 |      */
  161 |     async navigateBack() {
  162 |         await this.page.goBack();
  163 |     }
  164 |     /**
  165 |      *
  166 |      */
  167 |     async navigateForward() {
  168 |         await this.page.goForward();
  169 |     }
  170 | 
  171 |     // Common element interaction methods
  172 |     /**
  173 |      *
  174 |      * @param locator
  175 |      */
  176 |     async click(locator: string) {
> 177 |         await this.page.locator(locator).first().click();
      |                                                  ^ Error: locator.click: Test timeout of 200000ms exceeded.
  178 |     }
  179 |     /**
  180 |      *
  181 |      * @param locator
  182 |      */
  183 |     async dblClick(locator: string) {
  184 |         await this.page.locator(locator).first().dblclick();
  185 |     }
  186 |     /**
  187 |      *
  188 |      * @param locator
  189 |      */
  190 |     async check(locator: string) {
  191 |         await this.page.check(locator);
  192 |     }
  193 |     /**
  194 |      *
  195 |      * @param locator
  196 |      */
  197 |     async checkAndVerify(locator: string) {
  198 |         await this.check(locator);
  199 |         expect(await this.page.isChecked(locator)).toBeTruthy();
  200 |     }
  201 |     /**
  202 |      *
  203 |      * @param locator
  204 |      * @param text
  205 |      */
  206 |     async fill(locator: string, text: string) {
  207 |         await this.page.locator(locator).click();
  208 |         await this.page.locator(locator).fill(text, { force: true });
  209 |     }
  210 |     /**
  211 |      *
  212 |      * @param locator
  213 |      * @param text
  214 |      */
  215 |     async fillTextAndVerify(locator: string, text: string) {
  216 |         // Fill text
  217 |         logger.info(`Fill text ${text} in locator ${locator}`);
  218 |         await this.fill(locator, text);
  219 |         //Verify Text filled
  220 |         logger.info(`Expecting text ${text} in locator ${locator}`);
  221 |         await this.expectElementToContainText(locator, text);
  222 |     }
  223 |     /**
  224 |      *
  225 |      * @param locator
  226 |      * @param text
  227 |      */
  228 |     async fillTextAndVerifyValue(locator: string, value: string) {
  229 |         // Fill text
  230 |         logger.info(`Fill text ${value} in locator ${locator}`);
  231 |         await this.fill(locator, value);
  232 |         //Verify Text filled
  233 |         logger.info(`Expecting value ${value} in locator ${locator}`);
  234 |         await this.expectElementToContainText(locator, value);
  235 |     }
  236 |     /**
  237 |      *
  238 |      * @param locator
  239 |      * @param value
  240 |      */
  241 |     async selectOption(locator: string, value: string) {
  242 |         await this.page.locator(locator).selectOption(value);
  243 |     }
  244 | 
  245 |     // Advanced element interaction methods
  246 |     /**
  247 |      *
  248 |      * @param role
  249 |      * @param options
  250 |      * @returns
  251 |      */
  252 |     async getByRole(
  253 |         role: any,
  254 |         options?: { name?: string; hidden?: boolean; exact?: boolean }
  255 |     ): Promise<Locator> {
  256 |         return this.page.getByRole(role, options);
  257 |     }
  258 |     /**
  259 |      *
  260 |      * @param label
  261 |      * @returns
  262 |      */
  263 |     async getByLabel(
  264 |         label: string,
  265 |         options?: { name?: string; hidden?: boolean; exact?: boolean }
  266 |     ): Promise<Locator> {
  267 |         return this.page.getByLabel(label, options);
  268 |     }
  269 |     /**
  270 |      *
  271 |      * @param placeholder
  272 |      * @returns
  273 |      */
  274 |     async getByPlaceholder(placeholder: string): Promise<Locator> {
  275 |         return this.page.getByPlaceholder(placeholder);
  276 |     }
  277 |     /**
```