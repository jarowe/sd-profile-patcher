import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Patcher from './pages/Patcher';
import BeamyProject from './pages/BeamyProject';
import React, { Suspense } from 'react';
import StarseedProject from './pages/StarseedProject';
const UniversePage = React.lazy(() => import('./pages/UniversePage'));
import GameOverlay from './components/GameOverlay';
import Garden from './pages/Garden';
import Now from './pages/Now';

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tools/sd-profile-patcher" element={<Patcher />} />
            <Route path="/projects/beamy" element={<BeamyProject />} />
            <Route path="/projects/starseed" element={<StarseedProject />} />
            <Route path="/universe" element={
              <Suspense fallback={<div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>Loading Universe...</div>}>
                <UniversePage />
              </Suspense>
            } />
            <Route path="/garden" element={<Garden />} />
            <Route path="/now" element={<Now />} />
          </Routes>
          <GameOverlay />
        </main>
      </div>
    </Router>
  );
}

export default App;
