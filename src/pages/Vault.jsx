import { Link } from 'react-router-dom';
import { ArrowLeft, Key, Lock, Terminal, ShieldAlert, Sparkles, Music2, Rocket, Brain } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { playClickSound, playHoverSound } from '../utils/sounds';
import './Vault.css';

const vaultItems = [
    {
        icon: <Rocket size={24} color="#f472b6" />,
        title: "Project Starseed: Origin Story",
        content: "Starseed Labs started as a 2am idea on a napkin in Estepona, Spain. Maria was asleep. The boys were asleep. I was staring at the Mediterranean thinking about how every creative tool I used was built for someone else's workflow. So I started building my own. The name came from Jace — he was going through a space phase and said 'Dad, we should make something that plants seeds in the stars.' Done.",
        color: '#f472b6'
    },
    {
        icon: <Music2 size={24} color="#7c3aed" />,
        title: "The Suno Sessions",
        content: "Every night after the boys go to bed, I generate music. Not because I need to — because I can't stop. There's something about telling an AI 'synthwave with a melancholy piano hook and aggressive 808s' and hearing it come to life in 30 seconds. I've generated over 200 tracks. Most are terrible. Some are transcendent. The line between the two is thinner than you'd think.",
        color: '#7c3aed'
    },
    {
        icon: <Brain size={24} color="#0ea5e9" />,
        title: "What I Actually Think About AI",
        content: "Hot take: AI won't replace developers. But developers who use AI will replace developers who don't. I've been in tech for 15+ years and nothing has changed my daily workflow as much as LLMs. Not just for coding — for thinking. Using Claude and ChatGPT as thought partners has made me a better architect, writer, and decision maker. The trick is knowing when to trust it and when to push back.",
        color: '#0ea5e9'
    },
    {
        icon: <ShieldAlert size={24} color="#fbbf24" />,
        title: "Classified: Next Projects",
        content: "Three things I'm building that nobody knows about yet: 1) A WebAudio-powered ambient music engine that generates infinite, mood-reactive soundscapes for websites. 2) A daily creative prompt system that uses AI to generate personalized challenges. 3) Something involving AR and family travel that I genuinely can't talk about yet. Watch this space.",
        color: '#fbbf24'
    }
];

export default function Vault() {
    const container = useRef();
    const [accessGranted, setAccessGranted] = useState(false);
    const [typingText, setTypingText] = useState("");
    const [revealedItems, setRevealedItems] = useState([]);

    const fullText = "Analyzing clearance... Identity confirmed. Welcome to the Vault, explorer.";

    useGSAP(() => {
        gsap.from('.vault-glitch', {
            opacity: 0,
            duration: 0.1,
            yoyo: true,
            repeat: 5,
        });

        setTimeout(() => {
            let i = 0;
            const interval = setInterval(() => {
                setTypingText(fullText.substring(0, i));
                i++;
                if (i > fullText.length) {
                    clearInterval(interval);
                    setTimeout(() => setAccessGranted(true), 800);
                }
            }, 40);
        }, 800);

    }, { scope: container });

    useEffect(() => {
        if (accessGranted) {
            // Stagger reveal vault items
            vaultItems.forEach((_, idx) => {
                setTimeout(() => {
                    setRevealedItems(prev => [...prev, idx]);
                    playClickSound();
                }, 300 * (idx + 1));
            });
        }
    }, [accessGranted]);

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

    return (
        <div className="vault-container" ref={container}>
            <div className="vault-scanline"></div>

            <Link to="/" className="back-link vault-back">
                <ArrowLeft size={18} /> EXIT VAULT
            </Link>

            {!accessGranted ? (
                <div className="vault-terminal">
                    <Terminal size={48} color="#0ea5e9" className="vault-glitch" />
                    <h1 className="vault-glitch">RESTRICTED_ACCESS</h1>
                    <p className="typing-text">{typingText}<span className="cursor">_</span></p>
                </div>
            ) : (
                <div className="vault-content">
                    <div className="vault-header-section">
                        <Lock size={32} color="#10b981" />
                        <h2>THE VAULT</h2>
                        <span className="clearance-badge">CLEARANCE LEVEL: ROOT</span>
                        <p className="vault-subtitle">You found the secret. Here's what lives behind the curtain.</p>
                    </div>

                    <div className="vault-grid">
                        {vaultItems.map((item, idx) => (
                            <div
                                key={idx}
                                className={`vault-item glass-panel ${revealedItems.includes(idx) ? 'revealed' : ''}`}
                                style={{ '--accent': item.color }}
                            >
                                <div className="vault-item-header">
                                    {item.icon}
                                    <h3>{item.title}</h3>
                                </div>
                                <p>{item.content}</p>
                            </div>
                        ))}
                    </div>

                    <div className="vault-footer">
                        <Sparkles size={16} color="#7c3aed" />
                        <span>You've unlocked everything. For now. Check back — the Vault grows.</span>
                    </div>
                </div>
            )}
        </div>
    );
}
