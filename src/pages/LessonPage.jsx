import { useParams, Link } from 'react-router-dom'
import { sections } from '../data/courseData'

function VideoEmbed({ id, title }) {
  return (
    <div className="video-container">
      {title && <div className="video-title">{title}</div>}
      <div className="video-embed">
        <iframe
          src={`https://www.youtube.com/embed/${id}`}
          title={title || 'Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  )
}

function renderContent(content) {
  if (!content) return null
  return content.map((block, i) => {
    switch (block.type) {
      case 'text':
        return <div key={i} className="lesson-body" dangerouslySetInnerHTML={{__html: block.html}} />
      case 'heading':
        const Tag = `h${block.level || 2}`
        return <Tag key={i} id={block.anchor} className="lesson-body">{block.text}</Tag>
      case 'code':
        return (
          <div key={i}>
            {block.label && <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4}}>{block.label}</div>}
            <pre><code>{block.code}</code></pre>
          </div>
        )
      case 'diagram':
        return <div key={i} className="diagram">{block.content}</div>
      case 'video':
        return <VideoEmbed key={i} id={block.id} title={block.title} />
      case 'info':
        return (
          <div key={i} className={`info-box ${block.variant || 'info'}`}>
            {block.title && <h4>{block.title}</h4>}
            <div dangerouslySetInnerHTML={{__html: block.html}} />
          </div>
        )
      case 'practice':
        return (
          <div key={i} className="practice-box">
            <h4>{block.title || 'Practice Exercises'}</h4>
            <ol>
              {block.items.map((item, j) => (
                <li key={j} dangerouslySetInnerHTML={{__html: item}} />
              ))}
            </ol>
          </div>
        )
      case 'resources':
        return (
          <div key={i}>
            <h3 className="lesson-body" style={{marginTop: 24, marginBottom: 12}}>Resources</h3>
            <div className="resources-grid">
              {block.links.map((link, j) => (
                <a key={j} href={link.url} target="_blank" rel="noopener noreferrer" className="resource-card">
                  <div className="r-type">{link.type || 'Article'}</div>
                  <div className="r-title">{link.title}</div>
                  {link.desc && <div className="r-desc">{link.desc}</div>}
                </a>
              ))}
            </div>
          </div>
        )
      case 'table':
        return (
          <table key={i}>
            <thead>
              <tr>{block.headers.map((h, j) => <th key={j}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((row, j) => (
                <tr key={j}>{row.map((cell, k) => <td key={k} dangerouslySetInnerHTML={{__html: cell}} />)}</tr>
              ))}
            </tbody>
          </table>
        )
      default:
        return null
    }
  })
}

export default function LessonPage() {
  const { sectionId, lessonId } = useParams()
  const section = sections.find(s => s.id === parseInt(sectionId))
  if (!section) return <div className="lesson-page"><h1>Section not found</h1></div>

  const lesson = section.lessons.find(l => l.id === parseInt(lessonId))
  if (!lesson) return <div className="lesson-page"><h1>Lesson not found</h1></div>

  const lessonIndex = section.lessons.findIndex(l => l.id === parseInt(lessonId))

  // Find prev/next lesson across sections
  let prev = null, next = null
  if (lessonIndex > 0) {
    prev = { sectionId: section.id, lesson: section.lessons[lessonIndex - 1] }
  } else {
    const prevSection = sections.find(s => s.id === section.id - 1)
    if (prevSection && prevSection.lessons.length > 0) {
      prev = { sectionId: prevSection.id, lesson: prevSection.lessons[prevSection.lessons.length - 1] }
    }
  }
  if (lessonIndex < section.lessons.length - 1) {
    next = { sectionId: section.id, lesson: section.lessons[lessonIndex + 1] }
  } else {
    const nextSection = sections.find(s => s.id === section.id + 1)
    if (nextSection && nextSection.lessons.length > 0) {
      next = { sectionId: nextSection.id, lesson: nextSection.lessons[0] }
    }
  }

  return (
    <div className="lesson-page">
      <div className="lesson-breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to={`/section/${section.id}`}>Section {section.id}</Link>
        <span>/</span>
        <span>{lesson.title}</span>
      </div>

      <div className="lesson-header">
        <div className="section-label" style={{color: 'var(--accent-blue)'}}>
          Section {section.id}: {section.title}
        </div>
        <h1>{lesson.title}</h1>
        <div className="lesson-meta">
          <span>{lesson.duration}</span>
          <span>&middot;</span>
          <span>{lesson.subtitle}</span>
        </div>
      </div>

      {renderContent(lesson.content)}

      <div className="lesson-nav">
        {prev ? (
          <Link to={`/section/${prev.sectionId}/lesson/${prev.lesson.id}`}>
            <span className="nav-label">&larr; Previous</span>
            <span className="nav-title">{prev.lesson.title}</span>
          </Link>
        ) : <div />}
        {next ? (
          <Link to={`/section/${next.sectionId}/lesson/${next.lesson.id}`} className="next">
            <span className="nav-label">Next &rarr;</span>
            <span className="nav-title">{next.lesson.title}</span>
          </Link>
        ) : <div />}
      </div>
    </div>
  )
}
