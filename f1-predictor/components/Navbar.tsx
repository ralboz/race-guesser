'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/auth/AuthContext';

function MenuIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

export default function Navbar() {
    const pathname = usePathname();
    const { isLoggedIn, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [menuHeight, setMenuHeight] = useState(0);

    useEffect(() => {
        if (mobileMenuOpen && menuRef.current) {
            setMenuHeight(menuRef.current.scrollHeight);
        } else {
            setMenuHeight(0);
        }
    }, [mobileMenuOpen]);

    const links = isLoggedIn
        ? [
              { href: '/', name: 'Home' },
              { href: '/groups', name: 'Groups' },
              { href: '/leader-board', name: 'Leaderboard' },
              { href: '/global-leaderboard', name: 'Global Rankings' },
          ]
        : [
              { href: '/', name: 'Home' },
              { href: '/groups', name: 'Groups' },
              { href: '/global-leaderboard', name: 'Global Rankings' },
          ];

    const handleLogout = () => {
        logout();
    };

    const isActive = (href: string) => pathname === href;

    return (
        <nav
            className="relative"
            style={{ backgroundColor: 'var(--bg-nav)' }}
        >
            {/* nav bar */}
            <div className="flex h-16 items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-1">
                    <Link href="/" aria-label="Home" className="md:hidden">
                        <Image
                            src="/favicon.ico"
                            alt="Grid Guesser logo"
                            width={64}
                            height={64}
                            className="shrink-0"
                        />
                    </Link>
                    {/* Desktop*/}
                    <div className="hidden md:flex items-center">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`focus-ring relative mx-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                                    !isActive(link.href) ? 'hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]' : ''
                                }`}
                                style={{
                                    color: isActive(link.href)
                                        ? 'var(--text-primary)'
                                        : 'var(--text-secondary)',
                                }}
                            >
                                {link.name}
                                {isActive(link.href) && (
                                    <span
                                        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                                        style={{ backgroundColor: 'var(--color-accent)' }}
                                    />
                                )}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Desktop auth actions */}
                    <div className="hidden md:flex items-center gap-2 ml-4 pl-4"
                        style={{ borderLeft: '1px solid var(--bg-surface)' }}
                    >
                        {!isLoggedIn ? (
                            <>
                                <Link
                                    href="/sign-in"
                                    className="btn btn-ghost focus-ring text-sm"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/sign-up"
                                    className="btn btn-primary focus-ring text-sm"
                                >
                                    Signup
                                </Link>
                            </>
                        ) : (
                            <button
                                className="btn btn-ghost focus-ring text-sm"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        )}
                    </div>

                    {/* Hamburger menu mobile toggle */}
                    <button
                        className="focus-ring md:hidden flex items-center justify-center rounded"
                        style={{
                            width: '44px',
                            height: '44px',
                            color: 'var(--text-primary)',
                        }}
                        onClick={() => setMobileMenuOpen((prev) => !prev)}
                        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={mobileMenuOpen}
                    >
                        {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            <div
                className="md:hidden overflow-hidden"
                style={{
                    maxHeight: menuHeight,
                    opacity: mobileMenuOpen ? 1 : 0,
                    transition: 'max-height 0.15s ease, opacity 0.1s ease',
                    backgroundColor: 'var(--bg-nav)',
                }}
            >
                <div ref={menuRef} className="flex flex-col px-4 pb-4">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`focus-ring flex items-center rounded px-3 font-medium transition-colors ${
                                !isActive(link.href) ? 'hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]' : ''
                            }`}
                            style={{
                                minHeight: '44px',
                                color: isActive(link.href)
                                    ? 'var(--text-primary)'
                                    : 'var(--text-secondary)',
                                borderLeft: isActive(link.href)
                                    ? '3px solid var(--color-accent)'
                                    : '3px solid transparent',
                            }}
                        >
                            {link.name}
                        </Link>
                    ))}

                    <div
                        className="my-2 h-px"
                        style={{ backgroundColor: 'var(--bg-surface)' }}
                    />

                    {/* Mobile */}
                    {!isLoggedIn ? (
                        <>
                            <Link
                                href="/sign-in"
                                onClick={() => setMobileMenuOpen(false)}
                                className="focus-ring flex items-center rounded px-3 font-medium transition-colors"
                                style={{
                                    minHeight: '44px',
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                Login
                            </Link>
                            <Link
                                href="/sign-up"
                                onClick={() => setMobileMenuOpen(false)}
                                className="focus-ring flex items-center rounded px-3 font-medium transition-colors"
                                style={{
                                    minHeight: '44px',
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                Signup
                            </Link>
                        </>
                    ) : (
                        <button
                            className="focus-ring flex items-center rounded px-3 font-medium transition-colors text-left"
                            style={{
                                minHeight: '44px',
                                color: 'var(--text-secondary)',
                            }}
                            onClick={() => {
                                handleLogout();
                                setMobileMenuOpen(false);
                            }}
                        >
                            Logout
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
