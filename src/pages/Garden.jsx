import { Link } from 'react-router-dom';
import { ArrowLeft, Leaf, Coffee, Code2, Zap, X, Heart, Mountain, Paintbrush, Globe2 } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { playClickSound, playHoverSound } from '../utils/sounds';
import './Garden.css';

gsap.registerPlugin(ScrollTrigger);

const BASE = import.meta.env.BASE_URL;

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
    },
    // --- JOURNAL ENTRIES from Instagram ---
    {
        id: 5,
        title: "A Letter to Maria",
        stage: 'Evergreen',
        stageLabel: 'From the heart',
        date: 'June 2025',
        excerpt: "You didn't just chase your dream\u2014you embodied it. And in doing so, you've become a quiet revolution.",
        photo: `${BASE}images/Instagram/media/posts/202506/18117408043478584.jpg`,
        content: `One of the most meaningful moments of my life was when I told you my dreams of becoming a filmmaker, and you smiled\u2014that soft, soulful smile\u2014and said that your dream was to be a mother and to travel the world.

I didn't fully understand why it moved me so deeply then. But I do now. It's because, in that moment, you were showing me a dream that was pure. And deep down, all I wanted was to be with that woman.

A woman whose dream was to love her children with everything she had and to explore the world together in wonderment. And now\u2026 just let that sink in.

You've become that woman\u2014and so much more. You've not only become the woman you dreamed of\u2014you've surpassed her in every way. You've created a life that most people spend a lifetime hoping for. But you didn't stumble into it. You built it.

You're now only 38, and already, you've painted a life more vivid and honest than most dare to dream. Not through luck or chance\u2014but by choosing it, nurturing it, becoming it. You didn't just chase your dream\u2014you embodied it. And in doing so, you've become a quiet revolution.

This past year alone\u2014you've led us from Greece to Maine, through Acadia's wild beauty, and across Europe once again\u2014Spain, Germany, Austria, Italy. A dream life that's somehow real. Because you made it so.

It is the greatest honor of my life to be your husband. Happy Birthday to the woman who makes life the most beautiful adventure. I love you beyond what words can hold.`,
        icon: <Heart size={24} color="#f472b6" />,
        gallery: [
            `${BASE}images/Instagram/media/posts/202506/18117408043478584.jpg`,
            `${BASE}images/Instagram/media/posts/202506/18071369545975540.jpg`,
            `${BASE}images/Instagram/media/posts/202506/17978106839847821.jpg`,
            `${BASE}images/Instagram/media/posts/202506/17907490422171899.jpg`,
            `${BASE}images/Instagram/media/posts/202506/18056810669251441.jpg`,
            `${BASE}images/Instagram/media/posts/202506/18082322089704316.jpg`,
            `${BASE}images/Instagram/media/posts/202506/17961486461930716.jpg`,
            `${BASE}images/Instagram/media/posts/202506/18080979883764421.jpg`,
            `${BASE}images/Instagram/media/posts/202506/18052999454094216.jpg`,
            `${BASE}images/Instagram/media/posts/202506/18070334965989005.jpg`,
        ]
    },
    {
        id: 6,
        title: "Happy Golden Birthday, Jole",
        stage: 'Evergreen',
        stageLabel: 'From the heart',
        date: 'June 2025',
        excerpt: "From the very beginning, you've made me smile easier than anyone. It's an honor to be your dad.",
        photo: `${BASE}images/Instagram/media/posts/202506/17914595157108652.jpg`,
        content: `From the very beginning, you've made me smile easier than anyone. You were such a funny baby\u2026bright, quick, curious, and somehow, it felt like you were already here, fully formed, just figuring out how to walk and talk as fast as you could.

And you did. You've always moved fast. Thought fast. Eaten fast. And loved with your whole heart.

You've spent more time on my shoulders than anywhere else, because that's just where you fit right from the very start. And even now, when I close my eyes, I can still feel the weight of you there, your little chubby hands holding on, both of us just being together.

You have a heart full of joy, kindness, and this deep, emotional strength that not many people your age carry. You care so deeply about the people you love, and you protect them with everything you've got.

You're creative, thoughtful, hilarious, and full of light. Whether you're baking your gluten free double tree oat cookies or drawing with that wildly vivid imagination of yours, you put your whole heart into it.

My eyes fill when I think about all the moments that shaped you into the boy you are, and the man you'll one day become. You are a gift. So much light, and so much joy!

It's an honor to be your dad. Truly. What a pleasure to say I'm your Father, Son. Happy golden birthday, Jole. I love you so, so much.`,
        icon: <Heart size={24} color="#fbbf24" />,
        gallery: [
            `${BASE}images/Instagram/media/posts/202506/17914595157108652.jpg`,
            `${BASE}images/Instagram/media/posts/202506/18047771570526757.jpg`,
            `${BASE}images/Instagram/media/posts/202506/17855797470446616.jpg`,
            `${BASE}images/Instagram/media/posts/202506/18512645647053946.jpg`,
            `${BASE}images/Instagram/media/posts/202506/18079646629874354.jpg`,
            `${BASE}images/Instagram/media/posts/202506/18032416868404999.jpg`,
            `${BASE}images/Instagram/media/posts/202506/18307161658242748.jpg`,
            `${BASE}images/Instagram/media/posts/202506/18508395667013897.jpg`,
            `${BASE}images/Instagram/media/posts/202506/18009709811756330.jpg`,
            `${BASE}images/Instagram/media/posts/202506/18228245308289810.jpg`,
        ]
    },
    {
        id: 7,
        title: "In Between the Hustle, There's Flow",
        stage: 'Budding',
        stageLabel: 'Reflections',
        date: 'April 2025',
        excerpt: "Capturing the rhythm between creative work and finding moments of quiet in unexpected places.",
        photo: `${BASE}images/Instagram/media/posts/202505/18036208973644195.jpg`,
        content: `In between the hustle\u2026there's flow.

There are moments in the creative process where everything just aligns. The code compiles on the first try. The design clicks. The words pour out faster than you can type them. Those moments are rare, but they're what keep us going.

I've been chasing that flow state my entire career. First in filmmaking, then in product development, now in building creative tools. The medium changes but the feeling doesn't.

The secret I've learned: flow doesn't come from working harder. It comes from clearing the noise. Sometimes that means stepping away from the screen and walking through a new city with fresh eyes. Sometimes it means watching your kids discover something for the first time and remembering what curiosity felt like before deadlines existed.

These buildings are growing on me. These murals sing. And somewhere between the morning espresso and the midnight commit, the best ideas always find their way through.`,
        icon: <Paintbrush size={24} color="#a78bfa" />,
        gallery: [
            `${BASE}images/Instagram/media/posts/202504/18099032260474455.jpg`,
            `${BASE}images/Instagram/media/posts/202504/18043496630410520.jpg`,
            `${BASE}images/Instagram/media/posts/202504/17928016757932757.jpg`,
            `${BASE}images/Instagram/media/posts/202504/18119599621452905.jpg`,
            `${BASE}images/Instagram/media/posts/202504/18041557661622729.jpg`,
            `${BASE}images/Instagram/media/posts/202504/18057664345899652.jpg`,
            `${BASE}images/Instagram/media/posts/202504/17902035795159850.jpg`,
            `${BASE}images/Instagram/media/posts/202504/18458295763078376.jpg`,
        ]
    },
    {
        id: 8,
        title: "Brotherhood & The Weight of Words",
        stage: 'Evergreen',
        stageLabel: 'From the heart',
        date: 'June 2024',
        excerpt: "Brother\u2014it's the most meaningful word I know. Having two brothers who shaped who I am today.",
        photo: `${BASE}images/Instagram/media/posts/202505/17909458218141036.jpg`,
        content: `Brother\u2014it's the most meaningful word I know. Having two brothers who shaped who I am today, and now watching my three boys forge those same bonds\u2026 it's everything.

I used to think being a good father meant having all the answers. Being strong. Never showing weakness. But I've learned that the best thing I can give my boys is honesty. Showing them that it's okay to feel deeply, to cry, to be vulnerable.

Watching Jace protect his younger brothers. Watching Jax light up a room with his energy. Watching Jole care for everyone around him with that enormous heart. These are the moments that matter more than any product launch or career milestone.

Just before beginning what would have been a year-long home renovation journey, we paused\u2014and chose adventure instead. We packed our lives into suitcases and crossed an ocean. And in doing so, we didn't just see the world. We became part of it.

The boys are growing up with a different kind of education. One that can't be measured by tests or grades. They're learning empathy, resilience, adaptability. They're learning that home isn't a place\u2014it's a feeling that's created in moments shared.`,
        icon: <Heart size={24} color="#22c55e" />,
        gallery: [
            `${BASE}images/Instagram/media/posts/202406/18035308411811495.jpg`,
            `${BASE}images/Instagram/media/posts/202406/18228273304285645.jpg`,
            `${BASE}images/Instagram/media/posts/202406/18012271727384289.jpg`,
            `${BASE}images/Instagram/media/posts/202406/18060919540571241.jpg`,
            `${BASE}images/Instagram/media/posts/202406/17868761385107011.jpg`,
            `${BASE}images/Instagram/media/posts/202406/18079835032478250.jpg`,
            `${BASE}images/Instagram/media/posts/202406/17924153279909680.jpg`,
            `${BASE}images/Instagram/media/posts/202406/18344106379114900.jpg`,
            `${BASE}images/Instagram/media/posts/202406/18059896519604323.jpg`,
            `${BASE}images/Instagram/media/posts/202406/18337850548139087.jpg`,
        ]
    },
    {
        id: 9,
        title: "Water As Clear As Thoughts",
        stage: 'Budding',
        stageLabel: 'Reflections',
        date: 'May 2024',
        excerpt: "With water as clear as the thoughts these times inspire, I'm finding joy in the simple act of being present.",
        photo: `${BASE}images/Instagram/media/posts/202404/17878593333062972.jpg`,
        content: `With water as clear as the thoughts these times inspire, I'm finding joy in the simple act of being present.

Off the coast of Syros, aboard a beautiful yacht with nothing but the Aegean stretching in every direction, something shifted in me. The constant noise of notifications, deadlines, and to-do lists faded into the rhythm of the waves.

Watching our boys dance with the waves and lay in the sand, we realized something profound: their childhood isn't something that happens between our work hours. It IS the main event. Everything else is the intermission.

Exploring ancient caves today and I found joy in the simple act of watching my son discover a fossil. His eyes went wide. His mouth dropped. And in that moment, I saw the world the way it's supposed to be seen\u2014with wonder.

Tracing the paths of our childhood, my boys nearly mirror the curiosity my brothers and I once carried. The cycle continues. The adventure evolves. And every challenge presents a call to leap, expanding our horizons into bigger, brighter skies.`,
        icon: <Globe2 size={24} color="#38bdf8" />,
        gallery: [
            `${BASE}images/Instagram/media/posts/202405/18028570129844786.jpg`,
            `${BASE}images/Instagram/media/posts/202405/18029773807990488.jpg`,
            `${BASE}images/Instagram/media/posts/202405/17951798984664627.jpg`,
            `${BASE}images/Instagram/media/posts/202405/17867839035080687.jpg`,
            `${BASE}images/Instagram/media/posts/202405/18101020048402394.jpg`,
            `${BASE}images/Instagram/media/posts/202405/17981043038668072.jpg`,
            `${BASE}images/Instagram/media/posts/202405/18028999012854429.jpg`,
            `${BASE}images/Instagram/media/posts/202405/17976744140545057.jpg`,
            `${BASE}images/Instagram/media/posts/202405/18030248443956620.jpg`,
            `${BASE}images/Instagram/media/posts/202405/18017449808204624.jpg`,
        ]
    },
    {
        id: 10,
        title: "A Letter to Jace",
        stage: 'Evergreen',
        stageLabel: 'From the heart',
        date: 'March 2024',
        excerpt: "Your passion for reading, your sense of justice, your quiet confidence\u2014I see it all.",
        content: `To my oldest, Jace, I see you. Your passion for reading, your sense of justice, your quiet confidence that often goes unnoticed by the world but never by me.

You've changed my life in more ways than I can ever explain. From the moment you were born, there was something different about you. Your eyes, your spirit, the way you looked at the world as if you already knew something most people don't.

You're the kind of person who makes the world better just by being in it. You lift people up without even trying. You bring calm. You bring laughter. You bring heart.

You've faced challenges that could have made you bitter or discouraged, but instead, you became stronger. You became wiser. You became more compassionate. You've shown me how to choose joy, even when it's gluten free. You've shown your brothers what kindness looks like.

You've helped me become the father I always hoped to be. Watching you grow up has been the greatest honor of my life. And now, as you step into your teenage years, you're not someone still trying to figure out who they are. You already know. And you're not afraid to be that person.

Wherever your journey takes you, just know I'm always walking right behind you. Cheering you on. Learning from you. Loving you more than words can hold.`,
        icon: <Heart size={24} color="#0ea5e9" />,
        gallery: [
            `${BASE}images/Instagram/media/posts/202505/18049611632421210.jpg`,
            `${BASE}images/Instagram/media/posts/202505/17863725780402542.jpg`,
            `${BASE}images/Instagram/media/posts/202505/17980146791704711.jpg`,
            `${BASE}images/Instagram/media/posts/202505/17944225151991319.jpg`,
            `${BASE}images/Instagram/media/posts/202505/17909458218141036.jpg`,
            `${BASE}images/Instagram/media/posts/202505/18169634275338168.jpg`,
            `${BASE}images/Instagram/media/posts/202505/18068212789989135.jpg`,
            `${BASE}images/Instagram/media/posts/202505/18051349199524470.jpg`,
            `${BASE}images/Instagram/media/posts/202505/18043014722237621.jpg`,
            `${BASE}images/Instagram/media/posts/202505/17860762629355902.jpg`,
        ]
    },
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

    // Photo lightbox
    const [lightboxPhoto, setLightboxPhoto] = useState(null);

    // Gallery drag-to-scroll + wheel-to-scroll
    const galleryScrollRef = useRef(null);
    const isDragging = useRef(false);
    const hasDragged = useRef(false);
    const dragStartX = useRef(0);
    const dragScrollLeft = useRef(0);

    // Attach wheel handler (needs passive: false to preventDefault)
    useEffect(() => {
        const el = galleryScrollRef.current;
        if (!el) return;

        const handleWheel = (e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                el.scrollLeft += e.deltaY;
            }
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [activeNote]);

    const handleGalleryMouseDown = useCallback((e) => {
        const el = galleryScrollRef.current;
        if (!el) return;
        isDragging.current = true;
        hasDragged.current = false;
        dragStartX.current = e.pageX;
        dragScrollLeft.current = el.scrollLeft;
        el.style.cursor = 'grabbing';
        el.style.scrollSnapType = 'none';
    }, []);

    const handleGalleryMouseUp = useCallback(() => {
        isDragging.current = false;
        const el = galleryScrollRef.current;
        if (el) {
            el.style.cursor = '';
            el.style.scrollSnapType = '';
        }
    }, []);

    const handleGalleryMouseMove = useCallback((e) => {
        if (!isDragging.current) return;
        hasDragged.current = true;
        e.preventDefault();
        const el = galleryScrollRef.current;
        if (!el) return;
        const walk = (e.pageX - dragStartX.current) * 1.5;
        el.scrollLeft = dragScrollLeft.current - walk;
    }, []);

    const handlePhotoClick = useCallback((src) => {
        if (hasDragged.current) return;
        playClickSound();
        setLightboxPhoto(src);
    }, []);

    // Close lightbox on Escape
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape' && lightboxPhoto) setLightboxPhoto(null);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [lightboxPhoto]);

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
                            className={`growth-card glass-panel clickable ${note.photo ? 'has-photo' : ''}`}
                            style={{ '--card-accent': color }}
                            onClick={() => openNote(note)}
                            onMouseEnter={playHoverSound}
                        >
                            {note.photo && (
                                <div className="card-photo" style={{ backgroundImage: `url(${note.photo})` }} />
                            )}
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

            {/* Photo lightbox with film effect */}
            <AnimatePresence>
                {lightboxPhoto && (
                    <motion.div
                        className="photo-lightbox-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => setLightboxPhoto(null)}
                    >
                        <motion.div
                            className="film-frame"
                            initial={{ scale: 0.85, opacity: 0, rotateX: 8 }}
                            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img src={lightboxPhoto} className="film-photo" alt="Photo" />
                            <div className="film-grain" />
                            <div className="film-vignette" />
                            <div className="film-info">
                                <span className="film-brand">JAROWE</span>
                                <span className="film-detail">WORLDSCHOOL JOURNAL</span>
                            </div>
                            <button className="film-close" onClick={() => setLightboxPhoto(null)} aria-label="Close">
                                <X size={24} />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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

                                {activeNote.gallery && activeNote.gallery.length > 0 && (
                                    <motion.div
                                        className="overlay-gallery"
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <div
                                            className="gallery-scroll"
                                            ref={galleryScrollRef}
                                            onMouseDown={handleGalleryMouseDown}
                                            onMouseMove={handleGalleryMouseMove}
                                            onMouseUp={handleGalleryMouseUp}
                                            onMouseLeave={handleGalleryMouseUp}
                                        >
                                            {activeNote.gallery.map((src, i) => (
                                                <div key={i} className="gallery-item" onClick={() => handlePhotoClick(src)}>
                                                    <img
                                                        src={src}
                                                        alt={`${activeNote.title} photo ${i + 1}`}
                                                        className="gallery-photo"
                                                        loading="lazy"
                                                        draggable={false}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="gallery-hint">
                                            <span className="gallery-count">{activeNote.gallery.length} photos</span>
                                            <span className="gallery-swipe">scroll to explore &rarr;</span>
                                        </div>
                                    </motion.div>
                                )}

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
