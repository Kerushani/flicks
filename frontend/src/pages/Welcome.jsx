import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import '../style/Welcome.css';

function Welcome() {
  useEffect(() => {
    // Create stars dynamically
    const starsContainer = document.querySelector('.stars');
    for (let i = 0; i < 50; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.width = Math.random() * 3 + 'px';
      star.style.height = star.style.width;
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 2 + 's';
      starsContainer.appendChild(star);
    }
  }, []);

  return (
    <div className="welcome-screen">
      <div className="stars"></div>
      <div className="planet planet-1"></div>
      <div className="planet planet-2"></div>
      <div className="planet planet-3"></div>
      <div className="planet planet-4"></div>
      <div className="planet planet-5"></div>
      <div className="planet planet-6"></div>
      
      <div className="welcome-content">
        <h1 className="welcome-title">Flicks</h1>
        <p className="welcome-subtitle">Your cinematic universe</p>

      </div>
    </div>
  );
}

export default Welcome;

  