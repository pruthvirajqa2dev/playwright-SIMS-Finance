# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Post-Deployment-Tests/PostChecksTests.spec.ts >> Postchecks on environment:UAT >> RSS310Q - Attachments @shard2
- Location: src/tests/Post-Deployment-Tests/PostChecksTests.spec.ts:445:13

# Error details

```
Error: locator.dblclick: Error: strict mode violation: locator('.esr_grid_sort_span').locator('..') resolved to 2 elements:
    1) <div>…</div> aka locator('#LINE_NO > div')
    2) <div>…</div> aka locator('#SAVED_DATE > div')

Call log:
  - waiting for locator('.esr_grid_sort_span').locator('..')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic "Click here to show the navigation panel" [ref=e7] [cursor=pointer]: 
        - generic "Click here to navigate to your homepage" [ref=e8] [cursor=pointer]
      - heading "RSS310Q - Purchase Orders" [level=2] [ref=e10]
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
  - text: 
  - generic [ref=e19]:
    - generic [ref=e21]:
      - generic [ref=e23]:
        - button "Quick Launch" [ref=e30] [cursor=pointer]:
          - generic [ref=e32]: 
        - text: 
        - button "Spaces" [ref=e39] [cursor=pointer]:
          - generic [ref=e41]: 
        - text: 
        - button "Recent History" [ref=e48] [cursor=pointer]:
          - generic [ref=e50]: 
        - text:     
        - button "Favourites" [ref=e57] [cursor=pointer]:
          - generic [ref=e59]: 
        - text:    
        - generic: 
      - generic [ref=e61] [cursor=pointer]:
        - generic [ref=e62]: 
        - generic [ref=e63]: 
    - generic [ref=e67]:
      - generic [ref=e74]:
        - button [ref=e76] [cursor=pointer]:
          - generic [ref=e77]:
            - generic [ref=e80]: 
            - generic [ref=e81]: Attachments (67)
        - button "Diary (0)" [ref=e83] [cursor=pointer]:
          - generic [ref=e85]:  􏁳
          - text: Diary (0)
        - text: 
        - button "Options" [ref=e87] [cursor=pointer]:
          - generic [ref=e89]: 
          - text: Options
      - generic [ref=e91]:
        - generic [ref=e92]:
          - generic [ref=e93]: Search Criteria
          - text: »
          - generic [ref=e94]: Header Results
          - text: »
          - generic [ref=e95]: Header Details (000000009)
        - generic [ref=e96]:
          - generic [ref=e97]:
            - heading "Details" [level=1] [ref=e98]
            - generic:
              - table:
                - rowgroup: 
          - generic [ref=e100]:
            - heading "Header Details" [level=1] [ref=e101]
            - table [ref=e102]:
              - rowgroup [ref=e103]:
                - row "Buyer 000001 Green Abbey Buyer Requisitioner 010001 Green Abbey Finance Clerk Requisitioning Point 000001 Green Abbey Admin Location Code 000001 Location Code Green Abbey School Supplier 00005 Supplier Eastern Water Authority Order Status C Fully Received Order Book 001 Purchase Order No. 000000009 Purchase Order Date 05/08/2024 Monday, 05 August 2024 Punchout Delivery Details Default Lead Time Preferred Delivery Day Delivery Time" [ref=e104]:
                  - cell "Buyer 000001 Green Abbey Buyer Requisitioner 010001 Green Abbey Finance Clerk Requisitioning Point 000001 Green Abbey Admin Location Code 000001 Location Code Green Abbey School Supplier 00005 Supplier Eastern Water Authority Order Status C Fully Received" [ref=e105]:
                    - table [ref=e108]:
                      - rowgroup [ref=e109]:
                        - row "Buyer 000001 Green Abbey Buyer" [ref=e110]:
                          - cell "Buyer" [ref=e111]:
                            - generic [ref=e112]: Buyer
                          - cell "000001 Green Abbey Buyer" [ref=e113]:
                            - generic [ref=e115]:
                              - textbox "Buyer" [ref=e116]: "000001"
                              - text: 
                            - text: Green Abbey Buyer
                        - row "Requisitioner 010001 Green Abbey Finance Clerk" [ref=e117]:
                          - cell "Requisitioner" [ref=e118]:
                            - generic [ref=e119]: Requisitioner
                          - cell "010001 Green Abbey Finance Clerk" [ref=e120]:
                            - generic [ref=e122]:
                              - textbox "Requisitioner" [ref=e123]: "010001"
                              - text: 
                            - text: Green Abbey Finance Clerk
                        - row "Requisitioning Point 000001 Green Abbey Admin" [ref=e124]:
                          - cell "Requisitioning Point" [ref=e125]:
                            - generic [ref=e126]: Requisitioning Point
                          - cell "000001 Green Abbey Admin" [ref=e127]:
                            - generic [ref=e129]:
                              - textbox "Requisitioning Point" [ref=e130]: "000001"
                              - text: 
                            - text: Green Abbey Admin
                        - row "Location Code 000001 Location Code Green Abbey School" [ref=e131]:
                          - cell "Location Code" [ref=e132]:
                            - generic [ref=e133]: Delivery Location
                          - cell "000001 Location Code Green Abbey School" [ref=e134]:
                            - generic [ref=e135]:
                              - generic [ref=e136]:
                                - textbox "Location Code" [ref=e137]: "000001"
                                - text: 
                              - button "Location Code" [disabled] [ref=e140]: Address
                            - text: Green Abbey School
                        - row "Supplier 00005 Supplier Eastern Water Authority" [ref=e141]:
                          - cell "Supplier" [ref=e142]:
                            - generic [ref=e143]: Supplier
                          - cell "00005 Supplier Eastern Water Authority" [ref=e144]:
                            - generic [ref=e145]:
                              - generic [ref=e146]:
                                - textbox "Supplier" [ref=e147]: "00005"
                                - text: 
                              - button "Supplier" [ref=e150] [cursor=pointer]: Supplier Details
                            - text: Eastern Water Authority
                        - row "Order Status C Fully Received" [ref=e151]:
                          - cell "Order Status" [ref=e152]:
                            - generic [ref=e153]: Status
                          - cell "C Fully Received" [ref=e154]:
                            - generic [ref=e156]:
                              - textbox "Order Status" [ref=e157]: C
                              - text: 
                            - text: Fully Received
                  - cell "Order Book 001 Purchase Order No. 000000009 Purchase Order Date 05/08/2024 Monday, 05 August 2024 Punchout" [ref=e158]:
                    - table [ref=e161]:
                      - rowgroup [ref=e162]:
                        - row "Order Book 001" [ref=e163]:
                          - cell "Order Book" [ref=e164]:
                            - generic [ref=e165]: Order Book
                          - cell "001" [ref=e166]:
                            - generic [ref=e167]:
                              - generic [ref=e168]:
                                - textbox "Order Book" [ref=e169]: "001"
                                - text: 
                              - generic [ref=e171]:
                                - img
                        - row "Purchase Order No. 000000009" [ref=e172]:
                          - cell "Purchase Order No." [ref=e173]:
                            - generic [ref=e174]: Purchase Order No.
                          - cell "000000009" [ref=e175]:
                            - generic [ref=e177]:
                              - textbox "Purchase Order No." [ref=e178]: "000000009"
                              - text: 
                        - row "Purchase Order Date 05/08/2024 Monday, 05 August 2024" [ref=e179]:
                          - cell "Purchase Order Date" [ref=e180]:
                            - generic [ref=e181]: Purchase Order Date
                          - cell "05/08/2024 Monday, 05 August 2024" [ref=e182]:
                            - generic [ref=e184]:
                              - textbox "Purchase Order Date" [ref=e185]: 05/08/2024
                              - text: 
                            - text: Monday, 05 August 2024
                        - row "Punchout" [ref=e186]:
                          - cell "Punchout" [ref=e187]:
                            - generic [ref=e188]: Punchout
                          - cell "Punchout" [ref=e189]:
                            - generic [ref=e191]:
                              - checkbox "Punchout" [disabled] [ref=e192] [cursor=pointer]: 
                              - text: 
                        - text: 
                  - cell "Delivery Details Default Lead Time Preferred Delivery Day Delivery Time" [ref=e193]:
                    - table [ref=e196]:
                      - rowgroup [ref=e197]:
                        - row "Delivery Details" [ref=e198]:
                          - cell "Delivery Details" [ref=e199]
                        - row "Default Lead Time" [ref=e200]:
                          - cell "Default Lead Time" [ref=e201]:
                            - generic [ref=e202]: Lead Time
                          - cell [ref=e203]:
                            - generic [ref=e205]:
                              - textbox "Default Lead Time" [ref=e206]
                              - text: 
                        - row "Preferred Delivery Day" [ref=e207]:
                          - cell "Preferred Delivery Day" [ref=e208]:
                            - generic [ref=e209]: Delivery Date
                          - cell [ref=e210]:
                            - generic [ref=e212]:
                              - textbox "Preferred Delivery Day" [ref=e213]
                              - text: 
                        - row "Delivery Time" [ref=e214]:
                          - cell "Delivery Time" [ref=e215]:
                            - generic [ref=e216]: Time
                          - cell [ref=e217]:
                            - generic [ref=e219]:
                              - textbox "Delivery Time" [ref=e220]
                              - text: 
        - generic [ref=e223]:
          - heading "Notes" [level=1] [ref=e224]
          - table [ref=e226]:
            - rowgroup [ref=e227]:
              - row "Notes" [ref=e228]:
                - cell "Notes" [ref=e229]:
                  - generic [ref=e230]: Notes
                - cell [ref=e231]:
                  - generic [ref=e233]:
                    - textbox "Notes" [ref=e234]
                    - text: 
              - row [ref=e235]:
                - cell [ref=e236]
                - cell [ref=e237]:
                  - generic [ref=e239]:
                    - textbox [ref=e240]
                    - text: 
              - row [ref=e241]:
                - cell [ref=e242]
                - cell [ref=e243]:
                  - generic [ref=e245]:
                    - textbox [ref=e246]
                    - text: 
        - generic [ref=e248]:
          - heading "Line Details" [level=1] [ref=e249]
          - generic "Grid Summary :" [ref=e252]:
            - generic [ref=e255]:
              - generic [ref=e261]:
                - button "Refresh grid" [ref=e262] [cursor=pointer]:
                  - generic [ref=e264]: 
                - button "Export grid data" [ref=e265] [cursor=pointer]:
                  - generic [ref=e267]: 
              - generic [ref=e268]:
                - table "Grid Summary :" [ref=e269]:
                  - rowgroup [ref=e270]:
                    - row "Line No. Supplier's Item Reference Product Description Quantity Unit Price Discount Net Amount GL Code Status Cancelled Action" [ref=e271]:
                      - columnheader "Line No." [ref=e272] [cursor=pointer]:
                        - generic [ref=e273]:
                          - generic [ref=e274]: 
                          - generic [ref=e275]: Line No.
                      - columnheader "Supplier's Item Reference" [ref=e276] [cursor=pointer]:
                        - generic [ref=e278]: Supplier's Item Reference
                      - columnheader "Product" [ref=e279] [cursor=pointer]:
                        - generic [ref=e281]: Product
                      - columnheader "Description" [ref=e282] [cursor=pointer]:
                        - generic [ref=e284]: Description
                      - columnheader "Quantity" [ref=e285] [cursor=pointer]:
                        - generic [ref=e287]: Quantity
                      - columnheader "Unit Price" [ref=e288] [cursor=pointer]:
                        - generic [ref=e290]: Unit Price
                      - columnheader "Discount" [ref=e291] [cursor=pointer]:
                        - generic [ref=e293]: Discount
                      - columnheader "Net Amount" [ref=e294] [cursor=pointer]:
                        - generic [ref=e296]: Net Amount
                      - columnheader "GL Code" [ref=e297] [cursor=pointer]:
                        - generic [ref=e299]: GL Code
                      - columnheader "Status" [ref=e300] [cursor=pointer]:
                        - generic [ref=e302]: Status
                      - columnheader "Cancelled" [ref=e303] [cursor=pointer]:
                        - generic [ref=e305]: Cancelled
                      - columnheader "Action" [ref=e306] [cursor=pointer]:
                        - generic [ref=e308]: Action
                    - row "           Clear Filters" [ref=e309]:
                      - columnheader "" [ref=e310]:
                        - textbox "Enter Text to Filter on Line No." [ref=e311]:
                          - /placeholder: Filter
                        - text:  
                      - columnheader "" [ref=e312]:
                        - textbox "Enter Text to Filter on Supplier's Item Reference" [ref=e313]:
                          - /placeholder: Filter
                        - text:  
                      - columnheader "" [ref=e314]:
                        - textbox "Enter Text to Filter on Product" [ref=e315]:
                          - /placeholder: Filter
                        - text:  
                      - columnheader "" [ref=e316]:
                        - textbox "Enter Text to Filter on Description" [ref=e317]:
                          - /placeholder: Filter
                        - text:  
                      - columnheader "" [ref=e318]:
                        - textbox "Enter Text to Filter on Quantity" [ref=e319]:
                          - /placeholder: Filter
                        - text:  
                      - columnheader "" [ref=e320]:
                        - textbox "Enter Text to Filter on Unit Price" [ref=e321]:
                          - /placeholder: Filter
                        - text:  
                      - columnheader "" [ref=e322]:
                        - textbox "Enter Text to Filter on Discount" [ref=e323]:
                          - /placeholder: Filter
                        - text:  
                      - columnheader "" [ref=e324]:
                        - textbox "Enter Text to Filter on Net Amount" [ref=e325]:
                          - /placeholder: Filter
                        - text:  
                      - columnheader "" [ref=e326]:
                        - textbox "Enter Text to Filter on GL Code" [ref=e327]:
                          - /placeholder: Filter
                        - text:  
                      - columnheader "" [ref=e328]:
                        - textbox "Enter Text to Filter on Status" [ref=e329]:
                          - /placeholder: Filter
                        - text:  
                      - columnheader "" [ref=e330]:
                        - textbox "Enter Text to Filter on Cancelled" [ref=e331]:
                          - /placeholder: Filter
                        - text:  
                      - columnheader "Clear Filters" [ref=e332]:
                        - button "Clear Filters" [ref=e333] [cursor=pointer]:
                          - generic [ref=e335]: 
                          - text: Clear Filters
                  - rowgroup [ref=e336]:
                    - row "001 Test item reference Product Test description 9.10 560.5600 0.00 5101.10 GL Code C N View" [ref=e337]:
                      - text: 
                      - cell "001" [ref=e338]:
                        - generic [ref=e339]: "001"
                      - cell "Test item reference" [ref=e340]:
                        - generic [ref=e341]: Test item reference
                      - cell "Product" [ref=e342]:
                        - generic "Product" [ref=e343]
                      - cell "Test description" [ref=e344]:
                        - generic [ref=e345]: Test description
                      - cell "9.10" [ref=e346]:
                        - generic [ref=e347]: "9.10"
                      - cell "560.5600" [ref=e348]:
                        - generic [ref=e349]: "560.5600"
                      - cell "0.00" [ref=e350]:
                        - generic [ref=e351]: "0.00"
                      - cell "5101.10" [ref=e352]:
                        - generic [ref=e353]: "5101.10"
                      - cell "GL Code" [ref=e354]:
                        - generic "GL Code" [ref=e355]: 00141/530600-31
                      - cell "C" [ref=e356]:
                        - generic "C" [ref=e357]: Fully Received
                      - cell "N" [ref=e358]:
                        - generic "N" [ref=e359]: "No"
                      - text: 
                      - cell "View" [ref=e360]:
                        - button "View" [ref=e361]:
                          - generic [ref=e363]: View
                      - text: 
                    - row [ref=e364]:
                      - text: 
                      - cell [ref=e365]
                      - cell [ref=e366]
                      - cell [ref=e367]
                      - cell [ref=e368]
                      - cell [ref=e369]
                      - cell [ref=e370]
                      - cell [ref=e371]
                      - cell [ref=e372]
                      - cell [ref=e373]
                      - cell [ref=e374]
                      - cell [ref=e375]
                      - text: 
                      - cell [ref=e376]
                      - text: 
                    - row [ref=e377]:
                      - text: 
                      - cell [ref=e378]
                      - cell [ref=e379]
                      - cell [ref=e380]
                      - cell [ref=e381]
                      - cell [ref=e382]
                      - cell [ref=e383]
                      - cell [ref=e384]
                      - cell [ref=e385]
                      - cell [ref=e386]
                      - cell [ref=e387]
                      - cell [ref=e388]
                      - text: 
                      - cell [ref=e389]
                      - text: 
                    - row [ref=e390]:
                      - text: 
                      - cell [ref=e391]
                      - cell [ref=e392]
                      - cell [ref=e393]
                      - cell [ref=e394]
                      - cell [ref=e395]
                      - cell [ref=e396]
                      - cell [ref=e397]
                      - cell [ref=e398]
                      - cell [ref=e399]
                      - cell [ref=e400]
                      - cell [ref=e401]
                      - text: 
                      - cell [ref=e402]
                      - text: 
                    - row [ref=e403]:
                      - text: 
                      - cell [ref=e404]
                      - cell [ref=e405]
                      - cell [ref=e406]
                      - cell [ref=e407]
                      - cell [ref=e408]
                      - cell [ref=e409]
                      - cell [ref=e410]
                      - cell [ref=e411]
                      - cell [ref=e412]
                      - cell [ref=e413]
                      - cell [ref=e414]
                      - text: 
                      - cell [ref=e415]
                      - text: 
                    - row [ref=e416]:
                      - text: 
                      - cell [ref=e417]
                      - cell [ref=e418]
                      - cell [ref=e419]
                      - cell [ref=e420]
                      - cell [ref=e421]
                      - cell [ref=e422]
                      - cell [ref=e423]
                      - cell [ref=e424]
                      - cell [ref=e425]
                      - cell [ref=e426]
                      - cell [ref=e427]
                      - text: 
                      - cell [ref=e428]
                      - text: 
                    - row [ref=e429]:
                      - text: 
                      - cell [ref=e430]
                      - cell [ref=e431]
                      - cell [ref=e432]
                      - cell [ref=e433]
                      - cell [ref=e434]
                      - cell [ref=e435]
                      - cell [ref=e436]
                      - cell [ref=e437]
                      - cell [ref=e438]
                      - cell [ref=e439]
                      - cell [ref=e440]
                      - text: 
                      - cell [ref=e441]
                      - text: 
                    - row [ref=e442]:
                      - text: 
                      - cell [ref=e443]
                      - cell [ref=e444]
                      - cell [ref=e445]
                      - cell [ref=e446]
                      - cell [ref=e447]
                      - cell [ref=e448]
                      - cell [ref=e449]
                      - cell [ref=e450]
                      - cell [ref=e451]
                      - cell [ref=e452]
                      - cell [ref=e453]
                      - text: 
                      - cell [ref=e454]
                      - text: 
                    - row [ref=e455]:
                      - text: 
                      - cell [ref=e456]
                      - cell [ref=e457]
                      - cell [ref=e458]
                      - cell [ref=e459]
                      - cell [ref=e460]
                      - cell [ref=e461]
                      - cell [ref=e462]
                      - cell [ref=e463]
                      - cell [ref=e464]
                      - cell [ref=e465]
                      - cell [ref=e466]
                      - text: 
                      - cell [ref=e467]
                      - text: 
                    - row [ref=e468]:
                      - text: 
                      - cell [ref=e469]
                      - cell [ref=e470]
                      - cell [ref=e471]
                      - cell [ref=e472]
                      - cell [ref=e473]
                      - cell [ref=e474]
                      - cell [ref=e475]
                      - cell [ref=e476]
                      - cell [ref=e477]
                      - cell [ref=e478]
                      - cell [ref=e479]
                      - text: 
                      - cell [ref=e480]
                      - text: 
                - generic [ref=e484]:
                  - generic [ref=e486]: Records 1 to 1 of 1
                  - generic [ref=e488]:
                    - text: Page
                    - textbox "Enter Page Number to go to and hit the Enter Key" [ref=e489]: "1"
                    - text:  / 1
        - table [ref=e491]:
          - rowgroup [ref=e492]:
            - row "Back" [ref=e493]:
              - cell "Back" [ref=e494]:
                - table [ref=e497]:
                  - rowgroup [ref=e498]:
                    - row "Back" [ref=e499]:
                      - cell "Back" [ref=e500]:
                        - button "Back" [ref=e502] [cursor=pointer]
  - status [ref=e503]
  - status [ref=e504]
  - status [ref=e505]
  - status [ref=e506]
  - status [ref=e507]
  - status [ref=e508]
  - status [ref=e509]
  - status [ref=e510]
  - status [ref=e511]
  - status [ref=e512]
  - status [ref=e513]
  - status [ref=e514]
  - dialog "Attachments" [ref=e515]:
    - generic [ref=e516]:
      - generic [ref=e517]: Attachments
      - button " Close" [ref=e518] [cursor=pointer]:
        - generic [ref=e519]: 
        - text: Close
    - generic [ref=e522]:
      - table [ref=e525]:
        - rowgroup [ref=e526]:
          - row "Attachments for RSS/000001/000000009/ORD" [ref=e527]:
            - cell "Attachments for RSS/000001/000000009/ORD" [ref=e528]:
              - generic [ref=e529]: Attachments for RSS/000001/000000009/ORD
            - cell [ref=e530]:
              - generic:
                - generic: 
      - generic "Grid Summary :" [ref=e531]:
        - generic [ref=e534]:
          - generic [ref=e539]:
            - button "Export grid data" [ref=e541] [cursor=pointer]:
              - generic [ref=e543]: 
            - button "Upload document from file system" [ref=e544] [cursor=pointer]:
              - generic "Upload document from file system" [ref=e546]: Add File
          - generic [ref=e547]:
            - table "Grid Summary :" [ref=e548]:
              - rowgroup [ref=e549]:
                - row "Document Title File Ext File Desc Size (KB) Saved Date Action" [ref=e550]:
                  - cell [ref=e551]
                  - columnheader "Document Title" [ref=e552] [cursor=pointer]:
                    - generic [ref=e554]: Document Title
                  - columnheader "File Ext" [ref=e555] [cursor=pointer]:
                    - generic [ref=e557]: File Ext
                  - columnheader "File Desc" [ref=e558] [cursor=pointer]:
                    - generic [ref=e560]: File Desc
                  - columnheader "Size (KB)" [ref=e561] [cursor=pointer]:
                    - generic [ref=e563]: Size (KB)
                  - columnheader "Saved Date" [ref=e564] [cursor=pointer]:
                    - generic [ref=e565]:
                      - generic [ref=e566]: 
                      - generic [ref=e567]: Saved Date
                  - columnheader "Action" [ref=e568] [cursor=pointer]:
                    - generic [ref=e570]: Action
                  - cell [ref=e571]
                - row "     Clear Filters" [ref=e572]:
                  - cell [ref=e573]
                  - columnheader "" [ref=e574]:
                    - textbox "Enter Text to Filter on Document Title" [ref=e575]:
                      - /placeholder: Filter
                    - text:  
                  - columnheader "" [ref=e576]:
                    - textbox "Enter Text to Filter on File Ext" [ref=e577]:
                      - /placeholder: Filter
                    - text:  
                  - columnheader "" [ref=e578]:
                    - textbox "Enter Text to Filter on File Desc" [ref=e579]:
                      - /placeholder: Filter
                    - text:  
                  - columnheader "" [ref=e580]:
                    - textbox "Enter Text to Filter on Size (KB)" [ref=e581]:
                      - /placeholder: Filter
                    - text:  
                  - columnheader "" [ref=e582]:
                    - textbox "Enter Text to Filter on Saved Date" [ref=e583]:
                      - /placeholder: Filter
                    - text:  
                  - text:              
                  - columnheader "Clear Filters" [ref=e584]:
                    - button "Clear Filters" [ref=e585] [cursor=pointer]:
                      - generic [ref=e587]: 
                      - text: Clear Filters
                  - cell [ref=e588]
              - rowgroup [ref=e589]:
                - row " test1751272354535 docx Word Document 0 30/06/2025 09:32:35 View this attachment " [ref=e590]:
                  - cell "" [ref=e591] [cursor=pointer]:
                    - generic [ref=e592]: 
                  - cell "test1751272354535" [ref=e593]:
                    - generic [ref=e594]: test1751272354535
                  - cell "docx" [ref=e595]:
                    - generic [ref=e596]: docx
                  - cell "Word Document" [ref=e597]:
                    - generic [ref=e598]: Word Document
                  - cell "0" [ref=e599]:
                    - generic [ref=e600]: "0"
                  - cell "30/06/2025 09:32:35" [ref=e601]:
                    - generic [ref=e602]: 30/06/2025 09:32:35
                  - text: 
                  - cell "View this attachment" [ref=e603]:
                    - button "View this attachment" [ref=e604]:
                      - generic [ref=e605]:
                        - generic "View this attachment" [ref=e606]: View
                        - generic [ref=e607] [cursor=pointer]: 
                  - cell "" [ref=e608] [cursor=pointer]:
                    - generic [ref=e609]: 
                - row "test1738134642179 docx Word Document 0 29/01/2025 07:10:43 View this attachment" [ref=e610]:
                  - text: 
                  - cell "test1738134642179" [ref=e611]:
                    - generic [ref=e612]: test1738134642179
                  - cell "docx" [ref=e613]:
                    - generic [ref=e614]: docx
                  - cell "Word Document" [ref=e615]:
                    - generic [ref=e616]: Word Document
                  - cell "0" [ref=e617]:
                    - generic [ref=e618]: "0"
                  - cell "29/01/2025 07:10:43" [ref=e619]:
                    - generic [ref=e620]: 29/01/2025 07:10:43
                  - text: 
                  - cell "View this attachment" [ref=e621]:
                    - button "View this attachment" [ref=e622]:
                      - generic [ref=e623]:
                        - generic "View this attachment" [ref=e624]: View
                        - generic [ref=e625] [cursor=pointer]: 
                  - text: 
                - row "test1732802661017 docx Word Document 0 28/11/2024 14:04:22 View this attachment" [ref=e626]:
                  - text: 
                  - cell "test1732802661017" [ref=e627]:
                    - generic [ref=e628]: test1732802661017
                  - cell "docx" [ref=e629]:
                    - generic [ref=e630]: docx
                  - cell "Word Document" [ref=e631]:
                    - generic [ref=e632]: Word Document
                  - cell "0" [ref=e633]:
                    - generic [ref=e634]: "0"
                  - cell "28/11/2024 14:04:22" [ref=e635]:
                    - generic [ref=e636]: 28/11/2024 14:04:22
                  - text: 
                  - cell "View this attachment" [ref=e637]:
                    - button "View this attachment" [ref=e638]:
                      - generic [ref=e639]:
                        - generic "View this attachment" [ref=e640]: View
                        - generic [ref=e641] [cursor=pointer]: 
                  - text: 
                - row "test1756369976237 docx Word Document 0 28/08/2025 09:32:57 View this attachment" [ref=e642]:
                  - text: 
                  - cell "test1756369976237" [ref=e643]:
                    - generic [ref=e644]: test1756369976237
                  - cell "docx" [ref=e645]:
                    - generic [ref=e646]: docx
                  - cell "Word Document" [ref=e647]:
                    - generic [ref=e648]: Word Document
                  - cell "0" [ref=e649]:
                    - generic [ref=e650]: "0"
                  - cell "28/08/2025 09:32:57" [ref=e651]:
                    - generic [ref=e652]: 28/08/2025 09:32:57
                  - text: 
                  - cell "View this attachment" [ref=e653]:
                    - button "View this attachment" [ref=e654]:
                      - generic [ref=e655]:
                        - generic "View this attachment" [ref=e656]: View
                        - generic [ref=e657] [cursor=pointer]: 
                  - text: 
                - row "test1753681357985 docx Word Document 0 28/07/2025 06:42:39 View this attachment" [ref=e658]:
                  - text: 
                  - cell "test1753681357985" [ref=e659]:
                    - generic [ref=e660]: test1753681357985
                  - cell "docx" [ref=e661]:
                    - generic [ref=e662]: docx
                  - cell "Word Document" [ref=e663]:
                    - generic [ref=e664]: Word Document
                  - cell "0" [ref=e665]:
                    - generic [ref=e666]: "0"
                  - cell "28/07/2025 06:42:39" [ref=e667]:
                    - generic [ref=e668]: 28/07/2025 06:42:39
                  - text: 
                  - cell "View this attachment" [ref=e669]:
                    - button "View this attachment" [ref=e670]:
                      - generic [ref=e671]:
                        - generic "View this attachment" [ref=e672]: View
                        - generic [ref=e673] [cursor=pointer]: 
                  - text: 
                - row "test1779968614296 docx Word Document 0 28/05/2026 12:43:35 View this attachment" [ref=e674]:
                  - text: 
                  - cell "test1779968614296" [ref=e675]:
                    - generic [ref=e676]: test1779968614296
                  - cell "docx" [ref=e677]:
                    - generic [ref=e678]: docx
                  - cell "Word Document" [ref=e679]:
                    - generic [ref=e680]: Word Document
                  - cell "0" [ref=e681]:
                    - generic [ref=e682]: "0"
                  - cell "28/05/2026 12:43:35" [ref=e683]:
                    - generic [ref=e684]: 28/05/2026 12:43:35
                  - text: 
                  - cell "View this attachment" [ref=e685]:
                    - button "View this attachment" [ref=e686]:
                      - generic [ref=e687]:
                        - generic "View this attachment" [ref=e688]: View
                        - generic [ref=e689] [cursor=pointer]: 
                  - text: 
                - row "test1738052718501 docx Word Document 0 28/01/2025 08:25:19 View this attachment" [ref=e690]:
                  - text: 
                  - cell "test1738052718501" [ref=e691]:
                    - generic [ref=e692]: test1738052718501
                  - cell "docx" [ref=e693]:
                    - generic [ref=e694]: docx
                  - cell "Word Document" [ref=e695]:
                    - generic [ref=e696]: Word Document
                  - cell "0" [ref=e697]:
                    - generic [ref=e698]: "0"
                  - cell "28/01/2025 08:25:19" [ref=e699]:
                    - generic [ref=e700]: 28/01/2025 08:25:19
                  - text: 
                  - cell "View this attachment" [ref=e701]:
                    - button "View this attachment" [ref=e702]:
                      - generic [ref=e703]:
                        - generic "View this attachment" [ref=e704]: View
                        - generic [ref=e705] [cursor=pointer]: 
                  - text: 
                - row "test1769503112386 docx Word Document 0 27/01/2026 08:38:33 View this attachment" [ref=e706]:
                  - text: 
                  - cell "test1769503112386" [ref=e707]:
                    - generic [ref=e708]: test1769503112386
                  - cell "docx" [ref=e709]:
                    - generic [ref=e710]: docx
                  - cell "Word Document" [ref=e711]:
                    - generic [ref=e712]: Word Document
                  - cell "0" [ref=e713]:
                    - generic [ref=e714]: "0"
                  - cell "27/01/2026 08:38:33" [ref=e715]:
                    - generic [ref=e716]: 27/01/2026 08:38:33
                  - text: 
                  - cell "View this attachment" [ref=e717]:
                    - button "View this attachment" [ref=e718]:
                      - generic [ref=e719]:
                        - generic "View this attachment" [ref=e720]: View
                        - generic [ref=e721] [cursor=pointer]: 
                  - text: 
                - row "test1737966450351 docx Word Document 0 27/01/2025 08:27:31 View this attachment" [ref=e722]:
                  - text: 
                  - cell "test1737966450351" [ref=e723]:
                    - generic [ref=e724]: test1737966450351
                  - cell "docx" [ref=e725]:
                    - generic [ref=e726]: docx
                  - cell "Word Document" [ref=e727]:
                    - generic [ref=e728]: Word Document
                  - cell "0" [ref=e729]:
                    - generic [ref=e730]: "0"
                  - cell "27/01/2025 08:27:31" [ref=e731]:
                    - generic [ref=e732]: 27/01/2025 08:27:31
                  - text: 
                  - cell "View this attachment" [ref=e733]:
                    - button "View this attachment" [ref=e734]:
                      - generic [ref=e735]:
                        - generic "View this attachment" [ref=e736]: View
                        - generic [ref=e737] [cursor=pointer]: 
                  - text: 
                - row "test1774515875288 docx Word Document 0 26/03/2026 09:04:36 View this attachment" [ref=e738]:
                  - text: 
                  - cell "test1774515875288" [ref=e739]:
                    - generic [ref=e740]: test1774515875288
                  - cell "docx" [ref=e741]:
                    - generic [ref=e742]: docx
                  - cell "Word Document" [ref=e743]:
                    - generic [ref=e744]: Word Document
                  - cell "0" [ref=e745]:
                    - generic [ref=e746]: "0"
                  - cell "26/03/2026 09:04:36" [ref=e747]:
                    - generic [ref=e748]: 26/03/2026 09:04:36
                  - text: 
                  - cell "View this attachment" [ref=e749]:
                    - button "View this attachment" [ref=e750]:
                      - generic [ref=e751]:
                        - generic "View this attachment" [ref=e752]: View
                        - generic [ref=e753] [cursor=pointer]: 
                  - text: 
            - generic [ref=e757]:
              - generic [ref=e759]: Records 1 to 10 of 68
              - generic [ref=e761]:
                - text: Page
                - textbox "Enter Page Number to go to and hit the Enter Key" [ref=e762]: "1"
                - text:  / 7
                - generic [ref=e763] [cursor=pointer]: 
                - generic [ref=e764] [cursor=pointer]: 
      - table [ref=e767]:
        - rowgroup [ref=e768]:
          - row "Close" [ref=e769]:
            - cell "Close" [ref=e770]:
              - button "Close" [ref=e772] [cursor=pointer]
  - status [ref=e774]
  - status [ref=e775]
  - status [ref=e776]
  - status [ref=e777]
  - status [ref=e778]
  - status [ref=e779]
  - status [ref=e780]
  - status [ref=e781]
  - status [ref=e782]
  - status [ref=e783]
  - status [ref=e784]
  - status [ref=e785]
```

