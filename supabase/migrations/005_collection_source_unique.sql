-- Keep legacy Shikimori ids and new AniList ids from blocking each other when
-- their numeric ids happen to match.
ALTER TABLE anime_collection
DROP CONSTRAINT IF EXISTS anime_collection_user_id_anime_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS anime_collection_user_source_anime_unique
ON anime_collection(user_id, source, anime_id);
