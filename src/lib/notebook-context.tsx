'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ProfileId, NotesConflict } from '@/types';
import {
  getActiveProfileId,
  setActiveProfileId,
  getProfileNames,
  updateProfileNames,
  getCapabilityToken,
  setCapabilityToken,
  getShareableLink,
  generateSecureToken,
  syncWithCloud,
  rotateNotebookLink,
  subscribeToSync,
  subscribeToConflict,
  subscribeToStorage,
  getSyncStatus,
  SyncStatus,
} from './storage';
import { isSupabaseConfigured } from './supabase';

interface NotebookContextType {
  activeProfile: ProfileId;
  profileNames: { profile_a: string; profile_b: string };
  activeProfileName: string;
  token: string | null;
  shareUrl: string;
  syncStatus: SyncStatus;
  isCloudConnected: boolean;
  notesConflict: NotesConflict | null;
  switchProfile: (profileId: ProfileId) => void;
  updateNames: (nameA: string, nameB: string) => Promise<void>;
  createSharedNotebook: () => Promise<string>;
  connectWithToken: (token: string) => Promise<boolean>;
  rotateLink: () => Promise<string | null>;
  resolveConflict: () => void;
}

const NotebookContext = createContext<NotebookContextType | undefined>(undefined);

export function NotebookProvider({ children }: { children: React.ReactNode }) {
  const [activeProfile, setActiveProfileState] = useState<ProfileId>(() => getActiveProfileId());
  const [profileNames, setProfileNamesState] = useState<{ profile_a: string; profile_b: string }>(() => getProfileNames());
  const [token, setTokenState] = useState<string | null>(() => getCapabilityToken());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => getSyncStatus());
  const [notesConflict, setNotesConflict] = useState<NotesConflict | null>(null);

  // Sync state from storage on mount
  useEffect(() => {
    const t = getCapabilityToken();

    // If token exists and Supabase is configured, trigger cloud sync
    if (t && isSupabaseConfigured()) {
      syncWithCloud(t, false).catch((err) => {
        console.warn('Initial cloud sync notice:', err);
      });
    }

    // Subscribe to sync status changes
    const unsubSync = subscribeToSync((st) => setSyncStatus(st));

    // Subscribe to storage changes
    const unsubStorage = subscribeToStorage(() => {
      setActiveProfileState(getActiveProfileId());
      setProfileNamesState(getProfileNames());
      setTokenState(getCapabilityToken());
    });

    // Subscribe to notes conflict notifications
    const unsubConflict = subscribeToConflict((conflict) => {
      setNotesConflict(conflict);
    });

    return () => {
      unsubSync();
      unsubStorage();
      unsubConflict();
    };
  }, []);

  const switchProfile = useCallback((profileId: ProfileId) => {
    setActiveProfileId(profileId);
    setActiveProfileState(profileId);
  }, []);

  const updateNames = useCallback(async (nameA: string, nameB: string) => {
    await updateProfileNames(nameA, nameB);
    setProfileNamesState({ profile_a: nameA, profile_b: nameB });
  }, []);

  const createSharedNotebook = useCallback(async (): Promise<string> => {
    const newToken = generateSecureToken();
    setCapabilityToken(newToken);
    setTokenState(newToken);

    if (isSupabaseConfigured()) {
      await syncWithCloud(newToken, true);
    }

    return newToken;
  }, []);

  const connectWithToken = useCallback(async (newToken: string): Promise<boolean> => {
    const clean = newToken.trim();
    if (clean.length < 8) return false;

    setCapabilityToken(clean);
    setTokenState(clean);

    if (isSupabaseConfigured()) {
      const res = await syncWithCloud(clean, false);
      return res.success;
    }
    return true;
  }, []);

  const rotateLink = useCallback(async (): Promise<string | null> => {
    if (!token) return null;
    const res = await rotateNotebookLink(token);
    if (res.success && res.newToken) {
      setTokenState(res.newToken);
      return res.newToken;
    }
    return null;
  }, [token]);

  const resolveConflict = useCallback(() => {
    setNotesConflict(null);
  }, []);

  const activeProfileName = activeProfile === 'profile_b' ? profileNames.profile_b : profileNames.profile_a;
  const shareUrl = token ? getShareableLink(token) : '';
  const isCloudConnected = Boolean(token && isSupabaseConfigured());

  return (
    <NotebookContext.Provider
      value={{
        activeProfile,
        profileNames,
        activeProfileName,
        token,
        shareUrl,
        syncStatus,
        isCloudConnected,
        notesConflict,
        switchProfile,
        updateNames,
        createSharedNotebook,
        connectWithToken,
        rotateLink,
        resolveConflict,
      }}
    >
      {children}
    </NotebookContext.Provider>
  );
}

export function useNotebook() {
  const context = useContext(NotebookContext);
  if (!context) {
    throw new Error('useNotebook must be used within a NotebookProvider');
  }
  return context;
}
