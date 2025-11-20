"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

type HeaderProps = {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  subtitle?: string;
  totalBooks?: number;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
};

export default function Header({
  onMenuClick,
  showMenuButton = false,
  breadcrumbs,
  subtitle,
  totalBooks,
  searchTerm = "",
  onSearchChange,
}: HeaderProps) {
  return (
    <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm z-20">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded hover:bg-zinc-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Logo and breadcrumbs */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            <h1 className="text-xl font-bold text-zinc-900 hidden sm:block">Solvefy</h1>
          </Link>

          {breadcrumbs && breadcrumbs.length > 0 && (
            <>
              <div className="border-l h-6 hidden sm:block"></div>
              <div className="hidden sm:block">
                {subtitle && <div className="text-xs text-zinc-500">{subtitle}</div>}
                <div className="flex items-center gap-1 text-sm">
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                      {crumb.href ? (
                        <Link href={crumb.href} className="text-indigo-600 hover:underline">
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="font-semibold text-zinc-900">{crumb.label}</span>
                      )}
                      {index < breadcrumbs.length - 1 && (
                        <span className="text-zinc-400">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search bar - centered and wider */}
      {onSearchChange && (
        <div className="flex-1 max-w-2xl mx-4 hidden sm:block">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm sách..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-zinc-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      )}

      {/* User section */}
      <UserMenu totalBooks={totalBooks} />
    </header>
  );
}

function UserMenu({ totalBooks }: { totalBooks?: number }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    setShowMenu(false);
    router.push('/login');
  };

  return (
    <div className="flex items-center gap-3 relative">
      {totalBooks !== undefined && (
        <div className="hidden sm:block text-right">
          <div className="text-sm font-medium text-zinc-900">{user.fullName}</div>
          <div className="text-xs text-zinc-500">{totalBooks} sách</div>
        </div>
      )}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold hover:bg-indigo-200 transition-colors"
      >
        {user.avatar || user.fullName.charAt(0).toUpperCase()}
      </button>

      {/* User Dropdown Menu */}
      {showMenu && (
        <div className="absolute right-0 top-12 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="font-medium text-gray-900">{user.fullName}</p>
            <p className="text-sm text-gray-500">@{user.username}</p>
          </div>
          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
            onClick={() => setShowMenu(false)}
          >
            👤 Hồ sơ cá nhân
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition"
          >
            🚪 Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
