import React from 'react';
import { Link } from 'react-router-dom';
import './UniHome.css';

export default function UniHome() {
  return (
    <div className="uni-layout">
      <aside className="sidebar">
        <h2 className="sidebar-title">UniVise</h2>
        <nav className="sidebar-nav">
          <Link to="/uni" className="nav-link">Dashboard</Link>
          <Link to="/uni/your-program" className="nav-link">Your Program</Link>
          <Link to="/uni/explore-pathways" className="nav-link">Explore Pathways</Link>
        </nav>
      </aside>

      <main className="main-content">
        <h1>Welcome to UniVise!</h1>
        <p>Select a section from the left to begin exploring your academic journey.</p>

        <div className="tile-grid">
          <div className="tile">
            <h3>Your Program</h3>
            <p>Upload your transcript to view tailored program insights.</p>
          </div>
          <div className="tile">
            <h3>Courses & Majors</h3>
            <p>See how your courses align with UNSW majors and options.</p>
          </div>
          <div className="tile">
            <h3>Careers</h3>
            <p>Explore career paths that match your academic background.</p>
          </div>
          <div className="tile">
            <h3>Switching Majors</h3>
            <p>Compare majors and see how switching impacts your career options.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
