import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { playClickSound } from '../utils/sounds';
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

// Pseudo-random index based on current date
const getDailyWord = () => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    return WORDS[seed % WORDS.length];
};

export default function DailyCipher({ onUnlock }) {
    const [guesses, setGuesses] = useState([]);
    const [currentGuess, setCurrentGuess] = useState('');
    const [gameState, setGameState] = useState('playing'); // playing, won, lost
    const [dailyWord, setDailyWord] = useState('');
    const [shake, setShake] = useState(false);

    useEffect(() => {
        // Load state from local storage based on current date
        const word = getDailyWord();
        setDailyWord(word);

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
        // Save state
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
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#7c3aed', '#38bdf8', '#f472b6']
                    });
                    if (onUnlock) onUnlock();
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
    }, [currentGuess, gameState, guesses, dailyWord, onUnlock]);

    const getCharClasses = (char, index, guessWord) => {
        if (!dailyWord) return '';
        if (dailyWord[index] === char) return 'correct';
        if (dailyWord.includes(char)) {
            // Check if there are remaining instances of this character
            // (Simplified logic for now, typical Wordle counts occurrences)
            const remainingTarget = Array.from(dailyWord).filter((c, i) => c === char && guessWord[i] !== char).length;
            const previousGuessesOfChar = Array.from(guessWord.slice(0, index)).filter((c, i) => c === char && dailyWord[i] !== char).length;

            if (previousGuessesOfChar < remainingTarget) {
                return 'present';
            }
        }
        return 'absent';
    };

    return (
        <div className="cipher-game-container">
            <div className="cipher-header">DAILY CIPHER</div>
            <div className="cipher-subtitle">6 attempts to decrypt the vault.</div>

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
                                    <div key={colIndex} className={classNames}>
                                        {char}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            {gameState === 'won' && (
                <div className="cipher-message success">
                    ACCESS GRANTED! Vault code is: vault
                </div>
            )}
            {gameState === 'lost' && (
                <div className="cipher-message error">
                    LOCKDOWN INITIATED.<br />The word was {dailyWord}. Try again tomorrow.
                </div>
            )}
        </div>
    );
}
