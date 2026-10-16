'use client';

import React from 'react';
import { NotebookProvider } from '@/lib/notebook-context';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <NotebookProvider>{children}</NotebookProvider>;
}
