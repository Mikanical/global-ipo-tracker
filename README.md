# Global IPO Tracker

A live dashboard tracking upcoming IPOs across eleven global exchanges, built for the Investment Analyst case study.

**Live dashboard:** https://mikanical.github.io/global-ipo-tracker/

---

## What it does

Tracks 46 pipeline entries across all eleven target exchanges, London (LSE), Warsaw (WSE), Dubai (DFM), Saudi Arabia (TADAWUL), Johannesburg (JSE), Brazil (B3), Singapore (SGX), Taiwan (TWSE), Thailand (SET), Malaysia (KLSE) and Frankfurt (Xetra), with sourced valuations, expected listing dates, business descriptions and C-suite contact data.

### Core features

| Feature | Notes |
|---|---|
| Search | Matches company, sector, country, status and description. Company-name hits rank above description-only hits. |
| Filter by exchange | All eleven exchanges, labelled with full exchange names. |
| Filter by sector | Biotech, AI & Semiconductors, Energy, Metals & Mining, FinTech, Real Estate and others. |
| Filter by status | Announced, Regulator-approved, Rumoured, Postponed, Listed, Pipeline signalled. |
| Sortable columns | Company, exchange, listing date, sector, valuation, status. |
| Missing-data handling | Every absent field renders as an explicit *N/A* or *Not disclosed*, never a blank cell or an invented value. |

### Bonus features

- **Export to CSV**, exports the current filtered view, 22 columns including the contact-confidence tiers, pattern basis and source URLs.
- **Bookmarking**, star any company; the list persists in browser storage across sessions, with a "Saved" toggle to filter down to it.
- **Copy-to-clipboard**, one click on any email address.
- **Expandable detail**, click any row for the full description, all contacts, deal metrics, the contact-derivation note and clickable source links.
- **Sort by valuation and by listing date**, valuations are normalised to indicative USD purely so a single sort works across SAR, GBP, EUR, BRL and MYR.

---

## The contact-data problem, and how this handles it

The brief asks for CEO and CFO names *and email addresses*. In practice, executive email addresses are almost never published, and for pre-IPO companies the executive slate itself is often not disclosed until the prospectus. Inventing plausible-looking addresses would produce a dashboard that looks complete and is quietly wrong, the worst outcome for anything used to make outreach decisions.

So every address on this dashboard carries an explicit confidence tier, shown as a coloured dot in the table and spelled out in the row detail:

| Tier | Meaning |
|---|---|
| 🟢 **Verified** | The company publishes this address itself. Traceable through the row's source links. |
| 🟡 **Inferred** | The company's email pattern is known, and the named executive's address is constructed from it. A starting hypothesis for outreach, **not** a confirmed address. The pattern used is shown alongside it. |
| ⚪ **N/A** | No public basis exists. Displayed as N/A rather than guessed. |

The TK Elevator row shows the method working end to end. The company publishes two investor-relations addresses (`nicole.getta@tkelevator.com`, `christian.h.schulte@tkelevator.com`), which confirms the domain's `first.last@` convention; the CEO and CFO addresses are then derived from that confirmed pattern and marked inferred, with the IR address retained as a verified fallback route.

Three exchanges, SGX, WSE and SET, plus TWSE have live, publicly-confirmed pipelines where no individual issuer has been named yet. Those are retained as explicit unnamed entries rather than dropped, because for a coverage list "this exchange is active but has disclosed no issuer" is a materially different answer from silence.

---

## Data sourcing

Every row carries its own `sources` array and `verified` date, surfaced as clickable links in the expanded detail. Sources are:

- **Exchange calendars and filings**, SET's upcoming-IPO register, Deutsche Börse, Bursa Malaysia listings.
- **Regulator disclosure**, Saudi CMA approvals and offering windows.
- **Company disclosure**, investor-relations pages, press releases, leadership pages.
- **Financial press**, AGBI, The National, Börsen-Zeitung, City AM, Rio Times, CNBC Africa, WFE Focus.

Valuations are displayed in their reported currency. The `valuationUsdM` field is an indicative USD normalisation used *only* to make the valuation column sortable across currencies, at approximate September 2026 rates (EUR 1.16, GBP 1.34, SAR 0.267, BRL 0.185, MYR 0.237). It is not a valuation opinion.

---

## Tech stack

Deliberately minimal, because the deliverable is a link that has to work when someone clicks it.

- **Vanilla HTML, CSS and JavaScript.** No framework, no build step, no bundler, no dependencies.
- **Two files:** `index.html` (interface and all logic, inline) and `data.js` (the dataset).
- **GitHub Pages** for hosting, deploying straight from `main`.

There is no runtime API call, which is a deliberate choice rather than a shortcut. A free IPO-data API covering Tadawul, B3, KLSE and the JSE does not exist; the data for these markets lives in exchange calendars, regulator notices and local-language press. Serving a static, versioned, per-row-sourced dataset means the dashboard cannot break because a third-party endpoint rate-limited or went down mid-demo, and every figure stays traceable to where it came from. Refreshing the data means editing `data.js` and pushing.

### Running it locally

```bash
git clone https://github.com/Mikanical/global-ipo-tracker.git
cd global-ipo-tracker
python3 -m http.server 8000   # or just open index.html directly
```

Then open http://localhost:8000. It works from `file://` too, since there is no fetch call.

### Updating the data

Edit `data.js`. Each record needs `company`, `exchange`, `sector`, `status`, `listingDate`, `description`, the contact fields with their tiers, `verified` and at least one entry in `sources`. Dates accept four formats and sort correctly across all of them: `2026-05-11`, `2026-Q4`, `2026-H2`, `2026`, or `N/A`.

---

## Testing

`_test.js` drives the deployed page with Playwright and asserts on the behaviour the brief asks about: row counts, search, each filter, filter combinations, every sortable column in both directions, row expansion, bookmark persistence across a page reload, the CSV download and its shape, N/A rendering, and a clean JavaScript console.

```bash
npm install playwright
node _test.js                                          # local file
node _test.js https://mikanical.github.io/global-ipo-tracker/   # deployed
```

---

Built by Michael Del Vecchio.
