import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Trophy, Timer } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playClickSound } from '../utils/sounds';
import './SpeedPuzzle.css';

const COLORS = [
  { name: 'Purple', hex: '#7c3aed' },
  { name: 'Blue', hex: '#38bdf8' },
  { name: 'Pink', hex: '#f472b6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Gold', hex: '#fbbf24' },
];

const GAME_DURATION = 15; // seconds
const TOTAL_ROUNDS = 10;

export default function SpeedPuzzle({ onClose }) {
  const [phase, setPhase] = useState('ready'); // ready, playing, results
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [targetColor, setTargetColor] = useState(null);
  const [options, setOptions] = useState([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('jarowe_speed_highscore') || '0', 10);
  });
  const timerRef = useRef(null);

  const generateRound = useCallback(() => {
    const target = COLORS[Math.floor(Math.random() * COLORS.length)];
    // Shuffle colors for options, always include the target
    const shuffled = [...COLORS].sort(() => Math.random() - 0.5);
    setTargetColor(target);
    setOptions(shuffled);
  }, []);

  const startGame = useCallback(() => {
    setPhase('playing');
    setScore(0);
    setRound(0);
    setStreak(0);
    setBestStreak(0);
    setTimeLeft(GAME_DURATION);
    generateRound();
  }, [generateRound]);

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setPhase('results');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  useEffect(() => {
    if (phase === 'results') {
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('jarowe_speed_highscore', String(score));
        confetti({
          particleCount: 200,
          spread: 140,
          origin: { y: 0.5 },
          colors: ['#7c3aed', '#38bdf8', '#f472b6', '#fbbf24', '#22c55e'],
        });
      }
    }
  }, [phase, score, highScore]);

  const handleChoice = useCallback((color) => {
    if (phase !== 'playing') return;
    playClickSound();

    if (color.name === targetColor.name) {
      const streakBonus = streak >= 3 ? 2 : streak >= 5 ? 3 : 1;
      const timeBonus = timeLeft > 10 ? 2 : 1;
      const points = 10 * streakBonus * timeBonus;
      setScore(prev => prev + points);
      setStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak > bestStreak) setBestStreak(newStreak);
        return newStreak;
      });
      setFeedback({ type: 'correct', points });
    } else {
      setStreak(0);
      setFeedback({ type: 'wrong' });
    }

    setTimeout(() => setFeedback(null), 400);
    setRound(prev => prev + 1);
    generateRound();
  }, [phase, targetColor, streak, bestStreak, timeLeft, generateRound]);

  return (
    <motion.div
      className="speed-puzzle-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="speed-puzzle-container"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 150 }}
      >
        <button className="speed-close" onClick={onClose}><X size={20} /></button>

        {phase === 'ready' && (
          <div className="speed-ready">
            <div className="speed-icon-ring">
              <Zap size={40} color="#fbbf24" />
            </div>
            <h2>PRISM DASH</h2>
            <p>Match the color as fast as you can! You have {GAME_DURATION} seconds.</p>
            <p className="speed-highscore">High Score: {highScore}</p>
            <button className="speed-start-btn" onClick={startGame}>
              <Zap size={18} /> START
            </button>
          </div>
        )}

        {phase === 'playing' && (
          <div className="speed-playing">
            <div className="speed-hud">
              <div className="speed-hud-item">
                <Timer size={14} />
                <span className={timeLeft <= 5 ? 'time-critical' : ''}>{timeLeft}s</span>
              </div>
              <div className="speed-hud-item score">
                <Trophy size={14} />
                <span>{score}</span>
              </div>
              {streak >= 2 && (
                <motion.div
                  className="speed-streak"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  key={streak}
                >
                  {streak}x STREAK!
                </motion.div>
              )}
            </div>

            <div className="speed-prompt">
              <span>TAP</span>
              <div
                className="speed-target-swatch"
                style={{ background: targetColor?.hex }}
              />
              <span className="speed-target-name" style={{ color: targetColor?.hex }}>
                {targetColor?.name}
              </span>
            </div>

            <div className="speed-options">
              {options.map((color) => (
                <motion.button
                  key={color.name}
                  className="speed-option-btn"
                  style={{ background: color.hex }}
                  onClick={() => handleChoice(color)}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.08 }}
                />
              ))}
            </div>

            <AnimatePresence>
              {feedback && (
                <motion.div
                  className={`speed-feedback ${feedback.type}`}
                  initial={{ opacity: 0, scale: 0.5, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  {feedback.type === 'correct' ? `+${feedback.points}` : 'MISS'}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {phase === 'results' && (
          <div className="speed-results">
            <Trophy size={48} color="#fbbf24" />
            <h2>GAME OVER</h2>
            <div className="speed-final-score">{score}</div>
            <div className="speed-stats">
              <div>Rounds: {round}</div>
              <div>Best Streak: {bestStreak}x</div>
              {score >= highScore && score > 0 && (
                <div className="speed-new-record">NEW HIGH SCORE!</div>
              )}
            </div>
            <div className="speed-results-actions">
              <button className="speed-start-btn" onClick={startGame}>
                <Zap size={18} /> PLAY AGAIN
              </button>
              <button className="speed-done-btn" onClick={onClose}>Done</button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