# Test source

```ts
  196 |         expect(breadcrumbs).toContainEqual(
  197 |             expectedTexts.expectedSearchCriteriaText
  198 |         );
  199 |         expect(breadcrumbs).toContainEqual(
  200 |             expectedTexts.expectedHeaderResultsText
  201 |         );
  202 |         expect(breadcrumbs).toContainEqual(
  203 |             expectedTexts.expectedHeaderDetailsText +
  204 |                 " (" +
  205 |                 paddedString.trim() +
  206 |                 ")"
  207 |         );
  208 |     }
  209 |     /**
  210 |      *
  211 |      * @returns
  212 |      */
  213 |     async uploadAttachment(): Promise<string> {
  214 |         //CLick attachments icon
  215 |         await this.click(this.attachmentBtnLocator);
  216 |         //Verify dialog
  217 |         await this.checkIfDialogExistsWithTitle(
  218 |             expectedTexts.exepctedAttachmentsDialogText
  219 |         );
  220 |         //Click add file
  221 |         await this.page
  222 |             .locator(this.multiBtnLocator)
  223 |             .filter({ hasText: expectedTexts.addFileText })
  224 |             .click();
  225 |         const ext = ".DOCX";
  226 |         const dirAndFileNameWithExt: string | null =
  227 |             await FileUtils.fsWriteFile(ext);
  228 | 
  229 |         // Start waiting for file chooser before clicking. Note no await.
  230 |         const fileChooserPromise = this.page.waitForEvent("filechooser");
  231 |         //await this.clickButtonUsingRole(this.browseForFileLocator);
  232 |         await this.page
  233 |             .locator(this.commonDhxBtnLocator)
  234 |             .filter({ hasText: labels.browseForAFileLbl })
  235 |             .dblclick();
  236 |         const fileChooser = await fileChooserPromise;
  237 |         await fileChooser.setFiles(
  238 |             path.join(process.cwd() + "/" + dirAndFileNameWithExt!)
  239 |         );
  240 |         console.log("dirAndFileNameWithExt=" + dirAndFileNameWithExt);
  241 |         var fileNameWithExt: string = dirAndFileNameWithExt!.split("/")[1];
  242 |         console.log("fileNameWithExt=" + fileNameWithExt);
  243 |         await expect(
  244 |             this.page.locator(this.fileNameAfterUploadLocator)
  245 |         ).toContainText(fileNameWithExt);
  246 |         await this.expectElementToBeVisibleUsingLocator(
  247 |             this.successMarkLocator
  248 |         );
  249 |         await this.click(this._okBtnLocator);
  250 |         return fileNameWithExt;
  251 |     }
  252 |     /**
  253 |      *
  254 |      * @param uploadedFileName
  255 |      */
  256 |     async verifyAttachmentDetails(uploadedFileName: string) {
  257 |         //Verify dialog
  258 |         await this.checkIfDialogExistsWithTitle(
  259 |             expectedTexts.exepctedAttachmentDetailsDialogText
  260 |         );
  261 |         const splitFileName = uploadedFileName.split(".");
  262 | 
  263 |         //Assert filename
  264 |         await this.expectElementToHaveValue(
  265 |             this.fileTitleLocator,
  266 |             splitFileName[0]
  267 |         );
  268 |         await this.expectElementToContainText(
  269 |             this.fileNameLocator,
  270 |             uploadedFileName
  271 |         );
  272 |     }
  273 |     /**
  274 |      *
  275 |      */
  276 |     async clickOkOnAttachementDetails() {
  277 |         await this.click(this.uploadAttachmentBtnLocator);
  278 |     }
  279 |     /**
  280 |      *
  281 |      * @param uploadedFileName
  282 |      */
  283 |     async verifyUploadedAttachmentsOnAttachmentsDialog(
  284 |         uploadedFileName: string
  285 |     ) {
  286 |         const splitFileName = uploadedFileName.split(".");
  287 |         //Verify dialog
  288 |         await this.checkIfDialogExistsWithTitle(
  289 |             expectedTexts.exepctedAttachmentsDialogText
  290 |         );
  291 | 
  292 |         await this.page
  293 |             .locator(this.sortableGridLocator)
  294 |             .locator("..")
  295 |             .filter({ hasText: expectedTexts.documentTitleText })
> 296 |             .dblclick();
      |              ^ Error: locator.dblclick: Error: strict mode violation: locator('.esr_grid_sort_span').locator('..') resolved to 2 elements:
  297 | 
  298 |         await expect(
  299 |             this.page
  300 |                 .locator(this.documentTitleColoumn)
  301 |                 .filter({ hasText: splitFileName[0] })
  302 |         ).toBeVisible();
  303 |         const extension = await this.page
  304 |             .locator(this.fileExtColoumn)
  305 |             .first()
  306 |             .textContent();
  307 |         expect(extension).toContain(splitFileName[1].toLowerCase());
  308 |         const savedDate = await this.page
  309 |             .locator(this.savedDateColoumn)
  310 |             .first()
  311 |             .textContent();
  312 |         expect(savedDate).toContain(new Date().toLocaleDateString("en-GB"));
  313 |     }
  314 |     /**
  315 |      *
  316 |      */
  317 |     async clickCloseBtn() {
  318 |         await this.click(this._closeBtnLocator);
  319 |     }
  320 |     async clickNewMultiBtn() {
  321 |         await this.clickEsrMultiBtnUsingText(labels.newlbl);
  322 |     }
  323 |     async enterSupplierId(supplierId: string) {
  324 |         await (
  325 |             await this.getByRole(roles.textboxRole, {
  326 |                 name: labels.supplierLbl,
  327 |                 exact: true
  328 |             })
  329 |         ).fill(supplierId);
  330 |         await (await this.getByHeading(labels.headerDetailsLbl)).click();
  331 |     }
  332 | 
  333 |     async clickNewLineBtn() {
  334 |         await (
  335 |             await this.getByRole(roles.btnRole, { name: labels.newlbl })
  336 |         ).scrollIntoViewIfNeeded();
  337 |         await (
  338 |             await this.getByRole(roles.btnRole, { name: labels.newlbl })
  339 |         ).click();
  340 |     }
  341 |     async clickCloseBtnOnDialog() {
  342 |         await this.click(this.closeBtnOnDialogLocator);
  343 |     }
  344 |     async enterLineDetails() {
  345 |         await this.clickFreeFormatBtn();
  346 |         await (
  347 |             await this.getByLabel(labels.descriptionLbl, { exact: true })
  348 |         ).fill(expectedTexts.expectedDescription);
  349 |         await (
  350 |             await this.getByLabel(labels.quantityLbl, { exact: true })
  351 |         ).fill("1");
  352 |         const randomAmt = await getRandomAmount(100, 999);
  353 |         const randomIndex = await getRandomIntegerAmount(0, 4);
  354 |         console.log("Entering amount in Unit price:" + randomAmt);
  355 |         console.log("Index for vatcode:" + randomIndex);
  356 |         await (
  357 |             await this.getByLabel(labels.unitPriceLbl, { exact: true })
  358 |         ).fill(randomAmt.toString());
  359 |         await (
  360 |             await this.getByLocator(this.vatCodeLocator)
  361 |         ).selectOption(VAT_CODES[randomIndex]);
  362 |         const handler = new ExcelHandler(
  363 |             expectedTexts.glCodeExcelWorkBookNameRead
  364 |         );
  365 |         const sheetData = handler.readSheet(
  366 |             expectedTexts.glCodeExcelSheetNameRead
  367 |         );
  368 |         console.log("sheetdata:" + sheetData);
  369 |         const randomRow: Record<string, any> | null =
  370 |             handler.getRandomRowAsObject(sheetData);
  371 |         console.log(
  372 |             "Random costCentreCodeHeader:" +
  373 |                 randomRow?.[expectedTexts.costCentreCodeHeader]
  374 |         );
  375 |         console.log(
  376 |             "Random ledgerCodeHeader:" +
  377 |                 randomRow?.[expectedTexts.ledgerCodeHeader]
  378 |         );
  379 |         console.log(
  380 |             "Random fundCodeHeader:" + randomRow?.[expectedTexts.fundCodeHeader]
  381 |         );
  382 |         await (
  383 |             await this.getByLabel(labels.costCentreLbl, { exact: true })
  384 |         ).fill(randomRow?.[expectedTexts.costCentreCodeHeader]);
  385 |         await (
  386 |             await this.getByRole(roles.headingRole, {
  387 |                 name: labels.productDetailsLbl
  388 |             })
  389 |         ).click();
  390 |         const ledgerInput = await this.getByLabel(labels.ledgerLbl, {
  391 |             exact: true
  392 |         });
  393 |         await ledgerInput.waitFor({ state: "visible" });
  394 |         await expect(ledgerInput).not.toHaveClass(/readonly/, {
  395 |             timeout: 15000
  396 |         });
```