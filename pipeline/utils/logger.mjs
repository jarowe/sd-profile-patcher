/**
 * Simple pipeline logger with module context and warning counter.
 *
 * Format: [pipeline:{module}] {level}: {message}
 * Warnings are counted and a summary printed at end.
 * Errors cause the pipeline to exit with code 1.
 */

/** Global warning counters per module */
const warningCounts = new Map();

/** Whether an error has been logged (used for summary) */
let errorLogged = false;

/**
 * Create a logger scoped to a pipeline module.
 *
 * @param {string} module - Module name (e.g., "instagram", "exif-stripper")
 * @returns {{ info: Function, warn: Function, error: Function }}
 */
export function createLogger(module) {
  if (!warningCounts.has(module)) {
    warningCounts.set(module, 0);
  }

  return {
    /**
     * Log informational message.
     * @param {string} message
     */
    info(message) {
      console.log(`[pipeline:${module}] info: ${message}`);
    },

    /**
     * Log warning and increment warning counter.
     * @param {string} message
     */
    warn(message) {
      warningCounts.set(module, warningCounts.get(module) + 1);
      console.warn(`[pipeline:${module}] warn: ${message}`);
    },

    /**
     * Log error and exit with code 1.
     * @param {string} message
     */
    error(message) {
      errorLogged = true;
      console.error(`[pipeline:${module}] ERROR: ${message}`);
      // Don't exit immediately -- let caller decide (e.g., throw instead)
    },
  };
}

/**
 * Print a summary of all warnings across modules.
 * Call at the end of the pipeline run.
 */
export function printLogSummary() {
  let totalWarnings = 0;
  const entries = [];

  for (const [module, count] of warningCounts.entries()) {
    if (count > 0) {
      entries.push(`  ${module}: ${count} warning${count > 1 ? 's' : ''}`);
      totalWarnings += count;
    }
  }

  if (totalWarnings > 0) {
    console.log(`\n[pipeline] Summary: ${totalWarnings} warning${totalWarnings > 1 ? 's' : ''} total`);
    for (const entry of entries) {
      console.log(entry);
    }
  } else {
    console.log('\n[pipeline] Summary: 0 warnings');
  }

  if (errorLogged) {
    console.error('[pipeline] ERRORS were logged -- review output above');
  }
}

/**
 * Get warning count for a specific module (useful for testing).
 * @param {string} module
 * @returns {number}
 */
export function getWarningCount(module) {
  return warningCounts.get(module) || 0;
}

/**
 * Reset all counters (useful for testing).
 */
export function resetCounters() {
  warningCounts.clear();
  errorLogged = false;
}
