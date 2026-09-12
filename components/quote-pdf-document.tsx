import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { getBusinessProfile } from "@/lib/business-profile";
import { calculateQuoteTotals, formatCurrency } from "@/lib/calculations";
import type { DocumentType, Quote } from "@/lib/quote-schema";

type QuotePdfDocumentProps = {
  quote: Quote;
};

const colors = {
  ink: "#111827",
  muted: "#5f665f",
  line: "#d8ded6",
  green: "#1f5d43",
  pale: "#eef4ec",
  gold: "#c69335",
};

const styles = StyleSheet.create({
  page: {
    padding: 34,
    fontFamily: "Helvetica",
    color: colors.ink,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: 14,
    marginBottom: 16,
  },
  brand: {
    fontSize: 22,
    fontWeight: 700,
    color: colors.green,
  },
  titleBlock: {
    alignItems: "flex-end",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: colors.ink,
  },
  bodyText: {
    fontSize: 9,
    lineHeight: 1.45,
  },
  muted: {
    color: colors.muted,
  },
  section: {
    marginBottom: 12,
  },
  twoColumn: {
    flexDirection: "row",
    gap: 18,
  },
  column: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: colors.green,
    marginBottom: 5,
    textTransform: "uppercase",
  },
  jobTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6,
  },
  totalPanel: {
    alignSelf: "flex-end",
    width: 210,
    marginVertical: 8,
    padding: 12,
    backgroundColor: colors.pale,
    borderLeftWidth: 0,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: colors.green,
    textAlign: "center",
    marginBottom: 6,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 700,
    textAlign: "center",
  },
  taxNote: {
    marginTop: 4,
    fontSize: 8,
    color: colors.muted,
    textAlign: "center",
  },
  table: {
    borderWidth: 1,
    borderColor: colors.line,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.green,
    color: "#ffffff",
    fontSize: 8,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    fontSize: 8.5,
  },
  cell: {
    padding: 6,
  },
  descriptionCell: {
    flex: 1,
  },
  smallCell: {
    width: 54,
    textAlign: "right",
  },
  amountCell: {
    width: 74,
    textAlign: "right",
  },
  bullet: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 3,
  },
  bulletMark: {
    width: 6,
    color: colors.gold,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  photoItem: {
    width: "31.6%",
  },
  photo: {
    width: "100%",
    height: 76,
    objectFit: "cover",
    borderWidth: 1,
    borderColor: colors.line,
  },
  caption: {
    marginTop: 3,
    fontSize: 7,
    color: colors.muted,
  },
  footer: {
    position: "absolute",
    left: 34,
    right: 34,
    bottom: 22,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 7,
    fontSize: 7.5,
    color: colors.muted,
    textAlign: "center",
  },
});

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
          <View>
            <Text style={styles.brand}>{profile.name}</Text>
            <Text style={[styles.bodyText, styles.muted]}>{profile.email}</Text>
            <Text style={[styles.bodyText, styles.muted]}>{profile.phone}</Text>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.bodyText}>
              {isQuote ? "Quote No:" : "Invoice No:"} {quote.quoteNumber}
            </Text>
            <Text style={styles.bodyText}>
              {isQuote ? "Date:" : "Invoice Date:"} {formatDate(quote.issueDate)}
            </Text>
            <Text style={styles.bodyText}>
              {isQuote ? "Valid Until:" : "Due Date:"}{" "}
              {formatDate(isQuote ? quote.validUntil : quote.dueDate)}
            </Text>
          </View>
        </View>

        <View style={[styles.section, styles.twoColumn]}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Client</Text>
            <Text style={styles.bodyText}>Client Name: {quote.clientName || "Client"}</Text>
            <Text style={styles.bodyText}>Client Address: {quote.clientAddress}</Text>
            {quote.clientPhone ? <Text style={styles.bodyText}>Phone: {quote.clientPhone}</Text> : null}
            {quote.clientEmail ? <Text style={styles.bodyText}>Email: {quote.clientEmail}</Text> : null}
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Prepared By</Text>
            <Text style={styles.bodyText}>{profile.name}</Text>
            {isQuote ? <Text style={styles.bodyText}>Address: {profile.address}</Text> : null}
            <Text style={styles.bodyText}>ABN: {profile.abn}</Text>
            <Text style={styles.bodyText}>Phone: {profile.phone}</Text>
            <Text style={styles.bodyText}>Email: {profile.email}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.jobTitle}>{quote.jobTitle || "Painting works"}</Text>
          {quote.scope ? <Text style={styles.bodyText}>{quote.scope}</Text> : null}
        </View>

        <View style={styles.totalPanel}>
          <Text style={styles.totalLabel}>{summaryLabel(quote.documentType)}</Text>
          <Text style={styles.totalValue}>
            {formatCurrency(totals.grandTotal, quote.currency, quote.locale)}
          </Text>
          <Text style={styles.taxNote}>({quote.taxLabel} Inclusive)</Text>
        </View>

        {!isQuote ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Summary</Text>
            <PaymentTable quote={quote} />
            <Text style={[styles.bodyText, styles.muted]}>
              Note: This invoice confirms {quote.documentType === "deposit-invoice" ? "booking" : "completion"} of the listed work process and agreed project scope.
            </Text>
          </View>
        ) : (
          <WorkProcess quote={quote} />
        )}

        {photos.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{isQuote ? "Site Photos" : "Project Photos"}</Text>
            <View style={styles.photoGrid}>
              {photos.slice(0, 6).map((photo) => (
                <View key={photo.id} style={styles.photoItem}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image src={photo.dataUrl} style={styles.photo} />
                  <Text style={styles.caption}>{photo.caption}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {!isQuote ? <PaymentDetails quote={quote} /> : null}

        <View style={[styles.section, styles.twoColumn]}>
          <ListSection items={quote.inclusions} title="Inclusions" />
          {quote.exclusions.length > 0 ? (
            <ListSection items={quote.exclusions} title="Exclusions" />
          ) : null}
        </View>

        <ListSection items={quote.terms} title="Terms & Conditions" />

        {!isQuote ? (
          <View style={styles.section}>
            <Text style={[styles.bodyText, { textAlign: "center" }]}>Thank you for your business.</Text>
            <Text style={[styles.bodyText, { textAlign: "center" }]}>
              We appreciate the opportunity to complete this project for you.
            </Text>
          </View>
        ) : null}

        <Text fixed style={styles.footer}>
          {profile.name} | ABN {profile.abn} | {profile.phone} | {profile.email}
        </Text>
      </Page>
    </Document>
  );
}

function WorkProcess({ quote }: { quote: Quote }) {
  if (quote.workProcess.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Work Process</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.cell, { width: 36 }]}>Step</Text>
          <Text style={[styles.cell, { width: 96 }]}>Process</Text>
          <Text style={[styles.cell, styles.descriptionCell]}>Description</Text>
          <Text style={[styles.cell, { width: 58, textAlign: "right" }]}>Days</Text>
        </View>
        {quote.workProcess.map((row, index) => (
          <View key={`${row.step}-${index}`} style={styles.tableRow}>
            <Text style={[styles.cell, { width: 36 }]}>{row.step}</Text>
            <Text style={[styles.cell, { width: 96 }]}>{row.process}</Text>
            <Text style={[styles.cell, styles.descriptionCell]}>{row.description}</Text>
            <Text style={[styles.cell, { width: 58, textAlign: "right" }]}>{row.estimatedDays}</Text>
          </View>
        ))}
      </View>
      {quote.notes ? (
        <Text style={[styles.bodyText, styles.muted, { marginTop: 5 }]}>Note: {quote.notes}</Text>
      ) : null}
    </View>
  );
}

