import type { AniListAnime } from '@/lib/anilist/client'

export type AchievementCategory = 'collection' | 'genres' | 'ratings' | 'profile' | 'social'
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface AchievementStats {
  profile?: {
    username?: string
    avatar_url?: string | null
    country?: string | null
    bio?: string | null
    banner_url?: string | null
    background_url?: string | null
    favorite_anime_id?: number | null
    created_at?: string
  } | null
  collection: {
    anime_id: number
    status: string
    rating?: number | null
    review?: string | null
    added_at?: string
  }[]
  animeById: Record<number, AniListAnime>
  playlistsCount: number
  commentsCount: number
  sentCommentsCount: number
  friendsCount: number
  sentMessagesCount: number
  receivedMessagesCount: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  category: AchievementCategory
  tier: AchievementTier
  target: number
  getProgress: (stats: AchievementStats) => number
}

export interface AchievementProgress extends Achievement {
  progress: number
  unlocked: boolean
  percent: number
}

function uniqueItems(items: AchievementStats['collection']) {
  return Array.from(new Map(items.map((item) => [item.anime_id, item])).values())
}

function collectionCount(stats: AchievementStats) {
  return uniqueItems(stats.collection).length
}

function byStatus(stats: AchievementStats, status: string) {
  return uniqueItems(stats.collection.filter((item) => item.status === status))
}

function completed(stats: AchievementStats) {
  return byStatus(stats, 'completed')
}

function rated(stats: AchievementStats) {
  return uniqueItems(stats.collection.filter((item) => typeof item.rating === 'number' && item.rating > 0))
}

function reviewed(stats: AchievementStats) {
  return uniqueItems(stats.collection.filter((item) => item.review && item.review.trim().length > 0))
}

function completedAnime(stats: AchievementStats) {
  return completed(stats)
    .map((item) => stats.animeById[item.anime_id])
    .filter(Boolean)
}

function genreCount(stats: AchievementStats, genre: string) {
  return completedAnime(stats).filter((anime) => anime.genres?.includes(genre)).length
}

function formatCount(stats: AchievementStats, format: string) {
  return completedAnime(stats).filter((anime) => anime.format === format).length
}

function longAnimeCount(stats: AchievementStats, minEpisodes: number) {
  return completedAnime(stats).filter((anime) => (anime.episodes || 0) >= minEpisodes).length
}

function averageRating(stats: AchievementStats) {
  const list = rated(stats)
  if (list.length === 0) return 0
  return Math.round(list.reduce((sum, item) => sum + (item.rating || 0), 0) / list.length)
}

function profileFields(stats: AchievementStats) {
  const profile = stats.profile
  if (!profile) return 0
  return [
    profile.avatar_url,
    profile.bio,
    profile.country,
    profile.banner_url,
    profile.background_url,
    profile.favorite_anime_id,
  ].filter(Boolean).length
}

function accountAgeDays(stats: AchievementStats) {
  const createdAt = stats.profile?.created_at
  if (!createdAt) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000))
}

const make = (
  id: string,
  title: string,
  description: string,
  category: AchievementCategory,
  tier: AchievementTier,
  target: number,
  getProgress: Achievement['getProgress']
): Achievement => ({ id, title, description, category, tier, target, getProgress })

