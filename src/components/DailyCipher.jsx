import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Lock, Unlock, Zap, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { playClickSound, playHoverSound } from '../utils/sounds';
import './DailyCipher.css';

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;
const WORDS = [
    'VAULT', 'SPACE', 'REACT', 'AUDIO', 'BUILD', 'NOISE', 'MAKER', 'GLOBE', 'CODES', 'STARS',
    'PIXEL', 'SYNTH', 'ORBIT', 'CODEC', 'PATCH', 'STACK', 'CLOUD', 'PROBE', 'BLAZE', 'SPARK',
    'FLARE', 'DRIFT', 'CRAFT', 'FORGE', 'PRISM', 'NEXUS', 'SHARP', 'PULSE', 'WAVES', 'FOCUS',
    'LASER', 'CYBER', 'METAL', 'PIANO', 'ULTRA', 'TURBO', 'POWER', 'BRAIN', 'DREAM', 'LIGHT',
    'NIGHT', 'FLAME', 'STORM', 'QUEST', 'ROGUE', 'TRACK', 'PHASE', 'BLEND', 'CHAOS', 'UNITY',
    'CHILL', 'CRISP', 'LUCKY', 'MAGIC', 'SOLAR', 'GHOST', 'SWIFT', 'ROYAL', 'STONE', 'HONEY',
    'NORTH', 'ALPHA', 'OMEGA', 'BLISS', 'SONIC', 'VIRUS', 'ARMOR', 'BOOST', 'RAPID', 'BRAVE',
    'NOVEL', 'ATLAS', 'VERSE', 'WORLD', 'EARTH', 'OCEAN', 'MOUNT', 'TRAIL', 'RIDGE', 'COAST',
    'BYTES', 'LOGIC', 'VIVID', 'FRESH', 'CLIMB', 'SEEDS', 'GRIND', 'BLOOM', 'NOTES', 'BEATS',
    'LEVEL', 'SCOUT', 'HYPER', 'VAPOR', 'NEONS', 'RETRO', 'LUNAR', 'ASTRO', 'DRONE', 'VOXEL',
];

const BASE = import.meta.env.BASE_URL;

const vaultPhotos = [
    { id: 0, src: `${BASE}images/vault/velocicoaster.jpg`, name: 'VelociCoaster', rar: 'Legendary' },
    { id: 1, src: `${BASE}images/vault/hulk-coaster.jpg`, name: 'Incredible Hulk', rar: 'Epic' },
    { id: 2, src: `${BASE}images/vault/kraken-family.png`, name: 'Kraken', rar: 'Rare' },
    { id: 3, src: `${BASE}images/vault/penguin-trek.png`, name: 'Penguin Trek', rar: 'Beta' },
    { id: 4, src: `${BASE}images/vault/ice-breaker.png`, name: 'Ice Breaker', rar: 'Rare' },
    { id: 5, src: `${BASE}images/vault/mako-friends.jpg`, name: 'Mako', rar: 'Epic' },
    { id: 6, src: `${BASE}images/vault/manta-ride.jpg`, name: 'Manta', rar: 'Epic' },
    { id: 7, src: `${BASE}images/vault/mako-jace.jpg`, name: 'Mako II', rar: 'Rare' },
    { id: 8, src: `${BASE}images/vault/kraken-crew.jpg`, name: 'Kraken Squad', rar: 'Rare' },
    { id: 9, src: `${BASE}images/vault/mako-crew.jpg`, name: 'Mako Night Out', rar: 'Beta' },
    { id: 10, src: `${BASE}images/vault/mako-team.jpg`, name: 'Squadron', rar: 'Legendary' },
];

const getDailyData = () => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    return {
        word: WORDS[seed % WORDS.length],
        cardIndex: seed % vaultPhotos.length
    };
};

