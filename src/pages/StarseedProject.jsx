import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import './ProjectPage.css';

export default function StarseedProject() {
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
                    <span className="tagline">Creative Studio</span>
                    <h1>Starseed Labs</h1>
                </div>
            </motion.div>

            <div className="project-page-body">
                <motion.div
                    className="project-hero-image"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop)' }}
                >
                </motion.div>

                <motion.div
                    className="project-details"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="main-col">
                        <h2>Extraordinary Interactive Experiences</h2>
                        <p>
                            Starseed Labs is a powerhouse studio where art meets cutting-edge technology.
                            We collaborate with visionary brands and top-tier creators to build
                            interactive 3D environments, motion graphics, and live broadcasting assets
                            that push the boundaries of what's possible.
                        </p>
                        <h3>What We Do</h3>
                        <ul>
                            <li><strong>Premium Overlay Design:</strong> Crafting high-end visual packages for top streamers.</li>
                            <li><strong>Interactive 3D Environments:</strong> Using WebGL to create immersive brand experiences in the browser.</li>
                            <li><strong>R&amp;D for the Future:</strong> Experimenting with GenAI tools to pioneer new aesthetic paradigms.</li>
                        </ul>
                    </div>
                    <div className="sidebar-col glass-panel">
                        <h3>Role</h3>
                        <p>Director & Owner</p>

                        <h3>Expertise</h3>
                        <div className="tags">
                            <span className="tag">Creative Direction</span>
                            <span className="tag">3D Motion</span>
                            <span className="tag">WebGL</span>
                            <span className="tag">Unreal Engine</span>
                        </div>

                        <div className="sidebar-links">
                            <a href="https://starseed.llc" target="_blank" rel="noreferrer" className="btn-primary">
                                <ExternalLink size={16} /> Visit Studio
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
