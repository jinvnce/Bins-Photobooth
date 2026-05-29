import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <nav className="navbar">
      <Link to="/booth" className="navbar-logo">
        Vincie 4 Cats
      </Link>

      <div className="navbar-links">
        <Link to="/booth" className="navbar-link">booth</Link>
        <Link to="/gallery" className="navbar-link">gallery</Link>
      </div>

      <div className="navbar-user">
        {user && (
          <>
            <span className="navbar-email">{user.email}</span>
            <button onClick={handleSignOut} className="btn-signout">
              sign out
            </button>
          </>
        )}
      </div>
    </nav>
  )
}