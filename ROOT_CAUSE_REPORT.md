# Root Cause Report — Phase A3.5.2

## Confirmed root cause
Several Smart Reports forecasting and recommendation interface strings were still created as direct literals inside dynamic templates and Chart.js datasets. They included the predictive-engine badge, `Actual`/`Forecast` series labels, customer-analysis accessibility label, and navigation icons/messages used when opening linked recommendation reports.

Because these values were recreated during Smart Reports rendering, filters or report navigation could temporarily depend on runtime DOM translation instead of resolving the active language at source-render time.

## Fix
The affected values now resolve through explicit localization keys before the DOM or Chart.js configuration is created. A dedicated bilingual catalog was added for this phase. No observer, DOM scan, calculation, query, or business-data value was changed.
