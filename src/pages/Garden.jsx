import { Link } from 'react-router-dom';
import { ArrowLeft, Leaf, Coffee, Code2, Zap, X } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { playClickSound, playHoverSound } from '../utils/sounds';
import './Garden.css';

gsap.registerPlugin(ScrollTrigger);

const notes = [
    {
        id: 1,
        title: "AI Audio Generation & The Web",
        stage: 'Evergreen',
        stageLabel: 'Fully cooked',
        date: 'February 2026',
        excerpt: "Exploring the bleeding edge of WebAudio combined with real-time LLM streams for interactive music loops.",
        content: `The WebAudio API is criminally underused. Most devs know it exists for playing sound effects in games, but it's actually a full-blown audio synthesis and processing engine running in the browser.

I've been experimenting with piping LLM-generated MIDI data directly into WebAudio oscillators, creating real-time generative music that responds to user input. Imagine a website where the background music literally evolves based on what you're doing.

The trick is latency. You need to schedule audio events ahead of time using AudioContext.currentTime, not setTimeout. Once you internalize that, you can build surprisingly complex audio pipelines. Combine that with Suno's AI composition and you've got something truly wild.

Next steps: spatial audio using PannerNode to create 3D soundscapes that respond to scroll position. Your portfolio doesn't just look different as you scroll - it SOUNDS different.`,
        icon: <Code2 size={24} color="#0ea5e9" />
    },
    {
        id: 2,
        title: "Worldschooling: The Nomadic Tech Life",
        stage: 'Budding',
        stageLabel: 'Growing nicely',
        date: 'January 2026',
        excerpt: "How we manage 3 boys, an Alps excursion, remote startups, and staying creatively inspired.",
        content: `People ask how we do it. Three boys - Jace, Jax, and Jole - a remote tech career, and a habit of dragging the whole family across continents. Honestly? Controlled chaos.

The Austrian Alps taught us that learning happens when kids are uncomfortable (in a good way). Jace learning about glaciers by standing on one hits different than reading about them in a textbook. Jax negotiating prices at a Greek market in broken English was the best economics lesson he'll ever get.

The tech side is surprisingly doable. Good wifi, time zone discipline, and a partner (Maria) who is basically a logistics genius. The hard part isn't the work - it's being present. Not checking Slack when your kid is showing you a cool rock he found on a mountain.

We're planning Japan next. The boys don't know yet. Keeping it a secret until we're at the airport. That's the fun part.`,
        icon: <Coffee size={24} color="#f472b6" />
    },
    {
        id: 3,
        title: "Node-Based UI for React",
        stage: 'Seedling',
        stageLabel: 'Just planted',
        date: 'December 2025',
        excerpt: "Thoughts on implementing high-performance node editors natively on the web for BEAMY.",
        content: `Every node editor on the web sucks in some specific way. Either it's performant but ugly, or beautiful but laggy at 50+ nodes, or well-architected but impossible to extend.

BEAMY needs to handle hundreds of nodes with real-time connections, live previews, and sub-frame rendering. Canvas-based renderers are fast but lose React's component model. DOM-based approaches scale terribly. What if we hybridize?

The idea: React for the UI shell and node chrome, OffscreenCanvas for the connection lines and grid, and SharedArrayBuffer for the data flow between nodes. Each node's preview renders in its own scope but communicates state through a central bus.

Early tests show we can hit 120fps with 200 nodes. The secret sauce is virtualization - only rendering nodes in the viewport, but keeping their compute graph alive in a Worker. Still very raw. Still breaking constantly. That's the fun part.`,
        icon: <Leaf size={24} color="#22c55e" />
    },
    {
        id: 4,
        title: "Why Personal Sites Should Feel Like Playgrounds",
        stage: 'Budding',
        stageLabel: 'Growing nicely',
        date: 'February 2026',
        excerpt: "Your portfolio doesn't need to be a resume. It should be an experience people don't want to leave.",
        content: `The average recruiter spends 7 seconds on your portfolio. Seven. Seconds. So why do we keep building static resume pages with a hero section, an "About Me", and a grid of project cards?

I've been obsessed with sites like Bruno Simon's (where you literally drive a truck around), Robby Leonardi's (where scrolling tells a story), and Lynn Fisher's (where resizing the browser is the interaction). These sites break every convention and people LOVE them.

What if your personal site had a daily puzzle? What if the music changed based on the page? What if there were hidden easter eggs that rewarded curiosity with actual content? What if visiting your site felt more like exploring a game world than reading a document?

That's what this site is becoming. The bento grid is the hub. The globe is a toy. The cipher is a challenge. The character peeking out is a surprise. Every click should lead somewhere unexpected. Make them stay longer than 7 seconds.`,
        icon: <Zap size={24} color="#fbbf24" />
    }
];

const stageColors = {
    Seedling: '#22c55e',
    Budding: '#f472b6',
    Evergreen: '#0ea5e9'
};

