import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { z } from 'zod';
import { registerAuth, createUser, loginUser } from './auth/auth.js';
import {
  approvalDecisionSchema,
  approvalSchema,
  artifactSchema,
  assignSchema,
  commentSchema,
  createWorkSchema,
  depSchema,
  loginSchema,
  moveStageSchema,
  registerSchema,
  statusSchema
} from './api/schemas.js';
import { chCommand, chQuery } from './db/clickhouse.js';
import { createWorkItem, getWorkCurrent, insertEvent, listWork, moveWorkStage, recomputeBlockers, recomputeNeedsApproval, setStatus } from './services/workService.js';
import { v4 as uuid } from 'uuid';

export function buildServer() {
  const app = Fastify({ logger: true });
  app.register(cors, { origin: true });
  app.register(jwt, { secret: process.env.JWT_SECRET ?? 'dev-secret' });
  app.register(swagger, { openapi: { info: { title: 'Metric Ops API', version: '1.0.0' } } });
  app.register(swaggerUi, { routePrefix: '/api/docs' });
  app.register(registerAuth);

  app.post('/api/v1/auth/register', async (req, reply) => {
    const body = registerSchema.parse(req.body);
    const user = await createUser(body);
    reply.send(user);
  });

  app.post('/api/v1/auth/login', async (req, reply) => {
    const body = loginSchema.parse(req.body);
    const user = await loginUser(body.email, body.password);
    if (!user) return reply.code(401).send({ message: 'Invalid credentials' });
    const token = await reply.jwtSign({ user_id: user.user_id, role: user.role, email: user.email });
    reply.send({ token, user: { user_id: user.user_id, name: user.name, role: user.role, email: user.email } });
  });

  app.get('/api/v1/me', { preHandler: [app.auth] }, async (req: any) => req.user);

  app.post('/api/v1/work', { preHandler: [app.auth] }, async (req: any) => createWorkItem(createWorkSchema.parse(req.body), req.user.user_id));
  app.get('/api/v1/work', { preHandler: [app.auth] }, async (req: any) => listWork(req.query));

  app.get('/api/v1/work/:id', { preHandler: [app.auth] }, async (req: any) => {
    const workId = req.params.id;
    const [work, deps, approvals, artifacts, comments, events] = await Promise.all([
      getWorkCurrent(workId),
      chQuery(`SELECT * FROM os_work_deps WHERE (work_id={id:String} OR depends_on_work_id={id:String}) AND is_deleted=0`, { id: workId }),
      chQuery(`SELECT * FROM os_approvals WHERE work_id={id:String}`, { id: workId }),
      chQuery(`SELECT * FROM os_artifacts WHERE work_id={id:String} ORDER BY created_at DESC`, { id: workId }),
      chQuery(`SELECT * FROM os_comments WHERE work_id={id:String} ORDER BY created_at DESC LIMIT 20`, { id: workId }),
      chQuery(`SELECT * FROM os_events WHERE work_id={id:String} ORDER BY created_at DESC LIMIT 100`, { id: workId })
    ]);
    return { work, dependencies: deps, approvals, artifacts, comments, events };
  });

  app.post('/api/v1/work/:id/move', { preHandler: [app.auth] }, async (req: any) => moveWorkStage(req.params.id, moveStageSchema.parse(req.body).to_stage, req.user));
  app.post('/api/v1/work/:id/status', { preHandler: [app.auth] }, async (req: any) => setStatus(req.params.id, statusSchema.parse(req.body).status, req.user));

  app.post('/api/v1/work/:id/assign', { preHandler: [app.auth] }, async (req: any) => {
    const { owner_user_id } = assignSchema.parse(req.body);
    await chCommand(
      `INSERT INTO os_work_items SELECT work_id, board, type, title, description, stage, status, priority, business_area,
       {owner_user_id:String}, requester_user_id, due_at, sla_hours, created_at, now(), blocker_count, needs_approval, now()
       FROM os_work_items WHERE work_id={work_id:String} ORDER BY updated_at DESC LIMIT 1`,
      { owner_user_id, work_id: req.params.id }
    );
    await insertEvent(req.params.id, req.user.user_id, 'assigned', { owner_user_id });
    return getWorkCurrent(req.params.id);
  });

  app.post('/api/v1/work/:id/deps', { preHandler: [app.auth] }, async (req: any) => {
    const body = depSchema.parse(req.body);
    await chCommand(`INSERT INTO os_work_deps (dep_id, work_id, depends_on_work_id, dep_type, is_deleted, created_at) VALUES ({dep_id:String},{work_id:String},{depends_on_work_id:String},{dep_type:String},0,now())`, { dep_id: uuid(), work_id: req.params.id, ...body });
    await insertEvent(req.params.id, req.user.user_id, 'dep_added', body as any);
    await recomputeBlockers(req.params.id);
    return { ok: true };
  });

  app.delete('/api/v1/work/:id/deps/:depId', { preHandler: [app.auth] }, async (req: any) => {
    await chCommand(`INSERT INTO os_work_deps SELECT dep_id, work_id, depends_on_work_id, dep_type, 1, now() FROM os_work_deps WHERE dep_id={dep_id:String} ORDER BY created_at DESC LIMIT 1`, { dep_id: req.params.depId });
    await insertEvent(req.params.id, req.user.user_id, 'dep_removed', { dep_id: req.params.depId });
    await recomputeBlockers(req.params.id);
    return { ok: true };
  });

  app.post('/api/v1/work/:id/comment', { preHandler: [app.auth] }, async (req: any) => {
    const body = commentSchema.parse(req.body);
    await chCommand(`INSERT INTO os_comments (comment_id, work_id, user_id, body, created_at) VALUES ({comment_id:String},{work_id:String},{user_id:String},{body:String},now())`, { comment_id: uuid(), work_id: req.params.id, user_id: req.user.user_id, body: body.body });
    await insertEvent(req.params.id, req.user.user_id, 'comment_added', { body: body.body.slice(0, 60) });
    return { ok: true };
  });

  app.post('/api/v1/work/:id/artifact', { preHandler: [app.auth] }, async (req: any) => {
    const body = artifactSchema.parse(req.body);
    await chCommand(`INSERT INTO os_artifacts (artifact_id, work_id, kind, title, url, created_by_user_id, created_at) VALUES ({artifact_id:String},{work_id:String},{kind:String},{title:String},{url:String},{user_id:String},now())`, { artifact_id: uuid(), work_id: req.params.id, user_id: req.user.user_id, ...body });
    await insertEvent(req.params.id, req.user.user_id, 'artifact_added', { kind: body.kind, url: body.url });
    return { ok: true };
  });

  app.post('/api/v1/work/:id/approval', { preHandler: [app.auth] }, async (req: any) => {
    const body = approvalSchema.parse(req.body);
    await chCommand(`INSERT INTO os_approvals (approval_id, work_id, gate, required_from_user_id, status, decision_note, decided_at, created_at)
      VALUES ({approval_id:String},{work_id:String},{gate:String},{required_from_user_id:String},'pending','',NULL,now())`, { approval_id: uuid(), work_id: req.params.id, ...body });
    await insertEvent(req.params.id, req.user.user_id, 'approval_created', body as any);
    await recomputeNeedsApproval(req.params.id);
    return { ok: true };
  });

  app.post('/api/v1/approval/:approval_id/decide', { preHandler: [app.auth] }, async (req: any) => {
    const body = approvalDecisionSchema.parse(req.body);
    const rows = await chQuery<any>('SELECT * FROM os_approvals WHERE approval_id={id:String} ORDER BY created_at DESC LIMIT 1', { id: req.params.approval_id });
    const current = rows[0];
    await chCommand(`INSERT INTO os_approvals (approval_id, work_id, gate, required_from_user_id, status, decision_note, decided_at, created_at)
      VALUES ({approval_id:String},{work_id:String},{gate:String},{required_from_user_id:String},{status:String},{decision_note:String},now(),now())`, { ...current, status: body.status, decision_note: body.decision_note });
    await insertEvent(current.work_id, req.user.user_id, 'approval_decided', { status: body.status });
    await recomputeNeedsApproval(current.work_id);
    return { ok: true };
  });

  app.get('/api/v1/summary/daily', { preHandler: [app.auth] }, async (req: any) => {
    const date = z.string().default(new Date().toISOString().slice(0, 10)).parse(req.query.date);
    const [counts, approvals, blocked, kpi] = await Promise.all([
      chQuery(`SELECT board, stage, status, count() AS count FROM (SELECT work_id,argMax(board,updated_at) board,argMax(stage,updated_at) stage,argMax(status,updated_at) status FROM os_work_items GROUP BY work_id) GROUP BY board,stage,status`, {}),
      chQuery(`SELECT required_from_user_id, count() count FROM os_approvals WHERE status='pending' GROUP BY required_from_user_id`, {}),
      chQuery(`SELECT work_id, title, blocker_count FROM (SELECT work_id,argMax(title,updated_at) title,argMax(blocker_count,updated_at) blocker_count FROM os_work_items GROUP BY work_id) WHERE blocker_count > 0 ORDER BY blocker_count DESC LIMIT 20`, {}),
      chQuery(`SELECT * FROM os_kpi_snapshots WHERE snapshot_date={d:Date}`, { d: date })
    ]);
    return { date, counts, approvals_pending_by_user: approvals, blocked_items: blocked, kpi };
  });

  app.get('/api/v1/summary/weekly', { preHandler: [app.auth] }, async () => ({ message: 'stub' }));

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const app = buildServer();
  app.listen({ port: 3000, host: '0.0.0.0' });
}
