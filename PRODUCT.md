# Product

## Register

product

## Users

Small trade business owners and admin staff who need to turn spoken or pasted job details into professional customer quote and invoice PDFs. The first configured customer is 4 Elements Painting, with painting-specific quote, deposit invoice, and final invoice workflows.

## Product Purpose

The app reduces admin time by extracting structured document fields from messy voice/text input, letting the user review and correct the details, then generating a polished PDF. Success means a contractor can prepare a customer-ready document without rebuilding the same wording, payment details, numbering, and formatting each time.

## Brand Personality

Practical, polished, trustworthy. The interface should feel like a quiet operations tool: clear controls, dense enough for real work, and branded only where it helps the document feel customer-ready.

## Anti-references

Avoid marketing-page theatrics, decorative dashboards, generic AI SaaS styling, and workflows that hide important financial or customer details behind magic. The review form must stay explicit and editable.

## Design Principles

- Profile-driven, not hardcoded: business details, tax labels, numbering, and document copy should come from configuration.
- Review before output: extracted data is always editable before PDF generation.
- Deterministic money: calculations happen in application code, never by the model.
- Fit the trade workflow: document types, scope language, photos, inclusions, exclusions, and terms should match how painting jobs are quoted and invoiced.
- Local MVP first: the 4 Elements workflow should work without Supabase, then storage/accounts can be added later.

## Accessibility & Inclusion

Target WCAG AA for contrast, labels, keyboard access, and reduced-motion-safe UI. Forms should use ordinary controls and clear validation states so the workflow remains usable under time pressure.
