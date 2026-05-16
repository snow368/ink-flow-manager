// Country-specific legal consent templates for tattoo procedures.
// JP research: 2020 Supreme Court ruling — tattooing is NOT a medical act under 医師法.
//   No 保健所 mandate for consent forms; industry self-regulated via 日本タトゥー協会 (JTA).
//   Best practice: use international consent standards + Japanese text.
// BR research: State/municipal regulation. São Paulo CVS Portaria (Resolução SS-197) requires
//   TCLE with: client identification doc (RG/CPF), health screening, risk disclosure,
//   aftercare acknowledgment, 5-year record retention, parent/guardian consent for minors.
//   Other states (RJ, MG, PR) broadly follow similar Vigilância Sanitária patterns.

export interface CountryConsentClauses {
  country: string;
  title: string;
  preamble: string;
  mandatoryDisclosures: string[];
  minorClause?: string;
  coolingOffClause?: string;
  dataPrivacyClause: string;
  photoReleaseClause?: string;
  idVerificationNote?: string;
  recordRetentionYears?: number;
  additionalClauses: string[];
}

const CLAUSES: Record<string, CountryConsentClauses> = {
  US: {
    country: 'US',
    title: 'CONSENT FOR TATTOO PROCEDURE (US)',
    preamble: 'I, {clientName}, being of sound mind and legal age, hereby consent to the application of a tattoo by {artistName} at {shopName}.',
    mandatoryDisclosures: [
      'I represent that I am at least 18 years of age (or 16 with parental consent where permitted by state law).',
      'Tattooing is a permanent body modification. Removal requires laser surgery and may leave scarring.',
      'Risks include infection, allergic reaction, scarring, keloid formation, MRI complications from metallic pigments, and dissatisfaction with the result.',
      'The artist has made no guarantees regarding the final appearance, color retention, or longevity of the tattoo.',
      'I have disclosed all known medical conditions, allergies, medications (including blood thinners), and pregnancy status.',
    ],
    dataPrivacyClause: 'Personal data and health information are stored securely and retained as required by applicable law.',
    photoReleaseClause: 'I grant {artistName} and {shopName} permission to photograph the completed tattoo and healing process for portfolio, social media, and promotional use. I may revoke this consent in writing at any time.',
    idVerificationNote: 'Government-issued photo ID verified by studio staff.',
    recordRetentionYears: 7,
    additionalClauses: [
      'I agree to follow all aftercare instructions provided. Failure to do so releases the artist and studio from liability for any resulting complications.',
      'I release {artistName} and {shopName} from all claims, damages, and liabilities arising from this procedure.',
    ],
  },
  UK: {
    country: 'UK',
    title: 'TATTOO PROCEDURE CONSENT (UK)',
    preamble: 'I, {clientName}, confirm that I am at least 18 years of age and hereby consent to the tattoo procedure by {artistName} at {shopName}, a registered practitioner under the Local Government (Miscellaneous Provisions) Act 1982.',
    mandatoryDisclosures: [
      'The practitioner is registered with the local council and operates under a valid tattoo premises licence.',
      'All equipment used is single-use or sterilized in accordance with HSE and local council guidelines.',
      'I understand this is a permanent procedure and removal options (laser tattoo removal) are limited and not guaranteed.',
      'I have declared all relevant medical conditions including diabetes, epilepsy, hemophilia, hepatitis, HIV, skin conditions, and allergies.',
    ],
    coolingOffClause: 'I was given at least 24 hours to consider this consent before the appointment. I waive any cooling-off period under the Consumer Contracts Regulations 2013 for bespoke services.',
    dataPrivacyClause: 'Personal and health data will be stored in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.',
    photoReleaseClause: 'I consent to photographs of the tattoo being taken and used for portfolio and promotional purposes by {artistName} and {shopName}.',
    idVerificationNote: 'Photo ID verified. It is an offence under the Tattooing of Minors Act 1969 to tattoo a person under 18.',
    recordRetentionYears: 3,
    additionalClauses: [
      'I agree to follow all aftercare instructions. I understand sun exposure, swimming, and improper aftercare may damage the tattoo.',
      'I will contact the studio immediately if I suspect any sign of infection.',
    ],
  },
  CA: {
    country: 'CA',
    title: 'CONSENT FOR TATTOO PROCEDURE (CANADA)',
    preamble: 'I, {clientName}, consent to the tattoo procedure performed by {artistName} at {shopName} in accordance with provincial health regulations.',
    mandatoryDisclosures: [
      'The studio operates under a valid provincial health permit where required (varies by province).',
      'I confirm I am of legal age to consent in my province (18 or 19 depending on jurisdiction).',
      'Risks have been explained: infection, allergic reaction (including to specific ink pigments), scarring, keloid formation, and MRI complications.',
      'I have disclosed pregnancy, breastfeeding status, immune conditions, diabetes, bleeding disorders, and all medications.',
    ],
    dataPrivacyClause: 'Personal information will be handled in accordance with the Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable provincial privacy legislation.',
    photoReleaseClause: 'I authorize {artistName} and {shopName} to photograph the tattoo and use images for portfolio and marketing purposes.',
    idVerificationNote: 'Government-issued photo ID verified.',
    recordRetentionYears: 7,
    additionalClauses: [
      'I release {artistName} and {shopName} from liability arising from the tattoo procedure except in cases of gross negligence.',
      'I agree to follow aftercare instructions and understand improper care may affect the outcome.',
    ],
  },
  AU: {
    country: 'AU',
    title: 'TATTOO PROCEDURE CONSENT (AUSTRALIA)',
    preamble: 'I, {clientName}, confirm I am at least 18 years of age and give informed consent for the tattoo procedure by {artistName} at {shopName}, operating under applicable state health regulations.',
    mandatoryDisclosures: [
      'The studio complies with state health department infection control guidelines for skin penetration procedures.',
      'Single-use needles and sterile equipment are used for all procedures.',
      'I understand tattooing carries risks including infection (bacterial and blood-borne), allergic reaction, granulomas, keloid scarring, and MRI burn risks from certain pigments.',
      'I have disclosed all relevant health conditions, allergies, medications, and pregnancy status.',
    ],
    dataPrivacyClause: 'Health records are kept confidential per the Privacy Act 1988 (Cth) and state health records legislation. Records retained for minimum period specified by state regulations.',
    photoReleaseClause: 'I consent to photographs being taken of the completed tattoo for {artistName}\'s portfolio and social media.',
    idVerificationNote: 'Photo ID verified — minimum age 18.',
    recordRetentionYears: 7,
    additionalClauses: [
      'I acknowledge that no refund will be given for completed tattoo work. Any deposit paid is non-refundable.',
      'I agree to comply with all aftercare instructions provided.',
    ],
  },
  DE: {
    country: 'DE',
    title: 'EINWILLIGUNGSERKLÄRUNG TÄTOWIERUNG (DEUTSCHLAND)',
    preamble: 'Ich, {clientName}, willige in die Durchführung einer Tätowierung durch {artistName} im Studio {shopName} gemäß der Tätowiermittel-Verordnung (TätMV) ein.',
    mandatoryDisclosures: [
      'Die verwendeten Farbmittel entsprechen der Tätowiermittel-Verordnung. Auf Wunsch kann ich die Chargennummern der verwendeten Farben einsehen.',
      'Ich wurde über Risiken aufgeklärt: Infektionen, allergische Reaktionen, Narbenbildung, Keloidbildung, Wechselwirkungen bei MRT-Untersuchungen.',
      'Ich habe alle gesundheitlichen Informationen wahrheitsgemäß angegeben (Allergien, Hauterkrankungen, Blutgerinnungsstörungen, Medikamente, Schwangerschaft).',
      'Das Studio verfügt über die erforderliche gewerberechtliche Erlaubnis und erfüllt die Hygienevorschriften des Gesundheitsamtes.',
    ],
    coolingOffClause: 'Mir wurde eine angemessene Bedenkzeit eingeräumt. Ich verzichte auf ein gesetzliches Widerrufsrecht gemäß § 312g BGB, da es sich um eine individuelle Dienstleistung handelt.',
    dataPrivacyClause: 'Personenbezogene und gesundheitsbezogene Daten werden gemäß DSGVO (Datenschutz-Grundverordnung) und Bundesdatenschutzgesetz (BDSG) verarbeitet und gespeichert.',
    photoReleaseClause: 'Ich willige ein, dass Fotos des fertigen Tattoos für Portfolio- und Werbezwecke verwendet werden dürfen.',
    idVerificationNote: 'Ausweisdokument geprüft — Mindestalter 18 Jahre.',
    recordRetentionYears: 10,
    additionalClauses: [
      'Ich verpflichte mich, die Nachsorgehinweise zu befolgen. Bei Komplikationen suche ich umgehend einen Arzt auf und informiere das Studio.',
      'Ich entbinde {artistName} und {shopName} von der Haftung für Schäden, die durch Nichtbeachtung der Nachsorgehinweise entstehen.',
    ],
  },

  // JP: No specific health-department consent form mandate (2020 Supreme Court ruling).
  // Industry self-regulated. This template follows JTA best practices + international standards.
  JP: {
    country: 'JP',
    title: 'タトゥー施術同意書 兼 免責証書 / TATTOO PROCEDURE CONSENT & RELEASE (JAPAN)',
    preamble: '私、{clientName}は、{artistName}の施術によるタトゥーを{shopName}にて受けることに、自由意思により同意します。\nI, {clientName}, voluntarily consent to receive a tattoo performed by {artistName} at {shopName}.',
    mandatoryDisclosures: [
      '私は満20歳以上であり、日本国法定成年年齢に達していることを確認します（2022年4月民法改正による）。\nI confirm I am at least 20 years of age (legal adulthood in Japan per Civil Code as amended April 2022).',
      '施術者より、以下のリスクについて説明を受け理解しました：感染症、アレルギー反応、ケロイド・肥厚性瘢痕、肉芽腫、MRI検査時の熱傷・画像アーチファクト、色素の経年変化。\nI have been informed of and understand the risks: infection, allergic reaction, keloid/hypertrophic scarring, granuloma, MRI burn/artifact, and pigment fading over time.',
      '現在の健康状態（アレルギー、皮膚疾患、血液凝固障害、内服薬、妊娠・授乳の有無）について正確に申告しました。虚偽の申告により生じた結果について、施術者は責任を負いません。\nI have truthfully disclosed my current health status (allergies, skin conditions, bleeding disorders, medications, pregnancy/nursing). The artist bears no responsibility for consequences arising from false declarations.',
      '施術に使用する針は全て滅菌済み使い捨て（シングルユース）であり、器具は国際基準に従い高圧蒸気滅菌処理されています。\nAll needles used are sterile and single-use. Equipment is autoclave-sterilized per international standards.',
      '日本においてタトゥー施術は医師法上の医療行為には該当しないとの最高裁判決（令和2年）を認識しています。本同意書は民法上の契約として有効です。\nI acknowledge the Supreme Court of Japan ruling (2020) that tattooing is not a medical act under the Medical Practitioners Act. This consent is valid as a civil contract.',
    ],
    dataPrivacyClause: '個人情報及び健康情報は、個人情報保護法（令和4年全面施行）に基づき適切に管理・保管され、第三者提供は本人同意がある場合を除き行いません。\nPersonal and health data is managed and stored in compliance with the Act on Protection of Personal Information (fully effective April 2022). No third-party disclosure without explicit consent.',
    photoReleaseClause: '施術後のタトゥー写真を{artistName}および{shopName}のポートフォリオ・SNSに掲載することを許諾します。書面によりいつでも撤回できます。\nI grant permission for photographs of the completed tattoo to be used in {artistName}\'s and {shopName}\'s portfolio and social media. I may revoke this consent in writing at any time.',
    idVerificationNote: '本人確認書類（運転免許証・マイナンバーカード・パスポート等）を確認済み。\nGovernment-issued photo ID (driver\'s license, My Number card, or passport) verified.',
    recordRetentionYears: 5,
    additionalClauses: [
      '私はアフターケアの指示に従うことに同意します。指示に従わなかった場合の合併症について、施術者及びスタジオの責任を免除します。\nI agree to follow all aftercare instructions. I release the artist and studio from liability for complications arising from failure to follow aftercare.',
      'タトゥーの仕上がりは皮膚の状態・部位・年齢・アフターケア等の個人差により影響を受けます。施術者は誠実に施術を行いますが、最終的な仕上がりについて保証は行いません。\nThe final result depends on individual factors (skin type, placement, age, aftercare). The artist works with due care but makes no guarantee of final appearance.',
      '本同意書は日本語を正文とし、英語翻訳は参照用です。\nThis consent is executed in Japanese with English translation for reference only.',
    ],
  },

  // BR: Vigilância Sanitária (state/municipal level). Based on São Paulo CVS Portaria
  // TCLE requirements: RG/CPF, full health screening, aftercare, 5-year retention, parent consent for minors.
  BR: {
    country: 'BR',
    title: 'TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO — TATUAGEM (BRASIL)',
    preamble: 'Eu, {clientName}, portador(a) do documento de identidade verificado pelo estúdio, maior de idade e em pleno gozo de minhas faculdades mentais, autorizo livremente a realização de tatuagem por {artistName} no estúdio {shopName}, em conformidade com as normas da Vigilância Sanitária vigentes.',
    mandatoryDisclosures: [
      'Confirmo ter 18 (dezoito) anos completos ou mais. Para menores de 18 anos, é obrigatória a presença e autorização expressa de responsável legal com documento de identidade.',
      'Fui informado(a) detalhadamente sobre os riscos inerentes ao procedimento: infecção (bacteriana e viral, incluindo hepatites B/C, HIV), reação alérgica e/ou granulomatosa a pigmentos, formação de queloide e cicatriz hipertrófica, queimaduras e artefatos em exames de ressonância magnética, e desbotamento natural da pigmentação ao longo do tempo.',
      'Declaro que prestei informações verdadeiras e completas sobre: alergias conhecidas (látex, tintas, metais, antissépticos), doenças de pele (psoríase, dermatite, vitiligo), distúrbios de coagulação (hemofilia, uso de anticoagulantes), diabetes, imunossupressão, epilepsia, histórico de queloides, gravidez e lactação. A omissão de informações é de minha inteira responsabilidade.',
      'O estúdio {shopName} opera com alvará sanitário e licença da Vigilância Sanitária municipal. Todos os materiais perfurocortantes são descartáveis e estéreis. Os equipamentos reutilizáveis passam por esterilização em autoclave conforme normas da ANVISA.',
      'Recebi e compreendi as instruções de cuidados pós-tatuagem (anexas a este termo) e comprometo-me a segui-las rigorosamente.',
    ],
    minorClause: 'Para menores de 18 anos: este termo deve ser assinado pelo responsável legal, que deverá apresentar documento de identidade (RG/CPF) e comprovante de parentesco ou guarda legal.',
    dataPrivacyClause: 'Os dados pessoais e de saúde coletados neste termo serão armazenados pelo período mínimo de 5 (cinco) anos conforme exigência da Vigilância Sanitária, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018). O titular dos dados poderá solicitar acesso, correção ou exclusão a qualquer momento.',
    photoReleaseClause: 'Autorizo o registro fotográfico da tatuagem finalizada e sua utilização para fins de portfólio profissional e divulgação em redes sociais por {artistName} e {shopName}. Esta autorização pode ser revogada a qualquer momento mediante solicitação por escrito.',
    idVerificationNote: 'DOCUMENTO DE IDENTIFICAÇÃO VERIFICADO. RG/CPF registrados no cadastro do cliente. A não apresentação de documento válido impossibilita a realização do procedimento.',
    recordRetentionYears: 5,
    additionalClauses: [
      'Estou ciente de que a tatuagem é um procedimento permanente e que a remoção a laser é um processo caro, doloroso e que pode não remover completamente todos os pigmentos, podendo deixar cicatrizes.',
      'Comprometo-me a procurar atendimento médico imediatamente em caso de sinais de infecção (vermelhidão excessiva, inchaço, secreção purulenta, febre) e a comunicar o estúdio {shopName} sobre a ocorrência.',
      'Isento {artistName} e {shopName} de responsabilidade por complicações decorrentes da não observância das instruções de cuidados fornecidas ou da omissão de informações de saúde relevantes.',
      'Este termo é emitido em duas vias de igual teor: uma via permanece com o estúdio e outra com o cliente.',
    ],
  },
};

