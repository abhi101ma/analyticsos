import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { chCommand, chQuery } from '../db/clickhouse.js';

export async function registerAuth(server: FastifyInstance) {
  server.decorate('auth', async function (request: FastifyRequest) {
    await request.jwtVerify();
  });
}

export async function createUser(input: any) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const userId = uuid();
  await chCommand(
    `INSERT INTO os_users (user_id, name, email, password_hash, role, team, is_active, created_at)
     VALUES ({user_id:String}, {name:String}, {email:String}, {password_hash:String}, {role:String}, {team:String}, 1, now())`,
    { user_id: userId, name: input.name, email: input.email, password_hash: passwordHash, role: input.role, team: input.team }
  );
  return { user_id: userId, email: input.email };
}

export async function loginUser(email: string, password: string) {
  const users = await chQuery<any>(
    `SELECT user_id, argMax(name, created_at) name, email, argMax(password_hash, created_at) password_hash,
      argMax(role, created_at) role, argMax(team, created_at) team
      FROM os_users WHERE email={email:String} GROUP BY user_id, email ORDER BY max(created_at) DESC LIMIT 1`,
    { email }
  );
  const user = users[0];
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  return ok ? user : null;
}
