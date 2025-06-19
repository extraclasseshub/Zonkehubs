/*
  # Fix complete message deletion

  1. Database Functions
    - Update get_user_messages to properly filter deleted messages
    - Update get_conversation_messages to handle all deletion types
    - Add function to completely remove messages when deleted by both users

  2. Triggers
    - Add trigger to clean up messages deleted by both parties
    - Ensure proper message filtering in all scenarios

  3. Security
    - Maintain RLS policies
    - Ensure users can only delete their own messages
*/

-- Drop existing functions to recreate them with better deletion handling
DROP FUNCTION IF EXISTS get_user_messages(uuid);
DROP FUNCTION IF EXISTS get_conversation_messages(uuid, uuid);

-- Enhanced function to get user messages with proper deletion filtering
CREATE OR REPLACE FUNCTION get_user_messages(user_id uuid)
RETURNS TABLE (
  id uuid,
  sender_id uuid,
  receiver_id uuid,
  content text,
  read boolean,
  created_at timestamptz,
  message_type text,
  file_url text,
  file_name text,
  file_size integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.sender_id,
    m.receiver_id,
    m.content,
    m.read,
    m.created_at,
    m.message_type,
    m.file_url,
    m.file_name,
    m.file_size
  FROM chat_messages m
  WHERE 
    (m.sender_id = user_id OR m.receiver_id = user_id)
    AND m.deleted_for_all = false
    AND (
      (m.sender_id = user_id AND m.deleted_for_sender = false) OR
      (m.receiver_id = user_id AND m.deleted_for_receiver = false)
    )
  ORDER BY m.created_at ASC;
END;
$$;

-- Enhanced function to get conversation messages with proper deletion filtering
CREATE OR REPLACE FUNCTION get_conversation_messages(user1_id uuid, user2_id uuid)
RETURNS TABLE (
  id uuid,
  sender_id uuid,
  receiver_id uuid,
  content text,
  read boolean,
  created_at timestamptz,
  message_type text,
  file_url text,
  file_name text,
  file_size integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.sender_id,
    m.receiver_id,
    m.content,
    m.read,
    m.created_at,
    m.message_type,
    m.file_url,
    m.file_name,
    m.file_size
  FROM chat_messages m
  WHERE 
    (
      (m.sender_id = user1_id AND m.receiver_id = user2_id) OR
      (m.sender_id = user2_id AND m.receiver_id = user1_id)
    )
    AND m.deleted_for_all = false
    AND (
      (m.sender_id = user1_id AND m.deleted_for_sender = false) OR
      (m.receiver_id = user1_id AND m.deleted_for_receiver = false) OR
      (m.sender_id = user2_id AND m.deleted_for_sender = false) OR
      (m.receiver_id = user2_id AND m.deleted_for_receiver = false)
    )
  ORDER BY m.created_at ASC;
END;
$$;

-- Function to clean up messages that are deleted by both parties
CREATE OR REPLACE FUNCTION cleanup_fully_deleted_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete messages that are deleted for both sender and receiver
  DELETE FROM chat_messages 
  WHERE deleted_for_sender = true 
    AND deleted_for_receiver = true 
    AND deleted_for_all = false;
    
  -- Also delete messages that are deleted for all
  DELETE FROM chat_messages 
  WHERE deleted_for_all = true;
END;
$$;

-- Trigger to automatically clean up fully deleted messages
CREATE OR REPLACE FUNCTION trigger_cleanup_deleted_messages()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If message is now deleted by both parties, schedule for cleanup
  IF NEW.deleted_for_sender = true AND NEW.deleted_for_receiver = true THEN
    -- Delete the message immediately
    DELETE FROM chat_messages WHERE id = NEW.id;
    RETURN NULL;
  END IF;
  
  -- If message is deleted for all, delete immediately
  IF NEW.deleted_for_all = true THEN
    DELETE FROM chat_messages WHERE id = NEW.id;
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for message cleanup
DROP TRIGGER IF EXISTS cleanup_deleted_messages_trigger ON chat_messages;
CREATE TRIGGER cleanup_deleted_messages_trigger
  AFTER UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup_deleted_messages();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_messages(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_messages(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_fully_deleted_messages() TO authenticated;