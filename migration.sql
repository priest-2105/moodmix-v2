-- Remove the foreign key constraint and change the column type
ALTER TABLE moods 
DROP CONSTRAINT IF EXISTS moods_user_id_fkey;

-- Change the column type from UUID to TEXT
ALTER TABLE moods 
ALTER COLUMN user_id TYPE TEXT;

