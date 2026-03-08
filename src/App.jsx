import { Routes, Route, Link, useLocation } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import SectionPage from './pages/SectionPage'
import LessonPage from './pages/LessonPage'
import { sections } from './data/courseData'

function App() {
  const location = useLocation()

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand">
            <span className="icon">&#9889;</span>
            <span>Transistor to Browser</span>
          </Link>
          <div className="navbar-links">
            {sections.slice(0, 7).map(s => (
              <Link
                key={s.id}
                to={`/section/${s.id}`}
                className={location.pathname.includes(`/section/${s.id}`) ? 'active' : ''}
              >
                S{s.id}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/section/:sectionId" element={<SectionPage />} />
          <Route path="/section/:sectionId/lesson/:lessonId" element={<LessonPage />} />
        </Routes>
      </div>
      <footer className="footer">
        <p>From the Transistor to the Web Browser &mdash; A complete self-taught course in computer engineering</p>
        <p style={{marginTop: 8}}>
          Inspired by <a href="https://github.com/geohot/fromthetransistor" target="_blank" rel="noopener noreferrer">geohot/fromthetransistor</a>
        </p>
      </footer>
    </div>
  )
}

export default App
