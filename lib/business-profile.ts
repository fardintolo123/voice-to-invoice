import type { DocumentType, Quote } from "@/lib/quote-schema";

export const FOUR_ELEMENTS_BUSINESS_ID = "4elements";

export type PaymentDetails = Quote["paymentDetails"];

export type BusinessProfile = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  abn: string;
  locale: string;
  currency: string;
  taxLabel: string;
  taxRate: number;
  taxInclusive: boolean;
  quoteValidDays: number;
  defaultDepositPercent: number;
  paymentDetails: PaymentDetails;
};

export const fourElementsProfile: BusinessProfile = {
  id: FOUR_ELEMENTS_BUSINESS_ID,
  name: "4Elements Painting",
  address: "Bolwarra Heights, NSW, 2320",
  phone: "0421 216 949",
  email: "info@4elementspainting.com.au",
  abn: "37 282 947 279",
  locale: "en-AU",
  currency: "AUD",
  taxLabel: "GST",
  taxRate: 10,
  taxInclusive: true,
  quoteValidDays: 14,
  defaultDepositPercent: 20,
  paymentDetails: {
    accountName: "Mustafa Barati",
    bsb: "062-749",
    accountNumber: "10061919",
    reference: "Invoice Number",
  },
};

export function getBusinessProfile(businessId = FOUR_ELEMENTS_BUSINESS_ID) {
  if (businessId !== FOUR_ELEMENTS_BUSINESS_ID) return fourElementsProfile;
  return fourElementsProfile;
}

export function documentTypeLabel(documentType: DocumentType) {
  switch (documentType) {
    case "deposit-invoice":
      return "20% Deposit Tax Invoice";
    case "final-invoice":
      return "Final Tax Invoice";
    default:
      return "Quote";
  }
}

export function documentNumberPrefix(documentType: DocumentType) {
  return documentType === "quote" ? "QT" : "INV";
}

export function fallbackDocumentNumber(documentType: DocumentType) {
  const now = new Date();
  const stamp = [
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
    String(now.getUTCHours()).padStart(2, "0"),
    String(now.getUTCMinutes()).padStart(2, "0"),
  ].join("");

  return `${documentNumberPrefix(documentType)}-${stamp}`;
}

export function defaultTerms(documentType: DocumentType) {
  if (documentType === "quote") {
    return [
      "This quote is valid for 14 days from the date above.",
      "Payment terms: 20% deposit, balance on completion unless otherwise agreed.",
      "Any additional work outside the scope will be quoted separately.",
      "We are fully insured for public liability.",
    ];
  }

  return [
    "Payment is due by the due date shown above.",
    "Any unpaid balance may delay further works.",
    "Additional works outside the approved scope are charged separately.",
    "Thank you for choosing 4Elements Painting.",
  ];
}

export function defaultInclusions(documentType: DocumentType) {
  if (documentType === "quote") {
    return [
      "Labour and equipment",
      "Surface preparation as outlined above",
      "Application of 2 coats finish paint",
      "Site clean up",
    ];
  }

  return [
    "Labour/Paint and equipment",
    "Surface preparation",
    "Application of 2 finish coats",
    "Final inspection and site clean up",
  ];
}

export function defaultExclusions(documentType: DocumentType) {
  if (documentType !== "quote") return [];

  return [
    "Any repairs to damaged timber",
    "Additional coats beyond scope",
  ];
}

export function defaultWorkProcess() {
  return [
    {
      step: "1",
      process: "Prepare & Protect",
      description:
        "Protect windows, doors, floors and surrounding surfaces. Clean and prepare nominated areas before painting.",
      estimatedDays: "",
    },
    {
      step: "2",
      process: "Surface Preparation",
      description:
        "Treat affected areas, remove loose material, sand where required and prepare surfaces for coating.",
      estimatedDays: "",
    },
    {
      step: "3",
      process: "Prime & Coat",
      description:
        "Apply suitable primer or undercoat where required, followed by premium finish coats.",
      estimatedDays: "",
    },
    {
      step: "4",
      process: "Final Inspection & Clean Up",
      description:
        "Complete final touch-ups, remove masking/protection and leave the work area clean and tidy.",
      estimatedDays: "",
    },
  ];
}
