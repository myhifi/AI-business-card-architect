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
  }
};

// Simple pseudo-hashing for demo purposes
export const hashPassword = (password: string): string => {
  return btoa(password).split('').reverse().join('');
};
