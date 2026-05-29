import './styles/globals.css'
import AppRouter from './routes/AppRouter'
import { SessionProvider } from './store/sessionStore'

export default function App() {
  return (
    <SessionProvider>
      <AppRouter />
    </SessionProvider>
  )
}