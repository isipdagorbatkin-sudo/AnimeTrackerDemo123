-- Включение расширения для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблица профилей (расширяет auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Коллекция аниме пользователей
CREATE TABLE IF NOT EXISTS anime_collection (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  anime_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('watching', 'completed', 'plan_to_watch', 'dropped')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 100),
  review TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, anime_id)
);

-- Дружба
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Сообщения в чате
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_anime_collection_user ON anime_collection(user_id);
CREATE INDEX IF NOT EXISTS idx_anime_collection_anime ON anime_collection(anime_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- RLS (Row Level Security) политики
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE anime_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Политики для profiles
CREATE POLICY "Просмотр профилей" ON profiles FOR SELECT USING (true);
CREATE POLICY "Создание профиля" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Обновление профиля" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Политики для anime_collection
CREATE POLICY "Просмотр своей коллекции" ON anime_collection FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Создание в своей коллекции" ON anime_collection FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Обновление своей коллекции" ON anime_collection FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Удаление из своей коллекции" ON anime_collection FOR DELETE USING (auth.uid() = user_id);

-- Политики для friendships
CREATE POLICY "Просмотр дружбы" ON friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Создание дружбы" ON friendships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Обновление дружбы" ON friendships FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Удаление дружбы" ON friendships FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Политики для messages
CREATE POLICY "Просмотр сообщений" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Создание сообщений" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Обновление сообщений" ON messages FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Триггер для автоматического создания профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, split_part(new.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Включение Realtime для сообщений
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
