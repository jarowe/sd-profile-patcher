import { Link } from 'react-router-dom';
import { ArrowLeft, Film, Book, Utensils, Headphones, Sparkles, Rocket, Moon, Quote, Zap } from 'lucide-react';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { playClickSound, playHoverSound } from '../utils/sounds';
import './Favorites.css';

gsap.registerPlugin(ScrollTrigger);

const favorites = [
    {
        category: 'Watching',
        icon: <Film size={24} color="#f472b6" />,
        items: [
            { title: 'Interstellar', note: 'Watched it with the boys. Jax cried. A masterpiece of time and love.', color: '#f472b6' },
            { title: 'Dune: Part Two', note: 'Visual storytelling at its absolute peak. Re-watching constantly for inspiration.', color: '#f472b6' },
            { title: 'Friday Night Movies with Jax', note: 'Every Friday. No exceptions. His pick. Last week was Spider-Verse for the 4th time. No complaints.', color: '#f472b6' },
        ]
    },
    {
        category: 'Reading',
        icon: <Book size={24} color="#38bdf8" />,
        items: [
            { title: 'The Three-Body Problem', note: 'Mind-bending hard science fiction. Cannot put it down. Liu Cixin sees the universe differently.', color: '#38bdf8' },
            { title: 'The Age of AI Agents', note: 'Required reading for anyone building with LLMs right now. Changed how I think about architecture.', color: '#38bdf8' },
        ]
    },
    {
        category: 'Cooking',
        icon: <Utensils size={24} color="#22c55e" />,
        items: [
            { title: 'Greek Lemon Potatoes', note: 'From that taverna in Naxos. We recreate it monthly. The secret is way too much olive oil and lemon.', color: '#22c55e' },
            { title: 'Austrian Schnitzel', note: 'Mastered during our Alps trip. The breading technique is everything. The boys devour it.', color: '#22c55e' },
            { title: 'Maria\'s Empanadas', note: 'Family recipe. She won\'t tell me the seasoning. I\'ve stopped asking. Just grateful.', color: '#22c55e' },
        ]
    },
    {
        category: 'Listening',
        icon: <Headphones size={24} color="#7c3aed" />,
        items: [
            { title: 'Heavy Synthwave', note: 'The ultimate coding soundtrack. Carpenter Brut, Perturbator, Dance With The Dead. Pure focus fuel.', color: '#7c3aed' },
            { title: 'My Suno Experiments', note: 'Generating AI music is addictive. Over 200 tracks and counting. Most are chaos. Some are magic.', color: '#7c3aed' },
        ]
    },
    {
        category: 'Roller Coasters',
        icon: <Rocket size={24} color="#ef4444" />,
        items: [
            { title: 'Iron Gwazi - Busch Gardens', note: 'RMC hybrid coaster. The first drop is genuinely life-changing. The boys screamed the entire time.', color: '#ef4444' },
            { title: 'Hagrid\'s - Universal Orlando', note: 'Not the fastest. Not the tallest. But the most FUN coaster ever built. We\'ve ridden it 20+ times.', color: '#ef4444' },
            { title: 'Velocicoaster - Universal', note: 'Pure aggression. The inversions over the water make you question every life decision. In the best way.', color: '#ef4444' },
        ]
    },
    {
        category: 'Bedtime Stories',
        icon: <Moon size={24} color="#fbbf24" />,
        items: [
            { title: 'The Adventures of Captain Stardust', note: 'Running series I make up for the boys. A space pirate who solves problems with creativity instead of fighting. 100+ episodes and counting.', color: '#fbbf24' },
            { title: 'The Dreamwalkers', note: 'Three brothers who can enter each other\'s dreams. Based loosely on Jace, Jax, and Jole. They don\'t know yet.', color: '#fbbf24' },
        ]
    },
    {
        category: 'Quotes I Live By',
        icon: <Quote size={24} color="#a78bfa" />,
        items: [
            { title: '"Build what shouldn\'t exist yet."', note: 'Something I keep telling myself at 2am when I\'m hacking on something nobody asked for.', color: '#a78bfa' },
            { title: '"The obstacle is the way."', note: 'Marcus Aurelius, via Ryan Holiday. Every hard problem in code and life follows this pattern.', color: '#a78bfa' },
            { title: '"Stay hungry, stay foolish."', note: 'Steve Jobs quoting Stewart Brand. The older I get, the more this hits different.', color: '#a78bfa' },
        ]
    }
];

export default function Favorites() {
    const container = useRef();

    useGSAP(() => {
        gsap.from('.fav-header', {
            y: -20, opacity: 0, duration: 0.8, ease: 'power3.out'
        });

        gsap.from('.fav-category', {
            scrollTrigger: {
                trigger: '.fav-content',
                start: 'top 85%'
            },
            y: 40,
            opacity: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'back.out(1.2)'
        });
    }, { scope: container });

    useEffect(() => {
        const clickables = document.querySelectorAll('.back-link, .fav-item');
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

    return (
        <div className="fav-container" ref={container}>
            <div className="fav-header">
                <Link to="/" className="back-link">
                    <ArrowLeft size={18} /> Back to Hub
                </Link>
                <h1><Sparkles size={28} /> Into Right Now</h1>
                <p>The stuff I can't shut up about. Obsessions, favorites, and the things that make life worth living.</p>
            </div>

            <div className="fav-content">
                {favorites.map((section, idx) => (
                    <div key={idx} className="fav-category glass-panel">
                        <div className="category-header">
                            {section.icon}
                            <h2>{section.category}</h2>
                        </div>
                        <div className="category-items">
                            {section.items.map((item, itemIdx) => (
                                <div key={itemIdx} className="fav-item glass-panel" style={{ '--accent': item.color }}>
                                    <h3>{item.title}</h3>
                                    <p>{item.note}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="glow-bg"></div>
        </div>
    );
}
