"use client";

import { FaCopy } from "react-icons/fa";
import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <button onClick={handleCopy} title="Copy group ID" aria-label="Copy group ID" className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity relative">
            <FaCopy />
            {copied && <span className="text-sm ml-1 absolute bottom--5" style={{ color: 'var(--color-success)'}}>Copied!</span>}
        </button>
    );
}
