/**
 * Fuzzy Task Matching Algorithm
 * 
 * Finds existing tasks that match a priority text using keyword overlap.
 * Helps prevent creating duplicate tasks when user enters priorities
 * that already exist in their task list.
 */

import { Task } from '@/types';

// Common words to ignore when matching
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'to', 'for', 'my', 'on', 'at', 'in', 'of',
  'and', 'or', 'but', 'with', 'about', 'from', 'by', 'up', 'out',
  'do', 'get', 'make', 'take', 'go', 'need', 'have', 'want',
  'today', 'tomorrow', 'this', 'that', 'some', 'any', 'all',
]);

/**
 * Normalize text for comparison
 * - Lowercase
 * - Remove punctuation
 * - Split into words
 * - Remove stop words
 * - Sort alphabetically
 */
function normalizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 1 && !STOP_WORDS.has(word))
    .sort();
}

/**
 * Calculate similarity score between two word sets
 * Uses a Jaccard-like coefficient with partial word matching
 */
function calculateSimilarity(words1: string[], words2: string[]): number {
  if (words1.length === 0 || words2.length === 0) return 0;
  
  let matchCount = 0;
  
  for (const w1 of words1) {
    for (const w2 of words2) {
      // Full match
      if (w1 === w2) {
        matchCount += 1;
        break;
      }
      // Partial match (one contains the other, e.g., "call" matches "callback")
      if (w1.length >= 3 && w2.length >= 3) {
        if (w1.includes(w2) || w2.includes(w1)) {
          matchCount += 0.7; // Partial matches worth less
          break;
        }
      }
    }
  }
  
  // Normalize by the shorter list to favor matches with shorter priorities
  const divisor = Math.min(words1.length, words2.length);
  return matchCount / divisor;
}

export interface TaskMatch {
  task: Task;
  score: number;
  matchedWords: string[];
}

/**
 * Find tasks that match a given priority text
 * 
 * @param priorityText - The priority text entered by user
 * @param existingTasks - Array of existing tasks to search
 * @param threshold - Minimum similarity score (0-1), default 0.4
 * @returns Array of matching tasks sorted by score (highest first)
 */
export function findMatchingTasks(
  priorityText: string,
  existingTasks: Task[],
  threshold: number = 0.4
): TaskMatch[] {
  const priorityWords = normalizeText(priorityText);
  
  if (priorityWords.length === 0) return [];
  
  const matches: TaskMatch[] = [];
  
  for (const task of existingTasks) {
    // Skip completed tasks - we're looking for tasks to link, not completed ones
    if (task.completed) continue;
    
    const taskWords = normalizeText(task.title);
    const score = calculateSimilarity(priorityWords, taskWords);
    
    if (score >= threshold) {
      // Find which words actually matched for display
      const matchedWords = priorityWords.filter(pw => 
        taskWords.some(tw => tw === pw || tw.includes(pw) || pw.includes(tw))
      );
      
      matches.push({ task, score, matchedWords });
    }
  }
  
  // Sort by score descending
  return matches.sort((a, b) => b.score - a.score);
}

/**
 * Find the best single match for a priority
 * Returns null if no good match found
 */
export function findBestMatch(
  priorityText: string,
  existingTasks: Task[],
  threshold: number = 0.5
): TaskMatch | null {
  const matches = findMatchingTasks(priorityText, existingTasks, threshold);
  return matches.length > 0 ? matches[0] : null;
}

/**
 * Batch match multiple priorities against tasks
 * Returns an array of matches for each priority (or null if no match)
 */
export function batchMatchPriorities(
  priorities: string[],
  existingTasks: Task[],
  threshold: number = 0.5
): (TaskMatch | null)[] {
  return priorities.map(priority => 
    priority.trim() ? findBestMatch(priority, existingTasks, threshold) : null
  );
}
