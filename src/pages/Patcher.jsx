import { useState, useRef } from 'react';
import JSZip from 'jszip';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle2, AlertTriangle, Settings2, RefreshCw, Layers } from 'lucide-react';
import './Patcher.css';

// ============================================================
// Patch Rules — single source of truth
// ============================================================
const stripKeys = (action, keys) => {
    if (!action.Settings) return false;
    let removed = false;
    for (const key of keys) {
        if (key in action.Settings) {
            delete action.Settings[key];
            removed = true;
        }
    }
    return removed;
};

const PATCH_RULES = [
    {
        id: 'wave-link',
        name: 'Wave Link 3',
        desc: 'Clear hardware IDs — channels auto-discover on any setup',
        defaultOn: true,
        group: 'recommended',
        match: (uuid) => uuid.startsWith('com.elgato.wave-link.'),
        patch: (action) => {
            if (Object.keys(action.Settings || {}).length > 0) {
                action.Settings = {};
                return true;
            }
            return false;
        }
    },
    {
        id: 'window-mover',
        name: 'Window Mover',
        desc: 'Clear monitor IDs — auto-detects your displays',
        defaultOn: true,
        group: 'recommended',
        match: (uuid) => uuid.startsWith('com.elgato.window-mover.'),
        patch: (action) => stripKeys(action, ['deviceName', 'manufacturerId', 'modelId', 'screenId', 'screenLabel'])
    },
    {
        id: 'weather',
        name: 'Weather',
        desc: 'Clear location & IP address — prompts to set location',
        defaultOn: true,
        group: 'recommended',
        match: (uuid) => uuid.startsWith('com.elgato.weather.'),
        patch: (action) => stripKeys(action, ['city', 'location', 'userLocation', 'forecastStartDateOffset', 'hScrollOffset', 'indicatorType', 'selection', 'temperature', 'show_units'])
    },
    {
        id: 'open-app',
        name: 'Open App',
        desc: 'Clear app paths — keeps app name, user re-selects the app',
        defaultOn: true,
        group: 'recommended',
        match: (uuid) => uuid === 'com.elgato.streamdeck.system.openapp',
        patch: (action) => stripKeys(action, ['bundle_id', 'bundle_path', 'exec', 'source'])
    },
    {
        id: 'system-vitals',
        name: 'System Vitals',
        desc: 'Clear custom IP & exe path — keeps all visual styling',
        defaultOn: true,
        group: 'recommended',
        match: (uuid) => uuid.startsWith('com.vivremotion.systemvitals.'),
        patch: (action) => stripKeys(action, ['my_custom_ip', 'my_execute_url'])
    },
    {
        id: 'discord-voice',
        name: 'Discord Voice',
        desc: 'Clear channel ID — user re-selects voice channel',
        defaultOn: true,
        group: 'recommended',
        match: (uuid) => uuid === 'com.elgato.discord.channel.voice',
        patch: (action) => stripKeys(action, ['channel'])
    },
    {
        id: 'soundboard',
        name: 'Soundboard',
        desc: 'Clear audio paths — only needed if files aren\'t bundled in the profile',
        defaultOn: false,
        group: 'optional',
        match: (uuid) => uuid.startsWith('com.elgato.streamdeck.soundboard.'),
        patch: (action) => stripKeys(action, ['path'])
    },
    {
        id: 'open',
        name: 'Open (File/Folder)',
        desc: 'Clear file & folder paths — user re-selects the target',
        defaultOn: false,
        group: 'optional',
        match: (uuid) => uuid === 'com.elgato.streamdeck.system.open',
        patch: (action) => stripKeys(action, ['path'])
    },
];

const UNIVERSAL_PLUGINS = 'Spotify, Hotkeys, Multimedia, Clocks, Website, Volume Controller, Text/Emoji, Discord Mute/Deafen';

