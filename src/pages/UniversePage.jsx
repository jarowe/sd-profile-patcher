import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, OrbitControls, Points, PointMaterial, Html, Float, useTexture } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useRef, useState, useMemo } from 'react';
import * as random from 'maath/random/dist/maath-random.esm';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './UniversePage.css';

function Starfield(props) {
    const ref = useRef();
    const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 10 }));
    useFrame((state, delta) => {
        ref.current.rotation.x -= delta / 10;
        ref.current.rotation.y -= delta / 15;
    });
    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial transparent color="#0ea5e9" size={0.05} sizeAttenuation={true} depthWrite={false} />
            </Points>
        </group>
    );
}

// Polaroids scattered through space around the scene
const polaroidData = [
    { id: 'p1', position: [-6, 3, -8], rotation: [0.1, 0.2, -0.1], src: '/jarowe/images/family-alps.jpg', aspect: 1, caption: 'Worldschooling \nEurope' },
    { id: 'p2', position: [5, 4, -6], rotation: [-0.1, -0.3, 0.2], src: '/jarowe/images/boys-selfie.jpg', aspect: 1, caption: 'My Favorite \nHumans' },
    { id: 'p3', position: [-4, -3, -5], rotation: [0.2, 0.1, 0.1], src: '/jarowe/images/TwitchCon-2025-Panel.jpg', aspect: 1.5, caption: 'TwitchCon \n2025' },
    { id: 'p4', position: [6, -2, -7], rotation: [-0.2, 0.4, -0.2], src: '/jarowe/images/couple-golden-hour.jpg', aspect: 1, caption: 'Golden Hour' },
    { id: 'p5', position: [2, 5, -9], rotation: [0.1, -0.1, 0.3], src: '/jarowe/images/rooftop-social.jpg', aspect: 1, caption: 'Making Connections' }
];

function Polaroid({ position, rotation, src, aspect, caption }) {
    const texture = useTexture(src);
    const [hovered, setHovered] = useState(false);
    const width = 2 * aspect;
    const height = 2;

    // Set cursor to pointer only if someone actively manages to reach it
    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1.5} position={position}>
            <group rotation={rotation}>
                <mesh
                    onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
                    onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
                    onClick={() => { document.body.style.cursor = 'auto'; window.open('https://www.instagram.com/jaredrowe/', '_blank'); }}
                >
                    {/* Polaroid Frame */}
                    <planeGeometry args={[width + 0.4, height + 0.8]} />
                    <meshStandardMaterial color="#fff" emissive={hovered ? '#fff' : '#000'} emissiveIntensity={hovered ? 0.3 : 0} />

                    {/* Photo */}
                    <mesh position={[0, 0.2, 0.01]}>
                        <planeGeometry args={[width, height]} />
                        <meshBasicMaterial map={texture} />
                    </mesh>

                    {/* Caption text via HTML */}
                    {hovered && (
                        <Html position={[0, -height / 2 - 0.2, 0.02]} center transform zIndexRange={[100, 0]}>
                            <div style={{
                                fontFamily: 'Comic Sans MS, sans-serif',
                                color: '#333',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                fontSize: '12px',
                                transform: 'rotate(-2deg)'
                            }}>
                                {caption.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                            </div>
                        </Html>
                    )}
                </mesh>
            </group>
        </Float>
    );
}

// "Planets" or interactive nodes connecting to different parts of the portfolio
const nodes = [
    { id: 'projects', position: [2, 1, -3], label: 'The Workshop', color: '#7c3aed', link: '/#projects' },
    { id: 'starseed', position: [-3, 2, -5], label: 'Starseed Labs', color: '#38bdf8', link: '/projects/starseed' },
    { id: 'music', position: [4, -1, -2], label: 'The Studio', color: '#a78bfa', link: '/' },
    { id: 'patcher', position: [-2, -2, -4], label: 'SD Patcher', color: '#f472b6', link: '/tools/sd-profile-patcher' }
];

function InteractiveNode({ position, label, color, link }) {
    const mesh = useRef();
    const [hovered, setHover] = useState(false);
    const navigate = useNavigate();

    useFrame((state, delta) => {
        mesh.current.rotation.x += delta * 0.5;
        mesh.current.rotation.y += delta * 0.5;
        if (hovered) {
            mesh.current.scale.setScalar(1.2 + Math.sin(state.clock.elapsedTime * 5) * 0.1);
        } else {
            mesh.current.scale.setScalar(1);
        }
    });

    return (
        <group position={position}>
            {/* Node Graphic */}
            <mesh
                ref={mesh}
                onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
                onPointerOut={(e) => { setHover(false); document.body.style.cursor = 'auto'; }}
                onClick={() => {
                    document.body.style.cursor = 'auto';
                    if (link.startsWith('/#')) {
                        navigate('/');
                        // Slight delay then scroll into view
                        setTimeout(() => {
                            const element = document.getElementById(link.substring(2));
                            if (element) element.scrollIntoView({ behavior: 'smooth' });
                        }, 500);
                    } else {
                        navigate(link);
                    }
                }}
            >
                <octahedronGeometry args={[0.5, 0]} />
                <meshStandardMaterial color={hovered ? '#fff' : color} wireframe={hovered} emissive={color} emissiveIntensity={hovered ? 2 : 0.5} />
            </mesh>

            {/* Label */}
            {hovered && (
                <Html position={[0, 0.8, 0]} center zIndexRange={[100, 0]}>
                    <div className="node-label">
                        {label}
                    </div>
                </Html>
            )}
        </group>
    );
}

export default function UniversePage() {
    return (
        <div className="universe-container">
            <motion.div
                className="universe-ui"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
            >
                <Link to="/" className="back-link glass-panel">
                    <ArrowLeft size={18} /> Exit Universe
                </Link>
                <div className="universe-title">
                    <h1>Starseed Universe</h1>
                    <p>Drag to explore. Click a node to travel.</p>
                </div>
            </motion.div>

            <div className="canvas-wrapper">
                <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={2} color="#7c3aed" />
                    <pointLight position={[-10, -10, -10]} intensity={1} color="#0ea5e9" />

                    <Starfield />
                    <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

                    {nodes.map(node => (
                        <InteractiveNode key={node.id} {...node} />
                    ))}

                    {polaroidData.map(data => (
                        <Polaroid key={data.id} {...data} />
                    ))}

                    <EffectComposer>
                        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.5} />
                        <Vignette eskil={false} offset={0.1} darkness={0.8} />
                    </EffectComposer>

                    <OrbitControls
                        enableZoom={true}
                        enablePan={false}
                        autoRotate={true}
                        autoRotateSpeed={0.5}
                        minDistance={2}
                        maxDistance={15}
                    />
                </Canvas>
            </div>

            {/* Floating UI overlay for tooltips from React state could go here */}
        </div>
    );
}
