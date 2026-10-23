import { useEffect, useState } from 'react'

function displayRatio(width: number, height: number) {
  const ratio = width / height
  return ratio > 1.2 ? Math.max(1.6, Math.min(ratio, 2)) : Math.max(0.6, ratio)
}

export default function ResponsiveFashionImage({ src, alt }: { src: string; alt: string }) {
  const initial = /\/(asoebi|menswear|studio)\.png$/.test(src)
    ? 1.6
    : /\/custom\.png$/.test(src)
      ? 1
      : 2 / 3
  const [ratio, setRatio] = useState(initial)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    setRatio(initial)
    setFailed(false)
  }, [src, initial])
  return (
    <div className="responsive-fashion-image" style={{ aspectRatio: ratio }}>
      {!failed ? (
        <img
          key={src}
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={(event) => {
            const img = event.currentTarget
            setRatio(displayRatio(img.naturalWidth, img.naturalHeight))
          }}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="fashion-image-unavailable">Image unavailable</span>
      )}
    </div>
  )
}
