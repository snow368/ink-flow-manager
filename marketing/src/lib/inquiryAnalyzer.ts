import { db } from '../db';
import { logCommunication } from './aftercareLogic';
import type { LeadRecord, LeadConfirmationRecord, ProjectAssetRecord } from '../db';

// ── Types ──

export interface InquiryIssue {
  type:
    | 'missing_style'
    | 'missing_placement'
    | 'missing_budget'
    | 'missing_references'
    | 'vague_style'
    | 'vague_placement'
    | 'budget_too_low'
    | 'size_budget_conflict'
    | 'style_budget_conflict'
    | 'placement_reference_conflict'
    | 'unclear_scope';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  suggestedAction?: string;
}

export interface InquiryAnalysis {
  issues: InquiryIssue[];
  nextBestAction?: string;
  readyForDeposit: boolean;
  confidenceScore: number; // 0-100
}

// ── Vague phrase patterns ──

const VAGUE_PLACEMENT_PATTERNS = [
  /arm\s+somewhere/i, /leg\s+maybe/i, /somewhere\s+on/i, /not\s+sure\s+where/i,
  /small\s+side/i, /someplace/i, /wherever/i, /undecided/i, /tbd/i,
  /haven't\s+decided/i, /open\s+to\s+suggestions?/i, /surprise\s+me/i,
];

const VAGUE_STYLE_PATTERNS = [
  /not\s+sure/i, /something\s+cool/i, /fine\s+line\s+maybe/i,
  /dark\s+vibe/i, /open\s+to\s+ideas/i, /whatever\s+looks?\s+good/i,
  /just\s+something/i, /i\s+don't\s+know/i, /surprise\s+me/i,
  /anything\s+really/i, /not\s+picky/i, /no\s+preference/i,
  /still\s+deciding/i, /can't\s+decide/i,
];

// ── Style detail/cost heuristics ──

const HIGH_DETAIL_STYLES = [
  /realism/i, /photoreal/i, /hyper.?real/i, /portrait/i,
  /ornamental/i, /mandala/i, /bio.?mech/i, /dotwork/i,
  /stipple/i, /black.?and.?grey/i, /geometric/i, /watercolor/i,
  /japanese/i, /irezumi/i, /tribal/i,
];

const LARGE_PLACEMENTS = [
  /full\s+sleeve/i, /half\s+sleeve/i, /full\s+back/i, /back\s+piece/i,
  /chest\s+piece/i, /full\s+chest/i, /full\s+leg/i, /whole\s+thigh/i,
  /full\s+arm/i, /entire/i, /whole/i, /大片/i, /大臂/i, /整条/i,
];

const LARGE_SIZES = [
  /large/i, /sleeve/i, /full/i, /whole/i, /entire/i, /大片/i, /大臂/i,
];

// ── Keyword extraction helpers ──

function isVague(patterns: RegExp[], text: string): boolean {
  return patterns.some(p => p.test(text));
}

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/[\s,，.。、]+/);
  return words.filter(w => w.length > 2);
}

function hasHighDetailStyle(style?: string): boolean {
  if (!style) return false;
  return HIGH_DETAIL_STYLES.some(p => p.test(style));
}

function hasLargePlacement(placement?: string): boolean {
  if (!placement) return false;
  return LARGE_PLACEMENTS.some(p => p.test(placement));
}

function hasLargeSize(size?: string, placement?: string): boolean {
  if (size && LARGE_SIZES.some(p => p.test(size))) return true;
  if (placement && LARGE_PLACEMENTS.some(p => p.test(placement))) return true;
  return false;
}

function parseBudget(budget?: string): number | null {
  if (!budget) return null;
  const num = Number(String(budget).replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) && num > 0 ? num : null;
}

// ── Placement/reference conflict heuristic ──

function checkPlacementReferenceConflict(
  placement: string | undefined,
  references: string[] | undefined,
): boolean {
  if (!placement || !references || references.length === 0) return false;

  const placementText = placement.toLowerCase();
  // If placement is "small forearm" but references describe large area
  const smallPlacement = /small|tiny|mini|little|small|细|小/.test(placementText);
  if (!smallPlacement) return false;

  // Check if reference URLs seem to describe large pieces
  const largeRefPatterns = references.filter(r => {
    // data URLs or image filenames that suggest large pieces
    const lower = r.toLowerCase();
    return /sleeve|full|back|chest|large|大片/.test(lower);
  });
  return largeRefPatterns.length > 0;
}

// ── Main analysis ──

