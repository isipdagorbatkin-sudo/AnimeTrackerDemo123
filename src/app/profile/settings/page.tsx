'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { searchAnime, getAnimeById, getFullImageUrl, ShikimoriAnime } from '@/lib/shikimori/client'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { User, Camera, Save, Loader2, Sparkles, MapPin, Quote, Image, Heart, Search, X, Globe, Film, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const accentOptions = [
  { name: 'Фиолетовый', value: '#a855f7' },
  { name: 'Циан', value: '#22d3ee' },
  { name: 'Розовый', value: '#ec4899' },
  { name: 'Зеленый', value: '#22c55e' },
  { name: 'Янтарный', value: '#f59e0b' },
]

export default function ProfileSettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [country, setCountry] = useState('')
  const [bio, setBio] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [backgroundUrl, setBackgroundUrl] = useState('')
  const [favoriteAnimeId, setFavoriteAnimeId] = useState<number | null>(null)
  const [favoriteAnime, setFavoriteAnime] = useState<ShikimoriAnime | null>(null)
  const [profileTitle, setProfileTitle] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [accentColor, setAccentColor] = useState(accentOptions[0].value)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ShikimoriAnime[]>([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    loadProfile()
  }, [mounted])

  useEffect(() => {
    if (!searchQuery.trim() || !showSearch) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await searchAnime(searchQuery, 1, 10)
        setSearchResults(results)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, showSearch])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Профиль не найден')

      setProfile(data)
      setUsername(data.username)
      setAvatarUrl(data.avatar_url || '')
      setCountry(data.country || '')
      setBio(data.bio || '')
      setBannerUrl(data.banner_url || '')
      setBackgroundUrl(data.background_url || '')
      setFavoriteAnimeId(data.favorite_anime_id)
      setProfileTitle(data.profile_title || '')
      setStatusMessage(data.status_message || '')
      setAccentColor(data.accent_color || accentOptions[0].value)

      if (data.favorite_anime_id) {
        getAnimeById(data.favorite_anime_id).then(setFavoriteAnime)
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке профиля')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Вы не авторизованы')

      const { error } = await supabase
        .from('profiles')
        .update({
          username: username.trim(),
          avatar_url: avatarUrl.trim() || null,
          country: country.trim() || null,
          bio: bio.trim() || null,
          banner_url: bannerUrl.trim() || null,
          background_url: backgroundUrl.trim() || null,
          favorite_anime_id: favoriteAnimeId,
          profile_title: profileTitle.trim() || null,
          status_message: statusMessage.trim() || null,
          accent_color: accentColor,
        })
        .eq('id', user.id)

      if (error) throw error

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }

  const handleSelectFavorite = (anime: ShikimoriAnime) => {
    setFavoriteAnimeId(anime.id)
    setFavoriteAnime(anime)
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleRemoveFavorite = () => {
    setFavoriteAnimeId(null)
    setFavoriteAnime(null)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-12 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 animate-gradient-x" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-20" />
        <div className="container mx-auto text-center relative z-10">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <Sparkles className="h-5 w-5 sm:h-8 sm:w-8 text-primary animate-pulse" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Настройки профиля
            </h1>
            <Sparkles className="h-5 w-5 sm:h-8 sm:w-8 text-primary animate-pulse" />
          </div>
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Управляйте своим профилем
          </p>
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="container mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Витрина профиля</CardTitle>
              <CardDescription>Настройте профиль так, чтобы он выглядел как ваша личная аниме-страница.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm">
                    Профиль успешно обновлён!
                  </div>
                )}

                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="text-3xl">{getInitials(username)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Аватар</p>
                    <Button type="button" variant="outline" size="sm" disabled>
                      <Camera className="h-4 w-4 mr-2" />
                      Загрузить фото
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Функция загрузки будет добавлена позже
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatarUrl">URL аватара</Label>
                  <Input
                    id="avatarUrl"
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    disabled={saving}
                    className="bg-input border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Имя пользователя</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="animefan2024"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={saving}
                    required
                    minLength={3}
                    maxLength={30}
                    className="bg-input border"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profileTitle">Титул профиля</Label>
                    <Input
                      id="profileTitle"
                      type="text"
                      placeholder="Охотник за онгоингами"
                      value={profileTitle}
                      onChange={(e) => setProfileTitle(e.target.value)}
                      disabled={saving}
                      maxLength={40}
                      className="bg-input border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="statusMessage">Статус</Label>
                    <Input
                      id="statusMessage"
                      type="text"
                      placeholder="Сейчас пересматриваю классику"
                      value={statusMessage}
                      onChange={(e) => setStatusMessage(e.target.value)}
                      disabled={saving}
                      maxLength={80}
                      className="bg-input border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Страна
                  </Label>
                  <Input
                    id="country"
                    type="text"
                    placeholder="Россия"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    disabled={saving}
                    maxLength={100}
                    className="bg-input border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">
                    <Quote className="h-4 w-4 inline mr-1" />
                    О себе
                  </Label>
                  <Textarea
                    id="bio"
                    placeholder="Расскажите немного о себе..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={saving}
                    maxLength={500}
                    className="bg-input border min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
                </div>

                <div className="space-y-3">
                  <Label>Акцент профиля</Label>
                  <div className="flex flex-wrap gap-2">
                    {accentOptions.map((accent) => (
                      <button
                        key={accent.value}
                        type="button"
                        onClick={() => setAccentColor(accent.value)}
                        className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs transition-all ${
                          accentColor === accent.value
                            ? 'border-white/40 bg-white/10 text-foreground'
                            : 'border-border/60 bg-input text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="h-4 w-4 rounded-full" style={{ backgroundColor: accent.value }} />
                        {accent.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bannerUrl">
                    <Image className="h-4 w-4 inline mr-1" />
                    URL баннера
                  </Label>
                  <Input
                    id="bannerUrl"
                    type="url"
                    placeholder="https://example.com/banner.jpg"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    disabled={saving}
                    className="bg-input border"
                  />
                  {bannerUrl && (
                    <div className="relative h-24 rounded-xl overflow-hidden mt-2">
                      <img src={getProxiedImageUrl(bannerUrl)} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backgroundUrl">
                    <Globe className="h-4 w-4 inline mr-1" />
                    URL фона страницы
                  </Label>
                  <Input
                    id="backgroundUrl"
                    type="url"
                    placeholder="https://example.com/background.jpg"
                    value={backgroundUrl}
                    onChange={(e) => setBackgroundUrl(e.target.value)}
                    disabled={saving}
                    className="bg-input border"
                  />
                  {backgroundUrl && (
                    <div className="relative h-16 rounded-xl overflow-hidden mt-2">
                      <img src={getProxiedImageUrl(backgroundUrl)} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    <Heart className="h-4 w-4 inline mr-1" />
                    Любимое аниме
                  </Label>
                  {favoriteAnime ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                      {favoriteAnime.image?.original && (
                        <img
                          src={getProxiedImageUrl(getFullImageUrl(favoriteAnime.image.x48 || favoriteAnime.image.preview))}
                          alt=""
                          className="h-12 w-9 rounded object-cover shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{favoriteAnime.russian || favoriteAnime.name}</p>
                        <p className="text-xs text-muted-foreground">{favoriteAnime.score?.toFixed(1)}</p>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleRemoveFavorite}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Не выбрано</p>
                  )}
                  <div className="relative">
                    {showSearch ? (
                      <div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Поиск аниме..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-input border flex-1"
                            autoFocus
                          />
                          <Button type="button" variant="outline" size="icon" onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]) }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {searching && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Поиск...
                          </div>
                        )}
                        {searchResults.length > 0 && (
                          <div className="mt-2 border border-border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                            {searchResults.map((anime) => (
                              <button
                                key={anime.id}
                                type="button"
                                className="flex items-center gap-3 w-full p-3 hover:bg-muted/50 transition-colors text-left"
                                onClick={() => handleSelectFavorite(anime)}
                              >
                                {anime.image?.preview ? (
                                  <img src={getProxiedImageUrl(getFullImageUrl(anime.image.x48 || anime.image.preview))} alt="" className="h-10 w-7 rounded object-cover shrink-0" />
                                ) : (
                                  <div className="h-10 w-7 rounded bg-muted flex items-center justify-center shrink-0">
                                    <Film className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{anime.russian || anime.name}</p>
                                  <p className="text-xs text-muted-foreground">{anime.score?.toFixed(1)}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowSearch(true)}>
                        <Search className="h-4 w-4 mr-2" /> Выбрать аниме
                      </Button>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <Button type="submit" disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Сохранение...' : 'Сохранить изменения'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Опасная зона</CardTitle>
              <CardDescription>Удаление аккаунта</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                После удаления аккаунта все ваши данные будут безвозвратно удалены.
              </p>
              <Button variant="destructive" size="sm" disabled>
                Удалить аккаунт
              </Button>
            </CardContent>
          </Card>
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <Card className="glass overflow-hidden">
              <div
                className="h-28 bg-cover bg-center"
                style={{
                  backgroundImage: bannerUrl ? `linear-gradient(180deg, rgba(7,7,17,0), rgba(7,7,17,0.85)), url(${getProxiedImageUrl(bannerUrl)})` : `linear-gradient(135deg, ${accentColor}55, rgba(34,211,238,0.16))`,
                }}
              />
              <CardContent className="space-y-4 p-5">
                <div className="flex items-end gap-3">
                  <Avatar className="-mt-12 h-20 w-20 ring-4 ring-card">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="text-2xl">{getInitials(username || 'AT')}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 pb-1">
                    <p className="truncate text-lg font-bold">{username || 'animefan'}</p>
                    <p className="truncate text-xs" style={{ color: accentColor }}>
                      {profileTitle || 'Титул профиля'}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Статус</p>
                  <p className="mt-1 text-sm text-foreground">{statusMessage || 'Добавьте статус, который увидят гости профиля.'}</p>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">
                  {bio || 'Здесь будет короткое описание профиля.'}
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </div>
  )
}