export const ACHIEVEMENTS: Achievement[] = [
  make('registered', 'Добро пожаловать', 'Зарегистрируй профиль на AnimeTracker.', 'profile', 'bronze', 1, (s) => s.profile ? 1 : 0),
  make('profile_avatar', 'Лицо профиля', 'Поставь аватар.', 'profile', 'bronze', 1, (s) => s.profile?.avatar_url ? 1 : 0),
  make('profile_bio', 'Пара слов о себе', 'Заполни описание профиля.', 'profile', 'bronze', 1, (s) => s.profile?.bio ? 1 : 0),
  make('profile_country', 'На карте', 'Укажи страну в профиле.', 'profile', 'bronze', 1, (s) => s.profile?.country ? 1 : 0),
  make('profile_banner', 'Большая обложка', 'Поставь баннер профиля.', 'profile', 'silver', 1, (s) => s.profile?.banner_url ? 1 : 0),
  make('profile_background', 'Свой вайб', 'Поставь фон профиля.', 'profile', 'silver', 1, (s) => s.profile?.background_url ? 1 : 0),
  make('profile_favorite', 'Любимый тайтл', 'Выбери любимое аниме.', 'profile', 'silver', 1, (s) => s.profile?.favorite_anime_id ? 1 : 0),
  make('profile_complete', 'Профиль как в Steam', 'Заполни 6 важных элементов профиля.', 'profile', 'gold', 6, profileFields),
  make('account_week', 'Неделя на сайте', 'Профилю исполнилась неделя.', 'profile', 'bronze', 7, accountAgeDays),

  make('collection_1', 'Первый тайтл', 'Добавь первый тайтл в коллекцию.', 'collection', 'bronze', 1, collectionCount),
  make('collection_5', 'Полка началась', 'Добавь 5 тайтлов в коллекцию.', 'collection', 'bronze', 5, collectionCount),
  make('collection_10', 'Десятка', 'Добавь 10 тайтлов в коллекцию.', 'collection', 'bronze', 10, collectionCount),
  make('collection_25', 'Коллекционер', 'Добавь 25 тайтлов в коллекцию.', 'collection', 'silver', 25, collectionCount),
  make('collection_50', 'Большая медиатека', 'Добавь 50 тайтлов в коллекцию.', 'collection', 'silver', 50, collectionCount),
  make('collection_100', 'Архивариус', 'Добавь 100 тайтлов в коллекцию.', 'collection', 'gold', 100, collectionCount),
  make('completed_1', 'Первый просмотренный', 'Отметь 1 тайтл как просмотренный.', 'collection', 'bronze', 1, (s) => completed(s).length),
  make('completed_10', 'Уверенный старт', 'Отметь 10 тайтлов как просмотренные.', 'collection', 'bronze', 10, (s) => completed(s).length),
  make('completed_25', 'Смотритель сезона', 'Отметь 25 тайтлов как просмотренные.', 'collection', 'silver', 25, (s) => completed(s).length),
  make('completed_50', 'Опытный зритель', 'Отметь 50 тайтлов как просмотренные.', 'collection', 'gold', 50, (s) => completed(s).length),
  make('completed_100', 'Ветеран просмотра', 'Отметь 100 тайтлов как просмотренные.', 'collection', 'platinum', 100, (s) => completed(s).length),
  make('watching_5', 'Онгоинг-режим', 'Держи 5 тайтлов в статусе "Смотрю".', 'collection', 'bronze', 5, (s) => byStatus(s, 'watching').length),
  make('planned_10', 'Планов громадье', 'Добавь 10 тайтлов в планы.', 'collection', 'bronze', 10, (s) => byStatus(s, 'plan_to_watch').length),
  make('dropped_5', 'Без сожалений', 'Отложи 5 тайтлов в брошенное.', 'collection', 'bronze', 5, (s) => byStatus(s, 'dropped').length),
  make('movies_10', 'Киноман', 'Отметь просмотренными 10 полнометражных аниме.', 'collection', 'silver', 10, (s) => formatCount(s, 'MOVIE')),
  make('long_3', 'Долгая дорога', 'Посмотри 3 тайтла на 50+ эпизодов.', 'collection', 'silver', 3, (s) => longAnimeCount(s, 50)),
  make('very_long_3', 'Марафонец', 'Посмотри 3 тайтла на 100+ эпизодов.', 'collection', 'gold', 3, (s) => longAnimeCount(s, 100)),

  make('romance_5', 'Романтичное настроение', 'Посмотри 5 романтических тайтлов.', 'genres', 'bronze', 5, (s) => genreCount(s, 'Romance')),
  make('romance_30', 'Король романтики', 'Посмотри 30 романтических тайтлов.', 'genres', 'gold', 30, (s) => genreCount(s, 'Romance')),
  make('action_10', 'Адреналин', 'Посмотри 10 экшен-тайтлов.', 'genres', 'bronze', 10, (s) => genreCount(s, 'Action')),
  make('action_40', 'Мастер экшена', 'Посмотри 40 экшен-тайтлов.', 'genres', 'gold', 40, (s) => genreCount(s, 'Action')),
  make('comedy_10', 'Смехотерапия', 'Посмотри 10 комедий.', 'genres', 'bronze', 10, (s) => genreCount(s, 'Comedy')),
  make('comedy_30', 'Комедийный эксперт', 'Посмотри 30 комедий.', 'genres', 'gold', 30, (s) => genreCount(s, 'Comedy')),
  make('drama_10', 'Драма в сердце', 'Посмотри 10 драм.', 'genres', 'bronze', 10, (s) => genreCount(s, 'Drama')),
  make('drama_30', 'Слёзы наготове', 'Посмотри 30 драм.', 'genres', 'gold', 30, (s) => genreCount(s, 'Drama')),
  make('fantasy_10', 'Врата в другой мир', 'Посмотри 10 фэнтези.', 'genres', 'bronze', 10, (s) => genreCount(s, 'Fantasy')),
  make('fantasy_30', 'Архимаг фэнтези', 'Посмотри 30 фэнтези.', 'genres', 'gold', 30, (s) => genreCount(s, 'Fantasy')),
  make('sci_fi_10', 'За гранью будущего', 'Посмотри 10 sci-fi тайтлов.', 'genres', 'bronze', 10, (s) => genreCount(s, 'Sci-Fi')),
  make('sci_fi_25', 'Киберразум', 'Посмотри 25 sci-fi тайтлов.', 'genres', 'gold', 25, (s) => genreCount(s, 'Sci-Fi')),
  make('slice_10', 'Повседневность', 'Посмотри 10 slice of life тайтлов.', 'genres', 'bronze', 10, (s) => genreCount(s, 'Slice of Life')),
  make('slice_25', 'Тёплый плед', 'Посмотри 25 slice of life тайтлов.', 'genres', 'gold', 25, (s) => genreCount(s, 'Slice of Life')),
  make('mystery_10', 'Следователь', 'Посмотри 10 мистических тайтлов.', 'genres', 'bronze', 10, (s) => genreCount(s, 'Mystery')),
  make('thriller_10', 'На нервах', 'Посмотри 10 триллеров.', 'genres', 'silver', 10, (s) => genreCount(s, 'Thriller')),
  make('horror_5', 'Ночная смена', 'Посмотри 5 хорроров.', 'genres', 'bronze', 5, (s) => genreCount(s, 'Horror')),
  make('sports_10', 'Спортивный азарт', 'Посмотри 10 спортивных тайтлов.', 'genres', 'silver', 10, (s) => genreCount(s, 'Sports')),
  make('music_5', 'На одной волне', 'Посмотри 5 музыкальных тайтлов.', 'genres', 'bronze', 5, (s) => genreCount(s, 'Music')),
  make('supernatural_10', 'Охотник за странным', 'Посмотри 10 supernatural тайтлов.', 'genres', 'silver', 10, (s) => genreCount(s, 'Supernatural')),

  make('rated_1', 'Первая оценка', 'Поставь оценку одному тайтлу.', 'ratings', 'bronze', 1, (s) => rated(s).length),
  make('rated_10', 'Критик-новичок', 'Оцени 10 тайтлов.', 'ratings', 'bronze', 10, (s) => rated(s).length),
  make('rated_25', 'Критик', 'Оцени 25 тайтлов.', 'ratings', 'silver', 25, (s) => rated(s).length),
  make('rated_50', 'Строгий судья', 'Оцени 50 тайтлов.', 'ratings', 'gold', 50, (s) => rated(s).length),
  make('rated_100', 'Метр оценок', 'Оцени 100 тайтлов.', 'ratings', 'platinum', 100, (s) => rated(s).length),
  make('high_rating_5', 'Щедрая рука', 'Поставь 5 оценок 90+.', 'ratings', 'silver', 5, (s) => rated(s).filter((i) => (i.rating || 0) >= 90).length),
  make('perfect_rating_3', 'Идеальный вкус', 'Поставь 3 оценки 100/100.', 'ratings', 'gold', 3, (s) => rated(s).filter((i) => i.rating === 100).length),
  make('low_rating_5', 'Без розовых очков', 'Поставь 5 оценок 40 или ниже.', 'ratings', 'silver', 5, (s) => rated(s).filter((i) => (i.rating || 0) <= 40).length),
  make('review_1', 'Первый отзыв', 'Напиши отзыв к одному тайтлу.', 'ratings', 'bronze', 1, (s) => reviewed(s).length),
  make('review_10', 'Рецензент', 'Напиши 10 отзывов.', 'ratings', 'silver', 10, (s) => reviewed(s).length),
  make('review_25', 'Голос коллекции', 'Напиши 25 отзывов.', 'ratings', 'gold', 25, (s) => reviewed(s).length),

  make('playlist_1', 'Своя подборка', 'Создай первый плейлист.', 'social', 'bronze', 1, (s) => s.playlistsCount),
  make('wall_comment_1', 'На стене отметились', 'Получи первый комментарий в профиль.', 'social', 'bronze', 1, (s) => s.commentsCount),
  make('sent_comment_1', 'Оставил след', 'Напиши комментарий в чей-то профиль.', 'social', 'bronze', 1, (s) => s.sentCommentsCount),
  make('sent_comment_10', 'Комментатор', 'Напиши 10 комментариев в профили.', 'social', 'silver', 10, (s) => s.sentCommentsCount),
  make('friend_1', 'Первый друг', 'Добавь первого друга.', 'social', 'bronze', 1, (s) => s.friendsCount),
  make('friend_5', 'Компания', 'Добавь 5 друзей.', 'social', 'silver', 5, (s) => s.friendsCount),
  make('message_1', 'Первое сообщение', 'Напиши первое сообщение другу.', 'social', 'bronze', 1, (s) => s.sentMessagesCount),
  make('message_25', 'На связи', 'Отправь 25 сообщений.', 'social', 'silver', 25, (s) => s.sentMessagesCount),
  make('inbox_10', 'Тебе пишут', 'Получи 10 сообщений.', 'social', 'silver', 10, (s) => s.receivedMessagesCount),
  make('social_allrounder', 'Социальный профиль', 'Собери друзей, сообщения, комментарии и плейлист.', 'social', 'gold', 4, (s) => [
    s.friendsCount > 0,
    s.sentMessagesCount > 0,
    s.sentCommentsCount > 0,
    s.playlistsCount > 0,
  ].filter(Boolean).length),
]

export function calculateAchievements(stats: AchievementStats): AchievementProgress[] {
  return ACHIEVEMENTS.map((achievement) => {
    const progress = Math.max(0, achievement.getProgress(stats))
    const percent = achievement.target > 0
      ? Math.min(100, Math.round((Math.min(progress, achievement.target) / achievement.target) * 100))
      : 0
    return {
      ...achievement,
      progress,
      unlocked: progress >= achievement.target,
      percent,
    }
  })
}
