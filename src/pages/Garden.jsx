import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Leaf, Coffee, Code2 } from 'lucide-react';
import './Garden.css';

const notes = [
    {
        id: 1,
        title: "AI Audio Generation & The Web",
        stage: 'Evergreen', // Seedling, Budding, Evergreen
        date: 'February 2026',
        excerpt: "Exploring the bleeding edge of WebAudio combined with real-time LLM streams for interactive music loops.",
        icon: <Code2 size={24} color="#0ea5e9" />
    },
    {
        id: 2,
        title: "Worldschooling: The Nomadic Tech Life",
        stage: 'Budding',
        date: 'January 2026',
        excerpt: "How we manage 3 boys, an Alps excursion, remote startups, and staying creatively inspired.",
        icon: <Coffee size={24} color="#f472b6" />
    },
    {
        id: 3,
        title: "Node-Based UI for React",
        stage: 'Seedling',
        date: 'December 2025',
        excerpt: "Thoughts on implementing high-performance node editors natively on the web for BEAMY.",
        icon: <Leaf size={24} color="#22c55e" />
    }
];

const stageColors = {
    Seedling: '#22c55e',
    Budding: '#f472b6',
    Evergreen: '#0ea5e9'
};

export default function Garden() {
    return (
        <div className="garden-container">
            <motion.div
                className="garden-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Link to="/" className="back-link glass-panel">
                    <ArrowLeft size={18} /> Back to Hub
                </Link>
                <h1>The Sandbox Notes</h1>
                <p>A digital garden of half-baked ideas, technical deep-dives, and life lessons.</p>
            </motion.div>

            <div className="garden-grid">
                {notes.map((note, idx) => (
                    <motion.div
                        key={note.id}
                        className="garden-card glass-panel"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <div className="card-top">
                            {note.icon}
                            <div className="tag" style={{ borderColor: stageColors[note.stage], color: stageColors[note.stage] }}>
                                {note.stage}
                            </div>
                        </div>
                        <h2>{note.title}</h2>
                        <p className="date">{note.date}</p>
                        <p className="excerpt">{note.excerpt}</p>
                        <div className="read-more">Read Notes <ArrowLeft style={{ transform: 'rotate(180deg)' }} size={16} /></div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
