"use client";

import Link from "next/link";

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/80 backdrop-blur-xl lg:hidden">

      <div className="flex justify-around py-4">

        <Link href="/feed">
          Feed
        </Link>

        <Link href="#">
          Explore
        </Link>

        <Link href="#">
          Profile
        </Link>

      </div>

    </nav>
  );
}