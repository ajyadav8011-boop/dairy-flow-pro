'use client';

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Dairy {
  id: string;
  name: string;
  owner_name: string;
  dairy_code: string;
  phone: string;
  email?: string;
  logo_url?: string;
}

interface Farmer {
  id: string;
  farmer_code: string;
  name: string;
  phone: string;
  whatsapp_number?: string;
  village?: string;
  address?: string;
  pin_hash?: string;
  is_active?: boolean;
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
  party_type: string;
  farmer_id?: string;
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

const translations: Record<string, Record<string, string>> = {
  en: {
    portal: "Farmer Portal",
    milkEntries: "Milk Entries",
    settings: "Settings",
    totalMilk: "Total Milk",
    totalBill: "Total Bill (+)",
    totalPaid: "Total Paid (-)",
    balance: "Balance Due",
    changePin: "Change Login PIN / Password",
    updatePin: "Update PIN",
    callDairy: "Call Dairy",
    whatsapp: "WhatsApp",
    logout: "Logout",
    parchi: "Digital Parchi",
  },
  hi: {
    portal: "किसान पोर्टल",
    milkEntries: "दूध एंट्रीज",
    settings: "सेटिंग्स",
    totalMilk: "कुल दूध",
    totalBill: "कुल बिल (+)",
    totalPaid: "प्राप्त भुगतान (-)",
    balance: "शेष राशि (Balance)",
    changePin: "लॉगिन पिन / पासवर्ड बदलें",
    updatePin: "पिन अपडेट करें",
    callDairy: "कॉल करें",
    whatsapp: "व्हाट्सएप",
    logout: "लॉग आउट",
    parchi: "डिजिटल पर्ची",
  },
};

export default function FarmerPortalPage() {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "hi">("hi");
  const t = translations[lang] || translations.en;

  const [loading, setLoading] = useState(true);
  const [dairy, setDairy] = useState<Dairy | null>(null);
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [entries, setEntries] = useState<MilkEntry[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  const [activeTab, setActiveTab] = useState<"home" | "entries" | "settings">("home");

  const [activeDatePill, setActiveDatePill] = useState<string>("This Month");
  const todayStr = new Date().toISOString().split("T")[0];
  const firstDayStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const [filterStartDate, setFilterStartDate] = useState(firstDayStr);
  const [filterEndDate, setFilterEndDate] = useState(todayStr);

  const [newPin, setNewPin] = useState("");
  const [pinMsg, setPinMsg] = useState("");

  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [currentSlip, setCurrentSlip] = useState<DigitalSlipData | null>(null);

  useEffect(() => {
    const dairyId = localStorage.getItem("currentDairyId");
    const farmerId = localStorage.getItem("currentFarmerId");
    const role = localStorage.getItem("userRole");

    if (!dairyId || !farmerId || role !== "farmer") {
      router.push("/auth");
    } else {
      loadFarmerData(dairyId, farmerId);
    }
  }, [router]);

  const loadFarmerData = async (dId: string, fId: string) => {
    try {
      setLoading(true);
      const [dRes, fRes, eRes, pRes] = await Promise.all([
        supabase.from("dairies").select("*").eq("id", dId).maybeSingle(),
        supabase.from("farmers").select("*").eq("id", fId).maybeSingle(),
        supabase.from("milk_entries").select("*").eq("farmer_id", fId).order("created_at", { ascending: false }),
        supabase.from("dairy_payments").select("*").eq("farmer_id", fId).order("created_at", { ascending: false }),
      ]);

      if (!dRes.data || !fRes.data) {
        handleLogout();
        return;
      }

      setDairy(dRes.data);
      setFarmer(fRes.data);
      setEntries(eRes.data || []);
      setPayments(pRes.data || []);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/auth");
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
      setFilterStartDate(y.toISOString().split("T")[0]);
      setFilterEndDate(y.toISOString().split("T")[0]);
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

  const isDateInRange = (dateStr: string) => {
    const d = dateStr.slice(0, 10);
    return d >= filterStartDate && d <= filterEndDate;
  };

  const filteredEntries = entries.filter((e) => isDateInRange(e.created_at));
  const totalMilk = filteredEntries.reduce((acc, c) => acc + Number(c.quantity_litres || c.quantity_liters || 0), 0);
  const totalBill = filteredEntries.reduce((acc, c) => acc + Number(c.total_amount || 0), 0);
  const totalPaid = payments.reduce((acc, c) => acc + Number(c.amount || 0), 0);
  const balanceDue = Math.round((totalBill - totalPaid) * 100) / 100;

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmer || !newPin) return;
    if (newPin.trim().length < 4) {
      setPinMsg("PIN kam se kam 4 characters ka hona chahiye.");
      return;
    }
    try {
      const { error } = await supabase.from("farmers").update({ pin_hash: newPin.trim() }).eq("id", farmer.id);
      if (error) throw error;
      setPinMsg("✅ PIN successfully update ho gaya!");
      setNewPin("");
    } catch (err: any) {
      setPinMsg("Error: " + err.message);
    }
  };

  const openSlip = (entry: MilkEntry) => {
    if (!dairy || !farmer) return;
    const dt = new Date(entry.created_at);
    const slipData: DigitalSlipData = {
      dairyName: dairy.name,
      dairyPhone: dairy.phone,
      farmerName: farmer.name,
      farmerCode: farmer.farmer_code,
      farmerPhone: farmer.phone,
      date: dt.toLocaleDateString("en-IN"),
      time: dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      shift: entry.shift === "morning" ? "Morning (सुबह)" : "Evening (शाम)",
      milkType: (entry.milk_type || "COW").toUpperCase(),
      qty: Number(entry.quantity_litres || entry.quantity_liters || 0),
      fat: Number(entry.fat_percentage || 0),
      snf: Number(entry.snf_percentage || 0),
      water: Number(entry.water_percentage || 0),
      rate: Number(entry.rate_per_litre || entry.rate_per_liter || 0),
      total: Number(entry.total_amount || 0),
    };
    setCurrentSlip(slipData);
    setSlipModalOpen(true);
  };

  const sendWhatsAppSlip = (slip: DigitalSlipData) => {
    const text = `🥛 *${slip.dairyName.toUpperCase()} - DOODH PARCHI* 🥛\n📅 Tarikh: ${slip.date} (${slip.time})\n☀️️ Shift: ${slip.shift}\n👤 Kisan: *${slip.farmerName}* (ID: #${slip.farmerCode})\n🐄 Milk: ${slip.milkType}\n⚖️ Matra: *${slip.qty.toFixed(2)} Ltr*\n🧈 Fat: *${slip.fat.toFixed(1)}%*\n💵 Rate: *₹${slip.rate.toFixed(2)} / Ltr*\n💰 *KUL RASHI: ₹${slip.total.toFixed(2)}*`;
    let cleanPhone = slip.farmerPhone.replace(/\D/g, "");
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center">
        <p className="text-[#00796B] font-bold text-base animate-pulse">Loading Farmer Portal...</p>
      </div>
    );
  }

  const ownerPhone = dairy?.phone || "";
  const cleanOwnerPhone = ownerPhone.replace(/\D/g, "");

  return (
    <div className="min-h-screen bg-[#F3F6F4] text-slate-800 pb-24 font-sans antialiased">
      <header className="bg-[#00796B] text-white px-5 py-4 sticky top-0 z-30 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">🌾</span>
          <div>
            <h1 className="font-extrabold text-base leading-tight">{farmer?.name}</h1>
            <span className="text-xs text-teal-100 font-medium">ID: <b>#{farmer?.farmer_code}</b> • Dairy: {dairy?.name}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <select value={lang} onChange={(e) => setLang(e.target.value as any)} className="bg-white/20 text-white text-xs px-2.5 py-1.5 rounded-lg border border-white/30 font-bold outline-none cursor-pointer">
            <option value="en" className="text-slate-800">English</option>
            <option value="hi" className="text-slate-800">हिन्दी</option>
          </select>
          {ownerPhone && (
            <>
              <a href={`tel:${ownerPhone}`} className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl shadow flex items-center gap-1">
                <span>📞</span>
              </a>
              <a href={`https://wa.me/${cleanOwnerPhone.length === 10 ? '91' + cleanOwnerPhone : cleanOwnerPhone}?text=${encodeURIComponent("Namaste Dairy Owner ji, mujhe mera hisab dekhna hai.")}`} target="_blank" rel="noopener noreferrer" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl shadow flex items-center gap-1">
                <span>💬</span>
              </a>
            </>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {activeTab === "home" && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <p className="text-xs font-bold text-slate-700 uppercase">📅 Hisab Filter Karein</p>
              <div className="flex flex-wrap gap-1.5">
                {["Today", "Yesterday", "Last 7 Days", "This Month", "This Year"].map((pill) => (
                  <button key={pill} onClick={() => handlePillClick(pill)} className={`px-3 py-1 rounded-full text-xs font-bold transition ${activeDatePill === pill ? "bg-[#00796B] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    {pill}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">From Date</label>
                  <input type="date" value={filterStartDate} onChange={(e) => { setFilterStartDate(e.target.value); setActiveDatePill("Custom"); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">To Date</label>
                  <input type="date" value={filterEndDate} onChange={(e) => { setFilterEndDate(e.target.value); setActiveDatePill("Custom"); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase">{t.totalMilk}</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{totalMilk.toFixed(1)} L</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase">{t.totalBill}</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">₹{totalBill.toFixed(0)}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase">{t.totalPaid}</p>
                <p className="text-2xl font-black text-rose-600 mt-1">₹{totalPaid.toFixed(0)}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase">{t.balance}</p>
                <p className={`text-2xl font-black mt-1 ${balanceDue > 0 ? "text-rose-600" : "text-emerald-700"}`}>₹{balanceDue.toFixed(0)}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">🥛 Recent Milk Entries</h3>
              <div className="divide-y divide-slate-100">
                {filteredEntries.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Koi entry nahi mili.</p>
                ) : (
                  filteredEntries.slice(0, 5).map((e) => (
                    <div key={e.id} onClick={() => openSlip(e)} className="py-3 flex justify-between items-center text-xs hover:bg-slate-50 px-2 rounded-xl cursor-pointer transition">
                      <div>
                        <p className="font-bold text-slate-900 uppercase">{e.milk_type} • <span className="capitalize">{e.shift}</span></p>
                        <p className="text-[10px] text-slate-400">{new Date(e.created_at).toLocaleDateString("en-IN")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900">{Number(e.quantity_litres || e.quantity_liters)} L (Fat: {e.fat_percentage}%)</p>
                        <p className="text-emerald-700 font-bold">₹{e.total_amount}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "entries" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">📜 All Milk Entries & Parchis</h3>
            <div className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Koi entry uplabdh nahi hai.</p>
              ) : (
                filteredEntries.map((e) => (
                  <div key={e.id} onClick={() => openSlip(e)} className="py-3 flex justify-between items-center text-xs hover:bg-slate-50 px-2 rounded-xl cursor-pointer transition">
                    <div>
                      <p className="font-bold text-slate-900 uppercase">{e.milk_type} • <span className="capitalize">{e.shift}</span></p>
                      <p className="text-[10px] text-slate-400">{new Date(e.created_at).toLocaleString("en-IN")}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="font-black text-slate-900">{Number(e.quantity_litres || e.quantity_liters)} L</p>
                        <p className="text-emerald-700 font-bold">₹{e.total_amount}</p>
                      </div>
                      <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2 py-1 rounded-lg text-[10px] font-bold">📄 Parchi</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">👤 Farmer Profile Info</h3>
              <div className="space-y-1.5 text-xs text-slate-700">
                <p><b>Name:</b> {farmer?.name}</p>
                <p><b>Farmer ID Code:</b> #{farmer?.farmer_code}</p>
                <p><b>Mobile:</b> {farmer?.phone}</p>
                <p><b>Village:</b> {farmer?.village || "N/A"}</p>
                <p><b>Dairy Name:</b> {dairy?.name}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">🔒 {t.changePin}</h3>
              {pinMsg && <p className="text-xs font-bold p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-800">{pinMsg}</p>}
              <form onSubmit={handleUpdatePin} className="flex gap-2">
                <input type="password" required placeholder="New PIN (min 4 chars)" value={newPin} onChange={(e) => setNewPin(e.target.value)} className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none" />
                <button type="submit" className="bg-[#00796B] hover:bg-[#004D40] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm">{t.updatePin}</button>
              </form>
            </div>

            <div className="pt-2">
              <button onClick={handleLogout} className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-xl font-bold text-xs shadow-md transition">
                🚪 {t.logout}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-4 py-2.5 z-40 shadow-lg flex items-center justify-around">
        <button onClick={() => setActiveTab("home")} className={`flex flex-col items-center space-y-0.5 ${activeTab === "home" ? "text-[#00796B] font-bold" : "text-slate-400"}`}>
          <span className="text-lg">🏠</span>
          <span className="text-[10px]">Home</span>
        </button>
        <button onClick={() => setActiveTab("entries")} className={`flex flex-col items-center space-y-0.5 ${activeTab === "entries" ? "text-[#00796B] font-bold" : "text-slate-400"}`}>
          <span className="text-lg">📜</span>
          <span className="text-[10px]">{t.milkEntries}</span>
        </button>
        <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center space-y-0.5 ${activeTab === "settings" ? "text-[#00796B] font-bold" : "text-slate-400"}`}>
          <span className="text-lg">⚙️</span>
          <span className="text-[10px]">{t.settings}</span>
        </button>
      </nav>

      {/* Digital Parchi Modal */}
      {slipModalOpen && currentSlip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-3 border-b pb-2">
              <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">Digital Doodh Parchi</span>
              <button onClick={() => setSlipModalOpen(false)} className="text-slate-400 hover:text-slate-800 text-xl font-bold leading-none">✕</button>
            </div>
            <div className="bg-amber-50/40 p-4 rounded-2xl border border-dashed border-slate-300 font-mono text-slate-900 space-y-2 text-xs">
              <div className="text-center border-b border-dashed border-slate-400 pb-2">
                <h2 className="font-black text-base text-slate-900 tracking-tight">{currentSlip.dairyName}</h2>
                <p className="text-[10px] text-slate-600">Helpline: {currentSlip.dairyPhone || "N/A"}</p>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5">{currentSlip.date} • {currentSlip.time}</p>
              </div>
              <div className="py-1 border-b border-dashed border-slate-300 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Kisan</p>
                  <p className="font-black text-sm text-slate-900">{currentSlip.farmerName}</p>
                </div>
                <div className="text-right">
                  <span className="bg-slate-900 text-white text-[11px] font-black px-2 py-0.5 rounded">ID: #{currentSlip.farmerCode}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">{currentSlip.shift}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 py-1 text-slate-700">
                <div className="bg-white p-2 rounded-lg border border-slate-200"><p className="text-[9px] uppercase text-slate-400">Milk Type</p><p className="font-bold text-xs">{currentSlip.milkType}</p></div>
                <div className="bg-white p-2 rounded-lg border border-slate-200"><p className="text-[9px] uppercase text-slate-400">Fat %</p><p className="font-bold text-xs">{currentSlip.fat.toFixed(1)}%</p></div>
                <div className="bg-white p-2 rounded-lg border border-slate-200"><p className="text-[9px] uppercase text-slate-400">SNF %</p><p className="font-bold text-xs">{currentSlip.snf > 0 ? `${currentSlip.snf.toFixed(1)}%` : "N/A"}</p></div>
                <div className="bg-white p-2 rounded-lg border border-slate-200"><p className="text-[9px] uppercase text-slate-400">Water %</p><p className="font-bold text-xs">{currentSlip.water > 0 ? `${currentSlip.water.toFixed(1)}%` : "0.0%"}</p></div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-[10px] uppercase text-slate-400">Rate / Ltr</span>
                <span className="font-bold text-xs">₹{currentSlip.rate.toFixed(2)}</span>
              </div>
              <div className="bg-emerald-100/70 p-3 rounded-xl border border-emerald-300 text-emerald-950 flex justify-between items-center">
                <div><p className="text-[10px] font-bold uppercase text-emerald-800">Kul Doodh</p><p className="text-base font-black">{currentSlip.qty.toFixed(2)} Ltr</p></div>
                <div className="text-right"><p className="text-[10px] font-bold uppercase text-emerald-800">Kul Bhugtan</p><p className="text-2xl font-black text-emerald-900">₹{currentSlip.total.toFixed(2)}</p></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button type="button" onClick={() => sendWhatsAppSlip(currentSlip)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition">
                <span>💬</span><span>WhatsApp</span>
              </button>
              <button type="button" onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition">
                <span>🖨️</span><span>Print</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}