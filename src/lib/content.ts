import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  type Timestamp
} from 'firebase/firestore';

// Type definitions based on Firestore schema

export interface Person {
  id: string;
  name: string;
}

export interface Review {
  id: string;
  title: string;
  name: string;
  review: string; // HTML content
  reviewDate: string;
  timePublished: Timestamp;
  groups: Person[];
  writers: Person[];
  directors: Person[];
  actors: Person[];
  theater: Person; // {id, name}
  city: Person; // {id, name}
  year: number;
  images: string[];
}

export interface Interview {
  id: string;
  title: string;
  interview: string; // HTML content
  interviewDate: string;
  timePublished: Timestamp;
  persons: Person[];
  year: number;
  images: string[];
}

export type ContentItem = (Review & { type: 'review' }) | (Interview & { type: 'interview' });

/**
 * Get all reviews ordered by timePublished descending
 */
export async function getAllReviews(): Promise<Review[]> {
  const q = query(
    collection(db, 'reviews'),
    orderBy('timePublished', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Review[];
}

/**
 * Get a single review by ID
 */
export async function getReviewById(id: string): Promise<Review | null> {
  const docRef = doc(db, 'reviews', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Review;
}

/**
 * Get all interviews ordered by timePublished descending
 */
export async function getAllInterviews(): Promise<Interview[]> {
  const q = query(
    collection(db, 'interviews'),
    orderBy('timePublished', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

/**
 * Get a single interview by ID
 */
export async function getInterviewById(id: string): Promise<Interview | null> {
  const docRef = doc(db, 'interviews', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Interview;
}

/**
 * Get recent content combining reviews and interviews, sorted by date
 * Returns the most recent items up to the specified limit
 */
export async function getRecentContent(limitCount: number = 8): Promise<ContentItem[]> {
  // Fetch both collections in parallel
  const reviewsQuery = query(
    collection(db, 'reviews'),
    orderBy('timePublished', 'desc'),
    limit(limitCount)
  );
  const interviewsQuery = query(
    collection(db, 'interviews'),
    orderBy('timePublished', 'desc'),
    limit(limitCount)
  );

  const [reviewsSnapshot, interviewsSnapshot] = await Promise.all([
    getDocs(reviewsQuery),
    getDocs(interviewsQuery),
  ]);

  // Map reviews with type annotation
  const reviews: ContentItem[] = reviewsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    type: 'review' as const,
  })) as ContentItem[];

  // Map interviews with type annotation
  const interviews: ContentItem[] = interviewsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    type: 'interview' as const,
  })) as ContentItem[];

  // Combine and sort by timePublished descending
  const combined = [...reviews, ...interviews].sort((a, b) => {
    const timeA = a.timePublished?.toMillis?.() || 0;
    const timeB = b.timePublished?.toMillis?.() || 0;
    return timeB - timeA;
  });

  // Return limited results
  return combined.slice(0, limitCount);
}

/**
 * Get recent reviews only (for home page)
 */
export async function getRecentReviews(limitCount: number = 4): Promise<Review[]> {
  const q = query(
    collection(db, 'reviews'),
    orderBy('timePublished', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Review[];
}

/**
 * Get recent interviews only (for home page)
 */
export async function getRecentInterviews(limitCount: number = 4): Promise<Interview[]> {
  const q = query(
    collection(db, 'interviews'),
    orderBy('timePublished', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}