const stageEmojis = {
    Seedling: '\u{1F331}',
    Budding: '\u{1F33C}',
    Evergreen: '\u{1F333}'
};

export default function Garden() {
    const container = useRef();
    const [activeNote, setActiveNote] = useState(null);

    useGSAP(() => {
        gsap.from('.garden-header', {
            y: -20, opacity: 0, duration: 0.8, ease: 'power3.out'
        });

        gsap.from('.growth-card', {
            scrollTrigger: {
                trigger: '.garden-grid',
                start: 'top 80%'
            },
            y: 60,
            opacity: 0,
            duration: 0.7,
            stagger: 0.15,
            ease: 'back.out(1.4)'
        });
    }, { scope: container });

    useEffect(() => {
        const clickables = document.querySelectorAll('.back-link');
        const handleCellClick = () => playClickSound();
        const handleCellHover = () => playHoverSound();

        clickables.forEach(c => {
            c.addEventListener('click', handleCellClick);
            c.addEventListener('mouseenter', handleCellHover);
        });

        return () => {
            clickables.forEach(c => {
                c.removeEventListener('click', handleCellClick);
                c.removeEventListener('mouseenter', handleCellHover);
            });
        };
    }, []);

    /* Lock body scroll when overlay is open */
    useEffect(() => {
        if (activeNote) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [activeNote]);

    const openNote = useCallback((note) => {
        playClickSound();
        setActiveNote(note);
    }, []);

    const closeNote = useCallback(() => {
        playClickSound();
        setActiveNote(null);
    }, []);

    /* Close overlay on Escape key */
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape' && activeNote) closeNote();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [activeNote, closeNote]);

    return (
        <div className="garden-container" ref={container}>
            <div className="garden-particles" />

            <div className="garden-header">
                <Link to="/" className="back-link">
                    <ArrowLeft size={18} /> Back to Hub
                </Link>
                <h1>The Brain Dump</h1>
                <p className="garden-subtitle">
                    Ideas at various stages of doneness. Click to dig in.
                </p>
            </div>

            <div className="garden-grid">
                {notes.map((note) => {
                    const color = stageColors[note.stage];
                    const emoji = stageEmojis[note.stage];
                    return (
                        <div
                            key={note.id}
                            className="growth-card glass-panel clickable"
                            style={{ '--card-accent': color }}
                            onClick={() => openNote(note)}
                            onMouseEnter={playHoverSound}
                        >
                            <div className="card-accent-bar" />
                            <div className="card-body">
                                <div className="card-top-row">
                                    <div className="card-icon">{note.icon}</div>
                                    <span className="card-stage-badge" style={{ color }}>
                                        <span className="stage-emoji">{emoji}</span>
                                        {note.stageLabel}
                                    </span>
                                </div>
                                <h2 className="card-title">{note.title}</h2>
                                <span className="card-date">{note.date}</span>
                                <p className="card-excerpt">{note.excerpt}</p>
                                <span className="card-cta">Read more &rarr;</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Full overlay / modal */}
            <AnimatePresence>
                {activeNote && (
                    <motion.div
                        className="note-overlay-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={closeNote}
                    >
                        <motion.article
                            className="note-overlay full-screen-article"
                            style={{ '--card-accent': stageColors[activeNote.stage] }}
                            initial={{ clipPath: 'circle(0% at 50% 50%)', opacity: 0 }}
                            animate={{ clipPath: 'circle(150% at 50% 50%)', opacity: 1 }}
                            exit={{ clipPath: 'circle(0% at 50% 50%)', opacity: 0 }}
                            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="overlay-accent-bar" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }} />

                            <div className="note-overlay-inner">
                                <button
                                    className="overlay-close-massive"
                                    onClick={closeNote}
                                    aria-label="Close"
                                >
                                    <X size={32} />
                                </button>

                                <header className="overlay-header-massive">
                                    <motion.div
                                        className="overlay-icon-massive"
                                        initial={{ scale: 0, rotate: -45 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.3, type: "spring" }}
                                    >
                                        {activeNote.icon}
                                    </motion.div>
                                    <div className="overlay-meta-massive">
                                        <motion.h2
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            {activeNote.title}
                                        </motion.h2>
                                        <motion.div
                                            className="overlay-meta-row"
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                        >
                                            <span className="card-stage-badge" style={{ color: stageColors[activeNote.stage] }}>
                                                <span className="stage-emoji">{stageEmojis[activeNote.stage]}</span>
                                                {activeNote.stageLabel}
                                            </span>
                                            <span className="overlay-date">{activeNote.date}</span>
                                        </motion.div>
                                    </div>
                                </header>

                                <motion.div
                                    className="overlay-content-massive"
                                    initial={{ y: 30, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    {activeNote.content.split('\n\n').map((paragraph, pIdx) => (
                                        <p key={pIdx}>{paragraph}</p>
                                    ))}
                                </motion.div>
                            </div>
                        </motion.article>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
