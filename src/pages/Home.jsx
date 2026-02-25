import { motion } from 'framer-motion';
import { ArrowRight, Code, Zap, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import Experience from '../components/Experience';
import Projects from '../components/Projects';
import './Home.css';

export default function Home() {
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { type: 'spring', bounce: 0.4, duration: 0.8 } }
    };

    return (
        <div className="home-container">
            <motion.section
                className="hero"
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                <motion.div variants={itemVariants} className="hero-badge glass-panel">
                    <span className="badge-dot"></span> Senior Manager, Digital Product Innovation @ Elgato
                </motion.div>

                <motion.h1 variants={itemVariants} className="hero-title">
                    Builder, <span className="text-gradient">Dreamer</span>,
                    &amp; Storyteller.
                </motion.h1>

                <motion.p variants={itemVariants} className="hero-subtitle">
                    I'm <strong>Jared Rowe</strong>, a Technologist, Innovator, and AI Evangelist. Turning big ideas into real-world solutions for content creators, gamers, and visionary brands.
                </motion.p>

                <motion.div variants={itemVariants} className="hero-cta">
                    <Link to="/tools/sd-profile-patcher" className="btn-primary">
                        Explore Tools <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                    </Link>
                </motion.div>
            </motion.section>

            <section className="features-grid">
                <div className="feature-card glass-panel">
                    <div className="feature-icon"><Zap size={24} /></div>
                    <h3>Digital Products</h3>
                    <p>Over 15 years guiding teams to create immersive, cutting-edge experiences.</p>
                </div>
                <div className="feature-card glass-panel">
                    <div className="feature-icon"><Code size={24} /></div>
                    <h3>Creator Tools</h3>
                    <p>Bridging ideas from concept to launch with AI-assisted workflows and utilities.</p>
                </div>
                <div className="feature-card glass-panel">
                    <div className="feature-icon"><Lightbulb size={24} /></div>
                    <h3>Starseed Labs</h3>
                    <p>Collaborating with forward-thinking partners to build what's never been seen before.</p>
                </div>
            </section>

            <Experience />
            <Projects />
        </div>
    );
}
