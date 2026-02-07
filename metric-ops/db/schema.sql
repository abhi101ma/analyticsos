CREATE DATABASE IF NOT EXISTS metric_ops;
USE metric_ops;

CREATE TABLE IF NOT EXISTS os_users (
  user_id String,
  name String,
  email String,
  password_hash String,
  role LowCardinality(String),
  team LowCardinality(String),
  is_active UInt8,
  created_at DateTime('Asia/Kolkata')
) ENGINE = ReplacingMergeTree(created_at) ORDER BY (user_id);

CREATE TABLE IF NOT EXISTS os_work_items (
  work_id String,
  board LowCardinality(String),
  type LowCardinality(String),
  title String,
  description String,
  stage LowCardinality(String),
  status LowCardinality(String),
  priority LowCardinality(String),
  business_area LowCardinality(String),
  owner_user_id String,
  requester_user_id String,
  due_at Nullable(DateTime('Asia/Kolkata')),
  sla_hours Nullable(UInt32),
  created_at DateTime('Asia/Kolkata'),
  updated_at DateTime('Asia/Kolkata'),
  blocker_count UInt16,
  needs_approval UInt8,
  last_event_at DateTime('Asia/Kolkata')
) ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (board, stage, status, priority, work_id);

CREATE TABLE IF NOT EXISTS os_work_deps (
  dep_id String,
  work_id String,
  depends_on_work_id String,
  dep_type LowCardinality(String),
  is_deleted UInt8,
  created_at DateTime('Asia/Kolkata')
) ENGINE = ReplacingMergeTree(created_at) ORDER BY (work_id, depends_on_work_id);

CREATE TABLE IF NOT EXISTS os_comments (
  comment_id String,
  work_id String,
  user_id String,
  body String,
  created_at DateTime('Asia/Kolkata')
) ENGINE = MergeTree ORDER BY (work_id, created_at);

CREATE TABLE IF NOT EXISTS os_approvals (
  approval_id String,
  work_id String,
  gate LowCardinality(String),
  required_from_user_id String,
  status LowCardinality(String),
  decision_note String,
  decided_at Nullable(DateTime('Asia/Kolkata')),
  created_at DateTime('Asia/Kolkata')
) ENGINE = ReplacingMergeTree(created_at) ORDER BY (work_id, gate, required_from_user_id);

CREATE TABLE IF NOT EXISTS os_artifacts (
  artifact_id String,
  work_id String,
  kind LowCardinality(String),
  title String,
  url String,
  created_by_user_id String,
  created_at DateTime('Asia/Kolkata')
) ENGINE = MergeTree ORDER BY (work_id, created_at);

CREATE TABLE IF NOT EXISTS os_events (
  event_id String,
  work_id String,
  event_type LowCardinality(String),
  actor_user_id String,
  keys Array(String),
  values Array(String),
  created_at DateTime('Asia/Kolkata')
) ENGINE = MergeTree ORDER BY (work_id, created_at);

CREATE TABLE IF NOT EXISTS os_kpi_snapshots (
  snapshot_id String,
  snapshot_date Date,
  kpi_name LowCardinality(String),
  kpi_value Float64,
  delta_dod Nullable(Float64),
  delta_wow Nullable(Float64),
  notes String,
  created_at DateTime('Asia/Kolkata')
) ENGINE = MergeTree ORDER BY (snapshot_date, kpi_name);
