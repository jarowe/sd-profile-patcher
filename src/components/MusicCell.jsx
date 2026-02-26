import { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, Music2, Headphones } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import './MusicCell.css';

export default function MusicCell() {
    const { isPlaying, currentTrackIndex, currentTrack, sunoTracks, togglePlay, handleNext } = useAudio();
    const [isSpotifyActive, setIsSpotifyActive] = useState(false);
    const [spotifyData, setSpotifyData] = useState(null);

    // Fetch Spotify status
    useEffect(() => {
        const checkSpotify = async () => {
            try {
                // Future API route to hit the Cloudflare Worker
                setIsSpotifyActive(false); // Default to Suno for now
            } catch (err) {
                console.error("Failed to check Spotify status", err);
            }
        };

        checkSpotify();
        const interval = setInterval(checkSpotify, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    if (isSpotifyActive && spotifyData) {
        return (
            <div className="bento-content music-spotify-active" style={{ backgroundImage: `url(${spotifyData.albumArt})` }}>
                <div className="spotify-overlay">
                    <div className="music-art">
                        <Headphones size={24} color="#1db954" />
                    </div>
                    <div>
                        <div className="now-playing" style={{ color: '#1db954' }}>NOW PLAYING ON SPOTIFY</div>
                        <div className="song-title">{spotifyData.title}</div>
                        <div className="song-artist">{spotifyData.artist}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bento-content music-suno-active">
            <div className="music-top">
                <div className={`music-art-icon ${isPlaying ? 'playing' : ''}`}>
                    <Music2 size={32} color="#fff" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="now-playing">NOW SPINNING</div>
                    <a href="https://suno.com/@jarowe" target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: '#a1a1aa', textDecoration: 'none', borderBottom: '1px dotted #a1a1aa' }}>@jarowe on Suno</a>
                </div>
            </div>

            <div className="music-meta">
                <div className="song-title">{currentTrack?.title || "No Track Selected"}</div>
                <div className="song-artist">{currentTrack?.artist || "--"}</div>
                <div style={{ fontSize: '0.7rem', color: '#777', marginTop: '4px' }}>{currentTrackIndex + 1} OF {sunoTracks.length}</div>
            </div>

            <div className="music-controls-bar">
                <button onClick={togglePlay} className="control-btn play-btn" aria-label={isPlaying ? 'Pause' : 'Play'}>
                    {isPlaying ? <Pause size={20} color="#000" /> : <Play size={20} color="#000" style={{ marginLeft: '2px' }} />}
                </button>
                <button onClick={handleNext} className="control-btn next-btn" aria-label="Next track">
                    <SkipForward size={20} color="#fff" />
                </button>
            </div>
        </div>
    );
}
