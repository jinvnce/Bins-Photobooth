import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import EmailEntryPage from '../pages/EmailEntryPage'
import FramePickPage from '../pages/FramePickPage'
import BoothPage from '../pages/BoothPage'
import EditorPage from '../pages/EditorPage'
import DownloadPage from '../pages/DownloadPage'
import AdminPage from '../pages/AdminPage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EmailEntryPage />} />
        <Route path="/frame-pick" element={<FramePickPage />} />
        <Route path="/booth" element={<BoothPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}