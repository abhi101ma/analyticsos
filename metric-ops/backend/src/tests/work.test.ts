import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../db/clickhouse.js', () => ({ chCommand: vi.fn(), chQuery: vi.fn() }));

import { chCommand, chQuery } from '../db/clickhouse.js';
import { createWorkItem, moveWorkStage, recomputeNeedsApproval } from '../services/workService.js';

describe('work service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creating work item emits created event', async () => {
    vi.mocked(chQuery).mockResolvedValueOnce([{ work_id: 'w1', board: 'requests', stage: 'Intake' }] as any);
    await createWorkItem({ board: 'requests', type: 'metric_request', title: 'A', description: '', priority: 'p1', business_area: 'ops' }, 'u1');
    expect(chCommand).toHaveBeenCalled();
    const calls = vi.mocked(chCommand).mock.calls.map((c) => c[0]);
    expect(calls.some((q) => q.includes('INSERT INTO os_events'))).toBe(true);
  });

  it('moving stage validates gate', async () => {
    vi.mocked(chQuery)
      .mockResolvedValueOnce([{ work_id: 'w1', board: 'metric_factory', stage: 'Spec Drafted' }] as any)
      .mockResolvedValueOnce([{ c: 0 }] as any);
    await expect(moveWorkStage('w1', 'Spec Approved', { user_id: 'u1', role: 'lead' })).rejects.toThrow('requires spec_approval');
  });

  it('approval decision recompute updates needs_approval', async () => {
    vi.mocked(chQuery)
      .mockResolvedValueOnce([{ c: 0 }] as any)
      .mockResolvedValueOnce([{ work_id: 'w1' }] as any);
    await recomputeNeedsApproval('w1');
    const query = vi.mocked(chCommand).mock.calls[0][0];
    expect(query).toContain('needs_approval');
  });
});
