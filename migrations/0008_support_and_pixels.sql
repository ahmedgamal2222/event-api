-- Create Support Tickets/Messages table
CREATE TABLE IF NOT EXISTS support_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  
  -- User info
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Message
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK(category IN ('general', 'technical', 'registration', 'ticketing', 'other')),
  
  -- Status
  status TEXT NOT NULL CHECK(status IN ('new', 'open', 'in_progress', 'resolved', 'closed')) DEFAULT 'new',
  priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  
  -- Admin response
  admin_response TEXT,
  admin_name TEXT,
  responded_at DATETIME,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Create Pixel Tracking table
CREATE TABLE IF NOT EXISTS pixel_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  
  -- Pixel types
  facebook_pixel_id TEXT,
  facebook_pixel_code TEXT,
  
  linkedin_pixel_id TEXT,
  linkedin_pixel_code TEXT,
  
  twitter_pixel_id TEXT,
  twitter_pixel_code TEXT,
  
  -- Additional tracking codes
  gtag_id TEXT,
  gtag_code TEXT,
  
  custom_pixel_code TEXT,
  
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_support_messages_event_id ON support_messages(event_id);
CREATE INDEX idx_support_messages_email ON support_messages(email);
CREATE INDEX idx_support_messages_status ON support_messages(status);
CREATE INDEX idx_pixel_tracking_event_id ON pixel_tracking(event_id);
