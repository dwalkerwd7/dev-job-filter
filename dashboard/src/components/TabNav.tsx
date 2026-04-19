"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

export default function TabNav() {
    const pathname = usePathname();

    const tabs = [
        { label: "Jobs", href: "/" },
        { label: "Pipeline", href: "/pipeline" }
    ];

    return (
        <nav className="flex border-b border-gray-200 bg-white">
            {tabs.map(tab => {
                const active = pathname === tab.href
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={`px-10 py-4 text-lg font-medium transition-colors
                            ${active ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}
                        `}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}
