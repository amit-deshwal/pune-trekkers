# Find Hikes data audit — 15 October 2026

## What was checked

- All 704 current hike records and 7,461 place suggestions were checked for structure, coordinate bounds, duplicate slugs, source URL format, village distance, and implausible elevation. Run `npm run audit:hikes` to repeat these checks.
- The import pipeline and overrides were inspected. Important Pune-area destinations were compared with Maharashtra Tourism and Trekshitiz pages.
- Twenty-eight starting destinations have an explicit reference in `data/hike-review.json`. This confirms that they are real hike destinations. It does not verify every coordinate, route, access rule, or condition. The finder shows all matching starting destinations when a wider distance is selected.

## Findings and corrections

- The original 713 records were treated as hikes even though many were imported map features. Eight palace, wall-remnant, and generic-ruin records were removed. Some remaining forts are coastal or city sites rather than treks. The finder now requires a direct Trekshitiz or Maharashtra Tourism link, or an explicit featured reference, before showing a record. The broad imported dataset is retained for later review.
- Only 59 current records have a source-listed or manually supplied base village. Another 471 have only nearby map villages, and 174 have no village at all. A source-listed village is not a verified trailhead. The interface now distinguishes these cases and gives directions only to listed villages.
- “Popular” was derived from source coverage, not visitor numbers. Featured destinations now use an explicit list with references. The wider list is labeled as sourced map listings whose routes have not all been reviewed.
- Road distances were calculated by multiplying straight-line distance by 1.4. This is not a reliable road route in the Western Ghats. The finder now displays straight-line distance and directs users to a mapping service for a real drive.
- Rajgad's Pali route was described as gentler, contrary to [Maharashtra Tourism's route guidance](https://maharashtratourism.gov.in/fort/rajgad/). The note was corrected. Torna's displayed base village was changed to Velhe, which [Maharashtra Tourism identifies for the main trail](https://maharashtratourism.gov.in/fort/torna/).
- Two imported elevations exceeded Maharashtra's highest peak (Kalsubai at 1,646 m): Chandangad (3,800 m) and Taljai Hills (2,000 m). Those values are withheld. The builder now rejects elevations above that ceiling.
- Lohgad and Lohagad Fort were duplicate destinations within 100 m. The finder suppresses the former. A Trekshitiz entry for Sandan Valley was classified as a fort although [its source describes a valley trek](https://trekshitiz.com/fort/index.php?slug=Sandan+Valley+Karoli+Ghat-fort); it is excluded from the fort finder.
- Two Kalsubai spellings referred to the same peak. They are now one record with the common name and Bari base village, as described by [Maharashtra Tourism](https://maharashtratourism.gov.in/nature/kalsubai-peak/).
- The 7,461 place suggestions came from a rectangular import covering parts of neighboring states, including Telangana and Andhra Pradesh. They are no longer used for autocomplete. The page suggests nine known starting cities and uses map lookup when a visitor enters another town.

## Remaining limits

The raw OSM, Wikidata, Trekshitiz, and geocoding snapshots used to build these files are not in this repository. Individual source IDs and capture dates were not retained. The audit therefore cannot establish that every imported name, coordinate, elevation, route, or place suggestion is correct. The place file also has no state-boundary filter. Exact trail starts, current access, weather, and road mileage require local or live verification before a trip. The broader sourced listings should be reviewed destination by destination before they are promoted as recommended hikes.
