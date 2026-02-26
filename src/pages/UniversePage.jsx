import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, OrbitControls, Points, PointMaterial, Html, Float, useTexture, Line, MeshTransmissionMaterial } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { useRef, useState, Suspense, useMemo } from 'react';
import { HalfFloatType, Vector3, MathUtils } from 'three';
import * as random from 'maath/random/dist/maath-random.esm';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { playHoverSound, playClickSound } from '../utils/sounds';
import './UniversePage.css';

function Starfield(props) {
    const ref = useRef();
    const [sphere] = useState(() => random.inSphere(new Float32Array(8000), { radius: 12 }));
    useFrame((state, delta) => {
        ref.current.rotation.x -= delta / 15;
        ref.current.rotation.y -= delta / 20;
    });
    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial transparent color="#0ea5e9" size={0.03} sizeAttenuation={true} depthWrite={false} />
            </Points>
        </group>
    );
}

const BASE = import.meta.env.BASE_URL;
const polaroidData = [
    { id: 'p1', position: [-6, 3, -8], rotation: [0.1, 0.2, -0.1], src: `${BASE}images/family-alps.jpg`, aspect: 1, caption: 'Worldschooling \nEurope' },
    { id: 'p2', position: [5, 4, -6], rotation: [-0.1, -0.3, 0.2], src: `${BASE}images/boys-selfie.jpg`, aspect: 1, caption: 'My Favorite \nHumans' },
    { id: 'p3', position: [-4, -3, -5], rotation: [0.2, 0.1, 0.1], src: `${BASE}images/TwitchCon-2025-Panel.jpg`, aspect: 1.5, caption: 'TwitchCon \n2025' },
    { id: 'p4', position: [6, -2, -7], rotation: [-0.2, 0.4, -0.2], src: `${BASE}images/couple-golden-hour.jpg`, aspect: 1, caption: 'Golden Hour' },
    { id: 'p5', position: [2, 5, -9], rotation: [0.1, -0.1, 0.3], src: `${BASE}images/rooftop-social.jpg`, aspect: 1, caption: 'Making Connections' }
];

function Polaroid({ position, rotation, src, aspect, caption }) {
    const texture = useTexture(src);
    const [hovered, setHovered] = useState(false);
    const width = 2 * aspect;
    const height = 2;

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1.5} position={position}>
            <group rotation={rotation}>
                <mesh
                    onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; playHoverSound(); }}
                    onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
                    onClick={() => { playClickSound(); document.body.style.cursor = 'auto'; window.open('https://www.instagram.com/jaredrowe/', '_blank'); }}
                >
                    <planeGeometry args={[width + 0.4, height + 0.8]} />
                    <meshStandardMaterial color="#fff" emissive={hovered ? '#fff' : '#000'} emissiveIntensity={hovered ? 0.3 : 0} />

                    <mesh position={[0, 0.2, 0.01]}>
                        <planeGeometry args={[width, height]} />
                        <meshBasicMaterial map={texture} />
                    </mesh>

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

// Complex Nodes mapping to different zones
const nodes = [
    { id: 'projects', label: 'The Workshop', color: '#7c3aed', link: '/workshop', speed: 0.2, orbitRadius: 4, tilt: [0.1, 0, 0.2] },
    { id: 'starseed', label: 'Starseed Labs', color: '#38bdf8', link: '/projects/starseed', speed: 0.3, orbitRadius: 5, tilt: [-0.2, 0, 0.1] },
    { id: 'patcher', label: 'SD Patcher', color: '#f472b6', link: '/tools/sd-profile-patcher', speed: 0.15, orbitRadius: 3.5, tilt: [0.3, 0, -0.1] },
    { id: 'garden', label: 'Brain Dump', color: '#10b981', link: '/garden', speed: 0.25, orbitRadius: 4.5, tilt: [-0.1, 0, -0.2] },
    { id: 'now', label: 'Now', color: '#f59e0b', link: '/now', speed: 0.1, orbitRadius: 5.5, tilt: [0.2, 0, 0.3] },
    { id: 'favorites', label: 'Into Right Now', color: '#ec4899', link: '/favorites', speed: 0.18, orbitRadius: 6, tilt: [0.15, 0, -0.15] },
    { id: 'vault', label: 'The Vault', color: '#ef4444', link: '/vault', speed: 0.08, orbitRadius: 7, tilt: [-0.1, 0, 0.2] },
];

function CoreNode() {
    const mesh = useRef();
    useFrame((state, delta) => {
        mesh.current.rotation.x += delta * 0.2;
        mesh.current.rotation.y += delta * 0.3;
        mesh.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.05);
    });

    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <mesh ref={mesh}>
                <icosahedronGeometry args={[1, 1]} />
                <meshStandardMaterial
                    color="#fff"
                    emissive="#fff"
                    emissiveIntensity={1}
                    wireframe
                />

                {/* Glowing inner core */}
                <mesh scale={0.8}>
                    <sphereGeometry args={[1, 32, 32]} />
                    <MeshTransmissionMaterial
                        backside
                        thickness={1}
                        roughness={0}
                        transmission={1}
                        ior={1.5}
                        chromaticAberration={1}
                        anisotropy={0.1}
                    />
                </mesh>
            </mesh>
        </Float>
    );
}

