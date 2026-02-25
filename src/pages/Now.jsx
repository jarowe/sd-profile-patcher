import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Activity, MapPin } from 'lucide-react';
import './Now.css';

export default function Now() {
    return (
        <div className="now-container">
            <motion.div
                className="now-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Link to="/" className="back-link glass-panel">
                    <ArrowLeft size={18} /> Back to Hub
                </Link>
                <h1>What I'm doing <span>now</span></h1>
                <p>A log of current focus, updated continually.</p>
            </motion.div>

            <div className="now-content">
                <motion.div
                    className="now-status glass-panel"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="pulse-indicator">
                        <span className="pulse"></span> Active
                    </div>
                    <h2><Activity size={24} /> Main Focus</h2>
                    <ul>
                        <li>Building WebAudio spatialization pipelines for generative AI interactions.</li>
                        <li>Leading the interactive frontend architecture at Starseed Labs.</li>
                        <li>Preparing for our next family worldschooling trip to Japan!</li>
                        <li>Exploring advanced React Server Components patterns.</li>
                    </ul>
                </motion.div>

                <motion.div
                    className="now-location glass-panel"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2><MapPin size={24} /> Location</h2>
                    <p>Currently based in the US, dreaming of the Alps.</p>
                </motion.div>

                <motion.div
                    className="now-reading glass-panel"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h2><Clock size={24} /> Reading & Listening</h2>
                    <p>Diving deep into "The Three-Body Problem" and listening to heavy synthwave retrowave playlists.</p>
                </motion.div>
            </div>
        </div>
    );
}