export function analyzeLeadInquiry(
  lead: LeadRecord,
  confirmation?: LeadConfirmationRecord,
  projectAssets?: ProjectAssetRecord[],
): InquiryAnalysis {
  const issues: InquiryIssue[] = [];
  const placement = lead.bodyPart || confirmation?.extractedData.placement || '';
  const style = lead.style || confirmation?.extractedData.style || '';
  const size = lead.size || confirmation?.extractedData.size || '';
  const budget = lead.budget || confirmation?.extractedData.budget || '';
  const references = lead.referenceImages || confirmation?.extractedData.references || [];
  const note = lead.note || lead.changeRequest || '';

  const hasRefs = references.length > 0;
  const hasPlacement = placement.trim().length >= 3;
  const hasStyle = style.trim().length >= 2;
  const hasBudget = budget.trim().length >= 1;
  const hasSize = size.trim().length >= 2;
  const hasPayment = lead.paymentStatus === 'paid' || lead.paymentStatus === 'pending_verify';
  const hasProjectAssets = projectAssets && projectAssets.length > 0;

  // ── 1. Missing style ──
  if (!hasStyle) {
    issues.push({
      type: 'missing_style',
      severity: 'high',
      title: 'Style needed',
      description: 'No tattoo style specified — client hasn\'t chosen a direction',
      suggestedAction: 'Ask about preferred style',
    });
  }

  // ── 2. Missing placement ──
  if (!hasPlacement) {
    issues.push({
      type: 'missing_placement',
      severity: 'high',
      title: 'Placement needed',
      description: 'No body placement provided — can\'t estimate sizing or flow',
      suggestedAction: 'Ask where they want the tattoo',
    });
  }

  // ── 3. Missing budget ──
  if (!hasBudget) {
    issues.push({
      type: 'missing_budget',
      severity: 'medium',
      title: 'Budget not discussed',
      description: 'No budget mentioned — may lead to scope mismatch later',
      suggestedAction: 'Ask about budget range',
    });
  }

  // ── 4. Missing references ──
  if (!hasRefs && !hasProjectAssets) {
    issues.push({
      type: 'missing_references',
      severity: 'medium',
      title: 'No reference images',
      description: 'No visual references provided — artist has to guess the vision',
      suggestedAction: 'Ask for reference images',
    });
  }

  // ── 5. Vague placement ──
  if (hasPlacement && isVague(VAGUE_PLACEMENT_PATTERNS, placement)) {
    issues.push({
      type: 'vague_placement',
      severity: 'medium',
      title: 'Vague placement',
      description: `"${placement}" — need a more specific location`,
      suggestedAction: 'Clarify exact placement',
    });
  }

  // ── 6. Vague style ──
  if (hasStyle && isVague(VAGUE_STYLE_PATTERNS, style)) {
    issues.push({
      type: 'vague_style',
      severity: 'medium',
      title: 'Vague style',
      description: `"${style}" — need a clearer style direction`,
      suggestedAction: 'Ask for reference tattoos with similar vibe',
    });
  }

  // ── 7. Budget too low for scope ──
  const budgetNum = parseBudget(budget);
  if (budgetNum !== null) {
    const isLarge = hasLargeSize(size, placement);
    const isDetailed = hasHighDetailStyle(style);

    if (isLarge && budgetNum < 300) {
      issues.push({
        type: 'budget_too_low',
        severity: 'high',
        title: 'Budget too low for size',
        description: `$${budgetNum} for a ${size || placement || 'large'} piece is well below typical pricing`,
        suggestedAction: 'Explain realistic pricing for this size',
      });
    } else if (isDetailed && budgetNum < 200) {
      issues.push({
        type: 'budget_too_low',
        severity: 'high',
        title: 'Budget too low for style',
        description: `${style} at $${budgetNum} is unrealistic — this style demands more time and skill`,
        suggestedAction: 'Explain pricing for detailed work',
      });
    } else if (budgetNum < 50) {
      issues.push({
        type: 'budget_too_low',
        severity: 'high',
        title: 'Budget below minimum',
        description: `$${budgetNum} is below minimum pricing for professional tattooing`,
        suggestedAction: 'Explain studio minimums',
      });
    }
  }

  // ── 8. Style/budget conflict ──
  if (budgetNum !== null && hasStyle) {
    const isDetailed = hasHighDetailStyle(style);
    const isLarge = hasLargeSize(size, placement);

    if (isDetailed && isLarge && budgetNum < 800) {
      issues.push({
        type: 'style_budget_conflict',
        severity: 'high',
        title: 'Scope exceeds budget',
        description: `Large ${style} piece at $${budgetNum} — significant gap between expectations and budget`,
        suggestedAction: 'Discuss scope reduction or realistic pricing',
      });
    } else if (isDetailed && budgetNum < 300) {
      issues.push({
        type: 'style_budget_conflict',
        severity: 'medium',
        title: 'Style may exceed budget',
        description: `${style} at $${budgetNum} might be tight — detailed work takes longer`,
        suggestedAction: 'Clarify budget expectations',
      });
    }
  }

  // ── 9. Size/budget conflict ──
  if (budgetNum !== null && size) {
    const isLarge = hasLargeSize(size, placement);
    if (isLarge && budgetNum < 150) {
      issues.push({
        type: 'size_budget_conflict',
        severity: 'high',
        title: 'Size vs budget mismatch',
        description: `Large size with $${budgetNum} budget — likely needs downsizing`,
        suggestedAction: 'Suggest smaller design or adjust budget',
      });
    }
  }

  // ── 10. Placement/reference conflict ──
  if (checkPlacementReferenceConflict(placement, references)) {
    issues.push({
      type: 'placement_reference_conflict',
      severity: 'medium',
      title: 'Placement vs references mismatch',
      description: 'Placement says small area but references suggest larger piece',
      suggestedAction: 'Confirm actual desired placement and size',
    });
  }

  // ── 11. Unclear scope ──
  const vagueCount = [
    !hasStyle || isVague(VAGUE_STYLE_PATTERNS, style),
    !hasPlacement || isVague(VAGUE_PLACEMENT_PATTERNS, placement),
    !hasRefs,
    !hasSize,
  ].filter(Boolean).length;

  if (vagueCount >= 3) {
    issues.push({
      type: 'unclear_scope',
      severity: 'high',
      title: 'Unclear scope',
      description: 'Too many details missing — hard to move forward without more info',
      suggestedAction: 'Schedule a quick consult to narrow things down',
    });
  }

  // ── Compute next best action ──
  const nextBestAction = getNextBestLeadAction(issues);

  // ── Ready for deposit? ──
  const blockingIssues = issues.filter(i => i.severity === 'high');
  const readyForDeposit = blockingIssues.length === 0 && hasBudget && hasPlacement && hasStyle && !hasPayment;

  // ── Confidence score ──
  let score = 100;
  if (!hasPlacement) score -= 20;
  if (!hasStyle) score -= 15;
  if (!hasBudget) score -= 10;
  if (!hasRefs) score -= 10;
  if (!hasSize) score -= 5;
  if (isVague(VAGUE_PLACEMENT_PATTERNS, placement)) score -= 10;
  if (isVague(VAGUE_STYLE_PATTERNS, style)) score -= 10;
  if (budgetNum !== null && budgetNum < 50) score -= 15;
  if (budgetNum !== null && hasLargeSize(size, placement) && budgetNum < 300) score -= 15;
  issues.forEach(i => { if (i.severity === 'high') score -= 5; });
  score = Math.max(0, Math.min(100, score));

  return { issues, nextBestAction, readyForDeposit, confidenceScore: score };
}

