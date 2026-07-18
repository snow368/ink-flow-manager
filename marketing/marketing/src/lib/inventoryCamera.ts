import { db } from '../db';

const GUIDES: Record<string, {
  title: string;
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  success: string;
  ocrFailed: string;
}> = {
  en: {
    title: 'Scan Product to Add Inventory',
    step1: 'Place the product on a flat surface with good lighting',
    step2: 'Make sure the label is clearly visible',
    step3: 'Hold steady and tap Capture',
    step4: 'Confirm the product name and enter quantity',
    success: 'Product added to inventory',
    ocrFailed: 'Could not read label. Please enter product name manually.',
  },
  es: {
    title: 'Escanear Producto para Inventario',
    step1: 'Coloca el producto en una superficie plana con buena luz',
    step2: 'Asegúrate de que la etiqueta sea claramente visible',
    step3: 'Mantén firme y toca Capturar',
    step4: 'Confirma el nombre del producto e ingresa la cantidad',
    success: 'Producto agregado al inventario',
    ocrFailed: 'No se pudo leer la etiqueta. Ingresa el nombre manualmente.',
  },
  pt: {
    title: 'Digitalizar Produto para Estoque',
    step1: 'Coloque o produto em uma superfície plana com boa iluminação',
    step2: 'Certifique-se de que o rótulo esteja bem visível',
    step3: 'Segure firme e toque em Capturar',
    step4: 'Confirme o nome do produto e insira a quantidade',
    success: 'Produto adicionado ao estoque',
    ocrFailed: 'Não foi possível ler o rótulo. Insira o nome manualmente.',
  },
  it: {
    title: 'Scansiona Prodotto per Inventario',
    step1: 'Appoggia il prodotto su una superficie piana con buona illuminazione',
    step2: 'Assicurati che l\'etichetta sia ben visibile',
    step3: 'Tieni fermo e tocca Cattura',
    step4: 'Conferma il nome del prodotto e inserisci la quantità',
    success: 'Prodotto aggiunto all\'inventario',
    ocrFailed: 'Impossibile leggere l\'etichetta. Inserisci il nome manualmente.',
  },
  de: {
    title: 'Produkt für Inventar scannen',
    step1: 'Legen Sie das Produkt auf eine ebene Fläche mit guter Beleuchtung',
    step2: 'Stellen Sie sicher, dass das Etikett gut sichtbar ist',
    step3: 'Halten Sie ruhig und tippen Sie auf Aufnehmen',
    step4: 'Bestätigen Sie den Produktnamen und geben Sie die Menge ein',
    success: 'Produkt zum Inventar hinzugefügt',
    ocrFailed: 'Etikett konnte nicht gelesen werden. Bitte Namen manuell eingeben.',
  },
  fr: {
    title: 'Scanner le Produit pour l\'Inventaire',
    step1: 'Placez le produit sur une surface plane bien éclairée',
    step2: 'Assurez-vous que l\'étiquette est bien visible',
    step3: 'Maintenez stable et appuyez sur Capturer',
    step4: 'Confirmez le nom du produit et entrez la quantité',
    success: 'Produit ajouté à l\'inventaire',
    ocrFailed: 'Impossible de lire l\'étiquette. Veuillez entrer le nom manuellement.',
  },
};

// 引导开关：用户完成几次扫码后自动静默
const GUIDE_KEY = 'inkflow_scan_guide_count';
const GUIDE_THRESHOLD = 3;

export function getInventoryGuide(): typeof GUIDES.en {
  const lang = navigator.language.split('-')[0];
  return GUIDES[lang] || GUIDES.en;
}

export function shouldShowGuide(): boolean {
  const count = parseInt(localStorage.getItem(GUIDE_KEY) || '0', 10);
  return count < GUIDE_THRESHOLD;
}

export function markScanComplete(): void {
  const count = parseInt(localStorage.getItem(GUIDE_KEY) || '0', 10);
  localStorage.setItem(GUIDE_KEY, String(count + 1));
}

export function speakGuide(text: string, forceSpeak = false): void {
  if (!forceSpeak && !shouldShowGuide()) return;
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = navigator.language;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
}

export async function tryOCR(imageData: string): Promise<string | null> {
  if ('TextDetector' in window) {
    try {
      const detector = new (window as any).TextDetector();
      const img = new Image();
      return new Promise((resolve) => {
        img.onload = async () => {
          try {
            const results = await detector.detect(img);
            const text = results.map((r: any) => r.rawValue).join(' ').trim();
            resolve(text || null);
          } catch { resolve(null); }
        };
        img.src = imageData;
      });
    } catch { return null; }
  }
  return null;
}

export async function addInventoryFromPhoto(
  photoData: string,
  productName: string,
  category: string,
  quantity: number,
  unit: string
): Promise<string> {
  const now = Date.now();
  const id = 'inv_' + now + '_' + Math.random().toString(36).slice(2, 6);
  await db.inventory.add({
    id, name: productName.trim() || 'Unknown Product',
    category: category.trim() || 'General',
    quantity, reorderLevel: 5,
    unit: unit.trim() || 'pcs', createdAt: now,
  });
  return id;
}
