'use client';

/**
 * components/Navbar.tsx
 * Top navigation bar with branding and auth controls.
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Aperture, LogIn, LogOut, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const [dropOpen, setDropOpen] = React.useState(false);
  const dropRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      {/* Brand */}
      <Link href="/" className="navbar-brand-link" aria-label="Go to home page">
        <div className="navbar-brand">
          <Aperture size={22} className="brand-icon" />
          <span className="brand-name">
            Pixel<span className="brand-accent">Shift</span>
          </span>
          <span className="brand-badge">BETA</span>
        </div>
      </Link>

      {/* Auth section */}
      <div className="navbar-auth">
        {status === 'loading' && (
          <div className="auth-skeleton" aria-label="Loading session" />
        )}

        {status === 'unauthenticated' && (
          <button
            id="navbar-signin-btn"
            className="btn-secondary navbar-signin"
            onClick={() => signIn('google', { callbackUrl: '/' })}
          >
            <LogIn size={15} />
            Sign in
          </button>
        )}

        {status === 'authenticated' && session?.user && (
          <div className="user-menu" ref={dropRef}>
            <button
              id="user-menu-toggle"
              className="user-menu-trigger"
              onClick={() => setDropOpen((o) => !o)}
              aria-expanded={dropOpen}
              aria-haspopup="true"
            >
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? 'User'}
                  width={30}
                  height={30}
                  className="user-avatar"
                />
              ) : (
                <div className="user-avatar-fallback">
                  {(session.user.name ?? 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="user-name">
                {session.user.name?.split(' ')[0]}
              </span>
              <ChevronDown
                size={14}
                className={`user-chevron ${dropOpen ? 'rotated' : ''}`}
              />
            </button>

            {dropOpen && (
              <div className="user-dropdown" role="menu">
                <div className="dropdown-user-info">
                  <span className="dropdown-username">{session.user.name}</span>
                  <span className="dropdown-email">{session.user.email}</span>
                </div>
                <div className="dropdown-divider" />
                <button
                  id="signout-btn"
                  className="dropdown-item signout-item"
                  role="menuitem"
                  onClick={() => { setDropOpen(false); signOut(); }}
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
