// ClickHouse database client
// Used for: Analytics queries (fact tables, aggregations)

import { createClient, ClickHouseClient } from '@clickhouse/client';

const globalForClickHouse = globalThis as unknown as {
  clickhouse: ClickHouseClient | undefined;
};

function createClickHouseClient(): ClickHouseClient {
  return createClient({
    url: process.env.CLICKHOUSE_URL ?? 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USER ?? 'epus_user',
    password: process.env.CLICKHOUSE_PASSWORD ?? 'epus_password',
    database: process.env.CLICKHOUSE_DB ?? 'epus_analytics',
    request_timeout: 30000,
    max_open_connections: 10,
    compression: {
      request: true,
      response: true
    }
  });
}

export const clickhouse =
  globalForClickHouse.clickhouse ?? createClickHouseClient();

if (process.env.NODE_ENV !== 'production') {
  globalForClickHouse.clickhouse = clickhouse;
}

// Helper function for executing queries
export async function queryClickHouse<T>(
  query: string,
  params?: Record<string, unknown>
): Promise<T[]> {
  const result = await clickhouse.query({
    query,
    query_params: params,
    format: 'JSONEachRow'
  });
  return result.json<T>();
}

// Helper function for inserting data in batches
export async function insertClickHouse<T extends Record<string, unknown>>(
  table: string,
  values: T[]
): Promise<void> {
  if (values.length === 0) return;

  await clickhouse.insert({
    table,
    values,
    format: 'JSONEachRow'
  });
}

export default clickhouse;
