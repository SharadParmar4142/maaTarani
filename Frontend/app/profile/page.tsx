"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, company, token, isAuthenticated, isLoading, isAdmin, updateProfile } = useAuth();
  
  const [profile, setProfile] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    panNumber: company?.panNumber || "",
    companyPhone: company?.companyPhone || "",
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }

    if (!isLoading && isAdmin) {
      router.push("/admin/dashboard");
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    setProfile({
      name: user?.name || "",
      phone: user?.phone || "",
      email: user?.email || "",
      panNumber: company?.panNumber || "",
      companyPhone: company?.companyPhone || "",
    });
  }, [user, company]);

  const onProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const normalized = name === "panNumber" ? value.toUpperCase().replace(/\s+/g, "") : value;
    setProfile((prev) => ({ ...prev, [name]: normalized }));
  };

  const onProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage("");
    setMessageType("");

    try {
      await updateProfile({
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
        panNumber: profile.panNumber || null,
        companyPhone: profile.companyPhone || null,
      });
      setMessageType("success");
      setProfileMessage("Profile updated successfully.");
    } catch (err: any) {
      setMessageType("error");
      setProfileMessage(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  if (isLoading || !isAuthenticated || isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <Link 
            href="/dashboard"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="mb-6 text-sm text-gray-600">Update your profile information. Mobile and email cannot be changed.</p>

          <form onSubmit={onProfileSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input 
                name="name" 
                value={profile.name} 
                onChange={onProfileChange} 
                placeholder="Full name" 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent" 
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Mobile (Read-only)</label>
              <input 
                name="phone" 
                value={profile.phone} 
                placeholder="Phone" 
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 cursor-not-allowed" 
                disabled
                maxLength={10}
              />
              <p className="mt-1 text-xs text-gray-500">Your mobile number cannot be changed.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Email (Read-only)</label>
              <input 
                name="email" 
                value={profile.email} 
                placeholder="Email" 
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 cursor-not-allowed"
                disabled
                type="email" 
              />
              <p className="mt-1 text-xs text-gray-500">Your email address cannot be changed.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Phone (Optional)</label>
              <input 
                name="companyPhone" 
                value={profile.companyPhone} 
                onChange={onProfileChange} 
                placeholder="Company phone (optional)" 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PAN (Optional)</label>
              <input 
                name="panNumber" 
                value={profile.panNumber} 
                onChange={onProfileChange} 
                placeholder="PAN (optional)" 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent"
                maxLength={10}
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button 
                disabled={savingProfile} 
                className="rounded-lg bg-[#c41e3a] px-6 py-2 font-semibold text-white hover:bg-[#a01830] disabled:opacity-60 transition-all"
              >
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
              {profileMessage && (
                <span className={`text-sm ${messageType === "success" ? "text-green-700" : "text-red-700"}`}>
                  {profileMessage}
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
