import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { getBusinessProfile } from "@/lib/business-profile";
import { calculateQuoteTotals } from "@/lib/calculations";
import type { DocumentType, Quote } from "@/lib/quote-schema";

type QuotePdfDocumentProps = {
  quote: Quote;
};

const red = "#e01a24";

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingHorizontal: 13,
    paddingBottom: 18,
    fontFamily: "Helvetica",
    color: "#111111",
    backgroundColor: "#ffffff",
  },
  header: {
    minHeight: 82,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 14,
  },
  brandLockup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 54,
    height: 54,
    objectFit: "contain",
  },
  brandWords: {
    width: 150,
  },
  brandName: {
    fontSize: 21,
    fontWeight: 700,
    lineHeight: 0.92,
  },
  brandSuffix: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: 700,
    color: red,
    textAlign: "center",
  },
  documentMeta: {
    width: 220,
    alignItems: "flex-end",
  },
  documentTitle: {
    fontSize: 27,
    fontWeight: 700,
    marginBottom: 12,
    textAlign: "right",
    color: red,
  },
  metaRow: {
    width: 168,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  metaText: {
    fontSize: 8,
    lineHeight: 1.35,
  },
  redBar: {
    height: 20,
    marginBottom: 18,
    backgroundColor: red,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 4,
    textTransform: "uppercase",
    color: red,
  },
  bodyText: {
    fontSize: 8.4,
    lineHeight: 1.16,
  },
  bodyBlock: {
    fontSize: 11.4,
    lineHeight: 1.16,
    marginTop: 13,
  },
  bold: {
    fontWeight: 700,
  },
  twoColumn: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 8,
  },
  column: {
    flex: 1,
  },
  bottomColumns: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 34,
  },
  bottomColumn: {
    width: "30%",
  },
  preparedPanel: {
    width: 306,
    padding: 8,
    backgroundColor: "#efefef",
  },
  jobSection: {
    width: 370,
    paddingLeft: 8,
  },
  jobTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6,
  },
  moneyBlock: {
    position: "absolute",
    top: 292,
    right: 26,
    width: 178,
    borderWidth: 1,
    borderColor: "#111111",
  },
  moneyTitle: {
    paddingVertical: 6,
    fontSize: 8.8,
    fontWeight: 700,
    textAlign: "center",
    textTransform: "uppercase",
    color: "#ffffff",
    backgroundColor: "#0f1d26",
  },
  moneyValue: {
    paddingTop: 14,
    fontSize: 10,
    textAlign: "center",
  },
  taxText: {
    paddingBottom: 13,
    fontSize: 9,
    textAlign: "center",
    marginTop: 3,
  },
  table: {
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#5d5d5d",
  },
  tableRow: {
    minHeight: 29,
    flexDirection: "row",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#cfcfcf",
  },
  tableText: {
    padding: 5,
    fontSize: 7.6,
    lineHeight: 1.2,
  },
  descriptionCell: {
    flex: 1,
  },
  stepCell: {
    width: 45,
    textAlign: "center",
  },
  processCell: {
    width: 115,
  },
  daysCell: {
    width: 82,
    textAlign: "center",
  },
  qtyCell: {
    width: 48,
    textAlign: "right",
  },
  rateCell: {
    width: 84,
    textAlign: "right",
  },
  amountCell: {
    width: 86,
    textAlign: "right",
  },
  note: {
    fontSize: 6.8,
    lineHeight: 1.35,
    marginTop: 2,
    fontWeight: 700,
  },
  photoGrid: {
    minHeight: 52,
    flexDirection: "row",
    gap: 0,
    paddingHorizontal: 24,
  },
  photoItem: {
    width: "33.33%",
    paddingHorizontal: 10,
  },
  photo: {
    width: "100%",
    height: 142,
    objectFit: "cover",
  },
  photoPlaceholder: {
    width: "33.33%",
    height: 42,
    borderWidth: 1,
    borderColor: "#d7d7d7",
  },
  caption: {
    fontSize: 7,
    lineHeight: 1.2,
    marginTop: 2,
    color: "#444444",
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 1,
  },
  bulletMark: {
    width: 6,
    fontSize: 6.6,
  },
  listText: {
    fontSize: 7.2,
    lineHeight: 1.12,
  },
});

