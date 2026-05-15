-- Add source column to anime_collection to track which API the anime_id belongs to
-- 'shikimori' = legacy Shikimori IDs (existing data)
-- 'anilist' = new AniList IDs (data going forward)
ALTER TABLE anime_collection
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'shikimori' NOT NULL;

-- Update RLS to allow new columns
DROP POLICY IF EXISTS "Users can insert their own collection items" ON anime_collection;
CREATE POLICY "Users can insert their own collection items"
ON anime_collection
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Anime collection remains indexed by (user_id, anime_id) which still works
-- since Shikimori IDs and AniList IDs are different numbering systems
COMMENT ON COLUMN anime_collection.source IS 'API source: shikimori (legacy) or anilist';
