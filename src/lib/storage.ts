import { User, Profile } from '../types/auth';
import { BusinessCard } from '../types/card';

const USERS_KEY = 'bca_users';
const PROFILES_KEY = 'bca_profiles';
const CARDS_KEY = ' business-card-architect-gallery-v2'; // Keeping existing key but making it manageable

export const db = {
  getUsers: (): User[] => JSON.parse(localStorage.getItem(USERS_KEY) || '[]'),
  saveUsers: (users: User[]) => localStorage.setItem(USERS_KEY, JSON.stringify(users)),
  
  getProfiles: (): Profile[] => JSON.parse(localStorage.getItem(PROFILES_KEY) || '[]'),
  saveProfiles: (profiles: Profile[]) => localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles)),
  
  getCards: (): BusinessCard[] => JSON.parse(localStorage.getItem(CARDS_KEY) || '[]'),
  saveCards: (cards: BusinessCard[]) => localStorage.setItem(CARDS_KEY, JSON.stringify(cards)),

  // Helper to sync guest cards to a user
  syncGuestCards: (profileId: string) => {
    const cards = db.getCards();
    const updatedCards = cards.map(card => {
      if (card.profileId === 'guest') {
        return { ...card, profileId };
      }
      return card;
    });
    db.saveCards(updatedCards);
  },

  updatePassword: (userId: string, newPasswordHash: string) => {
    const users = db.getUsers();
    const updatedUsers = users.map(u => u.id === userId ? { ...u, passwordHash: newPasswordHash } : u);
    db.saveUsers(updatedUsers);
  },

  deleteUser: (userId: string) => {
    // 1. Delete associated cards
    const profiles = db.getProfiles().filter(p => p.userId === userId);
    const profileIds = profiles.map(p => p.id);
    const remainingCards = db.getCards().filter(c => !profileIds.includes(c.profileId));
    db.saveCards(remainingCards);

    // 2. Delete associated profiles
    const remainingProfiles = db.getProfiles().filter(p => p.userId !== userId);
    db.saveProfiles(remainingProfiles);

    // 3. Delete user
    const remainingUsers = db.getUsers().filter(u => u.id !== userId);
    db.saveUsers(remainingUsers);
  }
};

// Simple pseudo-hashing for demo purposes
export const hashPassword = (password: string): string => {
  return btoa(password).split('').reverse().join('');
};
