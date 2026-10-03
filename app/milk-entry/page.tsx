"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Farmer {
  id: string;
  farmer_code: string;
  name: string;
  phone: string;
  whatsapp_number?: string;
  village?: string;
  pin_hash?: string;
  dairy_id: string;
}

interface Dairy {
  id: string;
  name: string;
  phone: string;
  dairy_code: string;
}

interface MilkEntry {
  id: string;
  farmer_id: string;
  shift: string;
  milk_type: string;
  quantity_litres?: number;
  quantity_liters?: number;
  fat_percentage?: number;
  snf_percentage?: number;
  water_percentage?: number;
  rate_per_litre?: number;
  rate_per_liter?: number;
  total_amount: number;
  created_at: string;
}

interface PaymentRecord {
  id: string;
  amount: number;
  payment_date: string;
  created_at: string;
}

interface DigitalSlipData {
  dairyName: string;
  dairyPhone: string;
  farmerName: string;
  farmerCode: string;
  farmerPhone: string;
  date: string;
  time: string;
  shift: string;
  milkType: string;
  qty: number;
  fat: number;
  snf: number;
  water: number;
  rate: number;
  total: number;
}

export default function FarmerPortalPage() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Login Form States
  const [dairyCode, setDairyCode] = useState("");
  const [farmerCode, setFarmerCode] = useState("");
  const [farmerPin, setFarmerPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [dairy, setDairy] = useState<Dairy | null>(null);
  const [entries, setEntries] = useState<MilkEntry[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  // Date Filter States
  const [activeDatePill, setActiveDatePill] = useState<string>("This Month");
  const todayStr = new Date().toISOString().split("T")[0];
  const firstDayStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const [filterStartDate, setFilterStartDate] = useState(firstDayStr);
  const [filterEndDate, setFilterEndDate] = useState(todayStr);

  // Change PIN States
  const [newPin, setNewPin] = useState("");
  const [pinMsg, setPinMsg] = useState("");

  // Digital Slip Modal States
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [currentSlip, setCurrentSlip] = useState<DigitalSlipData | null>(null);

  useEffect(() => {
    const savedFarmerId = localStorage.getItem("currentFarmerId");
    const savedDairyId = localStorage.getItem("currentDairyId");
    if (savedFarmerId && savedDairyId) {
      fetchFarmerData(savedFarmerId, savedDairyId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchFarmerData = async (fId: string, dId: string) => {
    try {
      setLoading(true);
      const [fRes, dRes, eRes, pRes] = await Promise.all([
        supabase.from("farmers").select("*").eq("id", fId).single(),
        supabase.from("dairies").select("id, name, phone, dairy_code").eq("id", dId).single(),
        supabase.from("milk_entries").select("*").eq("farmer_id", fId).order("created_at", { ascending: false }),
        supabase.from("dairy_payments").select("*").eq("farmer_id", fId).order("created_at", { ascending: false }),
      ]);

      if (fRes.data) setFarmer(fRes.data);
      if (dRes.data) setDairy(dRes.data);
      if (eRes.data) setEntries(eRes.data);
      if (pRes.data) setPayments(pRes.data);

      setIsLoggedIn(true);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const { data: dairyData, error: dError } = await supabase
        .from("dairies")
        .select("id, name, phone, dairy_code")
        .eq("dairy_code", dairyCode.trim().toLowerCase())
        .maybeSingle();

      if (dError || !dairyData) {
        setErrorMsg("❌ Aisi koi Dairy nahi mili is Code par!");
        return;
      }

      const { data: farmerData, error: fError } = await supabase
        .from("farmers")
        .select("*")
        .eq("dairy_id", dairyData.id)
        .eq("farmer_code", farmerCode.trim().toLowerCase())
        .maybeSingle();

      if (fError || !farmerData) {
        setErrorMsg("❌ Farmer ID galat hai!");
        return;
      }

      if (farmerData.pin_hash === farmerPin.trim()) {
        localStorage.setItem("currentFarmerId", farmerData.id);
        localStorage.setItem("currentDairyId", dairyData.id);
        setFarmer(farmerData);
        setDairy(dairyData);
        setIsLoggedIn(true);
        fetchFarmerData(farmerData.id, dairyData.id);
      } else {
        setErrorMsg("❌ Galat PIN ya Password hai!");
      }
    } catch (err: any) {
      setErrorMsg("Error: " + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentFarmerId");
    localStorage.removeItem("currentDairyId");
    setIsLoggedIn(false);
    setFarmer(null);
    setDairy(null);
  };

  const handlePillClick = (pill: string) => {
    setActiveDatePill(pill);
    const now = new Date();
    if (pill === "Today") {
      setFilterStartDate(todayStr);
      setFilterEndDate(todayStr);
    } else if (pill === "Yesterday") {
      const y = new Date();
      y.setDate(now.getDate() - 1);
      const yStr = y.toISOString().split("T")[0];
      setFilterStartDate(yStr);
      setFilterEndDate(yStr);
    } else if (pill === "Last 7 Days") {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      setFilterStartDate(past.toISOString().split("T")[0]);
      setFilterEndDate(todayStr);
    } else if (pill === "This Month") {
      setFilterStartDate(firstDayStr);
      setFilterEndDate(todayStr);
    } else if (pill === "This Year") {
      const startYear = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
      setFilterStartDate(startYear);
      setFilterEndDate(todayStr);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmer || !newPin) return;
    if (newPin.trim().length < 4) {
      setPinMsg("❌ PIN kam se kam 4 characters ka hona chahiye.");
      return;
    }
    try {
      const { error } = await supabase
        .from("farmers")
        .update({ pin_hash: newPin.trim() })
        .eq("id", farmer.id);

      if (error) throw error;
      setPinMsg("✅ Password / PIN successfully update ho gaya!");
      setNewPin("");
    } catch (err: any) {
      setPinMsg("Error: " + err.message);
    }
  };

  const openSlipModal = (entry: MilkEntry) => {
    if (!dairy || !farmer) return;
    const entryDate = new Date(entry.created_at);
    const slip: DigitalSlipData = {
      dairyName: dairy.name,
      dairyPhone: dairy.phone,
      farmerName: farmer.name,
      farmerCode: farmer.farmer_code,
      farmerPhone: farmer.phone,
      date: entryDate.toLocaleDateString("en-IN"),
      time: entryDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      shift: entry.shift === "morning" ? "Morning (सुबह)" : "Evening (शाम)",
      milkType: (entry.milk_type || "COW").toUpperCase(),
      qty: Number(entry.quantity_litres || entry.quantity_liters || 0),
      fat: Number(entry.fat_percentage || 0),
      snf: Number(entry.snf_percentage || 0),
      water: Number(entry.water_percentage || 0),
      rate: Number(entry.rate_per_litre || entry.rate_per_liter || 0),
      total: Number(entry.total_amount || 0),
    };
    setCurrentSlip(slip);
    setSlipModalOpen(true);
  };

  const sendWhatsAppSlip = (slip: DigitalSlipData) => {
    const text = `🥛 *${slip.dairyName.toUpperCase()} - DOODH PARCHI* 🥛\n--------------------------------\n📅 Tarikh: ${slip.date} (${slip.time})\n☀️ Shift: ${slip.shift}\n👤 Kisan: *${slip.farmerName}* (ID: #${slip.farmerCode})\n🐄 Milk: ${slip.milkType}\n--------------------------------\n⚖️ Matra: *${slip.qty.toFixed(2)} Ltr*\n🧈 Fat: *${slip.fat.toFixed(1)}%*\n🧪 SNF: *${slip.snf > 0 ? slip.snf.toFixed(1) + "%" : "N/A"}*\n💧 Water: *${slip.water > 0 ? slip.water.toFixed(1) + "%" : "0.0%"}*\n💵 Rate: *₹${slip.rate.toFixed(2)} / Ltr*\n--------------------------------\n💰 *KUL RASHI: ₹${slip.total.toFixed(2)}*\n--------------------------------\nDairy Helpline: ${slip.dairyPhone || "N/A"}\nDhanyawad! 🙏`;

    let cleanPhone = slip.farmerPhone.replace(/\D/g, "");
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const formatAnimalLabel = (type: string) => {
    const tLower = (type || "").toLowerCase();
    if (tLower === "cow") return "🐄 Cow (गाय)";
    if (tLower === "buffalo") return "🐃 Buffalo (भैंस)";
    return "🥛 Other (अन्य)";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center font-bold text-[#00796B]">
        Loading Kisan Portal...
      </div>
    );
  }

  // 1. FARMER LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200">
          <div className="text-center mb-6">
            <span className="text-4xl">🌾</span>
            <h1 className="text-2xl font-black text-slate-900 mt-2">Farmer Portal Login</h1>
            <p className="text-xs text-slate-500 mt-1">Apni Dairy Code aur Farmer ID se Login karein</p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs text-center font-bold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dairy Code</label>
              <input
                type="text"
                required
                placeholder="e.g. shyam1234"
                value={dairyCode}
                onChange={(e) => setDairyCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Farmer ID (Code)</label>
              <input
                type="text"
                required
                placeholder="e.g. shyam101"
                value={farmerCode}
                onChange={(e) => setFarmerCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Login PIN / Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={farmerPin}
                onChange={(e) => setFarmerPin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold outline-none focus:border-teal-600"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#00796B] hover:bg-[#004D40] text-white py-3 rounded-xl font-bold text-xs shadow-md transition"
            >
              Sign In to Kisan Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filter entries based on date
  const isDateInRange = (dateStr: string) => {
    const d = dateStr.slice(0, 10);
    return d >= filterStartDate && d <= filterEndDate;
  };

  const filteredEntries = entries.filter((e) => isDateInRange(e.created_at));
  const totalMilk = filteredEntries.reduce((acc, c) => acc + Number(c.quantity_litres || c.quantity_liters || 0), 0);
  const totalBill = filteredEntries.reduce((acc, c) => acc + Number(c.total_amount || 0), 0);
  const totalPaid = payments.reduce((acc, c) => acc + Number(c.amount || 0), 0);
  const balance = Math.round((totalBill - totalPaid) * 100) / 100;

  const ownerPhone = dairy?.phone || "";
  const cleanOwnerPhone = ownerPhone.replace(/\D/g, "");

  return (
    <div className="min-h-screen bg-[#F3F6F4] text-slate-800 pb-16 font-sans antialiased p-4">
      <header className="bg-[#00796B] text-white px-5 py-4 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between mb-6 gap-3">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <span className="text-3xl">🌾</span>
          <div>
            <h1 className="font-extrabold text-lg leading-none">Kisan Portal: {farmer?.name}</h1>
            <span className="text-xs text-teal-100 font-medium">Farmer ID: <b>#{farmer?.farmer_code}</b> • Dairy: {dairy?.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {ownerPhone && (
            <>
              <a
                href={`tel:${ownerPhone}`}
                className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-3 py-2 rounded-xl shadow flex items-center gap-1"
              >
                <span>📞</span> Call Owner
              </a>
              <a
                href={`https://wa.me/${cleanOwnerPhone.length === 10 ? '91' + cleanOwnerPhone : cleanOwnerPhone}?text=${encodeURIComponent("Namaste Dairy Owner ji, mujhe mera hisab dekhna hai.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow flex items-center gap-1"
              >
                <span>💬</span> WhatsApp
              </a>
            </>
          )}
          <button
            onClick={handleLogout}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow transition"
          >
            🚪 Logout
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto space-y-6">
        {/* Date Filter Pills */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <p className="text-xs font-bold text-slate-700 uppercase">📅 Hisab Filter Karein (Date Range)</p>
          <div className="flex flex-wrap gap-1.5">
            {["Today", "Yesterday", "Last 7 Days", "This Month", "This Year"].map((pill) => (
              <button
                key={pill}
                onClick={() => handlePillClick(pill)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                  activeDatePill === pill ? "bg-[#00796B] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {pill}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">From Date</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => {
                  setFilterStartDate(e.target.value);
                  setActiveDatePill("Custom");
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">To Date</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => {
                  setFilterEndDate(e.target.value);
                  setActiveDatePill("Custom");
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
              />
            </div>
          </div>
        </div>

        {/* 4 Main Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Aapka Kul Doodh</p>
            <p className="text-xl font-black text-slate-900 mt-1">{totalMilk.toFixed(1)} L</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Kul Bill (+)</p>
            <p className="text-xl font-black text-emerald-700 mt-1">₹{totalBill.toFixed(0)}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Prapt Bhugtan (-)</p>
            <p className="text-xl font-black text-rose-600 mt-1">₹{totalPaid.toFixed(0)}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Bacha Balance</p>
            <p className={`text-xl font-black mt-1 ${balance > 0 ? "text-rose-600" : "text-emerald-700"}`}>
              ₹{balance.toFixed(0)}
            </p>
          </div>
        </div>

        {/* Change PIN Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">🔒 Apna Login Password / PIN Badlein</h3>
          {pinMsg && (
            <p className="text-xs font-bold p-2 bg-slate-50 rounded-lg text-teal-800">{pinMsg}</p>
          )}
          <form onSubmit={handleChangePin} className="flex gap-2">
            <input
              type="password"
              required
              placeholder="Naya PIN (Min 4 chars)"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
            />
            <button
              type="submit"
              className="bg-[#00796B] hover:bg-[#004D40] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
            >
              Update PIN
            </button>
          </form>
        </div>

        {/* Milk History Entries with Clickable Parchi */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">🥛 Aapki Doodh Entries (Click for Parchi)</h3>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {filteredEntries.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Is tareekh ke beech koi entry darj nahi hai.</p>
            ) : (
              filteredEntries.map((e) => (
                <div
                  key={e.id}
                  onClick={() => openSlipModal(e)}
                  className="py-3 flex justify-between items-center text-xs hover:bg-slate-50 px-2 rounded-xl cursor-pointer transition"
                >
                  <div>
                    <p className="font-bold text-slate-900">{formatAnimalLabel(e.milk_type)} • Shift: <span className="capitalize">{e.shift}</span></p>
                    <p className="text-[10px] text-slate-400">{new Date(e.created_at).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="font-black text-slate-900">{Number(e.quantity_litres || e.quantity_liters)} L (Fat: {e.fat_percentage}%)</p>
                      <p className="text-emerald-700 font-bold">₹{e.total_amount}</p>
                    </div>
                    <span className="text-teal-700 bg-teal-50 border border-teal-200 px-2 py-1 rounded-lg text-[10px] font-bold">📄 Parchi</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Digital Parchi Modal */}
      {slipModalOpen && currentSlip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-3 border-b pb-2">
              <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">Digital Doodh Parchi</span>
              <button
                onClick={() => setSlipModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 text-xl font-bold leading-none"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50/40 p-4 rounded-2xl border border-dashed border-slate-300 font-mono text-slate-900 space-y-2 text-xs">
              <div className="text-center border-b border-dashed border-slate-400 pb-2">
                <h2 className="font-black text-base text-slate-900 tracking-tight">{currentSlip.dairyName}</h2>
                <p className="text-[10px] text-slate-600">Helpline: {currentSlip.dairyPhone || "N/A"}</p>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                  {currentSlip.date} • {currentSlip.time}
                </p>
              </div>

              <div className="py-1 border-b border-dashed border-slate-300 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Kisan</p>
                  <p className="font-black text-sm text-slate-900">{currentSlip.farmerName}</p>
                </div>
                <div className="text-right">
                  <span className="bg-slate-900 text-white text-[11px] font-black px-2 py-0.5 rounded">
                    ID: #{currentSlip.farmerCode}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">{currentSlip.shift}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 py-1 text-slate-700">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <p className="text-[9px] uppercase text-slate-400">Milk Type</p>
                  <p className="font-bold text-xs">{currentSlip.milkType}</p>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <p className="text-[9px] uppercase text-slate-400">Fat %</p>
                  <p className="font-bold text-xs">{currentSlip.fat.toFixed(1)}%</p>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <p className="text-[9px] uppercase text-slate-400">SNF %</p>
                  <p className="font-bold text-xs">{currentSlip.snf > 0 ? `${currentSlip.snf.toFixed(1)}%` : "N/A"}</p>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <p className="text-[9px] uppercase text-slate-400">Water % (पानी)</p>
                  <p className="font-bold text-xs">{currentSlip.water > 0 ? `${currentSlip.water.toFixed(1)}%` : "0.0%"}</p>
                </div>
              </div>

              <div className="bg-white p-2 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-[10px] uppercase text-slate-400">Rate / Ltr</span>
                <span className="font-bold text-xs">₹{currentSlip.rate.toFixed(2)}</span>
              </div>

              <div className="bg-emerald-100/70 p-3 rounded-xl border border-emerald-300 text-emerald-950 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold uppercase text-emerald-800">Kul Doodh</p>
                  <p className="text-base font-black">{currentSlip.qty.toFixed(2)} Ltr</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase text-emerald-800">Kul Bhugtan (₹)</p>
                  <p className="text-2xl font-black text-emerald-900">₹{currentSlip.total.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                type="button"
                onClick={() => sendWhatsAppSlip(currentSlip)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition"
              >
                <span>💬</span>
                <span>WhatsApp Parchi</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition"
              >
                <span>🖨️</span>
                <span>Print Karein</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}