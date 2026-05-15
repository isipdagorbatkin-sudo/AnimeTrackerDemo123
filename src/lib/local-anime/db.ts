// Локальная база данных аниме с изображениями из Jikan API
// Используем base64 изображения для надежности

import { getAnimeImage } from './images'
import { JikanAnime } from '@/lib/jikan/types'

const getAnimeGradient = (id: number): string => {
  const gradients = [
    'from-blue-500/20 to-purple-500/20',
    'from-purple-500/20 to-pink-500/20',
    'from-pink-500/20 to-red-500/20',
    'from-red-500/20 to-orange-500/20',
    'from-orange-500/20 to-yellow-500/20',
    'from-yellow-500/20 to-green-500/20',
    'from-green-500/20 to-teal-500/20',
    'from-teal-500/20 to-cyan-500/20',
    'from-cyan-500/20 to-blue-500/20',
    'from-indigo-500/20 to-purple-500/20',
  ]
  return gradients[id % gradients.length]
}

export interface LocalAnime {
  id: number
  title: string
  titleRussian: string
  titleJapanese: string
  description: string
  imageUrl: string
  gradient: string
  genres: string[]
  score: number
  episodes: number
  status: string
  type: string
  year: number
}

export const LOCAL_ANIME_DB: LocalAnime[] = [
  {
    id: 20,
    title: "Naruto",
    titleRussian: "Наруто",
    titleJapanese: "ナルト",
    description: "История о молодом ниндзя Наруто Узумаки, который мечтает стать Хокаге - лидером своей деревни.",
    imageUrl: getAnimeImage(20),
    gradient: getAnimeGradient(1),
    genres: ["Экшен", "Приключения", "Фэнтези"],
    score: 8.3,
    episodes: 220,
    status: "Завершено",
    type: "ТВ",
    year: 2002
  },
  {
    id: 21,
    title: "One Piece",
    titleRussian: "Ван Пис",
    titleJapanese: "ワンピース",
    description: "Приключения пиратов во главе с Монки Д. Луффи, который ищет легендарное сокровище Ван Пис.",
    imageUrl: getAnimeImage(21),
    gradient: getAnimeGradient(2),
    genres: ["Экшен", "Приключения", "Комедия"],
    score: 8.7,
    episodes: 1000,
    status: "Выходит",
    type: "ТВ",
    year: 1999
  },
  {
    id: 16498,
    title: "Attack on Titan",
    titleRussian: "Атака Титанов",
    titleJapanese: "進撃の巨人",
    description: "Человечество живет внутри городов, окруженных огромными стенами, защищающими их от титанов.",
    imageUrl: getAnimeImage(16498),
    gradient: getAnimeGradient(3),
    genres: ["Экшен", "Драма", "Фэнтези"],
    score: 9.0,
    episodes: 87,
    status: "Завершено",
    type: "ТВ",
    year: 2013
  },
  {
    id: 1535,
    title: "Death Note",
    titleRussian: "Тетрадь Смерти",
    titleJapanese: "デスノート",
    description: "Студент Лайт Ягами находит сверхъестественную тетрадь, которая убивает любого, чье имя в ней записано.",
    imageUrl: getAnimeImage(1535),
    gradient: getAnimeGradient(4),
    genres: ["Триллер", "Детектив", "Психология"],
    score: 9.0,
    episodes: 37,
    status: "Завершено",
    type: "ТВ",
    year: 2006
  },
  {
    id: 5114,
    title: "Fullmetal Alchemist: Brotherhood",
    titleRussian: "Стальной Алхимик: Братство",
    titleJapanese: "鋼の錬金術師",
    description: "Братья Эдвард и Альфонс Элрик пытаются вернуть свои тела после неудачной попытки воскресить мать.",
    imageUrl: getAnimeImage(5114),
    gradient: getAnimeGradient(5),
    genres: ["Экшен", "Приключения", "Фэнтези"],
    score: 9.1,
    episodes: 64,
    status: "Завершено",
    type: "ТВ",
    year: 2009
  },
  {
    id: 38000,
    title: "Demon Slayer",
    titleRussian: "Клинок, рассекающий демонов",
    titleJapanese: "鬼滅の刃",
    description: "Танджиро Камадо становится охотником на демонов после того, как его семья была убита, а сестра превращена в демона.",
    imageUrl: getAnimeImage(38000),
    gradient: getAnimeGradient(6),
    genres: ["Экшен", "Фэнтези", "Сёнен"],
    score: 8.7,
    episodes: 44,
    status: "Выходит",
    type: "ТВ",
    year: 2019
  },
  {
    id: 31964,
    title: "My Hero Academia",
    titleRussian: "Моя Геройская Академия",
    titleJapanese: "僕のヒーローアカデミア",
    description: "В мире, где 80% людей обладают суперспособностями, Изуку Мидория мечтает стать героем.",
    imageUrl: getAnimeImage(31964),
    gradient: getAnimeGradient(7),
    genres: ["Экшен", "Комедия", "Сёнен"],
    score: 8.4,
    episodes: 138,
    status: "Выходит",
    type: "ТВ",
    year: 2016
  },
  {
    id: 40748,
    title: "Jujutsu Kaisen",
    titleRussian: "Магическая битва",
    titleJapanese: "呪術廻戦",
    description: "Юджи Итадори проглатывает проклятый палец и становится носителем могущественного проклятия.",
    imageUrl: getAnimeImage(40748),
    gradient: getAnimeGradient(8),
    genres: ["Экшен", "Фэнтези", "Сёнен"],
    score: 8.6,
    episodes: 48,
    status: "Выходит",
    type: "ТВ",
    year: 2020
  },
  {
    id: 50265,
    title: "Spy x Family",
    titleRussian: "Шпион × Семья",
    titleJapanese: "スパイファミリー",
    description: "Шпион создает фальшивую семью для миссии, не зная, что его жена - убийца, а дочь - телепат.",
    imageUrl: getAnimeImage(50265),
    gradient: getAnimeGradient(9),
    genres: ["Комедия", "Экшен", "Семейный"],
    score: 8.6,
    episodes: 37,
    status: "Выходит",
    type: "ТВ",
    year: 2022
  },
  {
    id: 44511,
    title: "Chainsaw Man",
    titleRussian: "Человек-Бензопила",
    titleJapanese: "チェンソーマン",
    description: "Дэнджи, охотник на демонов, сливается с демоном-бензопилой и становится Человеком-Бензопилой.",
    imageUrl: getAnimeImage(44511),
    gradient: getAnimeGradient(10),
    genres: ["Экшен", "Фэнтези", "Хоррор"],
    score: 8.5,
    episodes: 12,
    status: "Завершено",
    type: "ТВ",
    year: 2022
  }
]

