import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useConstellationStore } from '../store';
import mockData from '../data/mock-constellation.json';
import EntityChip from './EntityChip';
import './DetailPanel.css';

/** Type badge color mapping */
const TYPE_COLORS = {
  project: { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' },
  moment: { bg: 'rgba(248, 113, 113, 0.2)', text: '#f87171' },
  person: { bg: 'rgba(167, 139, 250, 0.2)', text: '#a78bfa' },
  place: { bg: 'rgba(45, 212, 191, 0.2)', text: '#2dd4bf' },
  idea: { bg: 'rgba(34, 211, 238, 0.2)', text: '#22d3ee' },
  milestone: { bg: 'rgba(251, 191, 36, 0.2)', text: '#fbbf24' },
};

/** Evidence type icons */
const EVIDENCE_ICONS = {
  temporal: 'calendar',
  place: 'map-pin',
  person: 'user',
  project: 'folder',
  idea: 'lightbulb',
};

/**
 * Format a date string to a human-readable format.
 */
function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Right sidebar detail panel for focused constellation node.
 * Slides in from right on desktop, bottom sheet on mobile.
 * Shows title, type badge, date, description, media, entity chips, and connection reasons.
 */
export default function DetailPanel() {
  const focusedNodeId = useConstellationStore((s) => s.focusedNodeId);
  const clearFocus = useConstellationStore((s) => s.clearFocus);
  const openLightbox = useConstellationStore((s) => s.openLightbox);

  const [becauseOpen, setBecauseOpen] = useState(false);

  // Find focused node and its edges
  const { node, edges, entities } = useMemo(() => {
    if (!focusedNodeId) return { node: null, edges: [], entities: [] };

    const foundNode = mockData.nodes.find((n) => n.id === focusedNodeId);
    if (!foundNode) return { node: null, edges: [], entities: [] };

    // Find all edges connected to this node
    const connectedEdges = mockData.edges.filter(
      (e) => e.source === focusedNodeId || e.target === focusedNodeId
    );

    // Extract unique entities (people, places, tags) from connected nodes
    const entityMap = new Map();
    for (const edge of connectedEdges) {
      const otherId =
        edge.source === focusedNodeId ? edge.target : edge.source;
      const otherNode = mockData.nodes.find((n) => n.id === otherId);
      if (!otherNode) continue;

      // Group by type + title
      const key = `${otherNode.type}:${otherNode.title}`;
      if (!entityMap.has(key)) {
        entityMap.set(key, {
          type: otherNode.type,
          label: otherNode.title,
          count: 0,
        });
      }
      entityMap.get(key).count += 1;
    }

    // Count total connections per entity across full graph (not just this node)
    const entityList = Array.from(entityMap.values()).map((entity) => {
      // Find how many total edges this entity's source node has
      const entityNode = mockData.nodes.find(
        (n) => n.title === entity.label && n.type === entity.type
      );
      if (entityNode) {
        const totalEdges = mockData.edges.filter(
          (e) => e.source === entityNode.id || e.target === entityNode.id
        );
        entity.count = totalEdges.length;
      }
      return entity;
    });

    // Sort: people first, then by count descending
    entityList.sort((a, b) => {
      const typeOrder = { person: 0, place: 1, project: 2, idea: 3, moment: 4, milestone: 5 };
      const aOrder = typeOrder[a.type] ?? 99;
      const bOrder = typeOrder[b.type] ?? 99;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return b.count - a.count;
    });

    return { node: foundNode, edges: connectedEdges, entities: entityList };
  }, [focusedNodeId]);

  // Reset because section when node changes
  useMemo(() => setBecauseOpen(false), [focusedNodeId]);

  const typeStyle = node ? TYPE_COLORS[node.type] || TYPE_COLORS.moment : {};

  return (
    <AnimatePresence>
      {node && (
        <motion.div
          className="detail-panel"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          drag={window.innerWidth <= 768 ? 'y' : false}
          dragConstraints={
            window.innerWidth <= 768
              ? { top: -window.innerHeight * 0.3, bottom: 0 }
              : undefined
          }
          dragElastic={0.1}
        >
          {/* Close button */}
          <button
            className="detail-panel__close"
            onClick={clearFocus}
            aria-label="Close detail panel"
          >
            <X size={18} />
          </button>

          {/* Mobile drag handle */}
          <div className="detail-panel__drag-handle" />

          {/* Header */}
          <div className="detail-panel__header">
            <div className="detail-panel__meta">
              <span
                className="detail-panel__type-badge"
                style={{
                  backgroundColor: typeStyle.bg,
                  color: typeStyle.text,
                }}
              >
                {node.type}
              </span>
              <span className="detail-panel__date">
                {formatDate(node.date)}
              </span>
            </div>
            <h2 className="detail-panel__title">{node.title}</h2>
            {node.epoch && (
              <span className="detail-panel__epoch">{node.epoch}</span>
            )}
          </div>

          {/* Description */}
          <div className="detail-panel__section">
            <p className="detail-panel__description">{node.description}</p>
          </div>

          {/* Media gallery */}
          {node.media && node.media.length > 0 && (
            <div className="detail-panel__section">
              <h3 className="detail-panel__section-title">Media</h3>
              <div className="detail-panel__media-grid">
                {node.media.map((item, idx) => (
                  <button
                    key={idx}
                    className="detail-panel__media-thumb"
                    onClick={() => openLightbox(node.media, idx)}
                    aria-label={`View media ${idx + 1}`}
                  >
                    <img
                      src={`${import.meta.env.BASE_URL}${item}`}
                      alt={`${node.title} media ${idx + 1}`}
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Placeholder for nodes with no media */}
          {(!node.media || node.media.length === 0) && (
            <div className="detail-panel__section">
              <div className="detail-panel__media-placeholder">
                No media yet
              </div>
            </div>
          )}

          {/* Entity chips */}
          {entities.length > 0 && (
            <div className="detail-panel__section">
              <h3 className="detail-panel__section-title">Connected</h3>
              <div className="detail-panel__chips">
                {entities.map((entity, i) => (
                  <EntityChip
                    key={`${entity.type}-${entity.label}-${i}`}
                    type={entity.type}
                    label={entity.label}
                    count={entity.count}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Because section */}
          {edges.length > 0 && (
            <div className="detail-panel__section">
              <button
                className="detail-panel__because-toggle"
                onClick={() => setBecauseOpen(!becauseOpen)}
                aria-expanded={becauseOpen}
              >
                <span>Because...</span>
                {becauseOpen ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>

              <AnimatePresence>
                {becauseOpen && (
                  <motion.div
                    className="detail-panel__because-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {edges.map((edge, i) => (
                      <div key={i} className="detail-panel__evidence">
                        {edge.evidence.map((ev, j) => (
                          <div
                            key={j}
                            className="detail-panel__evidence-item"
                          >
                            <span className="detail-panel__evidence-type">
                              {ev.type}
                            </span>
                            <span className="detail-panel__evidence-desc">
                              {ev.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