export default function DailyCipher({ showVault = false }) {
    const [guesses, setGuesses] = useState([]);
    const [currentGuess, setCurrentGuess] = useState('');
    const [gameState, setGameState] = useState('playing'); // playing, won, lost
    const [dailyWord, setDailyWord] = useState('');
    const [dailyCardId, setDailyCardId] = useState(0);
    const [shake, setShake] = useState(false);

    const [unlockedCards, setUnlockedCards] = useState([]);
    const [showRewardSpash, setShowRewardSplash] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);

    useEffect(() => {
        const data = getDailyData();
        setDailyWord(data.word);
        setDailyCardId(data.cardIndex);

        const storedStats = localStorage.getItem('jarowe_collection');
        if (storedStats) {
            setUnlockedCards(JSON.parse(storedStats));
        }

        const storedState = localStorage.getItem('dailyCipher');
        if (storedState) {
            const parsed = JSON.parse(storedState);
            const todayStr = new Date().toDateString();
            if (parsed.date === todayStr) {
                setGuesses(parsed.guesses || []);
                setGameState(parsed.gameState || 'playing');
            }
        }
    }, []);

    useEffect(() => {
        if (dailyWord) {
            localStorage.setItem('dailyCipher', JSON.stringify({
                date: new Date().toDateString(),
                guesses,
                gameState
            }));
        }
    }, [guesses, gameState, dailyWord]);

    const handleWin = () => {
        setGameState('won');
        playClickSound();

        let newUnlocked = [...unlockedCards];
        let cardToUnlock = dailyCardId;

        // If they already have today's card, give them the next locked one
        if (newUnlocked.includes(cardToUnlock)) {
            for (let i = 0; i < vaultPhotos.length; i++) {
                if (!newUnlocked.includes(i)) {
                    cardToUnlock = i;
                    break;
                }
            }
        }

        if (!newUnlocked.includes(cardToUnlock)) {
            newUnlocked.push(cardToUnlock);
            setUnlockedCards(newUnlocked);
            localStorage.setItem('jarowe_collection', JSON.stringify(newUnlocked));

            setTimeout(() => {
                setShowRewardSplash(cardToUnlock);
                confetti({
                    particleCount: 200,
                    spread: 120,
                    origin: { y: 0.6 },
                    colors: ['#7c3aed', '#38bdf8', '#f472b6', '#fbbf24', '#22c55e']
                });
            }, 1000);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (gameState !== 'playing' || showRewardSpash !== false || selectedCard !== null) return;

            if (e.key === 'Enter') {
                if (currentGuess.length !== WORD_LENGTH) {
                    setShake(true);
                    setTimeout(() => setShake(false), 500);
                    return;
                }
                const newGuesses = [...guesses, currentGuess];
                setGuesses(newGuesses);

                if (currentGuess === dailyWord) {
                    handleWin();
                } else if (newGuesses.length >= MAX_GUESSES) {
                    setGameState('lost');
                }
                setCurrentGuess('');
            } else if (e.key === 'Backspace') {
                setCurrentGuess(prev => prev.slice(0, -1));
            } else if (/^[A-Za-z]$/.test(e.key) && currentGuess.length < WORD_LENGTH) {
                setCurrentGuess(prev => prev + e.key.toUpperCase());
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentGuess, gameState, guesses, dailyWord, showRewardSpash, selectedCard, unlockedCards, dailyCardId]);

    const getCharClasses = (char, index, guessWord) => {
        if (!dailyWord) return '';
        if (dailyWord[index] === char) return 'correct';
        if (dailyWord.includes(char)) {
            const remainingTarget = Array.from(dailyWord).filter((c, i) => c === char && guessWord[i] !== char).length;
            const previousGuessesOfChar = Array.from(guessWord.slice(0, index)).filter((c, i) => c === char && dailyWord[i] !== char).length;
            if (previousGuessesOfChar < remainingTarget) return 'present';
        }
        return 'absent';
    };

    return (
        <div className={`cipher-vault-wrapper ${showVault ? 'with-vault' : ''}`}>

            {/* LEFT: CIPHER TERMINAL */}
            <div className="cipher-terminal">
                <div className="terminal-header">
                    <div className="terminal-title">
                        <Zap size={16} className="text-accent" />
                        <span>NETWORK DECRYPT</span>
                    </div>
                    <div className="terminal-status">
                        {gameState === 'playing' ? 'AWAITING INPUT...' : gameState === 'won' ? 'ACCESS GRANTED' : 'LOCKDOWN INITIATED'}
                    </div>
                </div>

                <div className="cipher-grid">
                    {Array.from({ length: MAX_GUESSES }).map((_, rowIndex) => {
                        const isCurrentRow = rowIndex === guesses.length;
                        const guess = isCurrentRow ? currentGuess : guesses[rowIndex] || '';
                        const isSubmitted = rowIndex < guesses.length;

                        return (
                            <div key={rowIndex} className={`cipher-row ${isCurrentRow && shake ? 'shake' : ''}`}>
                                {Array.from({ length: WORD_LENGTH }).map((_, colIndex) => {
                                    const char = guess[colIndex] || '';
                                    let classNames = 'cipher-cell';
                                    if (char) classNames += ' filled';
                                    if (isSubmitted) {
                                        classNames += ` submitted ${getCharClasses(char, colIndex, guess)}`;
                                    }

                                    return (
                                        <div key={colIndex} className={classNames} style={{ animationDelay: isSubmitted ? `${colIndex * 0.1}s` : undefined }}>
                                            <span className="cell-char">{char}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                <div className="terminal-footer">
                    <span>KEY: [{dailyWord.length} CHARS]</span>
                    <span>ATTEMPTS: {guesses.length}/{MAX_GUESSES}</span>
                </div>

                {gameState === 'lost' && (
                    <div className="terminal-overlay lost">
                        <Lock size={32} />
                        <h3>FATAL ERROR</h3>
                        <p>KEY WAS: {dailyWord}</p>
                    </div>
                )}
            </div>

            {/* RIGHT: CARD COLLECTION */}
            {showVault && (
                <div className="collection-visual">
                    <div className="collection-header">
                        <h3>THE ARCHIVE</h3>
                        <span className="collection-count">{unlockedCards.length} / {vaultPhotos.length} DISCOVERED</span>
                    </div>

                    <div className="cards-grid">
                        {vaultPhotos.map((item, idx) => {
                            const isUnlocked = unlockedCards.includes(idx);

                            return (
                                <motion.div
                                    key={idx}
                                    className={`collection-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                                    whileHover={isUnlocked ? { scale: 1.05, y: -5 } : {}}
                                    onClick={() => {
                                        if (isUnlocked) {
                                            setSelectedCard(item);
                                            playClickSound();
                                        }
                                    }}
                                >
                                    {isUnlocked ? (
                                        <>
                                            <img src={item.src} alt={item.name} className="card-image" />
                                            <div className="card-foil"></div>
                                            <div className="card-info">
                                                <div className="card-name">{item.name}</div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="card-locked-state">
                                            <Lock size={20} className="locked-icon" />
                                            <div className="locked-glitch"></div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* REWARD OR FULL SCREEN CARD SPLASH */}
            <AnimatePresence>
                {(showRewardSpash !== false || selectedCard !== null) && (
                    <motion.div
                        className="card-splash-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            if (showRewardSpash !== false) setShowRewardSplash(false);
                            if (selectedCard !== null) setSelectedCard(null);
                            playClickSound();
                        }}
                    >
                        <motion.div
                            className="card-splash-container"
                            initial={{ scale: 0.8, y: 50, rotateY: 90 }}
                            animate={{ scale: 1, y: 0, rotateY: 0 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button className="splash-close" onClick={() => { setShowRewardSplash(false); setSelectedCard(null); playClickSound(); }}>
                                <X size={24} />
                            </button>

                            {showRewardSpash !== false && (
                                <div className="reward-title">NEW RELIC ACQUIRED!</div>
                            )}

                            <div className="hero-card">
                                <img
                                    src={vaultPhotos[showRewardSpash !== false ? showRewardSpash : selectedCard.id].src}
                                    alt="Hero Card"
                                />
                                <div className="hero-card-foil"></div>
                                <div className="hero-card-shine"></div>
                                <div className="hero-card-content">
                                    <div className="hero-card-rarity">{vaultPhotos[showRewardSpash !== false ? showRewardSpash : selectedCard.id].rar}</div>
                                    <div className="hero-card-title">{vaultPhotos[showRewardSpash !== false ? showRewardSpash : selectedCard.id].name}</div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