export function getConsentClauses(country?: string): CountryConsentClauses | null {
  if (!country) return null;
  return CLAUSES[country.toUpperCase()] || null;
}

export function buildConsentContent(
  clientName: string,
  artistName: string,
  shopName: string,
  country?: string,
  aftercareText?: string,
): string {
  const cc = getConsentClauses(country);
  if (!cc) return buildGenericConsent(clientName, artistName, shopName, aftercareText);

  const fill = (text: string) =>
    text
      .replace(/\{clientName\}/g, clientName)
      .replace(/\{artistName\}/g, artistName)
      .replace(/\{shopName\}/g, shopName);

  const lines: string[] = [];
  const add = (...s: string[]) => lines.push(...s);

  add(cc.title, '', fill(cc.preamble), '');

  if (cc.idVerificationNote) {
    add(`[ID VERIFIED] ${fill(cc.idVerificationNote)}`, '');
  }

  for (const d of cc.mandatoryDisclosures) {
    add(`- ${fill(d)}`);
  }
  add('');

  if (cc.minorClause) {
    add(`MINORS: ${fill(cc.minorClause)}`, '');
  }
  if (cc.coolingOffClause) {
    add(`COOLING-OFF: ${fill(cc.coolingOffClause)}`, '');
  }

  add(
    `DATA PRIVACY: ${fill(cc.dataPrivacyClause)}`,
    '',
  );

  if (cc.recordRetentionYears) {
    add(`Record retention period: ${cc.recordRetentionYears} years from date of signature.`, '');
  }

  if (cc.photoReleaseClause) {
    add(
      `PHOTO RELEASE: ${fill(cc.photoReleaseClause)}`,
      '',
    );
  }

  for (const c of cc.additionalClauses) {
    add(`- ${fill(c)}`);
  }

  if (aftercareText) {
    add('', 'AFTERCARE ACKNOWLEDGEMENT', '');
    for (const line of aftercareText.split('\n')) {
      add(line);
    }
    add('', 'I acknowledge that I have received, read, and understood the above aftercare instructions.', '');
  }

  add(
    '',
    `Client Name:  ${clientName}`,
    `Client Signature: _______________`,
    `Date: _______________`,
    '',
    `Artist: ${artistName}`,
    `Studio: ${shopName}`,
  );

  return lines.join('\n');
}

function buildGenericConsent(clientName: string, artistName: string, shopName: string, aftercareText?: string): string {
  const lines = [
    'CONSENT FOR TATTOO PROCEDURE',
    '',
    `I, ${clientName}, hereby consent to the application of a tattoo by ${artistName} at ${shopName}.`,
    '',
    'I understand that:',
    '- Tattooing involves the insertion of pigment into the skin and is a permanent body modification.',
    '- There are risks including infection, allergic reaction, scarring, and dissatisfaction with the result.',
    '- I have been given the opportunity to ask questions and all my questions have been answered to my satisfaction.',
    '- I have disclosed all known allergies, medical conditions, and medications to the artist.',
    '',
    `I release ${artistName} and ${shopName} from all liability arising from the procedure.`,
  ];

  if (aftercareText) {
    lines.push('', 'AFTERCARE ACKNOWLEDGEMENT', '', ...aftercareText.split('\n'), '', 'I acknowledge that I have received, read, and understood the above aftercare instructions.');
  }

  lines.push(
    '',
    'Client Signature: _______________',
    'Date: _______________',
  );
  return lines.join('\n');
}

export const SUPPORTED_CONSENT_COUNTRIES = Object.keys(CLAUSES);
