import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Patcher from './pages/Patcher';
import BeamyProject from './pages/BeamyProject';
import StarseedProject from './pages/StarseedProject';

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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
