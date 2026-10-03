"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Supplier {
  id: string;
  supplier_code?: string;
  name: string;
  phone: string;
}

export default function SalesDispatchPage() {
  const [activeTab, setActiveTab] = useState<"sale" | "waste">("sale");
  const [dairyId, setDairyId] = useState<string>("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Add Supplier Modal
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supCode, setSupCode] = useState("");
  const [supName, setSupName] = useState("");
  const [supPhone, setSupPhone] = useState("");

  // Sale Form Fields
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [saleShift, setSaleShift] = useState<"morning" | "evening">("morning");
  const [saleMilkType, setSaleMilkType] = useState<"cow" | "buffalo" | "mixed">("mixed");
  const [saleQty, setSaleQty] = useState<number | "">("");
  const [saleRate, setSaleRate] = useState<number | "">("");
  const [saleTotal, setSaleTotal] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "pending">("pending");

  // Wastage Form Fields
  const [wasteShift, setWasteShift] = useState<"morning" | "evening">("morning");
  const [wasteMilkType, setWasteMilkType] = useState<"cow" | "buffalo" | "mixed">("mixed");
  const [wasteQty, setWasteQty] = useState<number | "">("");
  const [wasteReason, setWasteReason] = useState("Phat gaya (Curdled/Spoiled)");

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: dairyData } = await supabase
        .from("dairies")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (dairyData) {
        setDairyId(dairyData.id);

        const { data: supData } = await supabase
          .from("suppliers")
          .select("id, supplier_code, name, phone")
          .eq("dairy_id", dairyData.id)
          .order("created_at", { ascending: false });

        setSuppliers(supData || []);
        if (supData && supData.length > 0) {
          setSelectedSupplierId(supData[0].id);
        }
      }
    } catch (err: any) {
      console.error("Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculate Total Sale Amount
  useEffect(() => {
    const q = Number(saleQty) || 0;
    const r = Number(saleRate) || 0;
    setSaleTotal(Math.round(q * r * 100) / 100);
  }, [saleQty, saleRate]);

  // Handle Add Supplier
  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dairyId || !supName) return;

    try {
      const codeToUse = supCode.trim() || `S-${suppliers.length + 1}`;
      const { data, error } = await supabase
        .from("suppliers")
        .insert([
          {
            dairy_id: dairyId,
            supplier_code: codeToUse,
            name: supName.trim(),
            phone: supPhone.trim(),
          },
        ])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setSuppliers([data[0], ...suppliers]);
        setSelectedSupplierId(data[0].id);
      }
      setSupCode("");
      setSupName("");
      setSupPhone("");
      setShowSupplierModal(false);
      alert("✅ Naya Supplier / Grahak jud gaya!");
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Submit Sale Entry
  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dairyId || !selectedSupplierId || !saleQty || !saleRate) {
      alert("Kripya Supplier, Liters aur Bikri Rate sahi se bharein!");
      return;
    }

    try {
      setSaving(true);
      setMsg("");

      const { error } = await supabase.from("milk_sales").insert([
        {
          dairy_id: dairyId,
          supplier_id: selectedSupplierId,
          shift: saleShift,
          milk_type: saleMilkType,
          quantity_litres: Number(saleQty),
          rate_per_litre: Number(saleRate),
          total_amount: saleTotal,
          payment_status: paymentStatus,
        },
      ]);

      if (error) throw error;

      setMsg(`✅ Bikri Safal! ₹${saleTotal} ki entry save ho gayi.`);
      setSaleQty("");
      setSaleRate("");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Submit Wastage Entry
  const handleWasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dairyId || !wasteQty) {
      alert("Kripya Kharab Doodh ki quantity bharein!");
      return;
    }

    try {
      setSaving(true);
      setMsg("");

      const { error } = await supabase.from("milk_wastage").insert([
        {
          dairy_id: dairyId,
          shift: wasteShift,
          milk_type: wasteMilkType,
          quantity_litres: Number(wasteQty),
          reason: wasteReason,
        },
      ]);

      if (error) throw error;

      setMsg(`✅ ${wasteQty} Liter doodh kharab/wastage record me darj ho gaya.`);
      setWasteQty("");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600 font-bold">Sales & Dispatch Load Ho Raha Hai...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-12">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🚛</span>
            <h1 className="font-bold text-lg text-slate-900">Milk Sales & Outflow</h1>
          </div>
          <Link
            href="/dashboard"
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-lg"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-6">
        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 bg-slate-200 p-1.5 rounded-2xl mb-6">
          <button
            onClick={() => {
              setActiveTab("sale");
              setMsg("");
            }}
            className={`py-2.5 text-sm font-black rounded-xl transition ${
              activeTab === "sale"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🥛 Doodh Bikri (Sold Milk)
          </button>
          <button
            onClick={() => {
              setActiveTab("waste");
              setMsg("");
            }}
            className={`py-2.5 text-sm font-black rounded-xl transition ${
              activeTab === "waste"
                ? "bg-white text-rose-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ⚠️ Kharab / Wasted Doodh
          </button>
        </div>

        {msg && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-bold">
            {msg}
          </div>
        )}

        {/* SALE FORM */}
        {activeTab === "sale" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <form onSubmit={handleSaleSubmit} className="space-y-6">
              {/* Shift & Milk Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Shift</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSaleShift("morning")}
                      className={`py-2 text-xs font-bold rounded-xl border ${
                        saleShift === "morning"
                          ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      ☀️ Morning (सुबह)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSaleShift("evening")}
                      className={`py-2 text-xs font-bold rounded-xl border ${
                        saleShift === "evening"
                          ? "bg-indigo-600 text-white border-indigo-700 shadow-sm"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      🌙 Evening (शाम)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Milk Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSaleMilkType("cow")}
                      className={`py-2 text-xs font-bold rounded-xl border ${
                        saleMilkType === "cow"
                          ? "bg-emerald-600 text-white border-emerald-700"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      Cow
                    </button>
                    <button
                      type="button"
                      onClick={() => setSaleMilkType("buffalo")}
                      className={`py-2 text-xs font-bold rounded-xl border ${
                        saleMilkType === "buffalo"
                          ? "bg-emerald-600 text-white border-emerald-700"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      Buffalo
                    </button>
                    <button
                      type="button"
                      onClick={() => setSaleMilkType("mixed")}
                      className={`py-2 text-xs font-bold rounded-xl border ${
                        saleMilkType === "mixed"
                          ? "bg-emerald-600 text-white border-emerald-700"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      Mixed
                    </button>
                  </div>
                </div>
              </div>

              {/* Supplier Selection */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Kise Becha (Supplier / Buyer)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setSupCode(`S-${suppliers.length + 1}`);
                      setShowSupplierModal(true);
                    }}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg"
                  >
                    + Naya Supplier Jodein
                  </button>
                </div>

                {suppliers.length === 0 ? (
                  <p className="text-xs text-amber-700">Koi supplier nahi hai. Upar button se pehla buyer add karein.</p>
                ) : (
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.supplier_code ? `[${s.supplier_code}] ` : ""}{s.name} {s.phone ? `(📞 ${s.phone})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Liters & Selling Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Kitne Liter Becha? *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="e.g. 50"
                    value={saleQty}
                    onChange={(e) => setSaleQty(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-base font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Bikri Rate (₹ / Liter) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="e.g. 60"
                    value={saleRate}
                    onChange={(e) => setSaleRate(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-base font-black text-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Payment Status & Total */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">Payment Status</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentStatus("paid")}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold ${
                        paymentStatus === "paid" ? "bg-emerald-700 text-white" : "bg-white text-emerald-800 border"
                      }`}
                    >
                      Paisa Mil Gaya (Paid)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentStatus("pending")}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold ${
                        paymentStatus === "pending" ? "bg-amber-600 text-white" : "bg-white text-amber-800 border"
                      }`}
                    >
                      Udhar / Baaki (Pending)
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-emerald-800 font-bold uppercase">Kul Bikri Rashi</p>
                  <p className="text-3xl font-black text-emerald-950">₹{saleTotal.toFixed(2)}</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || suppliers.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-black text-base shadow-sm transition disabled:opacity-50"
              >
                {saving ? "Save Ho Raha Hai..." : "Doodh Bikri Entry Save Karein"}
              </button>
            </form>
          </div>
        )}

        {/* WASTAGE FORM */}
        {activeTab === "waste" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <form onSubmit={handleWasteSubmit} className="space-y-6">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
                ⚠️ Jo doodh phat gaya ya gir kar kharab ho gaya, use yahan darj karein taaki sham ke stock audit me hisab barabar rahe.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Shift</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWasteShift("morning")}
                      className={`py-2 text-xs font-bold rounded-xl border ${
                        wasteShift === "morning"
                          ? "bg-amber-500 text-white border-amber-600"
                          : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      Morning
                    </button>
                    <button
                      type="button"
                      onClick={() => setWasteShift("evening")}
                      className={`py-2 text-xs font-bold rounded-xl border ${
                        wasteShift === "evening"
                          ? "bg-indigo-600 text-white border-indigo-700"
                          : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      Evening
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Milk Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setWasteMilkType("cow")}
                      className={`py-2 text-xs font-bold rounded-xl border ${
                        wasteMilkType === "cow" ? "bg-rose-600 text-white" : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      Cow
                    </button>
                    <button
                      type="button"
                      onClick={() => setWasteMilkType("buffalo")}
                      className={`py-2 text-xs font-bold rounded-xl border ${
                        wasteMilkType === "buffalo" ? "bg-rose-600 text-white" : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      Buffalo
                    </button>
                    <button
                      type="button"
                      onClick={() => setWasteMilkType("mixed")}
                      className={`py-2 text-xs font-bold rounded-xl border ${
                        wasteMilkType === "mixed" ? "bg-rose-600 text-white" : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      Mixed
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Kharab / Phata Hua Doodh (Liters) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 5.0"
                  value={wasteQty}
                  onChange={(e) => setWasteQty(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-base font-black text-rose-800 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Kharab Hone Ka Kaaran (Reason)</label>
                <select
                  value={wasteReason}
                  onChange={(e) => setWasteReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  <option value="Phat gaya (Curdled/Spoiled)">Doodh Phat gaya (Curdled)</option>
                  <option value="Gir kar fail gaya (Spillage)">Gir kar fail gaya (Spillage)</option>
                  <option value="Quality testing me istemal hua">Quality testing me istemal hua</option>
                  <option value="Kisan se khatti quality aayi">Kisan se khatti quality aayi</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-xl font-black text-base shadow-sm transition disabled:opacity-50"
              >
                {saving ? "Save Ho Raha Hai..." : "Wastage Entry Darj Karein"}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Add Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h3 className="font-black text-slate-900 text-lg">Naya Supplier / Buyer Jodein</h3>
              <button onClick={() => setShowSupplierModal(false)} className="text-slate-400 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Supplier Code / ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S-1 ya PLANT-1"
                  value={supCode}
                  onChange={(e) => setSupCode(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-emerald-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Supplier / Party Ka Naam *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shyam Dairy Plant / Sharma Halwai"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10 digit phone"
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="flex-1 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow"
                >
                  Save Karein
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}