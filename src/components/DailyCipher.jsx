import React, { useState, useEffect, useMemo } from 'react';
import { Lock, Unlock, ChevronLeft, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
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
    { src: `${BASE}images/vault/velocicoaster.jpg`, name: 'VelociCoaster', park: 'Universal Orlando' },
    { src: `${BASE}images/vault/hulk-coaster.jpg`, name: 'Incredible Hulk', park: 'Islands of Adventure' },
    { src: `${BASE}images/vault/kraken-family.png`, name: 'Kraken', park: 'SeaWorld Orlando' },
    { src: `${BASE}images/vault/penguin-trek.png`, name: 'Penguin Trek', park: 'SeaWorld Orlando' },
    { src: `${BASE}images/vault/ice-breaker.png`, name: 'Ice Breaker', park: 'SeaWorld Orlando' },
    { src: `${BASE}images/vault/mako-friends.jpg`, name: 'Mako', park: 'SeaWorld Orlando' },
    { src: `${BASE}images/vault/manta-ride.jpg`, name: 'Manta', park: 'SeaWorld Orlando' },
    { src: `${BASE}images/vault/mako-jace.jpg`, name: 'Mako II', park: 'SeaWorld Orlando' },
    { src: `${BASE}images/vault/kraken-crew.jpg`, name: 'Kraken II', park: 'SeaWorld Orlando' },
    { src: `${BASE}images/vault/mako-crew.jpg`, name: 'Mako III', park: 'SeaWorld Orlando' },
    { src: `${BASE}images/vault/mako-team.jpg`, name: 'Mako IV', park: 'SeaWorld Orlando' },
];

const getDailyWord = () => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    return WORDS[seed % WORDS.length];
};

export default function DailyCipher({ showVault = false }) {
    const [guesses, setGuesses] = useState([]);
    const [currentGuess, setCurrentGuess] = useState('');
    const [gameState, setGameState] = useState('playing');
    const [dailyWord, setDailyWord] = useState('');
    const [shake, setShake] = useState(false);
    const [vaultOpening, setVaultOpening] = useState(false);
    const [vaultOpen, setVaultOpen] = useState(false);
    const [photoIndex, setPhotoIndex] = useState(0);

    useEffect(() => {
        const word = getDailyWord();
        setDailyWord(word);

        const storedState = localStorage.getItem('dailyCipher');
        if (storedState) {
            const parsed = JSON.parse(storedState);
            const todayStr = new Date().toDateString();
            if (parsed.date === todayStr) {
                setGuesses(parsed.guesses || []);
                const savedState = parsed.gameState || 'playing';
                setGameState(savedState);
                if (savedState === 'won') setVaultOpen(true);
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

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (gameState !== 'playing') return;

            if (e.key === 'Enter') {
                if (currentGuess.length !== WORD_LENGTH) {
                    setShake(true);
                    setTimeout(() => setShake(false), 500);
                    return;
                }
                const newGuesses = [...guesses, currentGuess];
                setGuesses(newGuesses);

                if (currentGuess === dailyWord) {
                    setGameState('won');
                    playClickSound();
                    // Vault opening sequence
                    setVaultOpening(true);
                    setTimeout(() => {
                        setVaultOpen(true);
                        setVaultOpening(false);
                        confetti({
                            particleCount: 150,
                            spread: 100,
                            origin: { y: 0.5, x: 0.75 },
                            colors: ['#7c3aed', '#38bdf8', '#f472b6', '#fbbf24', '#22c55e']
                        });
                    }, 1500);
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
    }, [currentGuess, gameState, guesses, dailyWord]);

    // Count how many letters are correctly placed across all guesses
    const correctPositions = useMemo(() => {
        if (!dailyWord) return new Set();
        const positions = new Set();
        guesses.forEach(guess => {
            for (let i = 0; i < WORD_LENGTH; i++) {
                if (guess[i] === dailyWord[i]) positions.add(i);
            }
        });
        return positions;
    }, [guesses, dailyWord]);

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
            {/* CIPHER SIDE */}
            <div className="cipher-game-container">
                <div className="cipher-header">DAILY CIPHER</div>
                <div className="cipher-subtitle">Crack the code. Unlock the vault.</div>

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
                                            {char}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                {gameState === 'won' && !showVault && (
                    <div className="cipher-message success">ACCESS GRANTED!</div>
                )}
                {gameState === 'lost' && (
                    <div className="cipher-message error">
                        LOCKDOWN.<br />The word was {dailyWord}. Try tomorrow.
                    </div>
                )}
            </div>

            {/* VAULT SIDE */}
            {showVault && (
                <div className="vault-visual">
                    {/* Lock indicators */}
                    <div className="vault-locks">
                        {Array.from({ length: WORD_LENGTH }).map((_, i) => {
                            const isUnlocked = correctPositions.has(i);
                            return (
                                <div key={i} className={`vault-lock ${isUnlocked ? 'unlocked' : ''}`}>
                                    {isUnlocked ? <Unlock size={16} /> : <Lock size={16} />}
                                </div>
                            );
                        })}
                    </div>

                    {/* Vault door / content */}
                    {!vaultOpen ? (
                        <div className={`vault-door ${vaultOpening ? 'opening' : ''}`}>
                            <div className="vault-door-face">
                                <div className="vault-dial">
                                    <div className="dial-ring"></div>
                                    <div className="dial-center">{correctPositions.size}/{WORD_LENGTH}</div>
                                </div>
                                <div className="vault-door-label">
                                    {gameState === 'lost' ? 'SEALED' : `${WORD_LENGTH - correctPositions.size} LOCKS REMAIN`}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="vault-revealed">
                            <div className="vault-photo-card">
                                <img
                                    src={vaultPhotos[photoIndex].src}
                                    alt={vaultPhotos[photoIndex].name}
                                    className="vault-photo"
                                />
                                <div className="vault-photo-info">
                                    <span className="vault-photo-name">{vaultPhotos[photoIndex].name}</span>
                                    <span className="vault-photo-park">{vaultPhotos[photoIndex].park}</span>
                                </div>
                            </div>
                            <div className="vault-photo-nav">
                                <button
                                    className="vault-nav-btn"
                                    onClick={() => { setPhotoIndex(p => (p - 1 + vaultPhotos.length) % vaultPhotos.length); playClickSound(); }}
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <span className="vault-photo-count">{photoIndex + 1} / {vaultPhotos.length}</span>
                                <button
                                    className="vault-nav-btn"
                                    onClick={() => { setPhotoIndex(p => (p + 1) % vaultPhotos.length); playClickSound(); }}
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
