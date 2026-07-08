import { readFileSync, writeFileSync } from 'fs';

const path = 'src/lib/i18n.ts';
let content = readFileSync(path, 'utf8');

const newKeys = [
  ['pos_session_checkout', { en:"Session Checkout", es:"Cobro de Sesión", pt:"Checkout de Sessão", fr:"Paiement de Session", de:"Sitzungs-Checkout", th:"ชำระเงินเซสชัน", jp:"セッション会計" }],
  ['pos_quick_sale', { en:"Quick Sale", es:"Venta Rápida", pt:"Venda Rápida", fr:"Vente Rapide", de:"Schnellverkauf", th:"ขายเร็ว", jp:"クイック販売" }],
  ['pos_refund_transaction', { en:"Refund Transaction", es:"Transacción de Reembolso", pt:"Transação de Reembolso", fr:"Transaction de Remboursement", de:"Rückerstattung", th:"รายการคืนเงิน", jp:"返金取引" }],
  ['pos_select_transaction', { en:"Select transaction...", es:"Seleccionar transacción...", pt:"Selecionar transação...", fr:"Sélectionner transaction...", de:"Transaktion wählen...", th:"เลือกรายการ...", jp:"取引を選択..." }],
  ['pos_confirm_refund', { en:"Confirm Refund", es:"Confirmar Reembolso", pt:"Confirmar Reembolso", fr:"Confirmer Remboursement", de:"Rückerstattung bestätigen", th:"ยืนยันการคืนเงิน", jp:"返金確定" }],
  ['pos_select_appointment', { en:"Select today's appointment to checkout:", es:"Seleccionar cita de hoy para cobrar:", pt:"Selecionar agendamento de hoje para checkout:", fr:"Sélectionner le rendez-vous d'aujourd'hui:", de:"Heutigen Termin zum Abrechnen wählen:", th:"เลือกนัดหมายวันนี้เพื่อชำระเงิน:", jp:"本日の予約を選択して会計:" }],
  ['pos_no_active_appointments', { en:"No active appointments today.", es:"Sin citas activas hoy.", pt:"Sem agendamentos ativos hoje.", fr:"Pas de rendez-vous actifs aujourd'hui.", de:"Keine aktiven Termine heute.", th:"ไม่มีการนัดหมายที่ใช้งานวันนี้", jp:"本日の有効な予約はありません。" }],
  ['pos_deposit_paid_label', { en:"Deposit Paid", es:"Depósito Pagado", pt:"Sinal Pago", fr:"Acompte Payé", de:"Anzahlung bezahlt", th:"มัดจำแล้ว", jp:"デポジット支払済" }],
  ['pos_unconfirmed', { en:"Unconfirmed", es:"Sin Confirmar", pt:"Não Confirmado", fr:"Non Confirmé", de:"Unbestätigt", th:"ยังไม่ยืนยัน", jp:"未確認" }],
  ['pos_checking_out', { en:"Checking out:", es:"Cobrando a:", pt:"Finalizando:", fr:"Paiement pour:", de:"Kasse für:", th:"กำลังชำระเงิน:", jp:"会計中:" }],
  ['pos_change_btn', { en:"Change", es:"Cambiar", pt:"Alterar", fr:"Changer", de:"Ändern", th:"เปลี่ยน", jp:"変更" }],
  ['pos_no_deposit', { en:"No deposit", es:"Sin depósito", pt:"Sem sinal", fr:"Pas d'acompte", de:"Keine Anzahlung", th:"ไม่มีมัดจำ", jp:"デポジットなし" }],
  ['pos_applied', { en:"applied", es:"aplicado", pt:"aplicado", fr:"appliqué", de:"angewendet", th:"ใช้แล้ว", jp:"適用済" }],
  ['pos_search_products', { en:"Search products...", es:"Buscar productos...", pt:"Buscar produtos...", fr:"Rechercher produits...", de:"Produkte suchen...", th:"ค้นหาสินค้า...", jp:"商品検索..." }],
  ['pos_tap_to_add', { en:"Tap products to add", es:"Toca productos para añadir", pt:"Toque nos produtos para adicionar", fr:"Appuyez sur les produits à ajouter", de:"Produkte antippen zum Hinzufügen", th:"แตะสินค้าเพื่อเพิ่ม", jp:"商品をタップして追加" }],
  ['pos_tip_label', { en:"Tip", es:"Propina", pt:"Gorjeta", fr:"Pourboire", de:"Trinkgeld", th:"ทิป", jp:"チップ" }],
  ['pos_tip_custom', { en:"Custom", es:"Personalizado", pt:"Personalizado", fr:"Personnalisé", de:"Benutzerdefiniert", th:"กำหนดเอง", jp:"カスタム" }],
  ['pos_out_of_stock', { en:"Out of stock", es:"Agotado", pt:"Esgotado", fr:"Rupture de stock", de:"Nicht vorrätig", th:"หมดสต็อก", jp:"在庫切れ" }],
  ['pos_recent_sales', { en:"Recent Sales", es:"Ventas Recientes", pt:"Vendas Recentes", fr:"Ventes Récentes", de:"Letzte Verkäufe", th:"การขายล่าสุด", jp:"最近の売上" }],
  ['pos_cart_empty', { en:"Cart is empty", es:"Carrito vacío", pt:"Carrinho vazio", fr:"Panier vide", de:"Warenkorb leer", th:"ตะกร้าว่าง", jp:"カートが空です" }],
  ['pos_insufficient_cash', { en:"Insufficient cash", es:"Efectivo insuficiente", pt:"Dinheiro insuficiente", fr:"Argent insuffisant", de:"Nicht genug Bargeld", th:"เงินสดไม่พอ", jp:"現金不足" }],
  ['pos_sale_failed', { en:"Sale failed:", es:"Venta fallida:", pt:"Venda falhou:", fr:"Vente échouée:", de:"Verkauf fehlgeschlagen:", th:"การขายล้มเหลว:", jp:"販売失敗:" }],
  ['pos_refund_not_found', { en:"Transaction not found or already refunded", es:"Transacción no encontrada o ya reembolsada", pt:"Transação não encontrada ou já reembolsada", fr:"Transaction introuvable ou déjà remboursée", de:"Transaktion nicht gefunden oder bereits erstattet", th:"ไม่พบรายการหรือคืนเงินแล้ว", jp:"取引が見つからないか返金済み" }],
  ['pos_refund_failed', { en:"Refund failed:", es:"Reembolso fallido:", pt:"Reembolso falhou:", fr:"Remboursement échoué:", de:"Rückerstattung fehlgeschlagen:", th:"การคืนเงินล้มเหลว:", jp:"返金失敗:" }],
  ['pos_cash_tendered', { en:"Cash tendered ($)", es:"Efectivo recibido ($)", pt:"Dinheiro recebido ($)", fr:"Argent reçu ($)", de:"Bargeld erhalten ($)", th:"เงินสดที่รับ ($)", jp:"現金受取 ($)" }],
];

const langs = ['en', 'es', 'pt', 'fr', 'de', 'th', 'jp'];
const lines = content.split('\n');
const out = [];
let langIdx = -1;

for (const line of lines) {
  out.push(line);

  // Detect which language section we're entering
  for (let i = 0; i < langs.length; i++) {
    if (line.trim() === `${langs[i]}: {`) {
      langIdx = i;
    }
  }

  // After sign_failed line, insert new keys in the current language
  if (langIdx >= 0 && line.trim().startsWith('sign_failed:')) {
    const lang = langs[langIdx];
    for (const [key, vals] of newKeys) {
      let val = vals[lang];
      // Escape single quotes inside the string
      val = val.replace(/'/g, "\\'");
      out.push(`    ${key}: '${val}',`);
    }
  }
}

writeFileSync(path, out.join('\n'), 'utf8');
console.log('Added ' + newKeys.length + ' new keys to all 7 languages.');
