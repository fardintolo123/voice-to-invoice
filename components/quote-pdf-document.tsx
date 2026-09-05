import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { calculateQuoteTotals, formatGbp } from "@/lib/calculations";
import type { Quote } from "@/lib/quote-schema";

type QuotePdfDocumentProps = {
  quote: Quote;
};

const styles = StyleSheet.create({
  page: {
    position: "relative",
    padding: 42,
    fontFamily: "Helvetica",
    color: "#151515",
    backgroundColor: "#ffffff",
  },
  watermark: {
    position: "absolute",
    top: 335,
    left: 55,
    transform: "rotate(-45deg)",
    fontSize: 64,
    fontWeight: 700,
    color: "#d6d1c0",
    opacity: 0.28,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#d8d4c7",
    paddingBottom: 18,
    marginBottom: 22,
  },
  brand: {
    fontSize: 22,
    fontWeight: 700,
    color: "#135f63",
  },
  muted: {
    color: "#68665f",
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    textAlign: "right",
  },
  section: {
    marginBottom: 20,
  },
  twoColumn: {
    flexDirection: "row",
    gap: 18,
  },
  column: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#68665f",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.55,
  },
  table: {
    borderWidth: 1,
    borderColor: "#d8d4c7",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#135f63",
    color: "#ffffff",
    fontSize: 9,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#d8d4c7",
    fontSize: 10,
  },
  cell: {
    padding: 8,
  },
  descriptionCell: {
    flex: 1,
  },
  numericCell: {
    width: 82,
    textAlign: "right",
  },
  totals: {
    width: 210,
    marginLeft: "auto",
    marginTop: 14,
    padding: 12,
    backgroundColor: "#f1f0e8",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 10,
    marginBottom: 7,
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: "#d8d4c7",
    paddingTop: 8,
    marginTop: 2,
    fontSize: 13,
    fontWeight: 700,
  },
  footer: {
    position: "absolute",
    left: 42,
    right: 42,
    bottom: 28,
    borderTopWidth: 1,
    borderTopColor: "#d8d4c7",
    paddingTop: 8,
    fontSize: 8,
    color: "#68665f",
  },
});

export function QuotePdfDocument({ quote }: QuotePdfDocumentProps) {
  const totals = calculateQuoteTotals(
    quote.lineItems,
    quote.includeVat,
    quote.vatRate,
  );

  return (
    <Document
      author="PlainLaunch Quotes"
      creator="PlainLaunch Quotes"
      keywords="quote, invoice, plainlaunch"
      ownerPassword={crypto.randomUUID()}
      permissions={{
        modifying: false,
        copying: false,
        annotating: false,
        fillingForms: false,
        documentAssembly: false,
        printing: "highResolution",
      }}
      producer="PlainLaunch Quotes"
      subject={`Quote ${quote.quoteNumber}`}
      title={`Quote ${quote.quoteNumber}`}
    >
      <Page size="A4" style={styles.page}>
        <Text fixed style={styles.watermark}>
          DRAFT QUOTE
        </Text>

        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>PlainLaunch Quotes</Text>
            <Text style={[styles.bodyText, styles.muted]}>
              Voice-to-invoice quote automation
            </Text>
          </View>
          <View>
            <Text style={styles.title}>QUOTE</Text>
            <Text style={[styles.bodyText, styles.muted]}>
              {quote.quoteNumber}
            </Text>
          </View>
        </View>

        <View style={[styles.section, styles.twoColumn]}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Prepared for</Text>
            <Text style={styles.bodyText}>{quote.clientName || "Client"}</Text>
            {quote.clientEmail ? (
              <Text style={styles.bodyText}>{quote.clientEmail}</Text>
            ) : null}
            <Text style={styles.bodyText}>{quote.clientAddress}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Dates</Text>
            <Text style={styles.bodyText}>Issue date: {quote.issueDate}</Text>
            <Text style={styles.bodyText}>Valid until: {quote.validUntil}</Text>
            <Text style={styles.bodyText}>
              VAT: {quote.includeVat ? `${quote.vatRate}% UK VAT` : "Not applied"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.cell, styles.descriptionCell]}>
                Description
              </Text>
              <Text style={[styles.cell, styles.numericCell]}>Qty</Text>
              <Text style={[styles.cell, styles.numericCell]}>Unit</Text>
              <Text style={[styles.cell, styles.numericCell]}>Total</Text>
            </View>
            {totals.lineItems.map((item, index) => (
              <View key={`${item.description}-${index}`} style={styles.tableRow}>
                <Text style={[styles.cell, styles.descriptionCell]}>
                  {item.description}
                </Text>
                <Text style={[styles.cell, styles.numericCell]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.cell, styles.numericCell]}>
                  {formatGbp(item.unitPrice)}
                </Text>
                <Text style={[styles.cell, styles.numericCell]}>
                  {formatGbp(item.lineTotal)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.totals}>
            <TotalRow label="Subtotal" value={formatGbp(totals.subtotal)} />
            <TotalRow
              label={`VAT ${quote.includeVat ? `${quote.vatRate}%` : "off"}`}
              value={formatGbp(totals.vatAmount)}
            />
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text>Total</Text>
              <Text>{formatGbp(totals.grandTotal)}</Text>
            </View>
          </View>
        </View>

        {quote.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.bodyText}>{quote.notes}</Text>
          </View>
        ) : null}

        <Text fixed style={styles.footer}>
          Generated by PlainLaunch Quotes. Calculations are performed
          deterministically in application code.
        </Text>
      </Page>
    </Document>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.totalRow}>
      <Text>{label}</Text>
      <Text>{value}</Text>
    </View>
  );
}
