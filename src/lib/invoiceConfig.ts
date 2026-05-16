export interface CountryInvoiceConfig {
  code: string;
  name: string;
  currency: string;
  locale: string;
  taxLabel: string;
  defaultTaxRate: number;
  invoiceTitle: string;
  dateLabel: string;
  subtotalLabel: string;
  taxLabelFull: string;
  totalLabel: string;
  paymentLabel: string;
  clientLabel: string;
  itemLabel: string;
  qtyLabel: string;
  priceLabel: string;
  amountLabel: string;
  depositLabel: string;
  tipLabel: string;
  // Optional extended labels — fall back to locale-aware defaults
  dueDateLabel?: string;
  serviceDateLabel?: string;
  balanceDueLabel?: string;
  studioLabel?: string;
  artistLabel?: string;
  termsLabel?: string;
  thankYouText?: string;
  signatureClientLabel?: string;
  signatureArtistLabel?: string;
}

// Locale-grouped defaults for extended fields
const EXTENDED_DEFAULTS: Record<string, Partial<CountryInvoiceConfig>> = {
  en: {
    dueDateLabel: 'Due Date', serviceDateLabel: 'Session Date', balanceDueLabel: 'Balance Due',
    studioLabel: 'Studio', artistLabel: 'Artist',
    termsLabel: 'Terms & Conditions',
    thankYouText: 'Thank you for your business! Please follow aftercare instructions for best results.',
    signatureClientLabel: 'Client Signature', signatureArtistLabel: 'Artist Signature',
  },
  es: {
    dueDateLabel: 'Fecha de Vencimiento', serviceDateLabel: 'Fecha de Sesión', balanceDueLabel: 'Saldo Pendiente',
    studioLabel: 'Estudio', artistLabel: 'Artista',
    termsLabel: 'Términos y Condiciones',
    thankYouText: '¡Gracias por su visita! Siga las instrucciones de cuidado posterior.',
    signatureClientLabel: 'Firma del Cliente', signatureArtistLabel: 'Firma del Artista',
  },
  pt: {
    dueDateLabel: 'Data de Vencimento', serviceDateLabel: 'Data da Sessão', balanceDueLabel: 'Saldo Devedor',
    studioLabel: 'Estúdio', artistLabel: 'Artista',
    termsLabel: 'Termos e Condições',
    thankYouText: 'Obrigado! Siga as instruções de cuidados posteriores.',
    signatureClientLabel: 'Assinatura do Cliente', signatureArtistLabel: 'Assinatura do Artista',
  },
  fr: {
    dueDateLabel: 'Date d\'Échéance', serviceDateLabel: 'Date de Séance', balanceDueLabel: 'Solde Dû',
    studioLabel: 'Studio', artistLabel: 'Artiste',
    termsLabel: 'Conditions Générales',
    thankYouText: 'Merci ! Suivez les instructions de soins post-tatouage.',
    signatureClientLabel: 'Signature du Client', signatureArtistLabel: 'Signature de l\'Artiste',
  },
  de: {
    dueDateLabel: 'Fälligkeitsdatum', serviceDateLabel: 'Sitzungsdatum', balanceDueLabel: 'Restbetrag',
    studioLabel: 'Studio', artistLabel: 'Künstler',
    termsLabel: 'Allgemeine Geschäftsbedingungen',
    thankYouText: 'Vielen Dank! Bitte befolgen Sie die Nachsorgehinweise.',
    signatureClientLabel: 'Unterschrift Kunde', signatureArtistLabel: 'Unterschrift Künstler',
  },
  ja: {
    dueDateLabel: '支払期限', serviceDateLabel: '施術日', balanceDueLabel: '残高',
    studioLabel: 'スタジオ', artistLabel: 'アーティスト',
    termsLabel: '利用規約',
    thankYouText: 'ご来店ありがとうございます。アフターケアの指示に従ってください。',
    signatureClientLabel: 'お客様署名', signatureArtistLabel: 'アーティスト署名',
  },
  ko: {
    dueDateLabel: '지급 기한', serviceDateLabel: '시술 날짜', balanceDueLabel: '잔액',
    studioLabel: '스튜디오', artistLabel: '아티스트',
    termsLabel: '이용 약관',
    thankYouText: '방문해 주셔서 감사합니다. 애프터케어 지침을 따라 주세요.',
    signatureClientLabel: '고객 서명', signatureArtistLabel: '아티스트 서명',
  },
  th: {
    dueDateLabel: 'วันครบกำหนด', serviceDateLabel: 'วันที่ให้บริการ', balanceDueLabel: 'ยอดคงเหลือ',
    studioLabel: 'สตูดิโอ', artistLabel: 'ศิลปิน',
    termsLabel: 'ข้อกำหนดและเงื่อนไข',
    thankYouText: 'ขอบคุณที่ใช้บริการ! กรุณาปฏิบัติตามคำแนะนำการดูแลหลังการสัก',
    signatureClientLabel: 'ลายเซ็นลูกค้า', signatureArtistLabel: 'ลายเซ็นศิลปิน',
  },
  fi: {
    dueDateLabel: 'Eräpäivä', serviceDateLabel: 'Istuntopäivä', balanceDueLabel: 'Maksettavaa',
    studioLabel: 'Studio', artistLabel: 'Artisti',
    termsLabel: 'Ehdot', thankYouText: 'Kiitos! Noudata jälkihoito-ohjeita.',
    signatureClientLabel: 'Asiakkaan Allekirjoitus', signatureArtistLabel: 'Artistin Allekirjoitus',
  },
  nl: {
    dueDateLabel: 'Vervaldatum', serviceDateLabel: 'Sessiedatum', balanceDueLabel: 'Openstaand Bedrag',
    studioLabel: 'Studio', artistLabel: 'Artiest',
    termsLabel: 'Voorwaarden', thankYouText: 'Bedankt! Volg de nazorginstructies.',
    signatureClientLabel: 'Handtekening Klant', signatureArtistLabel: 'Handtekening Artiest',
  },
  sv: {
    dueDateLabel: 'Förfallodatum', serviceDateLabel: 'Sessionsdatum', balanceDueLabel: 'Återstår',
    studioLabel: 'Studio', artistLabel: 'Konstnär',
    termsLabel: 'Villkor', thankYouText: 'Tack! Följ eftervårdsinstruktionerna.',
    signatureClientLabel: 'Kundens Signatur', signatureArtistLabel: 'Konstnärens Signatur',
  },
  nb: {
    dueDateLabel: 'Forfallsdato', serviceDateLabel: 'Øktdato', balanceDueLabel: 'Gjenstående',
    studioLabel: 'Studio', artistLabel: 'Artist',
    termsLabel: 'Vilkår', thankYouText: 'Takk! Følg instruksjonene for etterbehandling.',
    signatureClientLabel: 'Kundens Signatur', signatureArtistLabel: 'Kunstnerens Signatur',
  },
  da: {
    dueDateLabel: 'Forfaldsdato', serviceDateLabel: 'Sessionsdato', balanceDueLabel: 'Restbeløb',
    studioLabel: 'Studio', artistLabel: 'Kunstner',
    termsLabel: 'Vilkår', thankYouText: 'Tak! Følg efterbehandlingsinstruktionerne.',
    signatureClientLabel: 'Kundes Signatur', signatureArtistLabel: 'Kunstners Signatur',
  },
  pl: {
    dueDateLabel: 'Termin Płatności', serviceDateLabel: 'Data Sesji', balanceDueLabel: 'Pozostało do Zapłaty',
    studioLabel: 'Studio', artistLabel: 'Artysta',
    termsLabel: 'Warunki', thankYouText: 'Dziękujemy! Prosimy przestrzegać instrukcji pielęgnacji.',
    signatureClientLabel: 'Podpis Klienta', signatureArtistLabel: 'Podpis Artysty',
  },
  it: {
    dueDateLabel: 'Data Scadenza', serviceDateLabel: 'Data Sessione', balanceDueLabel: 'Saldo Dovuto',
    studioLabel: 'Studio', artistLabel: 'Artista',
    termsLabel: 'Termini e Condizioni', thankYouText: 'Grazie! Segui le istruzioni per la cura post-tatuaggio.',
    signatureClientLabel: 'Firma Cliente', signatureArtistLabel: 'Firma Artista',
  },
};

