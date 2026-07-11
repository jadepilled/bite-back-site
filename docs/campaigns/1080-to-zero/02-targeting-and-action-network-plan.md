# 1080 to Zero - targeting and Action Network plan

Status: implementation plan  
Last updated: 2026-07-11

## Principle

The public action should create useful constituent pressure, not indiscriminate email volume. Bite Back's technical submission goes to the Animal Welfare Task Group and AAWS officials separately. Supporter letters go to the elected representatives and ministers who can apply political pressure to the AAWS process.

## Public action recipients

Default recipient set:

1. Supporter's federal electorate MP.
2. Supporter's state or territory lower-house MP.
3. Supporter's state or territory agriculture, primary industries or animal welfare minister.
4. Commonwealth Agriculture Minister.

Do not send every supporter email to every agriculture minister. This creates weaker signals and higher spam risk.

## Organisational submission recipients

Send a reviewed Bite Back submission to:

- Animal Welfare Task Group chair.
- Commonwealth animal-welfare representative.
- State and territory AWTG representatives.
- AWTG mailbox: `awtg@aff.gov.au`.
- Commonwealth Agriculture Minister.
- State and territory agriculture ministers.

Use role records rather than only personal names. Re-check names, titles and email addresses within 48 hours of sending.

## Current national targets to verify before launch

Checked 2026-07-11:

- Commonwealth Agriculture, Fisheries and Forestry Minister: Julie Collins, official ministerial site.
- Assistant Minister for Agriculture, Fisheries and Forestry: Anthony Chisholm, official ministerial site.
- AWTG membership: use DAFF's members page as source of truth at send date.

Sources:

- https://minister.agriculture.gov.au/collins
- https://minister.agriculture.gov.au/chisholm
- https://www.agriculture.gov.au/agriculture-land/animal/welfare/awtg/members

## State and territory target handling

Configure targets as roles:

- NSW agriculture or primary industries minister.
- Victorian agriculture minister.
- Queensland primary industries minister.
- Western Australian agriculture and food minister.
- South Australian primary industries minister.
- Tasmanian primary industries minister.
- Northern Territory agriculture minister.
- ACT animal welfare minister.

Before action launch:

- Verify the current office-holder on the official jurisdiction website.
- Record source URL and access date.
- Confirm whether the office accepts direct constituent email, webform or postal-only correspondence.
- Confirm whether state upper-house recipients should be included.
- Confirm whether agriculture or animal welfare sits with a different minister in that jurisdiction.

## Action Network configuration

GitHub Pages cannot run secret-backed targeting or store supporter data. Use Action Network only through public links or embedded widgets after testing.

Required data objects outside the public repo:

- Federal electorate target list.
- State and territory electorate target lists.
- State/territory agriculture minister target list.
- Commonwealth minister target record.
- Suppression list and unsubscribe process.
- Internal test targets.

Required tests:

- Metropolitan address in each state and territory.
- Regional address in each state and territory.
- Remote address in each relevant jurisdiction.
- Address near electorate boundaries.
- Incomplete or ambiguous address.
- PO box where supported.
- Federal lower house match.
- Senate or upper-house match where used.
- State lower-house match.
- State upper-house match where used.
- Minister role match.
- Internal delivery logs.
- Confirmation email.
- Unsubscribe and suppression.
- Export and deletion request process.

## Message fields

Supporter-facing fields:

- First name.
- Last name.
- Email.
- Suburb.
- Postcode.
- Address fields required for matching.
- Optional personal sentence.
- Campaign consent checkbox.
- Separate marketing consent checkbox, not pre-ticked.

Do not collect:

- Sensitive political opinion fields.
- Health information.
- Animal incident details unless a separate reviewed incident-intake process exists.

## Default letter variants

Use variants by recipient:

- Federal MP: ask them to write to the Commonwealth Agriculture Minister and state their own position.
- State MP: ask them to write to the relevant state minister and state their own position.
- State minister: ask for support at the Agriculture Ministers' Meeting and jurisdictional implementation.
- Commonwealth minister: ask for AAWS wording, funding and national reporting.

All variants should include:

- AAWS 2027 opportunity.
- 2030 phase-out endpoint.
- Immediate replacement where lower-impact methods are suitable.
- Funded transition for unresolved uses.
- Public reporting of quantities, locations by safe aggregation, target species, outcomes and incidents.

## Tracker fields

For each target:

- Role.
- Name.
- Jurisdiction.
- Source URL.
- Source date.
- Contact method.
- Contact date.
- Response status.
- Position.
- Quote.
- Follow-up owner.
- Correction record.

## Launch hold conditions

Do not launch public sending if:

- Any target list includes unverified personal or private email addresses.
- Any test message goes to a real office before internal test mode.
- Consent language has not been reviewed.
- There is no unsubscribe/suppression process.
- Address matching fails for boundary tests.
- The campaign has not passed scientific and legal review.

