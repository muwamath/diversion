import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Show from './pages/Show'

export function AppRouter() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/show/:slug" element={<Show />} />
      </Routes>
    </BrowserRouter>
  )
}
