import { Link } from 'react-router-dom'
import { sections } from '../data/courseData'

const sectionColors = [
  { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
  { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6' },
  { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
  { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
  { bg: 'rgba(6,182,212,0.12)', color: '#06b6d4' },
  { bg: 'rgba(236,72,153,0.12)', color: '#ec4899' },
]

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <div style={{marginBottom: 16}}>
            <span className="badge badge-blue">12-Week Self-Taught Curriculum</span>
          </div>
          <h1>
            From the <span style={{background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Transistor</span> to the{' '}
            <span style={{background: 'linear-gradient(135deg, #10b981, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Web Browser</span>
          </h1>
          <p className="subtitle">
            Build a complete computer system from scratch &mdash; custom CPU, operating system, compiler, network stack, and web browser. Learn every layer of the modern computing stack from first principles.
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="number">7</div>
              <div className="label">Sections</div>
            </div>
            <div className="hero-stat">
              <div className="number">42</div>
              <div className="label">Lessons</div>
            </div>
            <div className="hero-stat">
              <div className="number">12</div>
              <div className="label">Weeks</div>
            </div>
            <div className="hero-stat">
              <div className="number">100%</div>
              <div className="label">From Scratch</div>
            </div>
          </div>
        </div>
      </section>

      <section style={{maxWidth: 900, margin: '0 auto', padding: '0 24px 40px'}}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          padding: 32,
        }}>
          <h2 style={{fontSize: '1.3rem', marginBottom: 16}}>What You Will Build</h2>
          <p style={{color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.95rem'}}>
            This course takes you on an extraordinary journey. Starting from how transistors work, you will build every layer of a modern computer system yourself:
          </p>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12}}>
            {[
              ['Digital Logic', 'Gates, flip-flops, and combinational circuits from LUTs'],
              ['Custom CPU', 'A full ARM7-like processor in Verilog'],
              ['Assembler', 'ARM assembly to machine code translator in Python'],
              ['C Compiler', 'A working C compiler targeting your CPU'],
              ['Linker', 'Object file linker with symbol resolution'],
              ['Operating System', 'Unix-like kernel with processes, files, and memory management'],
              ['Network Stack', 'TCP/IP from raw Ethernet frames'],
              ['Web Browser', 'Text-based browser that fetches real web pages'],
            ].map(([title, desc], i) => (
              <div key={i} style={{
                padding: 16, borderRadius: 10,
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
              }}>
                <div style={{fontWeight: 600, fontSize: '0.9rem', marginBottom: 4}}>{title}</div>
                <div style={{fontSize: '0.78rem', color: 'var(--text-muted)'}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sections-grid">
        {sections.map((section, i) => (
          <Link to={`/section/${section.id}`} key={section.id} style={{textDecoration: 'none', color: 'inherit'}}>
            <div className="section-card">
              <div className="card-header">
                <div className="card-number" style={{
                  background: sectionColors[i % sectionColors.length].bg,
                  color: sectionColors[i % sectionColors.length].color,
                }}>
                  {section.id}
                </div>
                <div>
                  <div className="card-title">{section.title}</div>
                  <div className="card-subtitle">{section.subtitle} &middot; {section.duration}</div>
                </div>
              </div>
              <div className="card-desc">{section.description}</div>
              <div className="card-topics">
                {section.topics.map((t, j) => (
                  <span className="topic-tag" key={j}>{t}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </section>

      <section style={{maxWidth: 900, margin: '0 auto', padding: '0 24px 60px'}}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          padding: 32,
        }}>
          <h2 style={{fontSize: '1.3rem', marginBottom: 16}}>Prerequisites</h2>
          <ul style={{paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.95rem'}}>
            <li style={{marginBottom: 8}}>Basic programming experience (any language)</li>
            <li style={{marginBottom: 8}}>Comfort with the command line / terminal</li>
            <li style={{marginBottom: 8}}>A computer running Linux or macOS (or WSL on Windows)</li>
            <li style={{marginBottom: 8}}>Curiosity and persistence &mdash; this is a challenging but deeply rewarding journey</li>
          </ul>
          <h2 style={{fontSize: '1.3rem', margin: '24px 0 16px'}}>Tools You Will Use</h2>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
            {['Verilator', 'Verilog', 'Python', 'Haskell', 'C', 'ARM Assembly', 'KiCad', 'Git', 'Make'].map(t => (
              <span key={t} style={{
                padding: '6px 14px', borderRadius: 8,
                background: 'rgba(59,130,246,0.1)',
                color: 'var(--accent-blue)',
                fontSize: '0.85rem', fontWeight: 500,
              }}>{t}</span>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
