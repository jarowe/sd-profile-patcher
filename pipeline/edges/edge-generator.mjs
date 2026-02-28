/**
 * Evidence-based edge generation for the constellation pipeline.
 *
 * Generates edges between canonical nodes using signal weight calculations.
 * Each edge includes an evidence array showing "Because..." reasons with
 * type, signal, description, and weight.
 *
 * Pruning: Limits to top 6 edges per node per signal type (PIPE-05).
 * Output: Sorted deterministically for byte-identical results.
 */

import { calculateSignals, EDGE_THRESHOLD } from './signals.mjs';

/**
 * Generate evidence-based edges between all node pairs.
 *
 * Algorithm:
 * 1. Sort nodes by id for deterministic pair ordering
 * 2. For each unique pair (i < j), calculate signal weights
 * 3. If total weight >= EDGE_THRESHOLD (0.5), create edge
 * 4. Prune: keep top 6 edges per node per signal type
 * 5. Populate node connections arrays
 * 6. Sort edges by source + target for determinism
 *
 * @param {Object[]} nodes - Array of canonical nodes
 * @returns {Promise<{edges: Object[], stats: {totalPairs: number, edgesCreated: number, edgesPruned: number}}>}
 */
export async function generateEdges(nodes) {
  // Sort nodes by id for deterministic pair ordering
  const sorted = [...nodes].sort((a, b) => a.id.localeCompare(b.id));

  const allEdges = [];
  let totalPairs = 0;

  // Generate edges for all unique pairs
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      totalPairs++;

      const signals = calculateSignals(sorted[i], sorted[j]);
      if (signals.length === 0) continue;

      const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
      if (totalWeight < EDGE_THRESHOLD) continue;

      allEdges.push({
        source: sorted[i].id,
        target: sorted[j].id,
        weight: Number(totalWeight.toFixed(2)),
        evidence: signals.map(s => ({
          type: s.type,
          signal: s.signal,
          description: s.description,
          weight: s.weight,
        })),
      });
    }
  }

  const edgesBeforePruning = allEdges.length;

  // ---- Pruning: top 6 edges per node per signal type ----
  // For each node, for each signal type, keep only top 6 highest-weighted edges
  const MAX_EDGES_PER_TYPE = 6;

  // Build index: nodeId -> signalType -> [edge indices]
  const nodeSignalEdges = new Map();

  for (let edgeIdx = 0; edgeIdx < allEdges.length; edgeIdx++) {
    const edge = allEdges[edgeIdx];
    const nodes_involved = [edge.source, edge.target];

    for (const nodeId of nodes_involved) {
      if (!nodeSignalEdges.has(nodeId)) {
        nodeSignalEdges.set(nodeId, new Map());
      }
      const signalMap = nodeSignalEdges.get(nodeId);

      for (const ev of edge.evidence) {
        if (!signalMap.has(ev.signal)) {
          signalMap.set(ev.signal, []);
        }
        signalMap.get(ev.signal).push(edgeIdx);
      }
    }
  }

  // Mark edges to remove
  const edgesToRemove = new Set();

  for (const [, signalMap] of nodeSignalEdges) {
    for (const [, edgeIndices] of signalMap) {
      if (edgeIndices.length <= MAX_EDGES_PER_TYPE) continue;

      // Sort by edge weight (highest first), keep top 6
      const sorted_indices = [...edgeIndices].sort(
        (a, b) => allEdges[b].weight - allEdges[a].weight
      );
      for (let k = MAX_EDGES_PER_TYPE; k < sorted_indices.length; k++) {
        edgesToRemove.add(sorted_indices[k]);
      }
    }
  }

  // Filter pruned edges
  const edges = allEdges.filter((_, idx) => !edgesToRemove.has(idx));

  // Sort edges deterministically by source + target
  edges.sort((a, b) => {
    const cmp = a.source.localeCompare(b.source);
    if (cmp !== 0) return cmp;
    return a.target.localeCompare(b.target);
  });

  // ---- Populate node connections arrays ----
  const connectionMap = new Map();
  for (const edge of edges) {
    if (!connectionMap.has(edge.source)) connectionMap.set(edge.source, new Set());
    if (!connectionMap.has(edge.target)) connectionMap.set(edge.target, new Set());
    connectionMap.get(edge.source).add(edge.target);
    connectionMap.get(edge.target).add(edge.source);
  }

  for (const node of nodes) {
    const conns = connectionMap.get(node.id);
    node.connections = conns ? [...conns].sort() : [];
  }

  const edgesPruned = edgesBeforePruning - edges.length;

  return {
    edges,
    stats: {
      totalPairs,
      edgesCreated: edges.length,
      edgesPruned,
    },
  };
}
