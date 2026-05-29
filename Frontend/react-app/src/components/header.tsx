"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, UserPlus, LogOut, User, FileText, ChevronDown } from "lucide-react";
import { MobileMenu } from "./mobile-menu";

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const isCompany = String(user?.role || "").toLowerCase() === "company";
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-gray-100 border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo on the left */}
          <div className="shrink-0">
            <Link to="/">
              <img src="/images/logo.png" alt="MAA TARINI ENTERPRISES Logo" width={180} height={50} className="h-10 md:h-12 w-auto" />
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
                  to={isAdmin ? "/admin/dashboard" : isCompany ? "/company/dashboard" : "/dashboard"}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#c41e3a] hover:bg-[#a01830] rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/50 shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  {isAdmin ? "Admin Dashboard" : isCompany ? "Company Dashboard" : "Dashboard"}
                </Link>
                {!isAdmin && !isCompany && (
                  <Link
                    to="/purchase-order"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-all"
                  >
                    New PO
                  </Link>
                )}
                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
                  >
                    <User className="w-4 h-4 text-[#c41e3a]" />
                    <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-50">
                      <Link
                        to={isCompany ? "/company/profile" : "/profile"}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#c41e3a] border-b border-gray-100 first:rounded-t-lg transition-colors"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        Edit Profile
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setProfileMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 last:rounded-b-lg transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:text-[#c41e3a] hover:bg-[#fff6f7] rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/30"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#c41e3a] hover:bg-[#a01830] rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/50 shadow-sm">
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-gray-200 shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
                    <Link
                      to="/signup"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#c41e3a] rounded-t-xl transition-colors border-b border-gray-100"
                    >
                      <User className="w-4 h-4 text-[#c41e3a]" />
                      <div>
                        <p>Buyer Sign Up</p>
                        <p className="text-xs text-gray-400 font-normal">Create purchase orders</p>
                      </div>
                    </Link>
                    <Link
                      to="/company/signup"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#c41e3a] rounded-b-xl transition-colors"
                    >
                      <FileText className="w-4 h-4 text-[#c41e3a]" />
                      <div>
                        <p>Supplier Sign Up</p>
                        <p className="text-xs text-gray-400 font-normal">Join as a supplier/company</p>
                      </div>
                    </Link>
                  </div>
                </div>
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
