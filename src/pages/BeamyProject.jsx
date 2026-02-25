import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import './ProjectPage.css';

export default function BeamyProject() {
    return (
        <div className="project-page-container">
            <motion.div
                className="project-page-header glass-panel"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Link to="/" className="back-link">
                    <ArrowLeft size={18} /> Back to Portfolio
                </Link>
                <div className="project-meta">
                    <span className="tagline">Next-Gen Creative Tool</span>
                    <h1>BEAMY</h1>
                </div>
            </motion.div>

            <div className="project-page-body">
                <motion.div
                    className="project-hero-image"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop)' }}
                >
                </motion.div>

                <motion.div
                    className="project-details"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="main-col">
                        <h2>Simply Powerful Animation Engine</h2>
                        <p>
                            BEAMY is designed from the ground up to democratize high-end motion graphics.
                            Built on a robust C++ core with a dynamic React frontend, it leverages modern
                            web technologies and a node-based architecture to bring unprecedented power
                            directly to creators.
                        </p>
                        <h3>Key Features</h3>
                        <ul>
                            <li><strong>Node-based Audio Graph:</strong> Connect audio sources to visual parameters dynamically.</li>
                            <li><strong>Real-time Preview:</strong> Instant feedback on complex particle and timeline animations.</li>
                            <li><strong>C++ Core Performance:</strong> Blazing fast rendering and minimal latency.</li>
                            <li><strong>Extensible Plugin System:</strong> Write custom logic for unique interactive experiences.</li>
                        </ul>
                    </div>
                    <div className="sidebar-col glass-panel">
                        <h3>Role</h3>
                        <p>Creator / Lead Engineer</p>

                        <h3>Tech Stack</h3>
                        <div className="tags">
                            <span className="tag">C++</span>
                            <span className="tag">React</span>
                            <span className="tag">WebAudio API</span>
                            <span className="tag">Vite</span>
                        </div>

                        <div className="sidebar-links">
                            <a href="#" className="btn-secondary disabled">
                                <ExternalLink size={16} /> Closed Beta
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
