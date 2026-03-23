"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, UserPlus, LogOut, User, FileText } from "lucide-react";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-700 hover:text-[#c41e3a] focus:outline-none"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-64 bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <span className="font-semibold text-gray-900">Menu</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-700 hover:text-[#c41e3a]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="p-4 space-y-4">
              {/* User Info (if logged in) */}
              {isAuthenticated && (
                <div className="pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-[#c41e3a]" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-600">{user?.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <nav className="space-y-2">
                <a
                  href="#who-we-are"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-sm font-semibold text-gray-700 hover:text-[#c41e3a] hover:bg-[#fff6f7] rounded-lg transition-all"
                >
                  WHO WE ARE
                </a>
                <a
                  href="#our-expertise"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-sm font-semibold text-gray-700 hover:text-[#c41e3a] hover:bg-[#fff6f7] rounded-lg transition-all"
                >
                  OUR EXPERTISE
                </a>
                <a
                  href="#what-we-offer"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-sm font-semibold text-gray-700 hover:text-[#c41e3a] hover:bg-[#fff6f7] rounded-lg transition-all"
                >
                  WHAT WE OFFER
                </a>
              </nav>

              {/* Auth Buttons */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      href={isAdmin ? "/admin/dashboard" : "/dashboard"}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-white bg-[#c41e3a] hover:bg-[#a01830] rounded-lg transition-all shadow-sm"
                    >
                      <FileText className="w-4 h-4" />
                      {isAdmin ? "Admin Dashboard" : "Dashboard"}
                    </Link>
                    {!isAdmin && (
                      <Link
                        href="/purchase-order"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-all"
                      >
                        <FileText className="w-4 h-4" />
                        Create PO
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-white bg-gray-700 hover:bg-gray-800 rounded-lg transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-gray-700 hover:text-[#c41e3a] hover:bg-[#fff6f7] rounded-lg transition-all border border-gray-300"
                    >
                      <LogIn className="w-4 h-4" />
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-white bg-[#c41e3a] hover:bg-[#a01830] rounded-lg transition-all shadow-sm"
                    >
                      <UserPlus className="w-4 h-4" />
                      Sign Up
                    </Link>
                    <Link
                      href="/admin/signup"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-all"
                    >
                      Admin Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
