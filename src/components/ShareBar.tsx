import { useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function ShareBar({ slug }: { slug: string }) {
  const [searchParams] = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)

  const url = window.location.href

  const copy = useCallback(() => {
    navigator.clipboard.writeText(url)
    if (inputRef.current) {
      inputRef.current.select()
    }
  }, [url])

  const fullscreenUrl = `${window.location.origin}${import.meta.env.BASE_URL}${slug}/live?${searchParams.toString()}`

  return (
    <div className="share-bar">
      <div className="url-row">
        <input ref={inputRef} readOnly value={url} />
        <button onClick={copy}>Copy</button>
      </div>
      <a
        className="fullscreen-btn"
        href={fullscreenUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open fullscreen &#x29C9;
      </a>
    </div>
  )
}
