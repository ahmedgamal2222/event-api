-- 0006_clear_registrations.sql
-- Clear all registrations and reset stats

DELETE FROM registrations;

UPDATE event_stats SET
  total_registrations = 0,
  approved_count = 0,
  startup_count = 0,
  updated_at = CURRENT_TIMESTAMP;
