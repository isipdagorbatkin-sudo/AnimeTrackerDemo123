-- Расширение профилей
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS background_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_anime_id INTEGER;

-- Кастомные плейлисты
CREATE TABLE IF NOT EXISTS custom_playlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Аниме в плейлистах
CREATE TABLE IF NOT EXISTS playlist_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  playlist_id UUID REFERENCES custom_playlists(id) ON DELETE CASCADE NOT NULL,
  anime_id INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(playlist_id, anime_id)
);

-- Комментарии на профиле
CREATE TABLE IF NOT EXISTS profile_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_custom_playlists_user ON custom_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist ON playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_profile_comments_profile ON profile_comments(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_comments_created ON profile_comments(created_at DESC);

-- RLS
ALTER TABLE custom_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Просмотр плейлистов" ON custom_playlists FOR SELECT USING (true);
CREATE POLICY "Создание плейлистов" ON custom_playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Обновление плейлистов" ON custom_playlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Удаление плейлистов" ON custom_playlists FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Просмотр элементов плейлиста" ON playlist_items FOR SELECT USING (true);
CREATE POLICY "Добавление в плейлист" ON playlist_items FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM custom_playlists WHERE id = playlist_id));
CREATE POLICY "Удаление из плейлиста" ON playlist_items FOR DELETE USING (auth.uid() IN (SELECT user_id FROM custom_playlists WHERE id = playlist_id));

CREATE POLICY "Просмотр комментариев" ON profile_comments FOR SELECT USING (true);
CREATE POLICY "Создание комментариев" ON profile_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Удаление комментариев" ON profile_comments FOR DELETE USING (auth.uid() = author_id OR auth.uid() = profile_id);
