"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminSignupPage() {
  const router = useRouter();
  const { registerAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    adminSignupKey: "",
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await registerAdmin(formData);
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Admin signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-gray-900">Admin Sign Up</h1>
        <p className="mt-2 text-sm text-gray-500">Create an admin account to review purchase orders.</p>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input name="name" value={formData.name} onChange={onChange} placeholder="Full name" className="w-full rounded-lg border border-gray-300 px-3 py-2" required />
          <input name="phone" value={formData.phone} onChange={onChange} placeholder="Phone (10 digits)" className="w-full rounded-lg border border-gray-300 px-3 py-2" required maxLength={10} />
          <input name="email" value={formData.email} onChange={onChange} type="email" placeholder="Email" className="w-full rounded-lg border border-gray-300 px-3 py-2" required />
          <input name="password" value={formData.password} onChange={onChange} type="password" placeholder="Password" className="w-full rounded-lg border border-gray-300 px-3 py-2" required minLength={6} />
          <input name="adminSignupKey" value={formData.adminSignupKey} onChange={onChange} placeholder="Admin signup key" className="w-full rounded-lg border border-gray-300 px-3 py-2" />

          <button disabled={isLoading} className="w-full rounded-lg bg-[#c41e3a] px-4 py-2.5 font-semibold text-white hover:bg-[#a01830] disabled:opacity-60">
            {isLoading ? "Creating..." : "Create Admin"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          <Link href="/login" className="font-semibold text-[#c41e3a] hover:text-[#a01830]">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