let cachedLogo: string | null = null;

export function QuotePdfDocument({ quote }: QuotePdfDocumentProps) {
  const profile = getBusinessProfile(quote.businessId);
  const totals = calculateQuoteTotals(
    quote.lineItems,
    quote.includeVat,
    quote.vatRate,
  );
  const isQuote = quote.documentType === "quote";
  const title = isQuote ? "QUOTE" : "TAX INVOICE";
  const photos = quote.photos.filter((photo) =>
    isQuote ? photo.section === "site" : photo.section === "project",
  );

  return (
    <Document
      author={profile.name}
      creator={profile.name}
      keywords={`${profile.name}, quote, invoice, painting`}
      producer={profile.name}
      subject={`${title} ${quote.quoteNumber}`}
      title={`${title} ${quote.quoteNumber}`}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandLockup}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={getLogoDataUri()} style={styles.logo} />
            <View style={styles.brandWords}>
              <Text style={styles.brandName}>4ELEMENTS</Text>
              <Text style={styles.brandName}>PAINTING</Text>
              <Text style={styles.brandSuffix}>PTY LTD</Text>
            </View>
          </View>
          <View style={styles.documentMeta}>
            <Text style={styles.documentTitle}>{title}</Text>
            <MetaRow label={isQuote ? "Quote No:" : "Invoice No:"} value={quote.quoteNumber} />
            <MetaRow label={isQuote ? "Date:" : "Invoice Date:"} value={formatDate(quote.issueDate)} />
            <MetaRow label={isQuote ? "Valid Until:" : "Due Date:"} value={formatDate(isQuote ? quote.validUntil : quote.dueDate)} />
          </View>
        </View>

        <View style={styles.redBar} />

        <View style={[styles.section, styles.twoColumn]}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Client</Text>
            <Text style={[styles.bodyText, { fontSize: 14, fontWeight: 700 }]}>
              Client Name: {quote.clientName || "Client"}
            </Text>
            <Text style={[styles.bodyText, styles.bold]}>Client Address: {quote.clientAddress}</Text>
            {quote.clientPhone ? <Text style={[styles.bodyText, styles.bold]}>Phone: {quote.clientPhone}</Text> : null}
            {quote.clientEmail ? <Text style={[styles.bodyText, styles.bold]}>Email: {quote.clientEmail}</Text> : null}
          </View>
          <View style={styles.preparedPanel}>
            <Text style={styles.sectionTitle}>Prepared By</Text>
            <Text style={[styles.bodyText, { fontSize: 12, fontWeight: 700 }]}>{profile.name}</Text>
            {isQuote ? <Text style={[styles.bodyText, styles.bold]}>Address: {profile.address}</Text> : null}
            <Text style={[styles.bodyText, styles.bold]}>Phone: {profile.phone}</Text>
            <Text style={[styles.bodyText, styles.bold]}>Email: {profile.email}</Text>
            <Text style={[styles.bodyText, styles.bold]}>ABN: {profile.abn.replaceAll(" ", "")}</Text>
          </View>
        </View>

        <View style={[styles.section, styles.jobSection]}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.jobTitle}>{quote.jobTitle || "Painting Works"}</Text>
          {quote.scope ? <Text style={styles.bodyBlock}>{quote.scope}</Text> : null}
        </View>

        <MoneyBlock
          documentType={quote.documentType}
          taxLabel={quote.taxLabel}
          total={totals.grandTotal}
        />

        {isQuote ? (
          <WorkProcess quote={quote} />
        ) : (
          <PaymentSummary quote={quote} />
        )}

        <PhotoSection
          photos={photos}
          title={isQuote ? "Site Photos" : "Project Photos"}
        />

        {!isQuote ? <PaymentDetails quote={quote} /> : null}

        <View style={[styles.section, styles.bottomColumns]}>
          <ListSection column items={quote.inclusions} title="Inclusions" />
          {quote.exclusions.length > 0 ? (
            <ListSection column items={quote.exclusions} title="Exclusions" />
          ) : null}
          <ListSection column items={quote.terms} title="Terms & Conditions" />
        </View>

        {!isQuote ? (
          <View style={styles.section}>
            <Text style={[styles.bodyText, { textAlign: "center" }]}>Thank you for your business.</Text>
            <Text style={[styles.bodyText, { textAlign: "center" }]}>
              We appreciate the opportunity to complete this project for you.
            </Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaText}>{label}</Text>
      <Text style={styles.metaText}>{value}</Text>
    </View>
  );
}

