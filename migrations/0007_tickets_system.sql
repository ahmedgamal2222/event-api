-- Create Tickets table
CREATE TABLE IF NOT EXISTS ticket_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description TEXT,
  price_per_unit REAL NOT NULL DEFAULT 0,
  
  -- Duration type
  duration_type TEXT NOT NULL CHECK(duration_type IN ('single_day', 'three_days', 'full_event', 'custom_days')),
  -- For custom_days: number of days
  custom_days INTEGER,
  
  -- Specific days for custom_days type (JSON array of day numbers)
  day_numbers TEXT DEFAULT '[]',
  
  quantity_available INTEGER NOT NULL DEFAULT 0,
  quantity_sold INTEGER NOT NULL DEFAULT 0,
  
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Create Tickets (purchased) table
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  ticket_type_id INTEGER NOT NULL,
  registration_id INTEGER,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  
  -- Ticket details
  ticket_number TEXT NOT NULL UNIQUE,
  qr_code TEXT,
  
  -- Days coverage (for reference)
  valid_from DATE,
  valid_to DATE,
  day_numbers TEXT DEFAULT '[]',
  
  status TEXT NOT NULL CHECK(status IN ('available', 'used', 'expired', 'cancelled')) DEFAULT 'available',
  purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  used_at DATETIME,
  
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id) ON DELETE CASCADE,
  FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX idx_tickets_event_id ON tickets(event_id);
CREATE INDEX idx_tickets_ticket_type_id ON tickets(ticket_type_id);
CREATE INDEX idx_tickets_email ON tickets(email);
CREATE INDEX idx_ticket_types_event_id ON ticket_types(event_id);
