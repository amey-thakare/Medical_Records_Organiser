import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';
import type { MedicalDocument, HealthParameter, UserProfile } from '../types';

// Mock User Type
export interface LocalUser {
  uid: string;
  email: string;
  password?: string;
}

// Config localforage
localforage.config({
  name: 'MedicalRecordsOrganiser',
  storeName: 'local_db'
});

export const localDb = {
  // --- AUTH ---
  async signup(email: string, password: string): Promise<LocalUser> {
    const users = (await localforage.getItem<LocalUser[]>('users')) || [];
    if (users.find(u => u.email === email)) {
      throw new Error('Email already in use');
    }
    
    const uid = uuidv4();
    const newUser: LocalUser = { uid, email, password };
    users.push(newUser);
    await localforage.setItem('users', users);
    
    // Auto login
    localStorage.setItem('currentUser', JSON.stringify({ uid: newUser.uid, email: newUser.email }));
    return newUser;
  },

  async login(email: string, password: string): Promise<LocalUser> {
    const users = (await localforage.getItem<LocalUser[]>('users')) || [];
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const safeUser = { uid: user.uid, email: user.email };
    localStorage.setItem('currentUser', JSON.stringify(safeUser));
    return safeUser;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('currentUser');
  },

  getCurrentUser(): LocalUser | null {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  },

  // --- PROFILE ---
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const profiles = (await localforage.getItem<Record<string, UserProfile>>('profiles')) || {};
    return profiles[uid] || null;
  },

  async updateUserProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
    const profiles = (await localforage.getItem<Record<string, UserProfile>>('profiles')) || {};
    profiles[uid] = { ...profiles[uid], ...profile } as UserProfile;
    await localforage.setItem('profiles', profiles);
  },

  // --- DOCUMENTS ---
  async addDocument(doc: Omit<MedicalDocument, 'id'>): Promise<string> {
    const docs = (await localforage.getItem<MedicalDocument[]>('documents')) || [];
    const newDoc: MedicalDocument = { ...doc, id: uuidv4() };
    docs.push(newDoc);
    await localforage.setItem('documents', docs);
    return newDoc.id;
  },

  async getDocuments(userId: string): Promise<MedicalDocument[]> {
    const docs = (await localforage.getItem<MedicalDocument[]>('documents')) || [];
    return docs.filter(d => d.userId === userId).sort((a, b) => b.uploadDate - a.uploadDate);
  },

  async getDocument(id: string): Promise<MedicalDocument | null> {
    const docs = (await localforage.getItem<MedicalDocument[]>('documents')) || [];
    return docs.find(d => d.id === id) || null;
  },

  // --- HEALTH PARAMETERS ---
  async addHealthParameters(params: Omit<HealthParameter, 'id'>[]): Promise<void> {
    const currentParams = (await localforage.getItem<HealthParameter[]>('healthParameters')) || [];
    const newParams = params.map(p => ({ ...p, id: uuidv4() }));
    await localforage.setItem('healthParameters', [...currentParams, ...newParams]);
  },

  async getHealthParameters(userId: string): Promise<HealthParameter[]> {
    const params = (await localforage.getItem<HealthParameter[]>('healthParameters')) || [];
    return params.filter(p => p.userId === userId).sort((a, b) => a.testDate - b.testDate);
  },

  // --- FILE STORAGE (MOCK) ---
  // Converts file to Base64 and stores it, returning a fake URL
  async uploadFile(file: File, _path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64data = reader.result as string;
          const fileId = uuidv4();
          await localforage.setItem(`file_${fileId}`, base64data);
          // Return a pseudo-url that can be used to retrieve the file
          resolve(`local://file_${fileId}`);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // Resolves local pseudo-urls to base64 data URLs
  async getFileUrl(url: string): Promise<string> {
    if (url.startsWith('local://')) {
      const fileId = url.replace('local://', '');
      const dataUrl = await localforage.getItem<string>(fileId);
      return dataUrl || '';
    }
    return url;
  }
};
