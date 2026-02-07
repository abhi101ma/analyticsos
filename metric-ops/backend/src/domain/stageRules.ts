export const BOARD_STAGES: Record<string, string[]> = {
  requests: ['Intake', 'Clarify', 'Approved', 'In Build', 'Delivered', 'Closed'],
  metric_factory: [
    'Spec Drafted',
    'Spec Approved',
    'Source Mapped',
    'Capture Gaps Raised',
    'Pipeline Built',
    'DQ Checks Implemented',
    'Reconciliation Passed',
    'Certified Published'
  ],
  insight_action: ['Monitor', 'Investigate', 'Explain', 'Recommend', 'Action Created', 'Outcome Logged'],
  ml_genai: ['Problem Framed', 'Data Ready', 'Features Ready', 'Train', 'Evaluate', 'Deploy', 'Monitor', 'Retire']
};

export const FINAL_STAGE: Record<string, string> = Object.fromEntries(
  Object.entries(BOARD_STAGES).map(([k, stages]) => [k, stages[stages.length - 1]])
);

export const GATE_REQUIREMENTS: Record<string, Record<string, string>> = {
  metric_factory: {
    'Spec Approved': 'spec_approval',
    'Certified Published': 'reconcile_approval'
  }
};

export function validateStageTransition(board: string, fromStage: string, toStage: string): { ok: boolean; reason?: string } {
  const stages = BOARD_STAGES[board];
  if (!stages) return { ok: false, reason: `Unknown board ${board}` };
  const fromIdx = stages.indexOf(fromStage);
  const toIdx = stages.indexOf(toStage);
  if (toIdx === -1) return { ok: false, reason: `Invalid stage ${toStage} for board ${board}` };
  if (fromIdx === -1) return { ok: false, reason: `Invalid current stage ${fromStage}` };
  if (toIdx > fromIdx + 1) return { ok: false, reason: 'Can only move one stage forward at a time' };
  return { ok: true };
}

export function requiresGate(board: string, toStage: string): string | undefined {
  return GATE_REQUIREMENTS[board]?.[toStage];
}
