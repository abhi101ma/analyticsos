import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { chCommand } from './clickhouse.js';
import { BOARD_STAGES } from '../domain/stageRules.js';

const users = [
  { name: 'Admin User', email: 'admin@local', role: 'admin', team: 'platform', password: 'admin123' },
  ...Array.from({ length: 10 }).map((_, i) => ({ name: `User ${i + 1}`, email: `user${i + 1}@local`, role: i % 3 === 0 ? 'lead' : 'contributor', team: ['analytics', 'data', 'ai'][i % 3], password: 'password123' }))
];

async function run() {
  const userIds: string[] = [];
  for (const u of users) {
    const id = uuid();
    userIds.push(id);
    await chCommand(`INSERT INTO os_users VALUES ({id:String},{name:String},{email:String},{hash:String},{role:String},{team:String},1,now())`, { id, name: u.name, email: u.email, hash: await bcrypt.hash(u.password, 10), role: u.role, team: u.team });
  }
  const boards = Object.keys(BOARD_STAGES);
  for (let i = 0; i < 40; i++) {
    const workId = uuid();
    const board = boards[i % boards.length];
    const stages = BOARD_STAGES[board];
    const stage = stages[i % stages.length];
    const owner = userIds[(i + 1) % userIds.length];
    await chCommand(`INSERT INTO os_work_items VALUES ({work_id:String},{board:String},{type:String},{title:String},{desc:String},{stage:String},{status:String},{priority:String},{biz:String},{owner:String},{req:String},NULL,NULL,now(),now(),0,0,now())`, {
      work_id: workId, board, type: ['metric_request', 'pipeline', 'dashboard', 'model'][i % 4], title: `Sample Work ${i + 1}`,
      desc: `Seeded item ${i + 1}`, stage, status: i % 7 === 0 ? 'blocked' : 'open', priority: ['p0', 'p1', 'p2', 'p3'][i % 4], biz: ['finance', 'ops', 'marketing', 'product'][i % 4], owner, req: userIds[0]
    });
    await chCommand(`INSERT INTO os_events VALUES ({e:String},{w:String},'created',{a:String},['stage'],[{stage:String}],now())`, { e: uuid(), w: workId, a: userIds[0], stage });
    await chCommand(`INSERT INTO os_comments VALUES ({id:String},{w:String},{u:String},{b:String},now())`, { id: uuid(), w: workId, u: owner, b: 'Initial triage completed.' });
    await chCommand(`INSERT INTO os_artifacts VALUES ({id:String},{w:String},'doc','Spec Doc','https://example.com/spec',{u:String},now())`, { id: uuid(), w: workId, u: owner });
    if (i % 5 === 0) {
      await chCommand(`INSERT INTO os_approvals VALUES ({id:String},{w:String},'spec_approval',{u:String},'pending','',NULL,now())`, { id: uuid(), w: workId, u: userIds[1] });
      await chCommand(`INSERT INTO os_work_items SELECT work_id,board,type,title,description,stage,status,priority,business_area,owner_user_id,requester_user_id,due_at,sla_hours,created_at,now(),blocker_count,1,now() FROM os_work_items WHERE work_id={w:String} ORDER BY updated_at DESC LIMIT 1`, { w: workId });
    }
  }
  await chCommand(`INSERT INTO os_kpi_snapshots VALUES ({id:String},today(),'flow_efficiency',72.4,1.2,3.5,'Healthy throughput',now())`, { id: uuid() });
  console.log('seed complete');
}

run();
