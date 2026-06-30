-- 1. Create a custom PostgreSQL enum type for ticket classification
CREATE TYPE ticket_type_enum AS ENUM ('bug', 'support');

-- 2. Build the structural support tickets storage table
CREATE TABLE support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT,
  ticket_type ticket_type_enum NOT NULL, -- Forces rows to match 'bug' or 'support' exactly
  message TEXT NOT NULL,
  app_version TEXT NOT NULL,
  user_agent TEXT, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Enable performance indexing for swift filtering down the road
CREATE INDEX idx_support_tickets_type ON support_tickets(ticket_type);