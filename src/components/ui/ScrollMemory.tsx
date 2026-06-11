'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

const STORAGE_PREFIX = 'anime-scroll:'

function getScrollKey(pathname: string, search: string): string {
  return `${STORAGE_PREFIX}${pathname}${search ? `?${search}` : ''}`
}

export function ScrollMemory() {
  const pathname = usePathname()
  const [search, setSearch] = useState('')
  const restoredKeyRef = useRef('')
  const key = useMemo(() => getScrollKey(pathname, search), [pathname, search])

  useEffect(() => {
    setSearch(window.location.search.replace(/^\?/, ''))
  }, [pathname])

  useEffect(() => {
    if (!key || restoredKeyRef.current === key) return
    restoredKeyRef.current = key

    const raw = window.sessionStorage.getItem(key)
    if (!raw) return

    const y = Number(raw)
    if (!Number.isFinite(y) || y <= 0) return

    const restore = () => window.scrollTo({ top: y, behavior: 'auto' })
    const first = window.setTimeout(restore, 0)
    const second = window.setTimeout(restore, 180)

    return () => {
      window.clearTimeout(first)
      window.clearTimeout(second)
    }
  }, [key])

  useEffect(() => {
    let frame = 0

    const save = () => {
      window.sessionStorage.setItem(key, String(Math.max(0, Math.round(window.scrollY))))
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        save()
      })
    }

    const onPageHide = () => save()
    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest('a[href]')
      if (!anchor) return
      const href = anchor.getAttribute('href') || ''
      if (href.startsWith('/') || href.startsWith(window.location.origin)) save()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', onPageHide)
    document.addEventListener('click', onClick, true)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      save()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', onPageHide)
      document.removeEventListener('click', onClick, true)
    }
  }, [key])

  return null
}