function MoneyBlock({
  documentType,
  taxLabel,
  total,
}: {
  documentType: DocumentType;
  taxLabel: string;
  total: number;
}) {
  return (
    <View style={styles.moneyBlock}>
      <Text style={styles.moneyTitle}>{summaryLabel(documentType)}</Text>
      <Text style={styles.moneyValue}>$ {formatWholeDollars(total)}</Text>
      <Text style={styles.taxText}>({taxLabel} Inclusive)</Text>
    </View>
  );
}

function WorkProcess({ quote }: { quote: Quote }) {
  if (quote.workProcess.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { paddingLeft: 18 }]}>Work Process</Text>
      <View style={[styles.table, { marginHorizontal: 18 }]}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableText, styles.stepCell, styles.bold, { color: "#ffffff" }]}>STEP</Text>
          <Text style={[styles.tableText, styles.processCell, styles.bold, { color: "#ffffff", textAlign: "center" }]}>PROCESS</Text>
          <Text style={[styles.tableText, styles.descriptionCell, styles.bold, { color: "#ffffff", textAlign: "center" }]}>DESCRIPTION</Text>
          <Text style={[styles.tableText, styles.daysCell, styles.bold, { color: "#ffffff" }]}>Estimated working Days</Text>
        </View>
        {quote.workProcess.map((row, index) => (
          <View key={`${row.step}-${index}`} style={styles.tableRow}>
            <Text style={[styles.tableText, styles.stepCell, styles.bold, { backgroundColor: red, color: "#ffffff" }]}>{row.step}</Text>
            <Text style={[styles.tableText, styles.processCell, styles.bold]}>{row.process}</Text>
            <Text style={[styles.tableText, styles.descriptionCell]}>{row.description}</Text>
            <Text style={[styles.tableText, styles.daysCell]}>{row.estimatedDays}</Text>
          </View>
        ))}
      </View>
      {quote.notes ? (
        <Text style={[styles.note, { paddingHorizontal: 18 }]}>Note: {quote.notes}</Text>
      ) : null}
    </View>
  );
}