// ── Next best action engine ──

export function getNextBestLeadAction(issues: InquiryIssue[]): string {
  if (issues.length === 0) return 'Ready for next step';

  // Sort by severity: high first, then medium, then low
  const sorted = [...issues].sort((a, b) => {
    const rank = { high: 3, medium: 2, low: 1 };
    return (rank[b.severity] || 0) - (rank[a.severity] || 0);
  });

  const top = sorted[0];

  // Map issue types to actions
  const actionMap: Record<string, string> = {
    missing_style: 'Clarify style direction',
    missing_placement: 'Clarify placement',
    missing_budget: 'Discuss budget',
    missing_references: 'Request references',
    vague_style: 'Ask for reference tattoos',
    vague_placement: 'Confirm exact placement',
    budget_too_low: 'Explain realistic pricing',
    size_budget_conflict: 'Adjust scope or budget',
    style_budget_conflict: 'Discuss pricing expectations',
    placement_reference_conflict: 'Clarify size vs placement',
    unclear_scope: 'Schedule consultation',
  };

  return actionMap[top.type] || 'Review and respond';
}

// ── Timeline logging ──

export async function logInquiryAnalysis(
  artistId: string,
  leadId: string,
  analysis: InquiryAnalysis,
): Promise<void> {
  const highWarnings = analysis.issues.filter(i => i.severity === 'high');

  if (highWarnings.length > 0) {
    await logCommunication(artistId, 'app_note', 'auto', {
      message: `Inquiry warnings (${highWarnings.length}): ${highWarnings.map(i => i.title).join(', ')}`,
      templateType: 'inquiry_warning',
    });
  }

  if (analysis.readyForDeposit) {
    await logCommunication(artistId, 'app_note', 'auto', {
      message: 'Lead is ready for deposit — all key info collected',
      templateType: 'deposit_ready',
    });
  }

  if (analysis.nextBestAction) {
    await logCommunication(artistId, 'app_note', 'auto', {
      message: `Next best action: ${analysis.nextBestAction}`,
      templateType: 'inquiry_analysis',
    });
  }
}
