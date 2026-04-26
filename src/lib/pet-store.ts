import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PetProfile, VisionResult, ChatMessage } from './types';

interface PetState {
  // Current scan results
  currentVisionResult: VisionResult | null;
  currentImageUrl: string | null;
  
  // Pet profiles
  pets: PetProfile[];
  currentPetId: string | null;
  
  // Chat
  chatMessages: Record<string, ChatMessage[]>;

  // Voice cache (blob URLs, session-only — NOT persisted)
  voiceCache: Record<string, string>;
  
  // Actions
  setVisionResult: (result: VisionResult, imageUrl: string) => void;
  addPet: (pet: PetProfile) => void;
  setCurrentPet: (id: string) => void;
  getCurrentPet: () => PetProfile | null;
  addChatMessage: (petId: string, message: ChatMessage) => void;
  getChatMessages: (petId: string) => ChatMessage[];
  setVoiceCache: (petId: string, audioUrl: string) => void;
  getVoiceCache: (petId: string) => string | null;
  reset: () => void;
}

export const usePetStore = create<PetState>()(
  persist(
    (set, get) => ({
      currentVisionResult: null,
      currentImageUrl: null,
      pets: [],
      currentPetId: null,
      chatMessages: {},
      voiceCache: {},

      setVisionResult: (result, imageUrl) =>
        set({ currentVisionResult: result, currentImageUrl: imageUrl }),

      addPet: (pet) =>
        set((state) => ({
          pets: [...state.pets, pet],
          currentPetId: pet.id,
        })),

      setCurrentPet: (id) => set({ currentPetId: id }),

      getCurrentPet: () => {
        const state = get();
        return state.pets.find((p) => p.id === state.currentPetId) || null;
      },

      addChatMessage: (petId, message) =>
        set((state) => ({
          chatMessages: {
            ...state.chatMessages,
            [petId]: [...(state.chatMessages[petId] || []), message],
          },
        })),

      getChatMessages: (petId) => get().chatMessages[petId] || [],

      setVoiceCache: (petId, audioUrl) =>
        set((state) => ({
          voiceCache: { ...state.voiceCache, [petId]: audioUrl },
        })),

      getVoiceCache: (petId) => get().voiceCache[petId] || null,

      reset: () =>
        set({
          currentVisionResult: null,
          currentImageUrl: null,
          pets: [],
          currentPetId: null,
          chatMessages: {},
          voiceCache: {},
        }),
    }),
    {
      name: 'petspeak-store',
      partialize: (state) => ({
        pets: state.pets,
        currentPetId: state.currentPetId,
        chatMessages: state.chatMessages,
      }),
    }
  )
);
