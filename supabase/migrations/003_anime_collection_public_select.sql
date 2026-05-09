-- Make anime_collection publicly viewable (like playlists and comments)
-- Previously only the owner could see their collection

DROP POLICY IF EXISTS "Просмотр своей коллекции" ON anime_collection;

CREATE POLICY "Просмотр коллекции" ON anime_collection FOR SELECT USING (true);

-- Note: INSERT/UPDATE/DELETE policies remain owner-only