function PaymentTable({ quote }: { quote: Quote }) {
  const totals = calculateQuoteTotals(quote.lineItems, quote.includeVat, quote.vatRate);

  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.cell, styles.descriptionCell]}>Description</Text>
        <Text style={[styles.cell, styles.smallCell]}>Qty</Text>
        <Text style={[styles.cell, styles.amountCell]}>Rate</Text>
        <Text style={[styles.cell, styles.amountCell]}>Amount</Text>
      </View>
      {totals.lineItems.map((item, index) => (
        <View key={`${item.description}-${index}`} style={styles.tableRow}>
          <Text style={[styles.cell, styles.descriptionCell]}>
            {paymentDescription(quote.documentType, item.description, quote.relatedQuoteNumber)}
          </Text>
          <Text style={[styles.cell, styles.smallCell]}>{item.quantity}</Text>
          <Text style={[styles.cell, styles.amountCell]}>
            {formatCurrency(item.unitPrice, quote.currency, quote.locale)}
          </Text>
          <Text style={[styles.cell, styles.amountCell]}>
            {formatCurrency(item.lineTotal, quote.currency, quote.locale)}
          </Text>
        </View>
      ))}
      <View style={styles.tableRow}>
        <Text style={[styles.cell, styles.descriptionCell]}>Total balance due</Text>
        <Text style={[styles.cell, { width: 202, textAlign: "right", fontWeight: 700 }]}>
          {formatCurrency(totals.grandTotal, quote.currency, quote.locale)}
        </Text>
      </View>
    </View>
  );
}

function PaymentDetails({ quote }: { quote: Quote }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Payment Details</Text>
      <Text style={styles.bodyText}>Account Name: {quote.paymentDetails.accountName}</Text>
      <Text style={styles.bodyText}>BSB: {quote.paymentDetails.bsb}</Text>
      <Text style={styles.bodyText}>Account Number: {quote.paymentDetails.accountNumber}</Text>
      <Text style={styles.bodyText}>Reference: {quote.paymentDetails.reference}</Text>
    </View>
  );
}

function ListSection({ items, title }: { items: string[]; title: string }) {
  if (items.length === 0) return null;

  return (
    <View style={[styles.section, styles.column]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.bullet}>
          <Text style={[styles.bodyText, styles.bulletMark]}>-</Text>
          <Text style={[styles.bodyText, styles.descriptionCell]}>{item}</Text>
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

  return `${description} - ${relatedQuoteNumber}`;
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
