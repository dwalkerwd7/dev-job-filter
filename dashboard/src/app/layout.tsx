import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import TabNav from "@/components/TabNav"

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Dev Job Filter",
    description: "An open-source tool by DTS for unemployed software developers.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${geistMono.variable} antialiased`}
        >
            <body className="min-h-screen flex flex-col flex-1">
                <TabNav />
                {children}
                <footer className="bg-white text-center text-sm text-gray-400 m-w-screen border-t border-gray-100">
                    &copy; 2026 <a
                        href="https://derekwalker.tech"
                        target="_blank"
                        className="underline text-green-500 hover:text-green-700"
                    >
                        DTS
                    </a>. MIT License
                </footer>
            </body>
        </html>
    );
}
