import { createClient } from '@clickhouse/client';

export const clickhouse = createClient({
  host: process.env.CLICKHOUSE_URL ?? 'http://clickhouse:8123',
  username: process.env.CLICKHOUSE_USER ?? 'default',
  password: process.env.CLICKHOUSE_PASSWORD ?? '',
  database: process.env.CLICKHOUSE_DB ?? 'metric_ops'
});

export async function chQuery<T>(query: string, params?: Record<string, unknown>): Promise<T[]> {
  const result = await clickhouse.query({ query, query_params: params, format: 'JSONEachRow' });
  return result.json<T>();
}

export async function chCommand(query: string, params?: Record<string, unknown>) {
  await clickhouse.command({ query, query_params: params });
}
