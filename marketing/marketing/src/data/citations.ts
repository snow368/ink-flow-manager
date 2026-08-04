// E-E-A-T 引用源注册表（全站单一出口）
//
// 铁律：
// 1. 每条 URL 必须经过实际抓取验证存在且内容对得上，禁止凭记忆写 URL。
// 2. 禁止 Wikipedia 作为引用源（只能当关键词难度信号，不能当参考文献）。
// 3. 只收 .gov / .edu / 官方法规 / 行业标准机构 / 一手数据源。
// 4. verifiedOn 记录最后一次人工/抓取验证日期，链接失效需回来更新。
//
// 用法：页面通过 <AuthorByline sourceIds={['esign-act', 'tx-dshs']} /> 引用，
// 不要在页面里直接写死 URL。

export interface Citation {
  id: string;
  title: string;
  publisher: string;
  url: string;
  /** 该源支撑的事实要点，用于页面正文写作时对照，避免过度引申 */
  supports: string;
  verifiedOn: string;
}

export const citations: Record<string, Citation> = {
  'esign-act': {
    id: 'esign-act',
    title: '15 U.S. Code § 7001 — General rule of validity (ESIGN Act)',
    publisher: 'Cornell Law School, Legal Information Institute',
    url: 'https://www.law.cornell.edu/uscode/text/15/7001',
    supports:
      'A contract may not be denied legal effect, validity, or enforceability solely because an electronic signature or electronic record was used in its formation.',
    verifiedOn: '2026-08-02',
  },
  'tx-dshs-studio-requirements': {
    id: 'tx-dshs-studio-requirements',
    title: 'Licensing Requirements — Tattoo and Body Piercing Studios',
    publisher: 'Texas Department of State Health Services',
    url: 'https://www.dshs.texas.gov/tattoo-body-piercing-studios/licensing-requirements-tattoo-body-piercing-studios',
    supports:
      'Inspectors verify sterilization records, per-client records for every person receiving a tattoo, reporting of infections or adverse reactions, and minor-consent conditions under 25 TAC §229.406.',
    verifiedOn: '2026-08-02',
  },
  'osha-bloodborne': {
    id: 'osha-bloodborne',
    title: '29 CFR 1910.1030 — Bloodborne Pathogens',
    publisher: 'U.S. Occupational Safety and Health Administration',
    url: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.1030',
    supports:
      'Requires a written Exposure Control Plan reviewed at least annually, contaminated sharps handling and disposal rules, a sharps injury log, and training at initial assignment and at least annually thereafter.',
    verifiedOn: '2026-08-02',
  },
  'cdc-standard-precautions': {
    id: 'cdc-standard-precautions',
    title: 'Standard Precautions for All Patient Care',
    publisher: 'U.S. Centers for Disease Control and Prevention',
    url: 'https://www.cdc.gov/infection-control/hcp/basics/standard-precautions.html',
    supports:
      'Core elements: hand hygiene, PPE whenever exposure to infectious material is expected, safe injection and sharps handling, and cleaning/disinfection of equipment and environment.',
    verifiedOn: '2026-08-02',
  },
  'fda-tattoo-inks': {
    id: 'fda-tattoo-inks',
    title: 'Tattoos & Permanent Makeup: Fact Sheet',
    publisher: 'U.S. Food and Drug Administration',
    url: 'https://www.fda.gov/cosmetics/cosmetic-products/tattoos-permanent-makeup-fact-sheet',
    supports:
      'FDA regulates tattoo inks as cosmetics; contaminated inks have triggered recalls (2004, 2012, 2017) and a 2019 safety advisory. Infections have resulted from contaminated ink even when the artist followed hygienic procedure.',
    verifiedOn: '2026-08-02',
  },
  'eu-reach-tattoo-inks': {
    id: 'eu-reach-tattoo-inks',
    title: 'Commission Regulation (EU) 2020/2081 — substances in tattoo inks and permanent make-up',
    publisher: 'EUR-Lex, Publications Office of the European Union',
    url: 'https://eur-lex.europa.eu/eli/reg/2020/2081/oj',
    supports:
      'Restricts listed substances in tattoo mixtures from 4 January 2022, with mandatory pack labelling from the same date; Pigment Blue 15:3 and Pigment Green 7 were derogated until 4 January 2023.',
    verifiedOn: '2026-08-02',
  },
  'irs-1099k': {
    id: 'irs-1099k',
    title: 'Understanding your Form 1099-K',
    publisher: 'U.S. Internal Revenue Service',
    url: 'https://www.irs.gov/businesses/understanding-your-form-1099-k',
    supports:
      'Card processors issue a 1099-K regardless of amount or transaction count; payment apps and marketplaces (TPSOs) report above $20,000 and more than 200 transactions. All income must be reported whether or not a 1099-K arrives.',
    verifiedOn: '2026-08-02',
  },
  'fcc-robotexts': {
    id: 'fcc-robotexts',
    title: 'Stop Unwanted Robocalls and Texts',
    publisher: 'U.S. Federal Communications Commission',
    url: 'https://www.fcc.gov/consumers/guides/stop-unwanted-robocalls-and-texts',
    supports:
      'Autodialed texts to a mobile number require prior consent. Commercial texts require written consent; informational texts may rely on oral consent. Recipients may opt out at any time in any reasonable manner.',
    verifiedOn: '2026-08-02',
  },
  'hhs-covered-entities': {
    id: 'hhs-covered-entities',
    title: 'Covered Entities and Business Associates',
    publisher: 'U.S. Department of Health and Human Services',
    url: 'https://www.hhs.gov/hipaa/for-professionals/covered-entities/index.html',
    supports:
      'HIPAA applies only to health plans, health care clearinghouses, and health care providers transmitting standard electronic transactions. "If an entity does not meet the definition of a covered entity or business associate, it does not have to comply with the HIPAA Rules."',
    verifiedOn: '2026-08-02',
  },
};

export function getCitations(ids: string[] = []): Citation[] {
  return ids.map((id) => citations[id]).filter((c): c is Citation => Boolean(c));
}
