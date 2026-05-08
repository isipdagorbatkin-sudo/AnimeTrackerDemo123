import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/database'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Защищаем маршруты, требующие авторизации
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
                      request.nextUrl.pathname.startsWith('/register')
  const isMainRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                      request.nextUrl.pathname.startsWith('/collection') ||
                      request.nextUrl.pathname.startsWith('/search') ||
                      request.nextUrl.pathname.startsWith('/friends') ||
                      request.nextUrl.pathname.startsWith('/chat') ||
                      request.nextUrl.pathname.startsWith('/profile')

  if (isMainRoute && !user) {
    // Перенаправляем на страницу входа, если пользователь не авторизован
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthRoute && user) {
    // Перенаправляем на главную страницу, если пользователь уже авторизован
    const redirectUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
