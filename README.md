# AnimeTracker

Приложение для отслеживания аниме с социальной сетью. Позволяет пользователям управлять своей коллекцией аниме, находить друзей и общаться в реальном времени.

## Возможности

- 📚 **Коллекция аниме** — добавление аниме в коллекцию с разными статусами (смотрю, просмотрено, в планах, брошено)
- ⭐ **Оценки и отзывы** — оценка от 1 до 100 и текстовые отзывы
- 🔍 **Поиск аниме** — поиск через Jikan API (база данных MyAnimeList)
- 👥 **Социальная сеть** — поиск пользователей, заявки в друзья, список друзей
- 💬 **Личные чаты** — общение в реальном времени через Supabase Realtime
- 👤 **Профили** — просмотр профилей и коллекций других пользователей
- 📱 **Адаптивный дизайн** — работает на всех устройствах

## Технологии

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI**: shadcn/ui
- **Backend**: Supabase (Auth, Database, Realtime, Storage)
- **Anime API**: Jikan API (https://api.jikan.moe/v4)

## Установка

### Требования

- Node.js 18+ 
- npm или yarn
- Аккаунт Supabase (бесплатный)

### Шаг 1: Клонирование и установка зависимостей

```bash
npm install
```

### Шаг 2: Настройка Supabase

1. Перейдите на [supabase.com](https://supabase.com) и создайте новый проект
2. В настройках проекта (Project Settings → API) скопируйте:
   - Project URL
   - anon public key

### Шаг 3: Создание базы данных

1. Откройте Supabase Dashboard
2. Перейдите в SQL Editor
3. Выполните SQL из файла `supabase/migrations/001_initial_schema.sql`

Или выполните этот SQL:

```sql
-- Включение расширения для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблица профилей
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Коллекция аниме
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

-- Сообщения
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_anime_collection_user ON anime_collection(user_id);
CREATE INDEX IF NOT EXISTS idx_anime_collection_anime ON anime_collection(anime_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE anime_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Политики
CREATE POLICY "Просмотр профилей" ON profiles FOR SELECT USING (true);
CREATE POLICY "Создание профиля" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Обновление профиля" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Просмотр своей коллекции" ON anime_collection FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Создание в своей коллекции" ON anime_collection FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Обновление своей коллекции" ON anime_collection FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Удаление из своей коллекции" ON anime_collection FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Просмотр дружбы" ON friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Создание дружбы" ON friendships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Обновление дружбы" ON friendships FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Удаление дружбы" ON friendships FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Просмотр сообщений" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Создание сообщений" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Обновление сообщений" ON messages FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Триггер для создания профиля
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

-- Realtime для сообщений
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### Шаг 4: Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```env
NEXT_PUBLIC_SUPABASE_URL=ваш_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш_supabase_anon_key
```

Замените `ваш_supabase_url` и `ваш_supabase_anon_key` на значения из Supabase Dashboard.

### Шаг 5: Запуск приложения

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Структура проекта

```
anime-tracker/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Маршруты авторизации
│   │   ├── (main)/            # Основные маршруты
│   │   ├── chat/              # Чаты
│   │   ├── profile/           # Профили
│   │   └── layout.tsx         # Корневой layout
│   ├── components/            # React компоненты
│   │   ├── anime/             # Компоненты аниме
│   │   ├── auth/              # Компоненты авторизации
│   │   ├── chat/              # Компоненты чата
│   │   ├── friends/           # Компоненты друзей
│   │   ├── layout/            # Layout компоненты
│   │   ├── profile/           # Компоненты профиля
│   │   └── ui/                # shadcn/ui компоненты
│   ├── lib/                   # Утилиты
│   │   ├── jikan/             # Jikan API клиент
│   │   ├── supabase/          # Supabase клиенты
│   │   └── utils.ts           # Утилиты
│   └── types/                 # TypeScript типы
├── supabase/
│   └── migrations/            # SQL миграции
└── public/                    # Статические файлы
```

## Использование

### Регистрация

1. Перейдите на страницу регистрации
2. Введите имя пользователя, email и пароль
3. Нажмите "Зарегистрироваться"

### Добавление аниме в коллекцию

1. Перейдите в раздел "Поиск"
2. Введите название аниме
3. Нажмите "Найти"
4. Нажмите "В коллекцию" на карточке аниме
5. Выберите статус, оценку и напишите отзыв

### Управление коллекцией

1. Перейдите в раздел "Коллекция"
2. Фильтруйте по статусам
3. Редактируйте или удаляйте записи

### Друзья

1. Перейдите в раздел "Друзья"
2. Найдите пользователя по имени
3. Отправьте заявку в друзья
4. Приммите или отклоните входящие заявки

### Чат

1. Перейдите в раздел "Чаты"
2. Выберите друга из списка
3. Напишите сообщение
4. Сообщения приходят в реальном времени

## Разработка

### Добавление новых компонентов shadcn/ui

```bash
npx shadcn@latest add [component-name]
```

### Создание миграций Supabase

SQL миграции находятся в `supabase/migrations/`. Выполняйте их через Supabase Dashboard → SQL Editor.

## Лицензия

MIT

## Поддержка

Если у вас есть вопросы или проблемы, создайте issue в репозитории.
