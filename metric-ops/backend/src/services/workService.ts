import { v4 as uuid } from 'uuid';
import { chCommand, chQuery } from '../db/clickhouse.js';
import { BOARD_STAGES, FINAL_STAGE, requiresGate, validateStageTransition } from '../domain/stageRules.js';

const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

export async function insertEvent(workId: string, actorUserId: string, eventType: string, kv: Record<string, string> = {}) {
  await chCommand(
    `INSERT INTO os_events (event_id, work_id, event_type, actor_user_id, keys, values, created_at)
     VALUES ({event_id:String}, {work_id:String}, {event_type:String}, {actor_user_id:String}, {keys:Array(String)}, {values:Array(String)}, now())`,
    { event_id: uuid(), work_id: workId, event_type: eventType, actor_user_id: actorUserId, keys: Object.keys(kv), values: Object.values(kv) }
  );
}

export async function getWorkCurrent(workId: string) {
  const rows = await chQuery<any>(
    `SELECT work_id,
      argMax(board, updated_at) board, argMax(type, updated_at) type, argMax(title, updated_at) title,
      argMax(description, updated_at) description,argMax(stage, updated_at) stage,argMax(status, updated_at) status,
      argMax(priority, updated_at) priority,argMax(business_area, updated_at) business_area,argMax(owner_user_id, updated_at) owner_user_id,
      argMax(requester_user_id, updated_at) requester_user_id,argMax(due_at, updated_at) due_at,argMax(sla_hours, updated_at) sla_hours,
      max(created_at) created_at, max(updated_at) updated_at, argMax(blocker_count, updated_at) blocker_count,
      argMax(needs_approval, updated_at) needs_approval,argMax(last_event_at, updated_at) last_event_at
      FROM os_work_items WHERE work_id = {work_id:String} GROUP BY work_id`,
    { work_id: workId }
  );
  return rows[0];
}

export async function recomputeNeedsApproval(workId: string) {
  const pending = await chQuery<{ c: number }>(
    `SELECT count() c FROM os_approvals WHERE work_id={work_id:String} AND status='pending'`,
    { work_id: workId }
  );
  const current = await getWorkCurrent(workId);
  await chCommand(
    `INSERT INTO os_work_items SELECT work_id, board, type, title, description, stage, status, priority, business_area,
      owner_user_id, requester_user_id, due_at, sla_hours, created_at, now(), blocker_count, {needs_approval:UInt8}, now()
      FROM os_work_items WHERE work_id={work_id:String} ORDER BY updated_at DESC LIMIT 1`,
    { work_id: workId, needs_approval: pending[0]?.c > 0 ? 1 : 0 }
  );
  return current;
}

export async function recomputeBlockers(workId: string) {
  const blocked = await chQuery<{ c: number }>(
    `SELECT count() c FROM os_work_deps WHERE work_id={work_id:String} AND is_deleted=0`,
    { work_id: workId }
  );
  await chCommand(
    `INSERT INTO os_work_items SELECT work_id, board, type, title, description, stage, status, priority, business_area,
      owner_user_id, requester_user_id, due_at, sla_hours, created_at, now(), {blocker_count:UInt16}, needs_approval, now()
      FROM os_work_items WHERE work_id={work_id:String} ORDER BY updated_at DESC LIMIT 1`,
    { work_id: workId, blocker_count: blocked[0]?.c ?? 0 }
  );
}