export function searchLocalAnime(query: string): LocalAnime[] {
  const lowerQuery = query.toLowerCase()
  return LOCAL_ANIME_DB.filter(anime =>
    anime.title.toLowerCase().includes(lowerQuery) ||
    anime.titleRussian.toLowerCase().includes(lowerQuery) ||
    anime.titleJapanese.toLowerCase().includes(lowerQuery) ||
    anime.description.toLowerCase().includes(lowerQuery)
  )
}

export function getLocalAnimeById(id: number): LocalAnime | null {
  return LOCAL_ANIME_DB.find(anime => anime.id === id) || null
}

export function convertLocalToJikanArray(local: LocalAnime[]): JikanAnime[] {
  return local.map(a => ({
    mal_id: a.id,
    title: a.title,
    title_english: a.title,
    title_japanese: a.titleJapanese,
    images: {
      jpg: { large_image_url: a.imageUrl, image_url: a.imageUrl, small_image_url: a.imageUrl },
      webp: { large_image_url: a.imageUrl, image_url: a.imageUrl, small_image_url: a.imageUrl },
    },
    score: a.score,
    scored_by: null,
    rank: null,
    popularity: null,
    synopsis: a.description,
    background: '',
    season: null,
    year: a.year,
    episodes: a.episodes,
    status: a.status === 'Выходит' ? 'Airing' : 'Finished Airing',
    type: a.type === 'ТВ' ? 'TV' : a.type,
    rating: null,
    airing: a.status === 'Выходит',
    genres: a.genres.map((g, i) => ({ mal_id: i + 10000, name: g, type: 'anime' })),
    explicit_genres: [],
    themes: [],
    demographics: [],
    titles: [{ type: 'Default', title: a.title }],
    url: '',
    trailer: null,
    approved: true,
    source: '',
    duration: '',
    broadcast: null,
    producers: [],
    licensors: [],
    studios: [],
    members: 0,
    favorites: 0,
  }))
}