// Country configs mapped by ISO code
export const COUNTRIES: Record<string, CountryInvoiceConfig> = {
  // ── North America ──
  US: {
    code: 'US', name: 'United States', currency: 'USD', locale: 'en-US',
    taxLabel: 'Sales Tax', defaultTaxRate: 0,
    invoiceTitle: 'INVOICE', dateLabel: 'Date', subtotalLabel: 'Subtotal',
    taxLabelFull: 'Sales Tax', totalLabel: 'Total Due', paymentLabel: 'Payment Method',
    clientLabel: 'Client', itemLabel: 'Description', qtyLabel: 'Qty',
    priceLabel: 'Price', amountLabel: 'Amount', depositLabel: 'Deposit Applied', tipLabel: 'Tip',
  },
  CA: {
    code: 'CA', name: 'Canada', currency: 'CAD', locale: 'en-CA',
    taxLabel: 'GST/HST', defaultTaxRate: 5,
    invoiceTitle: 'INVOICE', dateLabel: 'Date', subtotalLabel: 'Subtotal',
    taxLabelFull: 'GST/HST', totalLabel: 'Total Due', paymentLabel: 'Payment Method',
    clientLabel: 'Client', itemLabel: 'Description', qtyLabel: 'Qty',
    priceLabel: 'Price', amountLabel: 'Amount', depositLabel: 'Deposit Applied', tipLabel: 'Tip',
  },
  MX: {
    code: 'MX', name: 'Mexico', currency: 'MXN', locale: 'es-MX',
    taxLabel: 'IVA', defaultTaxRate: 16,
    invoiceTitle: 'FACTURA', dateLabel: 'Fecha', subtotalLabel: 'Subtotal',
    taxLabelFull: 'IVA (16%)', totalLabel: 'Total a Pagar', paymentLabel: 'Método de Pago',
    clientLabel: 'Cliente', itemLabel: 'Descripción', qtyLabel: 'Cant',
    priceLabel: 'Precio', amountLabel: 'Importe', depositLabel: 'Anticipo Aplicado', tipLabel: 'Propina',
  },

  // ── South America ──
  BR: {
    code: 'BR', name: 'Brasil', currency: 'BRL', locale: 'pt-BR',
    taxLabel: 'ICMS', defaultTaxRate: 18,
    invoiceTitle: 'NOTA FISCAL', dateLabel: 'Data', subtotalLabel: 'Subtotal',
    taxLabelFull: 'ICMS (18%)', totalLabel: 'Total a Pagar', paymentLabel: 'Forma de Pagamento',
    clientLabel: 'Cliente', itemLabel: 'Descrição', qtyLabel: 'Qtd',
    priceLabel: 'Preço', amountLabel: 'Valor', depositLabel: 'Sinal Aplicado', tipLabel: 'Gorjeta',
  },
  AR: {
    code: 'AR', name: 'Argentina', currency: 'ARS', locale: 'es-AR',
    taxLabel: 'IVA', defaultTaxRate: 21,
    invoiceTitle: 'FACTURA', dateLabel: 'Fecha', subtotalLabel: 'Subtotal',
    taxLabelFull: 'IVA (21%)', totalLabel: 'Total a Pagar', paymentLabel: 'Método de Pago',
    clientLabel: 'Cliente', itemLabel: 'Descripción', qtyLabel: 'Cant',
    priceLabel: 'Precio', amountLabel: 'Importe', depositLabel: 'Anticipo Aplicado', tipLabel: 'Propina',
  },
  CL: {
    code: 'CL', name: 'Chile', currency: 'CLP', locale: 'es-CL',
    taxLabel: 'IVA', defaultTaxRate: 19,
    invoiceTitle: 'FACTURA', dateLabel: 'Fecha', subtotalLabel: 'Subtotal',
    taxLabelFull: 'IVA (19%)', totalLabel: 'Total a Pagar', paymentLabel: 'Método de Pago',
    clientLabel: 'Cliente', itemLabel: 'Descripción', qtyLabel: 'Cant',
    priceLabel: 'Precio', amountLabel: 'Importe', depositLabel: 'Anticipo Aplicado', tipLabel: 'Propina',
  },
  CO: {
    code: 'CO', name: 'Colombia', currency: 'COP', locale: 'es-CO',
    taxLabel: 'IVA', defaultTaxRate: 19,
    invoiceTitle: 'FACTURA', dateLabel: 'Fecha', subtotalLabel: 'Subtotal',
    taxLabelFull: 'IVA (19%)', totalLabel: 'Total a Pagar', paymentLabel: 'Método de Pago',
    clientLabel: 'Cliente', itemLabel: 'Descripción', qtyLabel: 'Cant',
    priceLabel: 'Precio', amountLabel: 'Importe', depositLabel: 'Anticipo Aplicado', tipLabel: 'Propina',
  },
  PE: {
    code: 'PE', name: 'Peru', currency: 'PEN', locale: 'es-PE',
    taxLabel: 'IGV', defaultTaxRate: 18,
    invoiceTitle: 'FACTURA', dateLabel: 'Fecha', subtotalLabel: 'Subtotal',
    taxLabelFull: 'IGV (18%)', totalLabel: 'Total a Pagar', paymentLabel: 'Método de Pago',
    clientLabel: 'Cliente', itemLabel: 'Descripción', qtyLabel: 'Cant',
    priceLabel: 'Precio', amountLabel: 'Importe', depositLabel: 'Anticipo Aplicado', tipLabel: 'Propina',
  },

  // ── Oceania ──
  AU: {
    code: 'AU', name: 'Australia', currency: 'AUD', locale: 'en-AU',
    taxLabel: 'GST', defaultTaxRate: 10,
    invoiceTitle: 'TAX INVOICE', dateLabel: 'Date', subtotalLabel: 'Subtotal',
    taxLabelFull: 'GST (10%)', totalLabel: 'Total Due', paymentLabel: 'Payment Method',
    clientLabel: 'Client', itemLabel: 'Description', qtyLabel: 'Qty',
    priceLabel: 'Price', amountLabel: 'Amount', depositLabel: 'Deposit Applied', tipLabel: 'Tip',
  },
  NZ: {
    code: 'NZ', name: 'New Zealand', currency: 'NZD', locale: 'en-NZ',
    taxLabel: 'GST', defaultTaxRate: 15,
    invoiceTitle: 'TAX INVOICE', dateLabel: 'Date', subtotalLabel: 'Subtotal',
    taxLabelFull: 'GST (15%)', totalLabel: 'Total Due', paymentLabel: 'Payment Method',
    clientLabel: 'Client', itemLabel: 'Description', qtyLabel: 'Qty',
    priceLabel: 'Price', amountLabel: 'Amount', depositLabel: 'Deposit Applied', tipLabel: 'Tip',
  },

  // ── Europe ──
  GB: {
    code: 'GB', name: 'United Kingdom', currency: 'GBP', locale: 'en-GB',
    taxLabel: 'VAT', defaultTaxRate: 20,
    invoiceTitle: 'INVOICE', dateLabel: 'Date', subtotalLabel: 'Subtotal',
    taxLabelFull: 'VAT (20%)', totalLabel: 'Total Due', paymentLabel: 'Payment Method',
    clientLabel: 'Client', itemLabel: 'Description', qtyLabel: 'Qty',
    priceLabel: 'Price', amountLabel: 'Amount', depositLabel: 'Deposit Applied', tipLabel: 'Tip',
  },
  DE: {
    code: 'DE', name: 'Deutschland', currency: 'EUR', locale: 'de-DE',
    taxLabel: 'MwSt.', defaultTaxRate: 19,
    invoiceTitle: 'RECHNUNG', dateLabel: 'Datum', subtotalLabel: 'Zwischensumme',
    taxLabelFull: 'MwSt. (19%)', totalLabel: 'Gesamtbetrag', paymentLabel: 'Zahlungsart',
    clientLabel: 'Kunde', itemLabel: 'Beschreibung', qtyLabel: 'Anz.',
    priceLabel: 'Preis', amountLabel: 'Betrag', depositLabel: 'Anzahlung', tipLabel: 'Trinkgeld',
  },
  FR: {
    code: 'FR', name: 'France', currency: 'EUR', locale: 'fr-FR',
    taxLabel: 'TVA', defaultTaxRate: 20,
    invoiceTitle: 'FACTURE', dateLabel: 'Date', subtotalLabel: 'Sous-total',
    taxLabelFull: 'TVA (20%)', totalLabel: 'Total à Payer', paymentLabel: 'Mode de Paiement',
    clientLabel: 'Client', itemLabel: 'Description', qtyLabel: 'Qté',
    priceLabel: 'Prix', amountLabel: 'Montant', depositLabel: 'Acompte Déduit', tipLabel: 'Pourboire',
  },
  ES: {
    code: 'ES', name: 'España', currency: 'EUR', locale: 'es-ES',
    taxLabel: 'IVA', defaultTaxRate: 21,
    invoiceTitle: 'FACTURA', dateLabel: 'Fecha', subtotalLabel: 'Subtotal',
    taxLabelFull: 'IVA (21%)', totalLabel: 'Total a Pagar', paymentLabel: 'Método de Pago',
    clientLabel: 'Cliente', itemLabel: 'Descripción', qtyLabel: 'Cant',
    priceLabel: 'Precio', amountLabel: 'Importe', depositLabel: 'Anticipo Aplicado', tipLabel: 'Propina',
  },
  PT: {
    code: 'PT', name: 'Portugal', currency: 'EUR', locale: 'pt-PT',
    taxLabel: 'IVA', defaultTaxRate: 23,
    invoiceTitle: 'FATURA', dateLabel: 'Data', subtotalLabel: 'Subtotal',
    taxLabelFull: 'IVA (23%)', totalLabel: 'Total a Pagar', paymentLabel: 'Método de Pagamento',
    clientLabel: 'Cliente', itemLabel: 'Descrição', qtyLabel: 'Qtd',
    priceLabel: 'Preço', amountLabel: 'Valor', depositLabel: 'Sinal Aplicado', tipLabel: 'Gorjeta',
  },
  IT: {
    code: 'IT', name: 'Italia', currency: 'EUR', locale: 'it-IT',
    taxLabel: 'IVA', defaultTaxRate: 22,
    invoiceTitle: 'FATTURA', dateLabel: 'Data', subtotalLabel: 'Subtotale',
    taxLabelFull: 'IVA (22%)', totalLabel: 'Totale Dovuto', paymentLabel: 'Metodo di Pagamento',
    clientLabel: 'Cliente', itemLabel: 'Descrizione', qtyLabel: 'Qtà',
    priceLabel: 'Prezzo', amountLabel: 'Importo', depositLabel: 'Acconto Applicato', tipLabel: 'Mancia',
  },
  NL: {
    code: 'NL', name: 'Nederland', currency: 'EUR', locale: 'nl-NL',
    taxLabel: 'BTW', defaultTaxRate: 21,
    invoiceTitle: 'FACTUUR', dateLabel: 'Datum', subtotalLabel: 'Subtotaal',
    taxLabelFull: 'BTW (21%)', totalLabel: 'Totaal Verschuldigd', paymentLabel: 'Betaalmethode',
    clientLabel: 'Klant', itemLabel: 'Omschrijving', qtyLabel: 'Aant.',
    priceLabel: 'Prijs', amountLabel: 'Bedrag', depositLabel: 'Aanbetaling Toegepast', tipLabel: 'Fooi',
  },
  BE: {
    code: 'BE', name: 'Belgium', currency: 'EUR', locale: 'fr-BE',
    taxLabel: 'TVA', defaultTaxRate: 21,
    invoiceTitle: 'FACTURE', dateLabel: 'Date', subtotalLabel: 'Sous-total',
    taxLabelFull: 'TVA (21%)', totalLabel: 'Total à Payer', paymentLabel: 'Mode de Paiement',
    clientLabel: 'Client', itemLabel: 'Description', qtyLabel: 'Qté',
    priceLabel: 'Prix', amountLabel: 'Montant', depositLabel: 'Acompte Déduit', tipLabel: 'Pourboire',
  },
  AT: {
    code: 'AT', name: 'Österreich', currency: 'EUR', locale: 'de-AT',
    taxLabel: 'MwSt.', defaultTaxRate: 20,
    invoiceTitle: 'RECHNUNG', dateLabel: 'Datum', subtotalLabel: 'Zwischensumme',
    taxLabelFull: 'MwSt. (20%)', totalLabel: 'Gesamtbetrag', paymentLabel: 'Zahlungsart',
    clientLabel: 'Kunde', itemLabel: 'Beschreibung', qtyLabel: 'Anz.',
    priceLabel: 'Preis', amountLabel: 'Betrag', depositLabel: 'Anzahlung', tipLabel: 'Trinkgeld',
  },
  CH: {
    code: 'CH', name: 'Schweiz', currency: 'CHF', locale: 'de-CH',
    taxLabel: 'MWST', defaultTaxRate: 7.7,
    invoiceTitle: 'RECHNUNG', dateLabel: 'Datum', subtotalLabel: 'Zwischensumme',
    taxLabelFull: 'MWST (7.7%)', totalLabel: 'Gesamtbetrag', paymentLabel: 'Zahlungsart',
    clientLabel: 'Kunde', itemLabel: 'Beschreibung', qtyLabel: 'Anz.',
    priceLabel: 'Preis', amountLabel: 'Betrag', depositLabel: 'Anzahlung', tipLabel: 'Trinkgeld',
  },
  SE: {
    code: 'SE', name: 'Sverige', currency: 'SEK', locale: 'sv-SE',
    taxLabel: 'Moms', defaultTaxRate: 25,
    invoiceTitle: 'FAKTURA', dateLabel: 'Datum', subtotalLabel: 'Delsumma',
    taxLabelFull: 'Moms (25%)', totalLabel: 'Att Betala', paymentLabel: 'Betalningsmetod',
    clientLabel: 'Kund', itemLabel: 'Beskrivning', qtyLabel: 'Ant.',
    priceLabel: 'Pris', amountLabel: 'Belopp', depositLabel: 'Deposition Tillämpad', tipLabel: 'Dricks',
  },
  NO: {
    code: 'NO', name: 'Norge', currency: 'NOK', locale: 'nb-NO',
    taxLabel: 'MVA', defaultTaxRate: 25,
    invoiceTitle: 'FAKTURA', dateLabel: 'Dato', subtotalLabel: 'Delsum',
    taxLabelFull: 'MVA (25%)', totalLabel: 'Å Betale', paymentLabel: 'Betalingsmetode',
    clientLabel: 'Kunde', itemLabel: 'Beskrivelse', qtyLabel: 'Ant.',
    priceLabel: 'Pris', amountLabel: 'Beløp', depositLabel: 'Forskudd Trukket', tipLabel: 'Tips',
  },
  DK: {
    code: 'DK', name: 'Danmark', currency: 'DKK', locale: 'da-DK',
    taxLabel: 'Moms', defaultTaxRate: 25,
    invoiceTitle: 'FAKTURA', dateLabel: 'Dato', subtotalLabel: 'Subtotal',
    taxLabelFull: 'Moms (25%)', totalLabel: 'At Betale', paymentLabel: 'Betalingsmetode',
    clientLabel: 'Kunde', itemLabel: 'Beskrivelse', qtyLabel: 'Ant.',
    priceLabel: 'Pris', amountLabel: 'Beløb', depositLabel: 'Depositum Anvendt', tipLabel: 'Drikkepenge',
  },
  FI: {
    code: 'FI', name: 'Suomi', currency: 'EUR', locale: 'fi-FI',
    taxLabel: 'ALV', defaultTaxRate: 24,
    invoiceTitle: 'LASKU', dateLabel: 'Päiväys', subtotalLabel: 'Välisumma',
    taxLabelFull: 'ALV (24%)', totalLabel: 'Maksettava', paymentLabel: 'Maksutapa',
    clientLabel: 'Asiakas', itemLabel: 'Kuvaus', qtyLabel: 'Määrä',
    priceLabel: 'Hinta', amountLabel: 'Summa', depositLabel: 'Ennakkomaksu Vähennetty', tipLabel: 'Juomaraha',
  },
  IE: {
    code: 'IE', name: 'Ireland', currency: 'EUR', locale: 'en-IE',
    taxLabel: 'VAT', defaultTaxRate: 23,
    invoiceTitle: 'INVOICE', dateLabel: 'Date', subtotalLabel: 'Subtotal',
    taxLabelFull: 'VAT (23%)', totalLabel: 'Total Due', paymentLabel: 'Payment Method',
    clientLabel: 'Client', itemLabel: 'Description', qtyLabel: 'Qty',
    priceLabel: 'Price', amountLabel: 'Amount', depositLabel: 'Deposit Applied', tipLabel: 'Tip',
  },
  PL: {
    code: 'PL', name: 'Polska', currency: 'PLN', locale: 'pl-PL',
    taxLabel: 'VAT', defaultTaxRate: 23,
    invoiceTitle: 'FAKTURA', dateLabel: 'Data', subtotalLabel: 'Suma Częściowa',
    taxLabelFull: 'VAT (23%)', totalLabel: 'Do Zapłaty', paymentLabel: 'Metoda Płatności',
    clientLabel: 'Klient', itemLabel: 'Opis', qtyLabel: 'Ilość',
    priceLabel: 'Cena', amountLabel: 'Kwota', depositLabel: 'Zaliczka Odliczona', tipLabel: 'Napiwek',
  },

  // ── Asia-Pacific ──
  JP: {
    code: 'JP', name: '日本', currency: 'JPY', locale: 'ja-JP',
    taxLabel: '消費税', defaultTaxRate: 10,
    invoiceTitle: '領収書', dateLabel: '日付', subtotalLabel: '小計',
    taxLabelFull: '消費税 (10%)', totalLabel: '合計金額', paymentLabel: '支払方法',
    clientLabel: 'お客様', itemLabel: '品目', qtyLabel: '数量',
    priceLabel: '単価', amountLabel: '金額', depositLabel: '前受金充当', tipLabel: 'チップ',
  },
  TH: {
    code: 'TH', name: 'ประเทศไทย', currency: 'THB', locale: 'th-TH',
    taxLabel: 'VAT', defaultTaxRate: 7,
    invoiceTitle: 'ใบเสร็จรับเงิน', dateLabel: 'วันที่', subtotalLabel: 'ยอดรวมย่อย',
    taxLabelFull: 'VAT (7%)', totalLabel: 'ยอดรวมทั้งสิ้น', paymentLabel: 'วิธีชำระเงิน',
    clientLabel: 'ลูกค้า', itemLabel: 'รายการ', qtyLabel: 'จำนวน',
    priceLabel: 'ราคา', amountLabel: 'จำนวนเงิน', depositLabel: 'หักมัดจำ', tipLabel: 'ทิป',
  },
  KR: {
    code: 'KR', name: '대한민국', currency: 'KRW', locale: 'ko-KR',
    taxLabel: '부가세', defaultTaxRate: 10,
    invoiceTitle: '계산서', dateLabel: '날짜', subtotalLabel: '소계',
    taxLabelFull: '부가세 (10%)', totalLabel: '총액', paymentLabel: '결제수단',
    clientLabel: '고객', itemLabel: '품목', qtyLabel: '수량',
    priceLabel: '단가', amountLabel: '금액', depositLabel: '선금 적용', tipLabel: '팁',
  },
};

