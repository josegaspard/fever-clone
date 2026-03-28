'use client';

import React from 'react';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--fg)',
      }}
    >
      {children}
    </div>
  );
}
