import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Projects.css';

const projects = [
    {
        id: 'beamy',
        title: 'BEAMY',
        tagline: 'Simply Powerful Animation Engine',
        desc: 'A next-generation animation engine designed to democratize high-end motion graphics for creators.',
        tags: ['C++', 'React', 'Audio Graph', 'Animation'],
        link: '/projects/beamy',
        bgImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop', // placeholder
    },
    {
        id: 'starseed',
        title: 'Starseed Labs',
        tagline: 'Extraordinary Interactive Experiences',
        desc: 'A powerhouse studio collaborating with visionary brands to build interactive 3D and motion experiences.',
        tags: ['WebGL', '3D Motion', 'Creative Direction'],
        link: '/projects/starseed',
        bgImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop', // placeholder
    },
    {
        id: 'patcher',
        title: 'Stream Deck Profile Patcher',
        tagline: 'Creator Utility',
        desc: 'A client-side tool to deeply patch Stream Deck hardware IDs, fixing auto-discovery for Wave Link.',
        tags: ['React', 'JSZip', 'Utility'],
        link: '/tools/sd-profile-patcher',
        bgImage: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=800&auto=format&fit=crop', // placeholder
    }
];

export default function Projects() {
    return (
        <section className="projects-section">
            <div className="section-header">
                <h2>Flagship Projects</h2>
                <p className="subtitle">Defining the future of creative tools and interactive media.</p>
            </div>

            <div className="projects-grid">
                {projects.map((proj, index) => (
                    <motion.div
                        key={proj.id}
                        className="project-card"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ delay: index * 0.15, duration: 0.6 }}
                    >
                        <div className="project-bg" style={{ backgroundImage: `url(${proj.bgImage})` }}>
                            <div className="project-overlay"></div>
                        </div>

                        <div className="project-content">
                            <div>
                                <span className="project-tagline">{proj.tagline}</span>
                                <h3 className="project-title">{proj.title}</h3>
                                <p className="project-desc">{proj.desc}</p>

                                <div className="project-tags">
                                    {proj.tags.map(tag => (
                                        <span key={tag} className="tag">{tag}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="project-footer">
                                <Link to={proj.link} className="project-link">
                                    View Project <ArrowUpRight size={18} />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
