import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'lead', 'contributor', 'viewer']).default('contributor'),
  team: z.string().default('data')
});

export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export const createWorkSchema = z.object({
  board: z.enum(['requests', 'metric_factory', 'insight_action', 'ml_genai']),
  type: z.string(),
  title: z.string().min(3),
  description: z.string().default(''),
  priority: z.enum(['p0', 'p1', 'p2', 'p3']).default('p2'),
  business_area: z.string().default('product'),
  owner_user_id: z.string().optional(),
  requester_user_id: z.string().optional(),
  due_at: z.string().optional(),
  sla_hours: z.number().int().positive().optional()
});

export const moveStageSchema = z.object({ to_stage: z.string() });
export const statusSchema = z.object({ status: z.enum(['open', 'blocked', 'in_review', 'done', 'cancelled']) });
export const assignSchema = z.object({ owner_user_id: z.string() });
export const depSchema = z.object({ depends_on_work_id: z.string(), dep_type: z.enum(['blocks', 'data_needed', 'approval_needed']) });
export const commentSchema = z.object({ body: z.string().min(1) });
export const artifactSchema = z.object({ kind: z.enum(['doc', 'dashboard', 'query', 'repo', 'file', 'ticket_link']), title: z.string(), url: z.string().url() });
export const approvalSchema = z.object({ gate: z.enum(['spec_approval', 'reconcile_approval', 'publish_approval']), required_from_user_id: z.string() });
export const approvalDecisionSchema = z.object({ status: z.enum(['approved', 'rejected']), decision_note: z.string().default('') });
