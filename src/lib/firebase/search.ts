/**
 * Search Service
 *
 * Search infrastructure for the Quizy ecosystem.
 * Uses Firestore range queries for prefix-based user search.
 */

import { queryDocuments, where, orderBy, limit } from './firestore';
import { classifyError } from './firebase-error';
import type { UserDocument } from './types';

export interface SearchResult<T> {
  items: T[];
  query: string;
  hasMore: boolean;
}

/**
 * Search users by username prefix.
 * Uses Firestore >= / < range query for prefix matching.
 */
export async function searchUsers(
  queryStr: string,
  maxResults = 10,
): Promise<SearchResult<UserDocument>> {
  if (!queryStr || queryStr.length < 2) {
    return { items: [], query: queryStr, hasMore: false };
  }

  const normalized = queryStr.toLowerCase().trim();
  // Firestore prefix range: >= "abc" && < "abd"
  const end = normalized.slice(0, -1) + String.fromCharCode(
    normalized.charCodeAt(normalized.length - 1) + 1,
  );

  try {
    const results = await queryDocuments<UserDocument>(
      'users',
      where('username', '>=', normalized),
      where('username', '<', end),
      orderBy('username'),
      limit(maxResults + 1), // fetch 1 extra to check hasMore
    );

    return {
      items: results.slice(0, maxResults),
      query: queryStr,
      hasMore: results.length > maxResults,
    };
  } catch (error) {
    throw classifyError(error);
  }
}

/**
 * Search friends locally (subcollection is typically small).
 * Filters in-memory for instant results.
 */
export function filterFriendsLocal<T extends { displayName?: string; username?: string }>(
  friends: T[],
  query: string,
): T[] {
  if (!query || query.length < 1) return friends;

  const normalized = query.toLowerCase().trim();

  return friends.filter((friend) => {
    const name = (friend.displayName ?? '').toLowerCase();
    const username = (friend.username ?? '').toLowerCase();
    return name.includes(normalized) || username.includes(normalized);
  });
}
