'use client';

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [authTab, setAuthTab] = useState<"owner" | "farmer">("owner");
  const [ownerMode, setOwnerMode] = useState<"login" | "register">("login");
  
  const [emailInput, setEmailInput] = useState("");
  const [passInput, setPassInput] = useState("");
  const [regDairyName, setRegDairyName] = useState("");
  const [regOwnerName, setRegOwnerName] = useState("");
  const [regPhone, setRegPhone] = useState("");

  const [dCodeInput, setDCodeInput] = useState("");
  const [fCodeInput, setFCodeInput] = useState("");
  const [fPinInput, setFPinInput] = useState("");
  const [authError, setAuthError] = useState("");

  const handleOwnerAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      if (ownerMode === "login") {
        const { data, error } = await supabase
          .from("dairies")
          .select("*")
          .eq("email", emailInput.trim().toLowerCase())
          .maybeSingle();

        if (error || !data || data.password_hash !== passInput.trim()) {
          setAuthError("❌ गलत ईमेल या पासवर्ड!");
          return;
        }

        localStorage.setItem("currentDairyId", data.id);
        localStorage.setItem("userRole", "owner");
        router.push("/dashboard");
      } else {
        const generatedCode = "dairy" + Math.floor(1000 + Math.random() * 9000);
        const { data, error } = await supabase
          .from("dairies")
          .insert([
            {
              name: regDairyName.trim(),
              owner_name: regOwnerName.trim() || "Owner",
              email: emailInput.trim().toLowerCase(),
              phone: regPhone.trim(),
              password_hash: passInput.trim(),
              dairy_code: generatedCode,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        localStorage.setItem("currentDairyId", data.id);
        localStorage.setItem("userRole", "owner");
        router.push("/dashboard");
      }
    } catch (err: any) {
      setAuthError("Error: " + err.message);
    }
  };

  const handleFarmerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const { data: dData } = await supabase
        .from("dairies")
        .select("id")
        .eq("dairy_code", dCodeInput.trim().toLowerCase())
        .maybeSingle();

      if (!dData) {
        setAuthError("❌ इस कोड पर कोई डेयरी नहीं मिली!");
        return;
      }

      const { data: fData } = await supabase
        .from("farmers")
        .select("*")
        .eq("dairy_id", dData.id)
        .eq("farmer_code", fCodeInput.trim().toLowerCase())
        .maybeSingle();

      if (!fData || fData.pin_hash !== fPinInput.trim()) {
        setAuthError("❌ गलत किसान आईडी या पिन!");
        return;
      }

      localStorage.setItem("currentDairyId", dData.id);
      localStorage.setItem("currentFarmerId", fData.id);
      localStorage.setItem("userRole", "farmer");
      router.push("/farmer");
    } catch (err: any) {
      setAuthError("Error: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F6F4] flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-6">
          <span className="text-4xl">🥛</span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Dairy Flow Pro</h1>
          <p className="text-xs text-slate-500 mt-1">Apna Login Role chuniye</p>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl mb-5">
          <button type="button" onClick={() => { setAuthTab("owner"); setAuthError(""); }} className={`py-2 text-xs font-extrabold rounded-xl transition ${authTab === "owner" ? "bg-[#00796B] text-white shadow-sm" : "text-slate-600"}`}>
            👑 Dairy Owner
          </button>
          <button type="button" onClick={() => { setAuthTab("farmer"); setAuthError(""); }} className={`py-2 text-xs font-extrabold rounded-xl transition ${authTab === "farmer" ? "bg-[#00796B] text-white shadow-sm" : "text-slate-600"}`}>
            🌾 Farmer Portal
          </button>
        </div>

        {authError && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs text-center font-bold">{authError}</div>}

        {authTab === "owner" ? (
          <div>
            <div className="grid grid-cols-2 border border-slate-200 rounded-xl p-1 mb-4 text-xs font-bold text-center">
              <button type="button" onClick={() => setOwnerMode("login")} className={`py-1.5 rounded-lg transition ${ownerMode === "login" ? "bg-slate-900 text-white" : "text-slate-600"}`}>Login</button>
              <button type="button" onClick={() => setOwnerMode("register")} className={`py-1.5 rounded-lg transition ${ownerMode === "register" ? "bg-slate-900 text-white" : "text-slate-600"}`}>Register</button>
            </div>

            <form onSubmit={handleOwnerAuth} className="space-y-3.5">
              {ownerMode === "register" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Dairy Name *</label>
                    <input type="text" required placeholder="Shyam Milk Dairy" value={regDairyName} onChange={(e) => setRegDairyName(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Owner Name *</label>
                    <input type="text" required placeholder="Shyam Singh" value={regOwnerName} onChange={(e) => setRegOwnerName(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                    <input type="tel" required maxLength={10} placeholder="10 digit phone" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold outline-none" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <input type="email" required placeholder="admin@dairy.com" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                <input type="password" required placeholder="••••••••" value={passInput} onChange={(e) => setPassInput(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold outline-none" />
              </div>
              <button type="submit" className="w-full bg-[#00796B] hover:bg-[#004D40] text-white py-3 rounded-xl font-bold text-xs shadow-md transition mt-2">
                {ownerMode === "login" ? "Owner Login 🚀" : "Register New Dairy ✨"}
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleFarmerLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dairy Code</label>
              <input type="text" required placeholder="e.g. dairy1234" value={dCodeInput} onChange={(e) => setDCodeInput(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Farmer ID (Code)</label>
              <input type="text" required placeholder="e.g. kisan101" value={fCodeInput} onChange={(e) => setFCodeInput(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Login PIN</label>
              <input type="password" required placeholder="••••••••" value={fPinInput} onChange={(e) => setFPinInput(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold outline-none" />
            </div>
            <button type="submit" className="w-full bg-[#00796B] hover:bg-[#004D40] text-white py-3 rounded-xl font-bold text-xs shadow-md transition">
              Farmer Login 🌾
            </button>
          </form>
        )}

        <div className="mt-4 text-center">
          <button onClick={() => { localStorage.removeItem("dairyTermsAccepted"); router.push('/'); }} className="text-xs text-slate-500 hover:underline">← Back to Terms</button>
        </div>
      </div>
    </div>
  );
}