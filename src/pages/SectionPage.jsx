import { useParams, Link } from 'react-router-dom'
import { sections } from '../data/courseData'

const sectionColors = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899']

export default function SectionPage() {
  const { sectionId } = useParams()
  const section = sections.find(s => s.id === parseInt(sectionId))

  if (!section) return <div className="lesson-page"><h1>Section not found</h1></div>

  const color = sectionColors[(section.id - 1) % sectionColors.length]

  return (
    <div className="section-page">
      <div className="lesson-breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <span>Section {section.id}</span>
      </div>

      <div className="section-hero">
        <div style={{marginBottom: 12}}>
          <span className="badge" style={{background: `${color}22`, color}}>
            Section {section.id} &middot; {section.duration}
          </span>
        </div>
        <h1>{section.title}</h1>
        <p style={{marginTop: 8}}>{section.subtitle}</p>
        <p style={{marginTop: 16, color: 'var(--text-secondary)', lineHeight: 1.8}}>
          {section.longDescription || section.description}
        </p>
      </div>

      {section.learningGoals && (
        <div style={{
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 12, padding: 24, marginBottom: 32,
        }}>
          <h3 style={{color: 'var(--accent-green)', marginBottom: 12, fontSize: '1rem'}}>Learning Goals</h3>
          <ul style={{paddingLeft: 20}}>
            {section.learningGoals.map((g, i) => (
              <li key={i} style={{marginBottom: 6, color: 'var(--text-secondary)', fontSize: '0.9rem'}}>{g}</li>
            ))}
          </ul>
        </div>
      )}

      <h2 style={{fontSize: '1.3rem', marginBottom: 16}}>Lessons</h2>
      <div className="lessons-list">
        {section.lessons.map((lesson, i) => (
          <Link
            to={`/section/${section.id}/lesson/${lesson.id}`}
            key={lesson.id}
            style={{textDecoration: 'none', color: 'inherit'}}
          >
            <div className="lesson-list-item">
              <div className="lesson-num" style={{background: `${color}18`, color}}>
                {i + 1}
              </div>
              <div className="lesson-info">
                <div className="lesson-title">{lesson.title}</div>
                <div className="lesson-desc">{lesson.subtitle}</div>
              </div>
              <div className="lesson-time">{lesson.duration}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