export async function createWorkItem(input: any, actorUserId: string) {
  const workId = uuid();
  const firstStage = BOARD_STAGES[input.board][0];
  await chCommand(
    `INSERT INTO os_work_items (work_id, board, type, title, description, stage, status, priority, business_area,
      owner_user_id, requester_user_id, due_at, sla_hours, created_at, updated_at, blocker_count, needs_approval, last_event_at)
     VALUES ({work_id:String}, {board:String}, {type:String}, {title:String}, {description:String}, {stage:String}, 'open',
      {priority:String}, {business_area:String}, {owner_user_id:String}, {requester_user_id:String}, parseDateTimeBestEffortOrNull({due_at:String}),
      {sla_hours:Nullable(UInt32)}, now(), now(), 0, 0, now())`,
    {
      work_id: workId,
      board: input.board,
      type: input.type,
      title: input.title,
      description: input.description,
      stage: firstStage,
      priority: input.priority,
      business_area: input.business_area,
      owner_user_id: input.owner_user_id ?? actorUserId,
      requester_user_id: input.requester_user_id ?? actorUserId,
      due_at: input.due_at ?? '',
      sla_hours: input.sla_hours ?? null
    }
  );
  await insertEvent(workId, actorUserId, 'created', { stage: firstStage });
  return getWorkCurrent(workId);
}

export async function moveWorkStage(workId: string, toStage: string, actor: { user_id: string; role: string }) {
  const current = await getWorkCurrent(workId);
  const transition = validateStageTransition(current.board, current.stage, toStage);
  if (!transition.ok) throw new Error(transition.reason);
  const gate = requiresGate(current.board, toStage);
  if (gate && actor.role !== 'admin') {
    const approvals = await chQuery<{ c: number }>(
      `SELECT count() c FROM os_approvals WHERE work_id={work_id:String} AND gate={gate:String} AND status='approved'`,
      { work_id: workId, gate }
    );
    if ((approvals[0]?.c ?? 0) === 0) throw new Error(`Transition requires ${gate}`);
  }
  await chCommand(
    `INSERT INTO os_work_items SELECT work_id, board, type, title, description, {to_stage:String}, status, priority, business_area,
      owner_user_id, requester_user_id, due_at, sla_hours, created_at, now(), blocker_count, needs_approval, now()
      FROM os_work_items WHERE work_id={work_id:String} ORDER BY updated_at DESC LIMIT 1`,
    { work_id: workId, to_stage: toStage }
  );
  await insertEvent(workId, actor.user_id, 'stage_changed', { from: current.stage, to: toStage });
  return getWorkCurrent(workId);
}

export async function setStatus(workId: string, status: string, actor: any) {
  const current = await getWorkCurrent(workId);
  if (status === 'done' && current.stage !== FINAL_STAGE[current.board]) throw new Error('Done only allowed at final stage');
  await chCommand(
    `INSERT INTO os_work_items SELECT work_id, board, type, title, description, stage, {status:String}, priority, business_area,
      owner_user_id, requester_user_id, due_at, sla_hours, created_at, now(), blocker_count, needs_approval, now()
      FROM os_work_items WHERE work_id={work_id:String} ORDER BY updated_at DESC LIMIT 1`,
    { work_id: workId, status }
  );
  await insertEvent(workId, actor.user_id, 'status_changed', { status });
  return getWorkCurrent(workId);
}

export async function listWork(filters: any) {
  const cond: string[] = ['1=1'];
  const params: Record<string, any> = {};
  ['board', 'stage', 'status', 'owner_user_id', 'priority', 'business_area'].forEach((f) => {
    if (filters[f]) {
      cond.push(`${f} = {${f}:String}`);
      params[f] = filters[f];
    }
  });
  if (filters.blocked === 'true') cond.push('blocker_count > 0');
  if (filters.needs_approval === 'true') cond.push('needs_approval = 1');
  if (filters.search) {
    cond.push('(positionCaseInsensitive(title, {search:String}) > 0 OR positionCaseInsensitive(description, {search:String}) > 0)');
    params.search = filters.search;
  }
  return chQuery<any>(
    `SELECT work_id, argMax(board, updated_at) board, argMax(title, updated_at) title, argMax(stage, updated_at) stage,
      argMax(status, updated_at) status, argMax(priority, updated_at) priority, argMax(owner_user_id, updated_at) owner_user_id,
      argMax(blocker_count, updated_at) blocker_count, argMax(needs_approval, updated_at) needs_approval, max(updated_at) updated_at
     FROM os_work_items GROUP BY work_id HAVING ${cond.join(' AND ')} ORDER BY updated_at DESC LIMIT 200`,
    params
  );
}

export { now };
