-- Drop existing publication if it exists
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Create publication for real-time
CREATE PUBLICATION supabase_realtime FOR TABLE messages;

-- Enable replication on messages table
ALTER TABLE messages REPLICA IDENTITY FULL; 