// Standard tattoo studio terms — crafted from competitor research across US/UK/AU/JP studios
export const DEFAULT_TERMS_TEXT = `DEPOSIT
A non-refundable deposit is required to secure your appointment. The deposit will be applied to the final cost of your tattoo. For multi-session work, the deposit carries forward and is deducted from the final session balance.

CANCELLATION & RESCHEDULING
Your appointment time is reserved exclusively for you. If you need to cancel or reschedule, you must notify the studio at least 48 hours in advance. Cancellations made with less than 48 hours notice will result in forfeiture of the deposit. A new deposit will be required to rebook.

NO-SHOW
Failure to arrive for your scheduled appointment without prior communication will result in automatic forfeiture of your deposit. Repeat no-shows may result in refusal of future bookings.

LATE ARRIVAL
Please arrive on time. Clients arriving more than 15 minutes late may have their appointment shortened or forfeited at the artist's discretion, without refund of deposit.

REFUND POLICY
All tattoo services are non-refundable once performed. Aftercare products and retail items are non-returnable once opened. If you have concerns about your tattoo, please contact the studio within 7 days.

TOUCH-UP POLICY
One complimentary touch-up session is offered within 90 days of the original appointment, subject to artist assessment. Touch-ups requested after 90 days will be charged at the artist's standard rate. Touch-ups do not cover fading caused by improper aftercare, sun exposure, or natural skin changes.

PAYMENT
Balance is due at the time of service. Accepted payment methods are listed on the invoice. Tips are optional and go 100% to the artist.

ARTIST CANCELLATION
In the rare event the studio must cancel your appointment, we will reschedule you at no additional charge and your deposit will transfer to the new date.

By receiving this invoice and paying your deposit, you acknowledge that you have read and agree to these terms.`;

function getExtendedDefaults(locale: string): Partial<CountryInvoiceConfig> {
  const lang = locale.split('-')[0];
  return EXTENDED_DEFAULTS[lang] || EXTENDED_DEFAULTS.en;
}

export function getCountryConfig(code: string): CountryInvoiceConfig {
  const base = COUNTRIES[code] || COUNTRIES.US;
  const defaults = getExtendedDefaults(base.locale);
  return { ...defaults, ...base } as CountryInvoiceConfig;
}

export function getSupportedCountries(): { code: string; name: string }[] {
  return Object.entries(COUNTRIES).map(([code, cfg]) => ({ code, name: cfg.name }));
}

export function formatInvoiceCurrency(amountCents: number, country: string): string {
  const cfg = getCountryConfig(country);
  return new Intl.NumberFormat(cfg.locale, {
    style: 'currency',
    currency: cfg.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

export function formatInvoiceDate(timestamp: number, country: string): string {
  const cfg = getCountryConfig(country);
  return new Intl.DateTimeFormat(cfg.locale, {
    dateStyle: 'long', timeStyle: 'short',
  }).format(new Date(timestamp));
}
