export interface User {
  id: string;
  username: string;
  passwordHash: string; // Simplistic hash for simulation
}

export interface Profile {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  lastUsed?: number;
  lastState?: {
    name: string;
    profession: string;
    phones: string[];
    email: string;
    website: string;
    qrLink: string;
    layout: "standard" | "centered" | "split";
  };
}

export interface Session {
  user: User | null;
  profile: Profile | null;
}
