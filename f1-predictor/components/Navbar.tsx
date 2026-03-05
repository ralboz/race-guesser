'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/auth/AuthContext';
import { HiMenu, HiX } from 'react-icons/hi';

export default function Navbar() {
    const pathname = usePathname();
    const { isLoggedIn, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const links = isLoggedIn
        ? [
              { href: '/', name: 'Home' },
              { href: '/groups', name: 'Groups' },
              { href: '/leader-board', name: 'Leaderboard' },
          ]
        : [
              { href: '/', name: 'Home' },
              { href: '/groups', name: 'Groups' },
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
                        {mobileMenuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div
                    className="md:hidden flex flex-col px-4 pb-4"
                    style={{ backgroundColor: 'var(--bg-nav)' }}
                >
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
            )}
        </nav>
    );
}
