import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Wrench, Cpu, Rocket } from 'lucide-react';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { playClickSound, playHoverSound } from '../utils/sounds';
import './Workshop.css';

gsap.registerPlugin(ScrollTrigger);

const tools = [
    {
        id: 'sd-patcher',
        title: 'SD Profile Patcher',
        description: 'A dedicated tool to magically inject and manage profiles across various devices without touching raw configuration files.',
        icon: <Cpu size={32} color="#f472b6" />,
        link: '/tools/sd-profile-patcher',
        tags: ['React', 'Internal Tooling', 'File API'],
        bgImage: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=800'
    },
    {
        id: 'beamy',
        title: 'BEAMY Engine',
        description: 'Simply Powerful Animation Engine. Built on a C++ core with an intuitive React frontend layout.',
        icon: <Rocket size={32} color="#38bdf8" />,
        link: '/projects/beamy',
        tags: ['C++', 'React', 'Desktop'],
        bgImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800'
    }
];

export default function Workshop() {
    const navigate = useNavigate();
    const container = useRef();

    useGSAP(() => {
        // Header entrance 
        gsap.from('.workshop-header', {
            y: -20, opacity: 0, duration: 0.8, ease: 'power3.out'
        });

        // Stagger cards with ScrollTrigger
        gsap.from('.workshop-card', {
            scrollTrigger: {
                trigger: '.workshop-grid',
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
        const clickables = document.querySelectorAll('.clickable, .back-link');
        const handleCellClick = () => playClickSound();
        const handleCellHover = () => playHoverSound();

        clickables.forEach(c => {
            c.addEventListener('click', handleCellClick);
            c.addEventListener('mouseenter', handleCellHover);
        });

        // 3D Tilt Logic
        const cells = document.querySelectorAll('.tilt-enabled');
        const handleMouseMove = (e) => {
            const cell = e.currentTarget;
            const rect = cell.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;

            cell.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            cell.style.zIndex = 10;
        };

        const handleMouseLeave = (e) => {
            const cell = e.currentTarget;
            cell.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            cell.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            cell.style.zIndex = '';
        };

        const handleMouseEnter = (e) => {
            const cell = e.currentTarget;
            cell.style.transition = 'none';
        };

        cells.forEach(cell => {
            cell.addEventListener('mousemove', handleMouseMove);
            cell.addEventListener('mouseleave', handleMouseLeave);
            cell.addEventListener('mouseenter', handleMouseEnter);
        });

        return () => {
            clickables.forEach(c => {
                c.removeEventListener('click', handleCellClick);
                c.removeEventListener('mouseenter', handleCellHover);
            });
            cells.forEach(cell => {
                cell.removeEventListener('mousemove', handleMouseMove);
                cell.removeEventListener('mouseleave', handleMouseLeave);
                cell.removeEventListener('mouseenter', handleMouseEnter);
            });
        };
    }, []);

    return (
        <div className="workshop-container" ref={container}>
            <div className="workshop-header">
                <Link to="/" className="back-link">
                    <ArrowLeft size={18} /> Back to Hub
                </Link>
                <h1><Wrench size={32} /> The Workshop</h1>
                <p>The stuff I build when nobody's watching. Tools, experiments, and whatever I couldn't stop thinking about at 2am.</p>
            </div>

            <div className="workshop-grid">
                {tools.map(tool => (
                    <div
                        key={tool.id}
                        className="workshop-card glass-panel clickable tilt-enabled"
                        onClick={() => navigate(tool.link)}
                    >
                        <div className="card-bg-image" style={{ backgroundImage: `url(${tool.bgImage})` }}></div>
                        <div className="card-content-wrapper">
                            <div className="card-top">
                                {tool.icon}
                            </div>
                            <h2>{tool.title}</h2>
                            <p className="description">{tool.description}</p>

                            <div className="tags">
                                {tool.tags.map(tag => (
                                    <span key={tag} className="tool-tag">{tag}</span>
                                ))}
                            </div>

                            <div className="launch-btn">
                                Launch Tool <ArrowRight size={16} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
