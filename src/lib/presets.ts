import type { CurrencyCode } from "./types";

export const UNITS = [
  "sqm",
  "no",
  "nos",
  "lot",
  "rm",
  "lm",
  "cbm",
  "pcs",
  "set",
  "day",
  "days",
  "hrs",
] as const;

export const CURRENCIES: Array<{ code: CurrencyCode; label: string }> = [
  { code: "AED", label: "AED — UAE Dirham" },
  { code: "SAR", label: "SAR — Saudi Riyal" },
  { code: "QAR", label: "QAR — Qatari Riyal" },
  { code: "OMR", label: "OMR — Omani Rial" },
  { code: "KWD", label: "KWD — Kuwaiti Dinar" },
  { code: "BHD", label: "BHD — Bahraini Dinar" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — Pound Sterling" },
];

/** The category skeleton Fairplatz uses on every stand-build BOQ. */
export const DEFAULT_CATEGORY_TITLES = [
  "Carpentry",
  "Electrical rental",
  "AV - rental",
  "Graphics",
  "Furniture Rental & Plants",
  "Services",
  "Organizer charges",
];

export interface LibraryItem {
  description: string;
  unit: string;
  qty?: number;
}

/**
 * Scope lines that come up on nearly every exhibition stand quotation.
 * Picked from past Fairplatz BOQs so a new quote is mostly clicking, not typing.
 */
export const ITEM_LIBRARY: Record<string, LibraryItem[]> = {
  Carpentry: [
    {
      description:
        "10 cm high raised timber platform with carpet flooring finish, integrated LED skirting, concealed cable management, and complete installation.",
      unit: "sqm",
    },
    {
      description:
        "Main walls fabricated in MDF with timber framework, finished with decorative laminate and emulsion paint.",
      unit: "sqm",
    },
    {
      description:
        "Conference room and storage room walls fabricated in MDF with timber framework, finished with decorative laminate and emulsion paint.",
      unit: "sqm",
    },
    {
      description:
        "Illuminated wing walls with integrated product display shelves and LED lighting.",
      unit: "sqm",
    },
    {
      description:
        "Clear tempered glass walls and door for the conference room with frosted pattern finish.",
      unit: "sqm",
    },
    {
      description:
        "Customized overhead canopy structure with internal framework, finished with decorative laminate and emulsion paint.",
      unit: "sqm",
    },
    {
      description: "Decorative vertical slat partition fabricated in MDF with laminate finish.",
      unit: "sqm",
    },
    { description: "Customized hanging sign structure with internal frame support.", unit: "sqm" },
    {
      description: "Decorative overhead wooden slatted ceiling structure with oak laminate finish.",
      unit: "sqm",
    },
    { description: "Square mesh cotton fabric ceiling.", unit: "sqm" },
    { description: "Customized product display unit.", unit: "no" },
    {
      description:
        "Customized reception counter with 3D lit logo, laminate and spray painted finish.",
      unit: "no",
    },
    {
      description:
        "Customized meeting table with metal frame support and marble laminate top finish.",
      unit: "no",
    },
    { description: "Storage room with lockable door and shelving.", unit: "no" },
  ],
  "Electrical rental": [
    { description: "DB box and general lighting, power sockets.", unit: "lot", qty: 1 },
    { description: "Cabling & sockets.", unit: "lot", qty: 1 },
    { description: "LED strip lights.", unit: "lot", qty: 1 },
    { description: "Spot lights / track lighting.", unit: "nos" },
    { description: "Rigging points and power distribution.", unit: "lot", qty: 1 },
  ],
  "AV - rental": [
    { description: '55" TV with floor / wall mount.', unit: "nos" },
    { description: '55" touch screen.', unit: "no" },
    { description: "Truss structure.", unit: "rm" },
    { description: "LED video wall.", unit: "sqm" },
    { description: "Media player and content loading.", unit: "nos" },
    { description: "Sound system with speakers.", unit: "lot", qty: 1 },
  ],
  Graphics: [
    { description: "3D illuminated logo.", unit: "lot", qty: 1 },
    { description: "3D non-lit letters.", unit: "lot", qty: 1 },
    { description: "Printed fabric on wall.", unit: "sqm" },
    { description: "Printed fabric on hanging structure.", unit: "sqm" },
    { description: "Digitally printed artwork on canvas.", unit: "nos" },
    { description: "Frosted graphics for conference room glass.", unit: "sqm" },
    { description: "Vinyl printed graphics on panels.", unit: "sqm" },
  ],
  "Furniture Rental & Plants": [
    { description: "Bar stool.", unit: "nos" },
    { description: "Bar table.", unit: "nos" },
    { description: "Lounge chairs.", unit: "nos" },
    { description: "Side table.", unit: "nos" },
    { description: "Meeting chair.", unit: "nos" },
    { description: "Three seater sofa.", unit: "no" },
    { description: "Mini fridge.", unit: "no" },
    { description: "Plants.", unit: "lot", qty: 1 },
    { description: "Coffee machine.", unit: "lot", qty: 1 },
    { description: "Storage racks.", unit: "lot", qty: 1 },
    { description: "Waste bins.", unit: "lot", qty: 1 },
  ],
  Services: [
    {
      description:
        "Project management, fabrication, installation, dismantling, transportation, and site supervision.",
      unit: "lot",
      qty: 1,
    },
    { description: "Daily cleaning and onsite support.", unit: "no", qty: 1 },
    { description: "Hostess / stand staff.", unit: "days" },
    { description: "Stand insurance and third party liability.", unit: "lot", qty: 1 },
  ],
  "Organizer charges": [
    { description: "Stand advertisement fee.", unit: "no", qty: 1 },
    { description: "Stand approval fee.", unit: "no", qty: 1 },
    { description: "Stand by cleaning.", unit: "no", qty: 1 },
    { description: "Electricity.", unit: "no", qty: 1 },
    { description: "Internet (Wi-Fi).", unit: "no", qty: 1 },
    { description: "Rigging / hanging point approval.", unit: "no", qty: 1 },
  ],
};

export const DEFAULT_TERMS = `1 - DESCRIPTION & SCOPE OF THE WORK
The subject of the project is the supply, delivery, installation and removal of the stand as per the design.

2 - WORK START DATE & COMPLETION DATE
The contract will begin once signed and will expire after the dismantling completion. The setup works will be carried out according to the exhibition official schedule. The works shall be carried out as per the agreed schedule.

3 - PAYMENT
- 50% Advance payment
- 50% After removal
All payments have to be made via bank transfer to the following CONTRACTOR bank account. The CUSTOMER shall pay all banking commissions, including commissions of intermediary banks (correspondents) and other compulsory payments connected with the transfer of funds hereunder. Such fees are not included in the total cost of the WORK.

4 - TERMS OF THE CONTRACT
- The PARTIES agree all elements supplied within the scope of the WORK are intended on rental basis, the CONTRACTOR therefore shall entitle the CUSTOMER to fully use the WORK exclusively for the above mentioned event. The CONTRACTOR is the sole owner of all elements part of the WORK and has the right to reuse any of these elements in any other project without the need of any consent by the CUSTOMER.
- Any changes to the design shall be informed and confirmed in writing by both sides. If the change is major and results in increase of cost, the CONTRACTOR shall inform the cost in writing and get a written approval from the CUSTOMER before starting the works.
- The CUSTOMER shall promptly inform the CONTRACTOR of any issue related to the WORK's quality during the production and setup stage, in order to give the CONTRACTOR a reasonable time to solve them before the official exhibition setup deadline. In case the CUSTOMER detects any defects during acceptance of the WORK, the CUSTOMER may indicate such defects in the Work Completion Transfer and Acceptance Certificate. The CONTRACTOR will not accept any claims if WORK's problems detected by the CUSTOMER are not precisely indicated and described in the Work Completion Transfer and Acceptance Certificate.
- The CONTRACTOR shall execute the WORK with tech specs, finishing and features according to the above quotation as well as the technical drawings, with the related quality and in due time.
- The CONTRACTOR should inform the CUSTOMER & get an approval before adjusting the tech project and make changes to the WORK's if deemed necessary, such changes shall not be considered a violation and/or quality issue. The CONTRACTOR shall not be liable for such unless they clearly and objectively affect the quality of the WORK.
- Any item not listed in the Bill of Quantities is not included.

5 - JURISDICTION
For any controversy arising from the execution of this Agreement, the Parties agree that the exclusive jurisdiction will be that of Riyadh, KSA.`;

export const COMPANY = {
  name: "Fairplatz",
  tagline: "exhibitions | events | expos",
  logo: "/brand/fairplatz-logo.png",
  mark: "/brand/fairplatz-mark.png",
};
