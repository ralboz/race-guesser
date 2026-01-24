'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/auth/AuthContext';

export default function Navbar() {
    const pathname = usePathname();
    const { isLoggedIn, logout } = useAuth();
    let links = [
        { href: '/', name: 'Home' },
        { href: '/groups', name: 'Groups' },
    ];

    if(isLoggedIn)
    {
        links = [
            { href: '/groups', name: 'Groups' },
            { href: '/leader-board', name: 'Leaderboard' }
        ];
    }

    const handleLogout = () => {
        logout();
    }

    return (
        <nav className="flex bg-[202020] h-16 items-center justify-between">
            <div className="flex">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`mx-4 p-2 rounded  ${pathname === link.href ? 'text-blue-600' : ''}`}
                    >
                        {link.name}
                    </Link>
                ))}
            </div>
            {!isLoggedIn ?
                <div className="flex">
                    <Link href="/auth/login" className={`mx-4 p-2 rounded  ${pathname === "login" ? 'text-blue-600' : ''}`}>Login</Link>
                    <Link href="/auth/login" className={`mx-4 p-2 rounded  ${pathname === "sign-up" ? 'text-blue-600' : ''}`}>Signup</Link>
                </div>
                :
                <button className={`mx-4 p-2 rounded  ${pathname === "logout" ? 'text-blue-600' : ''}`} onClick={handleLogout}>Logout</button>
            }
        </nav>
    );
}
