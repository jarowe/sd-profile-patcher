import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github, Twitter, Linkedin, Wrench } from 'lucide-react';
import './Navbar.css'; // We'll create a dedicated css file

export default function Navbar() {
    const location = useLocation();

    const links = [
        { name: 'Home', path: '/' },
        { name: 'SD Patcher', path: '/tools/sd-profile-patcher' },
    ];

    return (
        <nav className="navbar glass-panel">
            <div className="nav-container">
                <Link to="/" className="nav-brand">
                    <span className="font-display">JAROWE</span>
                    <span className="brand-dot">.</span>
                </Link>

                <div className="nav-links">
                    {links.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                        >
                            {link.name}
                            {location.pathname === link.path && (
                                <motion.div
                                    layoutId="nav-pill"
                                    className="nav-active-bg"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                        </Link>
                    ))}
                </div>

                <div className="nav-socials">
                    <a href="https://x.com/jaredalanrowe" target="_blank" rel="noreferrer" className="social-icon">
                        <Twitter size={18} />
                    </a>
                    <a href="https://www.linkedin.com/in/jaredalanrowe/" target="_blank" rel="noreferrer" className="social-icon">
                        <Linkedin size={18} />
                    </a>
                    <a href="https://starseed.llc/" target="_blank" rel="noreferrer" className="social-icon" title="Starseed Labs">
                        <Wrench size={18} />
                    </a>
                </div>
            </div>
        </nav>
    );
}
