"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, UserPlus, LogOut, User, FileText } from "lucide-react";
import { MobileMenu } from "./mobile-menu";

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-gray-100 border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo on the left */}
          <div className="flex-shrink-0">
            <Link href="/">
              <Image
                src="/images/logo.png"
                alt="MAA TARINI ENTERPRISES Logo"
                width={180}
                height={50}
                className="h-10 md:h-12 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation and Auth buttons */}
          <div className="hidden md:flex items-center gap-4">
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-4">
              <a
                href="#who-we-are"
                className="text-sm font-semibold uppercase tracking-wider text-gray-700 hover:text-[#c41e3a] px-3 py-2 rounded hover:bg-[#fff6f7] transition-all focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/30"
              >
                WHO WE ARE
              </a>
              <a
                href="#our-expertise"
                className="text-sm font-semibold uppercase tracking-wider text-gray-700 hover:text-[#c41e3a] px-3 py-2 rounded hover:bg-[#fff6f7] transition-all focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/30"
              >
                OUR EXPERTISE
              </a>
              <a
                href="#what-we-offer"
                className="text-sm font-semibold uppercase tracking-wider text-gray-700 hover:text-[#c41e3a] px-3 py-2 rounded hover:bg-[#fff6f7] transition-all focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/30"
              >
                WHAT WE OFFER
              </a>
            </nav>

            {/* Divider */}
            <div className="hidden md:block h-8 w-px bg-gray-300"></div>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/purchase-order"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#c41e3a] hover:bg-[#a01830] rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/50 shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  Purchase Order
                </Link>
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
                  <User className="w-4 h-4 text-[#c41e3a]" />
                  <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-700 hover:bg-gray-800 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:text-[#c41e3a] hover:bg-[#fff6f7] rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/30"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#c41e3a] hover:bg-[#a01830] rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/50 shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          <MobileMenu />
        </div>
      </div>
    </header>
  );
} 