function InteractiveNode({ id, label, color, link, speed, orbitRadius, tilt, onDiscover }) {
    const group = useRef();
    const mesh = useRef();
    const [hovered, setHover] = useState(false);
    const navigate = useNavigate();
    const { camera } = useThree();

    const initialAngle = useMemo(() => Math.random() * Math.PI * 2, []);

    useFrame((state, delta) => {
        // Orbital logic
        const t = state.clock.elapsedTime * speed + initialAngle;
        const x = Math.cos(t) * orbitRadius;
        const z = Math.sin(t) * orbitRadius;

        group.current.position.set(x, 0, z);

        mesh.current.rotation.x += delta;
        mesh.current.rotation.y += delta;

        if (hovered) {
            mesh.current.scale.lerp(new Vector3(1.5, 1.5, 1.5), 0.1);
        } else {
            mesh.current.scale.lerp(new Vector3(1, 1, 1), 0.1);
        }
    });

    return (
        <group rotation={tilt}>
            {/* Draw a static glowing orbital ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[orbitRadius, 0.01, 16, 100]} />
                <meshBasicMaterial color={color} transparent opacity={0.3} />
            </mesh>

            <group ref={group}>
                <mesh
                    ref={mesh}
                    onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; playHoverSound(); if (onDiscover) onDiscover(id); }}
                    onPointerOut={(e) => { setHover(false); document.body.style.cursor = 'auto'; }}
                    onClick={(e) => {
                        e.stopPropagation();
                        playClickSound();
                        document.body.style.cursor = 'auto';

                        // Zoom in effect
                        gsap.to(camera.position, {
                            x: group.current.position.x * 1.5,
                            y: group.current.position.y * 1.5,
                            z: group.current.position.z * 1.5,
                            duration: 1,
                            ease: 'power3.inOut',
                            onComplete: () => {
                                if (link.startsWith('/#')) {
                                    navigate('/');
                                    setTimeout(() => {
                                        const element = document.getElementById(link.substring(2));
                                        if (element) element.scrollIntoView({ behavior: 'smooth' });
                                    }, 500);
                                } else {
                                    navigate(link);
                                }
                            }
                        });
                    }}
                >
                    <octahedronGeometry args={[0.6, 0]} />
                    <meshStandardMaterial
                        color={hovered ? '#fff' : color}
                        wireframe={hovered}
                        emissive={color}
                        emissiveIntensity={hovered ? 2 : 0.8}
                    />
                </mesh>

                {hovered && (
                    <Html position={[0, 1.2, 0]} center zIndexRange={[100, 0]}>
                        <div className="node-label" style={{
                            background: 'rgba(0,0,0,0.8)',
                            border: `1px solid ${color}`,
                            padding: '8px 16px',
                            borderRadius: '20px',
                            color: '#fff',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                            boxShadow: `0 0 10px ${color}`
                        }}>
                            {label}
                        </div>
                    </Html>
                )}
            </group>
        </group>
    );
}

export default function UniversePage() {
    const [discovered, setDiscovered] = useState(() => {
        const saved = localStorage.getItem('jarowe_discovered_nodes');
        return saved ? JSON.parse(saved) : [];
    });

    const handleNodeDiscover = (nodeId) => {
        setDiscovered(prev => {
            if (prev.includes(nodeId)) return prev;
            const next = [...prev, nodeId];
            localStorage.setItem('jarowe_discovered_nodes', JSON.stringify(next));
            return next;
        });
    };

    return (
        <div className="universe-container">
            <motion.div
                className="universe-ui"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
            >
                <Link to="/" className="back-link" onClick={() => playClickSound()}>
                    <ArrowLeft size={18} /> BACK TO HUB
                </Link>
                <div className="universe-title">
                    <h1 style={{ textShadow: '0 0 20px rgba(124, 58, 237, 0.8)' }}>The Constellation</h1>
                    <p>Everything I'm building, all connected. Hover to discover. Click to travel.</p>
                    <div className="discovery-counter">
                        {discovered.length} / {nodes.length} discovered
                    </div>
                </div>
            </motion.div>

            <div className="canvas-wrapper">
                <Canvas camera={{ position: [0, 2, 10], fov: 60 }}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={2} color="#7c3aed" />
                    <pointLight position={[-10, -10, -10]} intensity={1} color="#0ea5e9" />

                    <Starfield />
                    <Stars radius={50} depth={50} count={5000} factor={6} saturation={1} fade speed={2} />

                    <CoreNode />

                    {nodes.map(node => (
                        <InteractiveNode key={node.id} {...node} onDiscover={handleNodeDiscover} />
                    ))}

                    <Suspense fallback={null}>
                        {polaroidData.map(data => (
                            <Polaroid key={data.id} {...data} />
                        ))}
                    </Suspense>

                    <EffectComposer frameBufferType={HalfFloatType} disableNormalPass>
                        <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} intensity={2.5} mipmapBlur />
                        <ChromaticAberration offset={[0.002, 0.002]} />
                        <Vignette eskil={false} offset={0.1} darkness={0.9} />
                    </EffectComposer>

                    <OrbitControls
                        enableZoom={true}
                        enablePan={false}
                        autoRotate={true}
                        autoRotateSpeed={0.5}
                        minDistance={3}
                        maxDistance={20}
                    />
                </Canvas>
            </div>
        </div>
    );
}
