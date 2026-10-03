"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [userType, setUserType] = useState<"owner" | "farmer">("owner");
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Owner Register States
  const [dairyName, setDairyName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [dairyCode, setDairyCode] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");

  // Owner Login States
  const [loginDairyCode, setLoginDairyCode] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Farmer Form States
  const [farmerDairyCode, setFarmerDairyCode] = useState("");
  const [farmerCode, setFarmerCode] = useState("");
  const [farmerPin, setFarmerPin] = useState("");

  const [loading, setLoading] = useState(false);

  // 1. Dairy Owner Registration
  const handleOwnerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dairyName || !ownerName || !ownerPhone || !dairyCode || !ownerEmail || !ownerPassword) {
      alert("Kripya sabhi fields zaroor bharein!");
      return;
    }

    try {
      setLoading(true);
      const cleanCode = dairyCode.trim().toLowerCase();

      const { data: existing } = await supabase
        .from("dairies")
        .select("id")
        .eq("dairy_code", cleanCode)
        .maybeSingle();

      if (existing) {
        alert("Yeh Dairy Code pehle se use me hai! Koi dusra code dalein.");
        setLoading(false);
        return;
      }

      const { data: newDairy, error } = await supabase
        .from("dairies")
        .insert([
          {
            name: dairyName.trim(),
            owner_name: ownerName.trim(),
            phone: ownerPhone.trim(),
            dairy_code: cleanCode,
            email: ownerEmail.trim(),
            password_hash: ownerPassword.trim(),
          },
        ])
        .select("id, dairy_code")
        .single();

      if (error) throw error;

      if (newDairy) {
        localStorage.setItem("currentDairyId", newDairy.id);
        localStorage.setItem("currentDairyCode", newDairy.dairy_code);
        localStorage.setItem("userRole", "owner");
      }

      window.location.assign("/dashboard");
    } catch (err: any) {
      alert("Error: " + err.message);
      setLoading(false);
    }
  };

  // 2. Dairy Owner Login
  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginDairyCode || !loginPhone || !loginPassword) {
      alert("Kripya Dairy Code, Phone Number aur Password teeno bharein!");
      return;
    }

    try {
      setLoading(true);
      const cleanCode = loginDairyCode.trim().toLowerCase();
      const cleanPhone = loginPhone.trim();

      const { data: dairy, error } = await supabase
        .from("dairies")
        .select("*")
        .ilike("dairy_code", cleanCode)
        .maybeSingle();

      if (error || !dairy) {
        alert("❌ Yeh Dairy Code database me nahi mila!");
        setLoading(false);
        return;
      }

      if (String(dairy.phone).trim() !== cleanPhone) {
        alert("❌ Phone number match nahi ho raha!");
        setLoading(false);
        return;
      }

      if (String(dairy.password_hash || "").trim() !== loginPassword.trim()) {
        alert("❌ Galat Password!");
        setLoading(false);
        return;
      }

      localStorage.setItem("currentDairyId", dairy.id);
      localStorage.setItem("currentDairyCode", dairy.dairy_code);
      localStorage.setItem("userRole", "owner"); // Set Role to Owner

      window.location.assign("/dashboard");
    } catch (err: any) {
      alert("Error: " + err.message);
      setLoading(false);
    }
  };

  // 3. Farmer Login (Secure Role & ID Storing)
  const handleFarmerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerDairyCode || !farmerCode || !farmerPin) {
      alert("Kripya Dairy Code, Farmer Code aur PIN dalein!");
      return;
    }

    try {
      setLoading(true);
      const cleanDairyCode = farmerDairyCode.trim().toLowerCase();
      const cleanFarmerCode = farmerCode.trim().toLowerCase();

      const { data: dairy, error: dError } = await supabase
        .from("dairies")
        .select("id, dairy_code")
        .ilike("dairy_code", cleanDairyCode)
        .maybeSingle();

      if (dError || !dairy) {
        alert("❌ Galat Dairy Code!");
        setLoading(false);
        return;
      }

      const { data: farmer, error: fError } = await supabase
        .from("farmers")
        .select("*")
        .eq("dairy_id", dairy.id)
        .ilike("farmer_code", cleanFarmerCode)
        .eq("pin_hash", farmerPin.trim())
        .maybeSingle();

      if (fError || !farmer) {
        alert("❌ Galat Farmer Code ya PIN!");
        setLoading(false);
        return;
      }

      if (farmer.is_active === false) {
        alert("⚠️ Aapka account deactivate hai.");
        setLoading(false);
        return;
      }

      // 🔑 Save Secure Role & Farmer ID
      localStorage.setItem("currentDairyId", dairy.id);
      localStorage.setItem("currentDairyCode", dairy.dairy_code);
      localStorage.setItem("userRole", "farmer");
      localStorage.setItem("currentFarmerId", farmer.id);

      window.location.assign("/dashboard");
    } catch (err: any) {
      alert("Error: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F6F4] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-xl border border-slate-100 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-4xl">🥛</span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dairy Flow Pro</h1>
          <p className="text-xs text-slate-500 font-medium">Apne Panel ko select karke Login / Signup karein</p>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setUserType("owner")}
            className={`py-2.5 text-xs font-black rounded-xl transition ${
              userType === "owner" ? "bg-[#00796B] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            👑 Dairy Owner Panel
          </button>
          <button
            type="button"
            onClick={() => setUserType("farmer")}
            className={`py-2.5 text-xs font-black rounded-xl transition ${
              userType === "farmer" ? "bg-[#00796B] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🌾 Farmer Panel
          </button>
        </div>

        {userType === "owner" && (
          <div className="space-y-4">
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setIsLoginMode(true)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  isLoginMode ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setIsLoginMode(false)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  !isLoginMode ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                }`}
              >
                Register (Sign Up)
              </button>
            </div>

            {isLoginMode ? (
              <form onSubmit={handleOwnerLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dairy Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5130"
                    value={loginDairyCode}
                    onChange={(e) => setLoginDairyCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-[#00796B] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Owner Mobile Number</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10 digit phone number"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00796B] hover:bg-[#004D40] text-white py-3 rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50"
                >
                  {loading ? "Logging in..." : "Login to Dashboard 🚀"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOwnerRegister} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dairy Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shyam Doodh Dairy"
                    value={dairyName}
                    onChange={(e) => setDairyName(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Owner Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shyam Singh"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. owner@gmail.com"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="min 6 characters"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10 digit phone"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unique Dairy Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5130"
                    value={dairyCode}
                    onChange={(e) => setDairyCode(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-extrabold text-[#00796B] outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#52B788] hover:bg-[#40916C] text-white py-3 rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50"
                >
                  {loading ? "Registering..." : "Create Dairy Account ✨"}
                </button>
              </form>
            )}
          </div>
        )}

        {userType === "farmer" && (
          <form onSubmit={handleFarmerLogin} className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900 text-xs font-medium">
              🌾 Kisan bhai apne Dairy Code, Farmer ID aur PIN se login karke apna hisab dekh sakte hain.
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dairy Code</label>
              <input
                type="text"
                required
                placeholder="e.g. 5130"
                value={farmerDairyCode}
                onChange={(e) => setFarmerDairyCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-[#00796B] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Farmer Code / ID</label>
              <input
                type="text"
                required
                placeholder="e.g. shyam101"
                value={farmerCode}
                onChange={(e) => setFarmerCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Login PIN / Password</label>
              <input
                type="password"
                required
                placeholder="6 digit PIN"
                value={farmerPin}
                onChange={(e) => setFarmerPin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold tracking-widest outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00796B] hover:bg-[#004D40] text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login to Farmer Portal 🌾"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}