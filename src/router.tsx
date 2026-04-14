import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom'
import Edit from './pages/Edit'
import Live from './pages/Live'
import { experiments } from './experiments/registry'

function BareSlugRedirect() {
  const { slug } = useParams()
  const { search } = useLocation()
  return <Navigate to={`/${slug}/edit${search}`} replace />
}

function RootRedirect() {
  const defaultSlug = experiments[0]?.meta.slug ?? ''
  const { search } = useLocation()
  return <Navigate to={`/${defaultSlug}/edit${search}`} replace />
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
