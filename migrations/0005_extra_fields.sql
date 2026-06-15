-- 0005_extra_fields.sql
-- Add extra fields to registrations for general attendees

ALTER TABLE registrations ADD COLUMN work_field TEXT DEFAULT NULL;
ALTER TABLE registrations ADD COLUMN participation_reason TEXT DEFAULT NULL;
