-- 0001_initial.sql
-- Core schema for Event Management System

-- ─── Admins / Auth ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('super_admin','admin','moderator')),
  is_active   INTEGER DEFAULT 1,
  last_login  DATETIME,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── Events ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT UNIQUE NOT NULL,           -- e.g. "s3-summit-2026"
  name          TEXT NOT NULL,
  name_ar       TEXT,
  tagline       TEXT,
  tagline_ar    TEXT,
  description   TEXT,
  description_ar TEXT,
  location      TEXT,
  location_ar   TEXT,
  country       TEXT DEFAULT 'Syria',
  city          TEXT,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  cover_image   TEXT,
  logo          TEXT,
  primary_color TEXT DEFAULT '#6C63FF',
  status        TEXT DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
  registration_open INTEGER DEFAULT 1,
  max_attendees INTEGER,
  website       TEXT,
  email         TEXT,
  twitter       TEXT,
  instagram     TEXT,
  linkedin      TEXT,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── Speakers ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS speakers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id    INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  name_ar     TEXT,
  title       TEXT,
  title_ar    TEXT,
  company     TEXT,
  bio         TEXT,
  bio_ar      TEXT,
  photo_url   TEXT,
  sort_order  INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  is_surprise INTEGER DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── Agenda Days ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agenda_days (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id  INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date      DATE,
  label     TEXT,           -- "اليوم الأول"
  label_en  TEXT,
  UNIQUE(event_id, day_number)
);

-- ─── Agenda Sessions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agenda_sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id    INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  day_id      INTEGER NOT NULL REFERENCES agenda_days(id) ON DELETE CASCADE,
  speaker_id  INTEGER REFERENCES speakers(id) ON DELETE SET NULL,
  time_start  TEXT NOT NULL,          -- "09:00"
  time_end    TEXT,                   -- "10:00"
  title       TEXT NOT NULL,
  title_ar    TEXT,
  description TEXT,
  description_ar TEXT,
  session_type TEXT DEFAULT 'talk'
    CHECK(session_type IN ('talk','workshop','panel','break','networking','keynote','competition')),
  location    TEXT,                   -- room/hall
  sort_order  INTEGER DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── Registrations ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS registrations (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id         INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  reg_type         TEXT NOT NULL DEFAULT 'general'
    CHECK(reg_type IN ('startup','general','investor','speaker','sponsor','media')),
  -- Personal info
  full_name        TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT,
  city             TEXT,
  country          TEXT DEFAULT 'Syria',
  -- Startup info (when reg_type = 'startup')
  company_name     TEXT,
  sector           TEXT,
  stage            TEXT CHECK(stage IN ('idea','mvp','early','growth','scaling',NULL)),
  team_size        TEXT,
  website          TEXT,
  description      TEXT,
  -- Status & tracking
  status           TEXT DEFAULT 'pending'
    CHECK(status IN ('pending','approved','rejected','waitlisted','cancelled')),
  ticket_code      TEXT UNIQUE,
  notes            TEXT,              -- admin notes
  ip_address       TEXT,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── Stats (virtual/denormalized) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_stats (
  event_id           INTEGER PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  total_registrations INTEGER DEFAULT 0,
  approved_count     INTEGER DEFAULT 0,
  startup_count      INTEGER DEFAULT 0,
  speaker_count      INTEGER DEFAULT 0,
  days_count         INTEGER DEFAULT 0,
  updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── Sponsors ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sponsors (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id  INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  logo_url  TEXT,
  website   TEXT,
  tier      TEXT DEFAULT 'silver' CHECK(tier IN ('platinum','gold','silver','bronze','media','community')),
  sort_order INTEGER DEFAULT 0
);

-- ─── FAQs ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faqs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question   TEXT NOT NULL,
  question_ar TEXT,
  answer     TEXT NOT NULL,
  answer_ar  TEXT,
  sort_order INTEGER DEFAULT 0
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_events_slug       ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_status     ON events(status);
CREATE INDEX IF NOT EXISTS idx_speakers_event    ON speakers(event_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_sessions_day      ON agenda_sessions(day_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_reg_event         ON registrations(event_id, status);
CREATE INDEX IF NOT EXISTS idx_reg_email         ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_reg_ticket        ON registrations(ticket_code);
