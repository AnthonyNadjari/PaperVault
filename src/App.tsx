import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Archive from './pages/Archive'
import Photos from './pages/Photos'
import DocumentDetail from './pages/DocumentDetail'
import Scan from './pages/Scan'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Archive />} />
        <Route path="/photos" element={<Photos />} />
        <Route path="/doc/:id" element={<DocumentDetail />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
