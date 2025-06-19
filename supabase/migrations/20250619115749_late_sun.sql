/*
  # Add conversation deletion and message management features

  1. New Tables
    - `conversation_participants` - Track conversation participants and deletion status
    - Add message deletion tracking columns

  2. Features
    - Conversation deletion (delete for me vs delete for all)
    - Message deletion tracking
    - Better conversation management

  3. Security
    - Proper RLS policies for conversation management
    - User can only delete their own conversations/messages
*/

-- Add conversation_participants table for better conversation management
CREATE TABLE IF NOT EXISTS conversation_participants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id text NOT NULL, -- Format: smaller_user_id:larger_user_id
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  other_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deleted_at timestamptz NULL, -- When user deleted this conversation
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Add message deletion tracking columns
DO $$
BEGIN
  -- Add deleted_for_sender column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'deleted_for_sender'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN deleted_for_sender boolean DEFAULT false;
  END IF;

  -- Add deleted_for_receiver column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'deleted_for_receiver'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN deleted_for_receiver boolean DEFAULT false;
  END IF;

  -- Add deleted_for_all column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'deleted_for_all'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN deleted_for_all boolean DEFAULT false;
  END IF;

  -- Add message_type column for future file/image support
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'message_type'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file'));
  END IF;

  -- Add file_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'file_url'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN file_url text;
  END IF;

  -- Add file_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN file_name text;
  END IF;

  -- Add file_size column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'file_size'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN file_size integer;
  END IF;
END $$;

-- Enable RLS on conversation_participants
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Conversation participants policies
CREATE POLICY "Users can read their own conversation participants"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversation participants"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversation participants"
  ON conversation_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversation participants"
  ON conversation_participants FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update chat messages policies to handle deletion
DROP POLICY IF EXISTS "Users can update their received messages" ON chat_messages;

CREATE POLICY "Users can update their own messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_deletion ON chat_messages(deleted_for_all, deleted_for_sender, deleted_for_receiver);

-- Create function to generate conversation ID
CREATE OR REPLACE FUNCTION generate_conversation_id(user1_id UUID, user2_id UUID)
RETURNS TEXT AS $$
BEGIN
  -- Always put the smaller UUID first for consistency
  IF user1_id < user2_id THEN
    RETURN user1_id::text || ':' || user2_id::text;
  ELSE
    RETURN user2_id::text || ':' || user1_id::text;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to ensure conversation participants exist
CREATE OR REPLACE FUNCTION ensure_conversation_participants()
RETURNS TRIGGER AS $$
DECLARE
  conv_id TEXT;
BEGIN
  -- Generate conversation ID
  conv_id := generate_conversation_id(NEW.sender_id, NEW.receiver_id);
  
  -- Insert sender participant if not exists
  INSERT INTO conversation_participants (conversation_id, user_id, other_user_id)
  VALUES (conv_id, NEW.sender_id, NEW.receiver_id)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;
  
  -- Insert receiver participant if not exists
  INSERT INTO conversation_participants (conversation_id, user_id, other_user_id)
  VALUES (conv_id, NEW.receiver_id, NEW.sender_id)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create conversation participants
CREATE TRIGGER ensure_conversation_participants_trigger
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION ensure_conversation_participants();

-- Create function to handle conversation deletion
CREATE OR REPLACE FUNCTION delete_conversation_for_user(target_user_id UUID, other_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  conv_id TEXT;
BEGIN
  -- Generate conversation ID
  conv_id := generate_conversation_id(target_user_id, other_user_id);
  
  -- Mark conversation as deleted for the user
  UPDATE conversation_participants 
  SET deleted_at = now(), updated_at = now()
  WHERE conversation_id = conv_id AND user_id = target_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the setup
SELECT 'Conversation deletion system setup complete' as status;