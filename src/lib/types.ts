export interface PetProfile {
  id: string;
  name: string;
  breed: string;
  species: string;
  personality: string;
  traits: string[];
  imageUrl: string;
  voiceId?: string;
  introText: string;
  careAdvice: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'pet';
  content: string;
  audioUrl?: string;
  timestamp: number;
}

export interface VisionResult {
  labels: string[];
  breed: string;
  species: string;
  confidence: number;
}

export interface PersonalityResult {
  name: string;
  personality: string;
  traits: string[];
  introText: string;
  careAdvice: string[];
}