function PaymentSummary({ quote }: { quote: Quote }) {
  const totals = calculateQuoteTotals(quote.lineItems, quote.includeVat, quote.vatRate);

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { paddingLeft: 18 }]}>Payment Summary</Text>
      <View style={[styles.table, { marginHorizontal: 18 }]}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableText, styles.descriptionCell, styles.bold, { color: "#ffffff" }]}>DESCRIPTION</Text>
          <Text style={[styles.tableText, styles.qtyCell, styles.bold, { color: "#ffffff" }]}>QTY</Text>
          <Text style={[styles.tableText, styles.rateCell, styles.bold, { color: "#ffffff" }]}>RATE</Text>
          <Text style={[styles.tableText, styles.amountCell, styles.bold, { color: "#ffffff" }]}>AMOUNT</Text>
        </View>
        {totals.lineItems.map((item, index) => (
          <View key={`${item.description}-${index}`} style={styles.tableRow}>
            <Text style={[styles.tableText, styles.descriptionCell]}>
              {paymentDescription(quote.documentType, item.description, quote.relatedQuoteNumber)}
            </Text>
            <Text style={[styles.tableText, styles.qtyCell]}>{item.quantity}</Text>
            <Text style={[styles.tableText, styles.rateCell]}>$ {formatWholeDollars(item.unitPrice)}</Text>
            <Text style={[styles.tableText, styles.amountCell]}>$ {formatWholeDollars(item.lineTotal)}</Text>
          </View>
        ))}
        <View style={styles.tableRow}>
          <Text style={[styles.tableText, styles.descriptionCell]}>Total balance due</Text>
          <Text style={[styles.tableText, { width: 218, textAlign: "right", fontWeight: 700 }]}>
            $ {formatWholeDollars(totals.grandTotal)}
          </Text>
        </View>
      </View>
      <Text style={[styles.note, { paddingHorizontal: 18 }]}>
        Note: This invoice confirms {quote.documentType === "deposit-invoice" ? "booking" : "completion"} of the listed work process and agreed project scope.
      </Text>
    </View>
  );
}

function PhotoSection({
  photos,
  title,
}: {
  photos: Quote["photos"];
  title: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { paddingLeft: 18 }]}>{title}</Text>
      <View style={styles.photoGrid}>
        {photos.length > 0
          ? photos.slice(0, 3).map((photo) => (
              <View key={photo.id} style={styles.photoItem}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={photo.dataUrl} style={styles.photo} />
                {photo.caption ? <Text style={styles.caption}>{photo.caption}</Text> : null}
              </View>
            ))
          : [0, 1, 2].map((index) => (
              <View key={index} style={styles.photoPlaceholder} />
            ))}
      </View>
    </View>
  );
}

function PaymentDetails({ quote }: { quote: Quote }) {
  return (
    <View style={[styles.section, { paddingHorizontal: 18 }]}>
      <Text style={styles.sectionTitle}>Payment Details</Text>
      <Text style={styles.bodyText}>Account Name: {quote.paymentDetails.accountName}</Text>
      <Text style={styles.bodyText}>BSB: {quote.paymentDetails.bsb}</Text>
      <Text style={styles.bodyText}>Account Number:{quote.paymentDetails.accountNumber}</Text>
      <Text style={styles.bodyText}>Reference: {quote.paymentDetails.reference}</Text>
    </View>
  );
}

function ListSection({
  column = false,
  items,
  title,
}: {
  column?: boolean;
  items: string[];
  title: string;
}) {
  const visibleItems = items.map((item) => item.trim()).filter(Boolean);
  if (visibleItems.length === 0) return null;

  return (
    <View style={column ? styles.bottomColumn : [styles.section, styles.column]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {visibleItems.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.bulletRow}>
          <Text style={styles.bulletMark}>-</Text>
          <Text style={[styles.bodyText, styles.listText, styles.descriptionCell]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function summaryLabel(documentType: DocumentType) {
  switch (documentType) {
    case "deposit-invoice":
      return "20% Deposit due";
    case "final-invoice":
      return "Balance Due";
    default:
      return "Quote Total";
  }
}

function paymentDescription(
  documentType: DocumentType,
  description: string,
  relatedQuoteNumber: string,
) {
  if (documentType !== "deposit-invoice" || !relatedQuoteNumber) {
    return description;
  }

  return `${description} _ ${relatedQuoteNumber}`;
}

function formatDate(value: string) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatWholeDollars(value: number) {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2);
}

function getLogoDataUri() {
  if (cachedLogo) return cachedLogo;

  const logoPath = join(process.cwd(), "public", "logo.png");
  const logo = readFileSync(logoPath).toString("base64");
  cachedLogo = `data:image/png;base64,${logo}`;
  return cachedLogo;
}
