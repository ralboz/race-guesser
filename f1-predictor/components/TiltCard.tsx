'use client';

import { useRef, useEffect, type ReactNode, type CSSProperties } from 'react';

type TiltCardProps = {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
    accentLine?: boolean;
};

export default function TiltCard({ children, className = '', style, accentLine = false }: TiltCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);
    const rafId = useRef(0);
    const hovering = useRef(false);

    useEffect(() => {
        const el = cardRef.current;
        if (!el) return;

        const onMove = (e: MouseEvent) => {
            cancelAnimationFrame(rafId.current);
            rafId.current = requestAnimationFrame(() => {
                const rect = el.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;

                const tiltX = (y - 0.5) * -4.2;
                const tiltY = (x - 0.5) * 4.2;

                el.style.transition = 'none';
                el.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;

                const glow = glowRef.current;
                if (glow) {
                    glow.style.opacity = '1';
                    glow.style.background = `radial-gradient(circle 75px at ${x * 100}% ${y * 100}%, rgba(59,91,219,0.12) 0%, transparent 70%)`;
                }
            });
        };

        const onEnter = () => { hovering.current = true; };

        const onLeave = () => {
            hovering.current = false;
            cancelAnimationFrame(rafId.current);
            el.style.transition = 'transform 0.4s ease-out';
            el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
            const glow = glowRef.current;
            if (glow) glow.style.opacity = '0';
        };

        el.addEventListener('mousemove', onMove);
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);

        return () => {
            cancelAnimationFrame(rafId.current);
            el.removeEventListener('mousemove', onMove);
            el.removeEventListener('mouseenter', onEnter);
            el.removeEventListener('mouseleave', onLeave);
        };
    }, []);

    return (
        <div
            ref={cardRef}
            className={className}
            style={{
                ...style,
                willChange: 'transform',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {accentLine && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent, var(--color-accent), transparent)',
                        zIndex: 1,
                    }}
                />
            )}
            <div
                ref={glowRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                }}
            />
            <div style={{ position: 'relative' }}>{children}</div>
        </div>
    );
}
