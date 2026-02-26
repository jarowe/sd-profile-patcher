import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Music2 } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useLocation } from 'react-router-dom';
import './GlobalPlayer.css';

export default function GlobalPlayer() {
    const { isPlaying, currentTrack, togglePlay, handleNext, handlePrevious } = useAudio();
    const location = useLocation();

    // Hide on home page - MusicCell handles it there
    if (!currentTrack || location.pathname === '/') return null;

    return (
        <div className="global-player">
            <div className="global-player-track-info">
                <div className={`global-art-icon ${isPlaying ? 'playing' : ''}`}>
                    <Music2 size={16} color="#fff" />
                </div>
                <div className="global-track-details">
                    <div className="global-song-title">{currentTrack.title}</div>
                    <div className="global-song-artist">{currentTrack.artist}</div>
                </div>
            </div>

            <div className="global-player-controls">
                <button onClick={handlePrevious} className="global-control-btn" aria-label="Previous track">
                    <SkipBack size={16} color="#fff" />
                </button>
                <button onClick={togglePlay} className="global-control-btn global-play-btn" aria-label={isPlaying ? 'Pause' : 'Play'}>
                    {isPlaying ? <Pause size={16} color="#000" /> : <Play size={16} color="#000" style={{ marginLeft: '2px' }} />}
                </button>
                <button onClick={handleNext} className="global-control-btn" aria-label="Next track">
                    <SkipForward size={16} color="#fff" />
                </button>
            </div>
        </div>
    );
}