export default function Patcher() {
    const [enabledRules, setEnabledRules] = useState(() => {
        const defaultSet = new Set();
        PATCH_RULES.forEach(r => r.defaultOn && defaultSet.add(r.id));
        return defaultSet;
    });

    const [isHovered, setIsHovered] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, processing, done, error
    const [errorMsg, setErrorMsg] = useState("");
    const [patchResults, setPatchResults] = useState(null);
    const [logs, setLogs] = useState([]);

    const fileInputRef = useRef(null);

    const toggleRule = (id) => {
        const newSet = new Set(enabledRules);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setEnabledRules(newSet);
    };

    const logMessage = (msg, type = 'info') => {
        setLogs(prev => [...prev, { id: Date.now() + Math.random(), msg, type }]);
    };

    const patchActionRecursive = (action, coord, label, rulesSet) => {
        const patches = [];
        const uuid = action.UUID || '';

        // Check against enabled rules
        let appliedRule = null;
        for (const rule of PATCH_RULES) {
            if (rulesSet.has(rule.id) && rule.match(uuid)) {
                if (rule.patch(action)) {
                    appliedRule = { ruleId: rule.id, ruleName: rule.name };
                }
                break; // Matched a rule
            }
        }

        if (appliedRule) {
            patches.push({ ...appliedRule, coord, label, action });
        }

        // Recurse sub-actions
        if (Array.isArray(action.Actions)) {
            for (const subGroup of action.Actions) {
                if (subGroup && Array.isArray(subGroup.Actions)) {
                    for (const subAction of subGroup.Actions) {
                        patches.push(...patchActionRecursive(subAction, coord, label, rulesSet));
                    }
                }
                if (subGroup && subGroup.UUID) {
                    patches.push(...patchActionRecursive(subGroup, coord, label, rulesSet));
                }
            }
        }

        return patches;
    };

    const processFile = async (file) => {
        if (!file.name.endsWith('.streamDeckProfile')) {
            setStatus('error');
            setErrorMsg("Please drop a valid .streamDeckProfile export.");
            return;
        }

        if (enabledRules.size === 0) {
            setStatus('error');
            setErrorMsg("Enable at least one patch rule below.");
            return;
        }

        setStatus('processing');
        setLogs([]);
        setPatchResults(null);
        logMessage(`Loading ${file.name} (${(file.size / 1024).toFixed(0)} KB)...`);

        try {
            const buf = await file.arrayBuffer();
            const zip = await JSZip.loadAsync(buf);

            const manifestPaths = Object.keys(zip.files).filter(
                (p) => p.endsWith('manifest.json') && !zip.files[p].dir
            );
            logMessage(`Found ${manifestPaths.length} manifest(s)`);

            const allPatches = [];

            for (const mfPath of manifestPaths) {
                const raw = await zip.file(mfPath).async('string');
                let manifest;
                try {
                    manifest = JSON.parse(raw);
                } catch {
                    continue;
                }

                if (!manifest.Controllers) continue;

                let filePatched = 0;

                for (const controller of manifest.Controllers) {
                    if (!controller.Actions) continue;
                    const label = controller.Type === 'Encoder' ? 'dial' : 'key';

                    for (const [coord, action] of Object.entries(controller.Actions)) {
                        const patches = patchActionRecursive(action, coord, label, enabledRules);
                        if (patches.length > 0) {
                            allPatches.push(...patches);
                            filePatched += patches.length;
                        }
                    }
                }

                if (filePatched > 0) {
                    zip.file(mfPath, JSON.stringify(manifest));
                }
            }

            if (allPatches.length === 0) {
                logMessage('No machine-specific settings found. Profile is already clean!', 'success');
                setStatus('done');
                setPatchResults({ count: 0, outName: null });
                return;
            }

            // Group patches by rule
            const byRule = {};
            for (const p of allPatches) {
                if (!byRule[p.ruleId]) byRule[p.ruleId] = { name: p.ruleName, patches: [] };
                byRule[p.ruleId].patches.push(p);
            }

            for (const [ruleId, group] of Object.entries(byRule)) {
                logMessage(`${group.name} (${group.patches.length})`, 'category');
                for (const p of group.patches) {
                    const title = (p.action.States && p.action.States[0] && p.action.States[0].Title) || '';
                    const cleanTitle = title.replace(/\n/g, ' ');
                    const shortUuid = (p.action.UUID || '').split('.').slice(-1)[0];
                    const titleStr = cleanTitle ? ` "${cleanTitle}"` : '';
                    logMessage(`  [${p.coord}] ${p.label} | .${shortUuid}${titleStr}`, 'patched');
                }
            }

            logMessage('Repackaging...', 'info');
            const outBuf = await zip.generateAsync({ type: 'blob' });
            const baseName = file.name.replace(/\.streamDeckProfile$/, '');
            const outName = `${baseName}_patched.streamDeckProfile`;

            const url = URL.createObjectURL(outBuf);
            const a = document.createElement('a');
            a.href = url;
            a.download = outName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            const summaryParts = Object.values(byRule).map(g => `${g.patches.length} ${g.name}`);
            logMessage(`Done: ${summaryParts.join(', ')}`, 'success');

            setStatus('done');
            setPatchResults({ count: allPatches.length, outName });

        } catch (err) {
            setStatus('error');
            setErrorMsg(err.message);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsHovered(false);
        if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
    };

    // Group rules for UI
    const recommendedRules = PATCH_RULES.filter(r => r.group === 'recommended');
    const optionalRules = PATCH_RULES.filter(r => r.group === 'optional');

    return (
        <div className="patcher-container">
            <div className="patcher-header">
                <h1>Stream Deck Profile Patcher</h1>
                <p className="subtitle">Share exported profiles that just work on any machine.</p>
            </div>

            <div
                className={`drop-zone glass-panel ${isHovered ? 'hover' : ''} ${status}`}
                onDragOver={(e) => { e.preventDefault(); setIsHovered(true); }}
                onDragLeave={() => setIsHovered(false)}
                onDrop={handleDrop}
                onClick={() => { if (status !== 'processing') fileInputRef.current.click() }}
            >
                <AnimatePresence mode="wait">
                    {status === 'idle' && (
                        <motion.div key="idle" className="drop-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <UploadCloud size={48} className="drop-icon" />
                            <div className="drop-main">Drop a <strong>.streamDeckProfile</strong> here</div>
                            <div className="drop-sub">or click to browse</div>
                        </motion.div>
                    )}
                    {status === 'processing' && (
                        <motion.div key="processing" className="drop-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                                <RefreshCw size={48} className="drop-icon processing-icon" />
                            </motion.div>
                            <div className="drop-main">Patching Profile</div>
                            <div className="drop-sub">Please wait...</div>
                        </motion.div>
                    )}
                    {status === 'done' && (
                        <motion.div key="done" className="drop-content success-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <CheckCircle2 size={48} className="drop-icon success-icon" />
                            <div className="drop-main">
                                {patchResults?.count === 0 ? 'Already Clean!' : `${patchResults?.count} action(s) patched`}
                            </div>
                            <div className="drop-sub">
                                {patchResults?.outName ? `Downloading ${patchResults.outName}` : 'No machine-specific config found'}
                            </div>
                        </motion.div>
                    )}
                    {status === 'error' && (
                        <motion.div key="error" className="drop-content error-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <AlertTriangle size={48} className="drop-icon error-icon" />
                            <div className="drop-main">Something went wrong</div>
                            <div className="drop-sub">{errorMsg}</div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <input type="file" ref={fileInputRef} onChange={(e) => { if (e.target.files[0]) processFile(e.target.files[0]) }} accept=".streamDeckProfile" style={{ display: 'none' }} />
            </div>

            {status !== 'idle' && status !== 'processing' && (
                <div className="center-btn">
                    <button className="btn-secondary" onClick={() => setStatus('idle')}>Patch Another</button>
                </div>
            )}

            {logs.length > 0 && (
                <div className="terminal-log glass-panel">
                    {logs.map((log) => (
                        <div key={log.id} className={`log-line type-${log.type}`}>
                            {log.msg}
                        </div>
                    ))}
                </div>
            )}

            <details className="options-panel glass-panel">
                <summary>
                    <div className="summary-left"><Settings2 size={16} /> Patch Options</div>
                    <div className="summary-right">{enabledRules.size} of {PATCH_RULES.length} enabled</div>
                </summary>
                <div className="options-body">
                    <div className="options-divider"></div>
                    <div className="options-section-label">Enabled by default</div>
                    {recommendedRules.map(rule => (
                        <label key={rule.id} className={`opt-row ${!enabledRules.has(rule.id) ? 'dimmed' : ''}`}>
                            <input type="checkbox" checked={enabledRules.has(rule.id)} onChange={() => toggleRule(rule.id)} />
                            <div className="opt-text">
                                <div className="opt-name">{rule.name}</div>
                                <div className="opt-desc">{rule.desc}</div>
                            </div>
                        </label>
                    ))}
                    <div className="options-divider"></div>
                    <div className="options-section-label">Optional</div>
                    {optionalRules.map(rule => (
                        <label key={rule.id} className={`opt-row ${!enabledRules.has(rule.id) ? 'dimmed' : ''}`}>
                            <input type="checkbox" checked={enabledRules.has(rule.id)} onChange={() => toggleRule(rule.id)} />
                            <div className="opt-text">
                                <div className="opt-name">{rule.name}</div>
                                <div className="opt-desc">{rule.desc}</div>
                            </div>
                        </label>
                    ))}
                    <div className="options-divider"></div>
                    <div className="universal-note">
                        <Layers size={14} style={{ display: 'inline', marginBottom: '-2px' }} /> <strong>Already Universal:</strong> {UNIVERSAL_PLUGINS}
                    </div>
                </div>
            </details>
        </div>
    );
}
