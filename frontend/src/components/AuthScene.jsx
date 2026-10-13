import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import dayVideo from '../assets/auth/washitsu-day.mp4'
import dayClosed from '../assets/auth/washitsu-day-closed.webp'
import dayOpen from '../assets/auth/washitsu-day-open.webp'
import night from '../assets/auth/washitsu-night.webp'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Latar halaman Masuk/Daftar: ruang washitsu. Siang = shoji menggeser terbuka sekali lalu
// berhenti di posisi terbuka (video dipotong sampai titik itu). Malam = gambar diam.
export default function AuthScene() {
  const { theme } = useTheme()
  const videoRef = useRef(null)
  const [still, setStill] = useState(prefersReducedMotion)

  useEffect(() => {
    if (theme === 'dark' || still) return
    // Autoplay bisa ditolak browser (mode hemat daya dll.); jatuh ke gambar shoji terbuka.
    videoRef.current?.play().catch(() => setStill(true))
  }, [theme, still])

  let scene
  if (theme === 'dark') {
    scene = <img className="auth-scene-media" src={night} alt="" />
  } else if (still) {
    scene = <img className="auth-scene-media" src={dayOpen} alt="" />
  } else {
    scene = (
      <video
        ref={videoRef}
        className="auth-scene-media"
        src={dayVideo}
        poster={dayClosed}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        onError={() => setStill(true)}
      />
    )
  }

  return (
    <div className="auth-scene" aria-hidden="true">
      {scene}
    </div>
  )
}
