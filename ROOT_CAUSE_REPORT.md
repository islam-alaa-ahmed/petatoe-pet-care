# Root Cause Report — Phase A3.3

## Confirmed root cause

The Customers & Pets and customer master-data surfaces still contained direct Arabic labels, placeholders, table headers, filters, empty states, and runtime fallback text. These surfaces depended on the generic post-render operations subtree translator instead of explicit localization keys.

## Responsible areas

- `index.html`: customer/pet tab, customer master-data section, customer filters, actions, fields, search placeholder, and table headers.
- `operations/operations-legacy-engine.js`: runtime empty state, unknown customer/animal labels, and pet count display.

## Impact

English mode could depend on runtime DOM translation after rendering, leaving hard-coded UI text in source and increasing the risk of mixed-language output or translation flash.

## Resolution

An explicit bilingual `operationsCustomer` localization module was added. Static controls now use `data-i18n` / `data-i18n-placeholder`; dynamic customer/pet display strings resolve through the localization center. Stored customer, animal, breed, and workflow values were not changed.
