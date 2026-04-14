import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import Edit from './pages/Edit'
import Live from './pages/Live'
import { experiments } from './experiments/registry'

function BareSlugRedirect() {
  const { slug } = useParams()
  return <Navigate to={`/${slug}/edit`} replace />
}

function RootRedirect() {
  const defaultSlug = experiments[0]?.meta.slug ?? ''
  return <Navigate to={`/${defaultSlug}/edit`} replace />
}

export function AppRouter() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/:slug" element={<BareSlugRedirect />} />
        <Route path="/:slug/edit" element={<Edit />} />
        <Route path="/:slug/live" element={<Live />} />
      </Routes>
    </BrowserRouter>
  )
}
