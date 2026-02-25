import './Experience.css';
import { motion } from 'framer-motion';
import { Briefcase } from 'lucide-react';

const experiences = [
    {
        id: 1,
        title: 'Senior Manager, Digital Product Innovation',
        company: 'Elgato (Corsair)',
        date: 'Dec 2024 - Present',
        desc: 'Driving the innovation pipeline for Elgato’s digital ecosystem, including the Elgato Marketplace and OBS Studio plugin. Bridging the next frontier of creative tools and AI-driven solutions.'
    },
    {
        id: 2,
        title: 'Product Innovation Manager',
        company: 'Elgato',
        date: 'Jan 2022 - Dec 2024',
        desc: 'Owned product innovation, establishing the vision for the future success of all Marketplace products within the Elgato ecosystem.'
    },
    {
        id: 3,
        title: 'Director & Owner',
        company: 'Starseed Creative',
        date: 'Jan 2020 - Present',
        desc: 'A power hub for artists at their pinnacle. Collaborating with forward-thinking partners to craft extraordinary interactive experiences and award-winning 3D motion graphics.'
    },
    {
        id: 4,
        title: 'Head of Product',
        company: 'Visuals by Impulse',
        date: 'Jul 2019 - Feb 2021',
        desc: 'Reported directly to the CEO, overseeing the marketplace and customer experience. Guided the transition from a service-driven design shop to a scalable digital product marketplace.'
    },
    {
        id: 5,
        title: 'Co-Founder & Director',
        company: 'Doctrine Creative',
        date: 'Feb 2007 - Jan 2020',
        desc: 'Full-service creative design team delivering top-notch motion graphics and experience design for major players like Google, Disney, Nickelodeon, and Sony PlayStation.'
    }
];

export default function Experience() {
    return (
        <section className="experience-section">
            <div className="section-header">
                <h2>Professional Journey</h2>
                <p className="subtitle">15+ years of building products, brands, and teams.</p>
            </div>

            <div className="timeline">
                {experiences.map((exp, index) => (
                    <motion.div
                        key={exp.id}
                        className="timeline-item"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className="timeline-marker">
                            <div className="marker-core"></div>
                            <div className="marker-glow"></div>
                        </div>

                        <div className="timeline-content glass-panel">
                            <div className="content-header">
                                <div>
                                    <h3 className="timeline-title">{exp.title}</h3>
                                    <div className="timeline-company">{exp.company}</div>
                                </div>
                                <div className="timeline-date">{exp.date}</div>
                            </div>
                            <p className="timeline-desc">{exp.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
