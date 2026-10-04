'use client';

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Dairy {
  id: string;
  name: string;
  owner_name: string;
  dairy_code: string;
  phone: string;
  email?: string;
  password_hash?: string;
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
  created_at?: string;
}

interface Supplier {
  id: string;
  supplier_code: string;
  name: string;
  phone: string;
  whatsapp_number?: string;
  village?: string;
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
  farmers?: {
    name: string;
    farmer_code?: string;
    phone?: string;
    village?: string;
  };
}

interface MilkSale {
  id: string;
  supplier_id: string;
  shift: string;
  quantity_litres: number;
  rate_per_litre: number;
  total_amount: number;
  created_at: string;
  suppliers?: {
    name: string;
    supplier_code?: string;
  };
}

interface MilkWastage {
  id: string;
  shift: string;
  quantity_litres: number;
  total_amount?: number;
  reason: string;
  created_at: string;
}

interface PaymentRecord {
  id: string;
  party_type: "farmer" | "supplier";
  farmer_id?: string;
  supplier_id?: string;
  amount: number;
  payment_mode: string;
  reference_no?: string;
  payment_date: string;
  notes?: string;
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
    dashboard: "Dashboard",
    milkEntry: "Milk Entry",
    farmers: "Farmers",
    payments: "Payments",
    reports: "Reports",
    settings: "Settings",
    today: "TODAY",
    todayCollection: "Today's Collection",
    todayFarmers: "Today's Farmers",
    todayAmount: "Today's Amount",
    totalSupply: "Total Supply",
    totalCollection: "TOTAL COLLECTION",
    rejectedMilk: "Total Rejected / Bad Milk",
    remainingMilk: "Remaining Milk",
    quickActions: "QUICK ACTIONS",
    addFarmer: "Add New Farmer",
    addEntry: "Add Milk Entry",
    parchis: "Parchis",
    addSupply: "Add Milk Supply",
    addRejected: "Add Rejected Milk",
    recordPayment: "RECORD PAYMENT",
    farmerPayments: "Farmer Payments (Paid)",
    buyerPayments: "Buyer Payments (Received)",
    save: "Save",
    shift: "Shift",
    morning: "Morning",
    evening: "Evening",
    cow: "Cow",
    buffalo: "Buffalo",
    other: "Other",
  },
  hi: {
    dashboard: "डैशबोर्ड",
    milkEntry: "दूध एंट्री",
    farmers: "किसान",
    payments: "भुगतान / लेन-देन",
    reports: "रिपोर्ट्स",
    settings: "सेटिंग्स",
    today: "आज का हिसाब",
    todayCollection: "आज का कुल दूध",
    todayFarmers: "आज आए किसान",
    todayAmount: "आज की कुल रकम",
    totalSupply: "आज की बिक्री (सप्लाई)",
    totalCollection: "कुल दूध संकलन",
    rejectedMilk: "खराब / फटा हुआ दूध",
    remainingMilk: "बचा हुआ स्टॉक",
    quickActions: "त्वरित कार्य (Quick Actions)",
    addFarmer: "नया किसान जोड़ें",
    addEntry: "दूध एंट्री करें",
    parchis: "पर्चियां",
    addSupply: "दूध बिक्री जोड़ें",
    addRejected: "खराब दूध दर्ज करें",
    recordPayment: "पेमेंट रिकॉर्ड करें",
    farmerPayments: "किसान को भुगतान (Paid)",
    buyerPayments: "सप्लायर से मिला पैसा (Received)",
    save: "सुरक्षित करें (Save)",
    shift: "शिफ्ट",
    morning: "सुबह",
    evening: "शाम",
    cow: "गाय",
    buffalo: "भैंस",
    other: "अन्य",
  },
};

export default function CompleteMasterDairyManager() {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [lang, setLang] = useState<"en" | "hi">("hi");
  const t = translations[lang] || translations.en;

  const [isAuth, setIsAuth] = useState(false);
  const [userRole, setUserRole] = useState<"owner" | "farmer">("owner");
  const [loading, setLoading] = useState(true);
  const [dairy, setDairy] = useState<Dairy | null>(null);

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

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [allEntries, setAllEntries] = useState<MilkEntry[]>([]);
  const [allSales, setAllSales] = useState<MilkSale[]>([]);
  const [allWastages, setAllWastages] = useState<MilkWastage[]>([]);
  const [allPayments, setAllPayments] = useState<PaymentRecord[]>([]);

  const [loggedInFarmer, setLoggedInFarmer] = useState<Farmer | null>(null);
  const [newFarmerPin, setNewFarmerPin] = useState("");
  const [pinChangeMsg, setPinChangeMsg] = useState("");

  const [activeBottomNav, setActiveBottomNav] = useState<"dashboard" | "entry" | "farmers" | "payments" | "reports" | "parchis" | "settings">("dashboard");

  const [activeDatePill, setActiveDatePill] = useState<string>("This Month");
  const todayStr = new Date().toISOString().split("T")[0];
  const firstDayStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const [filterStartDate, setFilterStartDate] = useState(firstDayStr);
  const [filterEndDate, setFilterEndDate] = useState(todayStr);

  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [currentSlip, setCurrentSlip] = useState<DigitalSlipData | null>(null);

  const [showAddFarmerModal, setShowAddFarmerModal] = useState(false);
  const [fCode, setFCode] = useState("");
  const [fName, setFName] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fWhatsapp, setFWhatsapp] = useState("");
  const [fVillage, setFVillage] = useState("");
  const [fAddress, setFAddress] = useState("");
  const [fPin, setFPin] = useState("123456");
  const [fStatus, setFStatus] = useState<boolean>(true);

  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [sCode, setSCode] = useState("");
  const [sName, setSName] = useState("");
  const [sPhone, setSPhone] = useState("");
  const [sWhatsapp, setSWhatsapp] = useState("");
  const [sVillage, setSVillage] = useState("");

  const [saleSupplierId, setSaleSupplierId] = useState("");
  const [saleQty, setSaleQty] = useState<number | "">("");
  const [saleRate, setSaleRate] = useState<number | "">("");

  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [wasteQty, setWasteQty] = useState<number | "">("");
  const [wastePrice, setWastePrice] = useState<number | "">("");
  const [wasteReason, setWasteReason] = useState("Doodh phat gaya (Curdled)");

  const [paymentSubTab, setPaymentSubTab] = useState<"farmer" | "buyer">("farmer");
  const [selectedPayTargetId, setSelectedPayTargetId] = useState("");
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [payRefNo, setPayRefNo] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [payMode, setPayMode] = useState<"cash" | "upi" | "bank">("cash");

  const [parchiSearchQuery, setParchiSearchQuery] = useState("");

  const [entryFarmerCode, setEntryFarmerCode] = useState("");
  const [entryFarmerId, setEntryFarmerId] = useState("");
  const [entryShift, setEntryShift] = useState<"morning" | "evening">("morning");
  const [entryType, setEntryType] = useState<"cow" | "buffalo" | "other">("cow");
  const [entryQty, setEntryQty] = useState<number | "">("");
  const [entryFat, setEntryFat] = useState<number | "">("");
  const [entrySnf, setEntrySnf] = useState<number | "">("");
  const [entryWater, setEntryWater] = useState<number | "">("");
  const [entryRate, setEntryRate] = useState<number | "">("");
  const [isManualRate, setIsManualRate] = useState(false);

  const [viewingFarmer, setViewingFarmer] = useState<Farmer | null>(null);

  const [settingDairyName, setSettingDairyName] = useState("");
  const [settingOwnerName, setSettingOwnerName] = useState("");
  const [settingDairyCode, setSettingDairyCode] = useState("");
  const [settingPhone, setSettingPhone] = useState("");
  const [settingEmail, setSettingEmail] = useState("");
  const [settingNewPassword, setSettingNewPassword] = useState("");
  const [settingLogoUrl, setSettingLogoUrl] = useState("");

  useEffect(() => {
    const savedDairyId = localStorage.getItem("currentDairyId");
    const savedRole = localStorage.getItem("userRole") as "owner" | "farmer";
    const savedFarmerId = localStorage.getItem("currentFarmerId");
    const isTermsAcceptedStorage = localStorage.getItem("dairyTermsAccepted");

    if (isTermsAcceptedStorage === "true") {
      setTermsAccepted(true);
    }

    if (savedDairyId && savedRole) {
      setIsAuth(true);
      setUserRole(savedRole);
      loadAppData(savedDairyId, savedRole, savedFarmerId);
    } else {
      setLoading(false);
    }
  }, []);

  const handleAllowTerms = () => {
    if (agreed) {
      setTermsAccepted(true);
      localStorage.setItem("dairyTermsAccepted", "true");
    } else {
      alert("Kripya aage badhne ke liye terms ko allow karein.");
    }
  };

  const loadAppData = async (dId: string, role: "owner" | "farmer", fId: string | null) => {
    try {
      setLoading(true);
      const { data: dData } = await supabase.from("dairies").select("*").eq("id", dId).maybeSingle();
      if (!dData) {
        handleLogout();
        return;
      }

      setDairy(dData);
      setSettingDairyName(dData.name || "");
      setSettingOwnerName(dData.owner_name || "");
      setSettingDairyCode(dData.dairy_code || "");
      setSettingPhone(dData.phone || "");
      setSettingEmail(dData.email || "");
      setSettingLogoUrl(dData.logo_url || "");

      if (role === "farmer" && fId) {
        const { data: fData } = await supabase.from("farmers").select("*").eq("id", fId).single();
        setLoggedInFarmer(fData || null);

        const [eRes, pRes] = await Promise.all([
          supabase.from("milk_entries").select("*, farmers(*)").eq("farmer_id", fId).order("created_at", { ascending: false }),
          supabase.from("dairy_payments").select("*").eq("farmer_id", fId).order("created_at", { ascending: false }),
        ]);

        setAllEntries((eRes.data as MilkEntry[]) || []);
        setAllPayments((pRes.data as PaymentRecord[]) || []);
      } else {
        const [fRes, sRes, eRes, saleRes, wRes, pRes] = await Promise.all([
          supabase.from("farmers").select("*").eq("dairy_id", dId).order("created_at", { ascending: false }),
          supabase.from("suppliers").select("*").eq("dairy_id", dId).order("created_at", { ascending: false }),
          supabase.from("milk_entries").select("*, farmers(*)").eq("dairy_id", dId).order("created_at", { ascending: false }),
          supabase.from("milk_sales").select("*, suppliers(*)").eq("dairy_id", dId).order("created_at", { ascending: false }),
          supabase.from("milk_wastage").select("*").eq("dairy_id", dId).order("created_at", { ascending: false }),
          supabase.from("dairy_payments").select("*").eq("dairy_id", dId).order("created_at", { ascending: false }),
        ]);

        setFarmers(fRes.data || []);
        setSuppliers(sRes.data || []);
        setAllEntries((eRes.data as MilkEntry[]) || []);
        setAllSales((saleRes.data as MilkSale[]) || []);
        setAllWastages((wRes.data as MilkWastage[]) || []);
        setAllPayments((pRes.data as PaymentRecord[]) || []);

        if (fRes.data && fRes.data.length > 0) {
          setEntryFarmerId(fRes.data[0].id);
          setEntryFarmerCode(fRes.data[0].farmer_code || "");
          setSelectedPayTargetId(fRes.data[0].id);
        }
        if (sRes.data && sRes.data.length > 0) {
          setSaleSupplierId(sRes.data[0].id);
        }
      }
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

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
          setAuthError(lang === "hi" ? "❌ गलत ईमेल या पासवर्ड!" : "❌ Invalid Email or Password!");
          return;
        }

        localStorage.setItem("currentDairyId", data.id);
        localStorage.setItem("userRole", "owner");
        setIsAuth(true);
        setUserRole("owner");
        loadAppData(data.id, "owner", null);
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
        setIsAuth(true);
        setUserRole("owner");
        loadAppData(data.id, "owner", null);
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
        setAuthError(lang === "hi" ? "❌ इस कोड पर कोई डेयरी नहीं मिली!" : "❌ Dairy not found!");
        return;
      }

      const { data: fData } = await supabase
        .from("farmers")
        .select("*")
        .eq("dairy_id", dData.id)
        .eq("farmer_code", fCodeInput.trim().toLowerCase())
        .maybeSingle();

      if (!fData || fData.pin_hash !== fPinInput.trim()) {
        setAuthError(lang === "hi" ? "❌ गलत किसान आईडी या पिन!" : "❌ Invalid Farmer ID or PIN!");
        return;
      }

      localStorage.setItem("currentDairyId", dData.id);
      localStorage.setItem("currentFarmerId", fData.id);
      localStorage.setItem("userRole", "farmer");
      setIsAuth(true);
      setUserRole("farmer");
      loadAppData(dData.id, "farmer", fData.id);
    } catch (err: any) {
      setAuthError("Error: " + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuth(false);
    setLoggedInFarmer(null);
    setTermsAccepted(false);
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

  const todayEntries = allEntries.filter((e) => e.created_at.startsWith(todayStr));
  const todaySales = allSales.filter((s) => s.created_at.startsWith(todayStr));
  const todayCollectionQty = todayEntries.reduce((acc, c) => acc + Number(c.quantity_litres || c.quantity_liters || 0), 0);
  const todayAmount = todayEntries.reduce((acc, c) => acc + Number(c.total_amount || 0), 0);
  const todayFarmersCount = new Set(todayEntries.map((e) => e.farmer_id)).size;
  const todaySupplyQty = todaySales.reduce((acc, c) => acc + Number(c.quantity_litres || 0), 0);

  const isDateInRange = (dateStr: string) => {
    const d = dateStr.slice(0, 10);
    return d >= filterStartDate && d <= filterEndDate;
  };

  const periodEntries = allEntries.filter((e) => isDateInRange(e.created_at));
  const periodSales = allSales.filter((s) => isDateInRange(s.created_at));
  const periodWastages = allWastages.filter((w) => isDateInRange(w.created_at));
  const periodPayments = allPayments.filter((p) => isDateInRange(p.payment_date || p.created_at));

  const periodCollectionQty = periodEntries.reduce((acc, c) => acc + Number(c.quantity_litres || c.quantity_liters || 0), 0);
  const periodCollectionAmount = periodEntries.reduce((acc, c) => acc + Number(c.total_amount || 0), 0);
  const periodSupplyQty = periodSales.reduce((acc, c) => acc + Number(c.quantity_litres || 0), 0);
  const periodSupplyAmount = periodSales.reduce((acc, c) => acc + Number(c.total_amount || 0), 0);
  const periodRejectedQty = periodWastages.reduce((acc, c) => acc + Number(c.quantity_litres || 0), 0);
  const periodRemainingQty = Math.max(0, Math.round((periodCollectionQty - periodSupplyQty - periodRejectedQty) * 10) / 10);

  const periodTotalEarned = periodCollectionAmount;
  const periodTotalSalesBill = periodSales.reduce((acc, c) => acc + Number(c.total_amount || 0), 0);
  const periodTotalReceived = periodPayments.filter((p) => p.party_type === "supplier").reduce((acc, c) => acc + Number(c.amount || 0), 0);
  const periodTotalPaid = periodPayments.filter((p) => p.party_type === "farmer").reduce((acc, c) => acc + Number(c.amount || 0), 0);
  const periodRemainingPayable = Math.max(0, Math.round((periodTotalEarned - periodTotalPaid) * 100) / 100);
  const periodRemainingReceivable = Math.max(0, Math.round((periodTotalSalesBill - periodTotalReceived) * 100) / 100);

  useEffect(() => {
    if (!isManualRate) {
      const f = Number(entryFat) || 0;
      const s = Number(entrySnf) || 0;
      if (f > 0) {
        let calcRate = 0;
        if (entryType === "cow") calcRate = f * 6.5 + (s > 0 ? s * 1.8 : 14);
        else if (entryType === "buffalo") calcRate = f * 7.5 + (s > 0 ? (s - 8.5) * 1.5 : 0);
        else calcRate = f * 7.0 + (s > 0 ? s * 1.5 : 12);
        setEntryRate(Math.round(calcRate * 100) / 100);
      }
    }
  }, [entryFat, entrySnf, entryType, isManualRate]);

  const handleFarmerCodeSearch = (code: string) => {
    setEntryFarmerCode(code);
    const matched = farmers.find((f: Farmer) => String(f.farmer_code).trim().toLowerCase() === code.trim().toLowerCase());
    if (matched) setEntryFarmerId(matched.id);
  };

  const getCleanDairyBrand = () => {
    const rawName = (dairy?.name || dairy?.dairy_code || "shyam").toLowerCase().trim();
    const cleanWord = rawName.replace(/(dairy|dudh|doodh|milk|center|centre)/gi, "").trim();
    const match = cleanWord.match(/^[a-z]+/i);
    return match ? match[0].toLowerCase() : (cleanWord || "kisan");
  };

  const openNewFarmerModal = () => {
    const brand = getCleanDairyBrand();
    const nextNum = 100 + farmers.length + 1;
    setFCode(`${brand}${nextNum}`);
    setFName(""); setFPhone(""); setFWhatsapp(""); setFVillage(""); setFAddress(""); setFPin("123456"); setFStatus(true);
    setShowAddFarmerModal(true);
  };

  const openNewSupplierModal = () => {
    const brand = getCleanDairyBrand();
    const nextNum = 100 + suppliers.length + 1;
    setSCode(`${brand}-sup${nextNum}`);
    setSName(""); setSPhone(""); setSWhatsapp(""); setSVillage("");
    setShowAddSupplierModal(true);
  };

  const handleAddFarmerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dairy || !fName || !fPhone || !fCode) return;
    try {
      const cleanCode = fCode.trim().toLowerCase();
      const { error } = await supabase.from("farmers").insert([
        {
          dairy_id: dairy.id,
          farmer_code: cleanCode,
          name: fName.trim(),
          phone: fPhone.trim(),
          whatsapp_number: fWhatsapp.trim() || fPhone.trim(),
          village: fVillage.trim(),
          address: fAddress.trim(),
          pin_hash: fPin.trim(),
          is_active: fStatus,
          approval_status: "approved",
        },
      ]);
      if (error) throw error;
      alert(`Kisan #${cleanCode} jud gaya!`);
      setShowAddFarmerModal(false);
      loadAppData(dairy.id, "owner", null);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleAddSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dairy || !sName || !sPhone) return;
    try {
      const cleanCode = sCode.trim().toLowerCase();
      const { error } = await supabase.from("suppliers").insert([
        {
          dairy_id: dairy.id,
          supplier_code: cleanCode,
          name: sName.trim(),
          phone: sPhone.trim(),
          whatsapp_number: sWhatsapp.trim() || sPhone.trim(),
          village: sVillage.trim(),
          is_active: true,
        },
      ]);
      if (error) throw error;
      alert(`Buyer/Supplier #${cleanCode} jud gaya!`);
      setShowAddSupplierModal(false);
      loadAppData(dairy.id, "owner", null);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleMilkEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dairy || !entryFarmerId || !entryQty || !entryRate) return;
    try {
      const totalAmount = Math.round(Number(entryQty) * Number(entryRate) * 100) / 100;
      const { error } = await supabase.from("milk_entries").insert([
        {
          dairy_id: dairy.id,
          farmer_id: entryFarmerId,
          shift: entryShift,
          milk_type: entryType,
          quantity_liters: Number(entryQty),
          quantity_litres: Number(entryQty),
          fat_percentage: Number(entryFat) || 0,
          snf_percentage: Number(entrySnf) || null,
          water_percentage: Number(entryWater) || 0,
          rate_per_liter: Number(entryRate),
          rate_per_litre: Number(entryRate),
          total_amount: totalAmount,
        },
      ]);
      if (error) throw error;

      const now = new Date();
      const selectedFarmer = farmers.find((f: Farmer) => f.id === entryFarmerId);
      const slip: DigitalSlipData = {
        dairyName: dairy.name,
        dairyPhone: dairy.phone,
        farmerName: selectedFarmer?.name || "Kisan",
        farmerCode: selectedFarmer?.farmer_code || "101",
        farmerPhone: selectedFarmer?.phone || "",
        date: now.toLocaleDateString("en-IN"),
        time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        shift: entryShift === "morning" ? "Morning (सुबह)" : "Evening (शाम)",
        milkType: entryType.toUpperCase(),
        qty: Number(entryQty),
        fat: Number(entryFat) || 0,
        snf: Number(entrySnf) || 0,
        water: Number(entryWater) || 0,
        rate: Number(entryRate),
        total: totalAmount,
      };
      setCurrentSlip(slip);
      setSlipModalOpen(true);
      setEntryQty(""); setEntryFat(""); setEntrySnf(""); setEntryWater(""); setIsManualRate(false);
      loadAppData(dairy.id, "owner", null);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const sendWhatsAppSlip = (slip: DigitalSlipData) => {
    const text = `🥛 *${slip.dairyName.toUpperCase()} - DOODH PARCHI* 🥛\n--------------------------------\n📅 Tarikh: ${slip.date} (${slip.time})\n☀️ Shift: ${slip.shift}\n👤 Kisan: *${slip.farmerName}* (ID: #${slip.farmerCode})\n🐄 Milk: ${slip.milkType}\n--------------------------------\n⚖️️ Matra: *${slip.qty.toFixed(2)} Ltr*\n🧈 Fat: *${slip.fat.toFixed(1)}%*\n🧪 SNF: *${slip.snf > 0 ? slip.snf.toFixed(1) + "%" : "N/A"}*\n💧 Water: *${slip.water > 0 ? slip.water.toFixed(1) + "%" : "0.0%"}*\n💵 Rate: *₹${slip.rate.toFixed(2)} / Ltr*\n--------------------------------\n💰 *KUL RASHI: ₹${slip.total.toFixed(2)}*\n--------------------------------\nDairy Helpline: ${slip.dairyPhone || "N/A"}\nDhanyawad! 🙏`;
    let cleanPhone = slip.farmerPhone.replace(/\D/g, "");
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const openHistoricSlip = (entry: MilkEntry) => {
    if (!dairy) return;
    const entryDate = new Date(entry.created_at);
    const slip: DigitalSlipData = {
      dairyName: dairy.name,
      dairyPhone: dairy.phone,
      farmerName: entry.farmers?.name || "Kisan",
      farmerCode: entry.farmers?.farmer_code || "101",
      farmerPhone: entry.farmers?.phone || "",
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

  const toggleFarmerStatus = async (farmer: Farmer) => {
    const newStatus = !(farmer.is_active !== false);
    try {
      const { error } = await supabase.from("farmers").update({ is_active: newStatus }).eq("id", farmer.id);
      if (error) throw error;
      setFarmers(farmers.map((f: Farmer) => (f.id === farmer.id ? { ...f, is_active: newStatus } : f)));
      if (viewingFarmer && viewingFarmer.id === farmer.id) {
        setViewingFarmer({ ...viewingFarmer, is_active: newStatus });
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const sendWhatsAppToFarmer = (phone: string, name: string, code: string) => {
    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
    const text = `राम-राम ${name} जी (किसान कोड: #${code}),\n${dairy?.name || "डेयरी"} से आपका स्वागत है।`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dairy || !selectedPayTargetId || !payAmount) return;
    try {
      const isFarmer = paymentSubTab === "farmer";
      const insertObj: any = {
        dairy_id: dairy.id,
        party_type: isFarmer ? "farmer" : "supplier",
        amount: Number(payAmount),
        payment_mode: payMode,
        reference_no: payRefNo,
        notes: payNotes,
      };
      if (isFarmer) insertObj.farmer_id = selectedPayTargetId;
      else insertObj.supplier_id = selectedPayTargetId;

      const { error } = await supabase.from("dairy_payments").insert([insertObj]);
      if (error) throw error;
      alert(`Payment Recorded!`);
      setPayAmount(""); setPayRefNo(""); setPayNotes("");
      loadAppData(dairy.id, "owner", null);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleSupplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dairy || !saleSupplierId || !saleQty || !saleRate) return;
    try {
      const total = Math.round(Number(saleQty) * Number(saleRate) * 100) / 100;
      const currentAvailableMilk = periodCollectionQty - periodSupplyQty - periodRejectedQty;
      if (Number(saleQty) > currentAvailableMilk) {
        alert(`Error: Aapke paas bechne ke liye sirf ${currentAvailableMilk.toFixed(1)} Ltr doodh available hai!`);
        return;
      }
      const { error } = await supabase.from("milk_sales").insert([
        {
          dairy_id: dairy.id,
          supplier_id: saleSupplierId,
          shift: "morning",
          quantity_litres: Number(saleQty),
          rate_per_litre: Number(saleRate),
          total_amount: total,
        },
      ]);
      if (error) throw error;
      alert("Milk Supply Recorded!");
      setShowSupplyModal(false);
      setSaleQty(""); setSaleRate("");
      loadAppData(dairy.id, "owner", null);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleRejectedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dairy || !wasteQty || wastePrice === "") return;
    try {
      const { error } = await supabase.from("milk_wastage").insert([
        {
          dairy_id: dairy.id,
          shift: "morning",
          quantity_litres: Number(wasteQty),
          total_amount: Number(wastePrice),
          reason: wasteReason,
        },
      ]);
      if (error) throw error;
      alert("Rejected/Bad Milk Recorded!");
      setShowRejectedModal(false);
      setWasteQty(""); setWastePrice("");
      loadAppData(dairy.id, "owner", null);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dairy) return;
    try {
      const updateObj: any = {
        name: settingDairyName,
        owner_name: settingOwnerName,
        dairy_code: settingDairyCode.toLowerCase().trim(),
        phone: settingPhone,
        email: settingEmail,
        logo_url: settingLogoUrl,
      };
      if (settingNewPassword.trim().length > 0) {
        if (settingNewPassword.trim().length < 6) {
          alert("Password kam se kam 6 characters ka hona chahiye!");
          return;
        }
        updateObj.password_hash = settingNewPassword.trim();
      }
      const { error } = await supabase.from("dairies").update(updateObj).eq("id", dairy.id);
      if (error) throw error;
      alert("Dairy Settings Updated!");
      setSettingNewPassword("");
      loadAppData(dairy.id, "owner", null);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleFarmerChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInFarmer || !newFarmerPin) return;
    if (newFarmerPin.trim().length < 4) {
      setPinChangeMsg("PIN kam se kam 4 characters ka hona chahiye.");
      return;
    }
    try {
      const { error } = await supabase.from("farmers").update({ pin_hash: newFarmerPin.trim() }).eq("id", loggedInFarmer.id);
      if (error) throw error;
      setPinChangeMsg("Password / PIN successfully update ho gaya!");
      setNewFarmerPin("");
    } catch (err: any) {
      setPinChangeMsg("Error: " + err.message);
    }
  };

  const formatAnimalLabel = (type: string) => {
    const tLower = (type || "").toLowerCase();
    if (tLower === "cow") return "🐄 Cow (गाय)";
    if (tLower === "buffalo") return "🐃 Buffalo (भैंस)";
    return "🥛 Other (अन्य)";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center">
        <p className="text-[#00796B] font-bold text-base animate-pulse">Loading Dashboard...</p>
      </div>
    );
  }

  // 1. TERMS & CONDITIONS SCREEN (AGREEMENT GATE)
  if (!termsAccepted) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Dairy Flow Pro - Terms & Conditions</h2>

        <div style={{ 
          height: '250px', 
          overflowY: 'scroll', 
          padding: '20px', 
          border: '1px solid #ccc', 
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
          marginBottom: '20px',
          lineHeight: '1.6',
          fontSize: '14px',
          color: '#555'
        }}>
          Dairy Flow Pro is built with the primary purpose of helping dairy owners, workers, and farmers manage their daily milk collection, animal records, financial tracking, payment calculations, and operational summaries smoothly and efficiently, ensuring that everyone involved in the dairy ecosystem can keep track of their daily work transparently and without unnecessary complications. Every feature integrated into this platform has been designed specifically to support the daily workflow of managing milk distribution, maintaining daily shift records, tracking fat and SNF values, handling customer accounts, and generating reports digitally. However, while we provide this platform as a helpful management tool to make your daily routine easier, it is absolutely essential for every user, dairy owner, and farmer to understand how data, system usage, privacy, and liabilities are handled as you navigate through the application. As you move forward into the subsequent pages, explore the various dashboard features, enter daily data, and use the system regularly, please be explicitly aware of our strict liability terms regarding data security, system operations, and unexpected technical failures. We take absolutely no responsibility or liability whatsoever for any data loss, data corruption, financial loss, server downtime, system errors, data leaks, or security breaches that may occur on the platform under any circumstances whatsoever. The user, dairy owner, and farmer explicitly acknowledge, understand, and agree that we carry zero legal, operational, financial, or moral liability for what happens to the data entered, stored, or processed within the system, whether due to technical glitches, software bugs, unauthorized access, hacking attempts, third-party interference, or any unforeseen circumstances beyond our control. You are solely, entirely, and completely responsible for your own data security, account credentials, device safety, operational choices, and passwords. The service is provided strictly on an as-is and as-available basis without any warranties or guarantees of any kind, whether express or implied, meaning we do not guarantee uninterrupted access, error-free execution, or absolute perfection in system performance. By continuing to use this application, accessing the features, scrolling through the pages, and proceeding further into the system, you unconditionally accept that the platform provider bears no responsibility for any unexpected issues, breaches, losses, or damages, and you completely agree to these terms to proceed further.
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <input 
            type="checkbox" 
            id="termsCheck" 
            checked={agreed} 
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          />
          <label htmlFor="termsCheck" style={{ cursor: 'pointer', fontSize: '15px', fontWeight: '500', color: '#333' }}>
            I have read and agree to all the terms and conditions. Allow access.
          </label>
        </div>

        <button 
          onClick={handleAllowTerms}
          disabled={!agreed}
          style={{
            padding: '12px 28px',
            backgroundColor: agreed ? '#27ae60' : '#bdc3c7',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: agreed ? 'pointer' : 'not-allowed',
            fontWeight: 'bold'
          }}
        >
          Allow & Continue
        </button>
      </div>
    );
  }

  // 2. LOGIN & REGISTER SCREEN
  if (!isAuth) {
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
                <button type="button" onClick={() => setOwnerMode("register")} className={`py-1.5 rounded-lg transition ${ownerMode === "register" ? "bg-slate-900 text-white" : "text-slate-600"}`}>Register (Sign Up)</button>
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
                      <input type="tel" required maxLength={10} placeholder="10 digit phone number" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold outline-none" />
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
                <input type="text" required placeholder="e.g. shyam1234" value={dCodeInput} onChange={(e) => setDCodeInput(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Farmer ID (Code)</label>
                <input type="text" required placeholder="e.g. shyam101" value={fCodeInput} onChange={(e) => setFCodeInput(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold outline-none" />
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
        </div>
      </div>
    );
  }

  // 3. FARMER PORTAL VIEW
  if (userRole === "farmer" && loggedInFarmer) {
    const isFarmerDateInRange = (dateStr: string) => {
      const d = dateStr.slice(0, 10);
      return d >= filterStartDate && d <= filterEndDate;
    };

    const filteredFarmerEntries = allEntries.filter((e) => isFarmerDateInRange(e.created_at));
    const farmerTotalMilk = filteredFarmerEntries.reduce((acc, c) => acc + Number(c.quantity_litres || c.quantity_liters || 0), 0);
    const farmerTotalBill = filteredFarmerEntries.reduce((acc, c) => acc + Number(c.total_amount || 0), 0);
    const farmerTotalPaid = allPayments.reduce((acc, c) => acc + Number(c.amount || 0), 0);
    const farmerBalance = Math.round((farmerTotalBill - farmerTotalPaid) * 100) / 100;

    const ownerPhone = dairy?.phone || "";
    const cleanOwnerPhone = ownerPhone.replace(/\D/g, "");

    return (
      <div className="min-h-screen bg-[#F3F6F4] text-slate-800 pb-16 font-sans antialiased p-4">
        <header className="bg-[#00796B] text-white px-5 py-4 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between mb-6 gap-3">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <span className="text-3xl">🌾</span>
            <div>
              <h1 className="font-extrabold text-lg leading-none">Kisan Portal: {loggedInFarmer.name}</h1>
              <span className="text-xs text-teal-100 font-medium">Farmer ID: <b>#{loggedInFarmer.farmer_code}</b> • Dairy: {dairy?.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select value={lang} onChange={(e) => setLang(e.target.value as any)} className="bg-white/20 text-white text-xs px-2.5 py-1.5 rounded-lg border border-white/30 font-bold outline-none cursor-pointer">
              <option value="en" className="text-slate-800">English</option>
              <option value="hi" className="text-slate-800">हिन्दी</option>
            </select>
            {ownerPhone && (
              <>
                <a href={`tel:${ownerPhone}`} className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-3 py-2 rounded-xl shadow flex items-center gap-1">
                  <span>📞</span> Call
                </a>
                <a href={`https://wa.me/${cleanOwnerPhone.length === 10 ? '91' + cleanOwnerPhone : cleanOwnerPhone}?text=${encodeURIComponent("Namaste Dairy Owner ji, mujhe mera hisab dekhna hai.")}`} target="_blank" rel="noopener noreferrer" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow flex items-center gap-1">
                  <span>💬</span> WhatsApp
                </a>
              </>
            )}
            <button onClick={handleLogout} className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow transition">
              🚪 Logout
            </button>
          </div>
        </header>

        <main className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <p className="text-xs font-bold text-slate-700 uppercase">📅 Hisab Filter Karein (Date Range)</p>
            <div className="flex flex-wrap gap-1.5">
              {["Today", "Yesterday", "Last 7 Days", "This Month", "This Year"].map((pill) => (
                <button key={pill} onClick={() => handlePillClick(pill)} className={`px-3 py-1 rounded-full text-xs font-bold transition ${activeDatePill === pill ? "bg-[#00796B] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {pill}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Aapka Kul Doodh</p>
              <p className="text-xl font-black text-slate-900 mt-1">{farmerTotalMilk.toFixed(1)} L</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Kul Bill (+)</p>
              <p className="text-xl font-black text-emerald-700 mt-1">₹{farmerTotalBill.toFixed(0)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Prapt Bhugtan (-)</p>
              <p className="text-xl font-black text-rose-600 mt-1">₹{farmerTotalPaid.toFixed(0)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Bacha Balance</p>
              <p className={`text-xl font-black mt-1 ${farmerBalance > 0 ? "text-rose-600" : "text-emerald-700"}`}>₹{farmerBalance.toFixed(0)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">🔒 Apna Login Password / PIN Badlein</h3>
            {pinChangeMsg && <p className="text-xs font-bold p-2 bg-slate-50 rounded-lg text-teal-800">{pinChangeMsg}</p>}
            <form onSubmit={handleFarmerChangePin} className="flex gap-2">
              <input type="password" required placeholder="Naya PIN (Min 4 chars)" value={newFarmerPin} onChange={(e) => setNewFarmerPin(e.target.value)} className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none" />
              <button type="submit" className="bg-[#00796B] hover:bg-[#004D40] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm">Update PIN</button>
            </form>
          </div>

          {/* Farmer Entries & Digital Parchi List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">🥛 Aapki Doodh Entries (Click for Parchi)</h3>
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {filteredFarmerEntries.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Is tareekh ke beech koi entry darj nahi hai.</p>
              ) : (
                filteredFarmerEntries.map((e) => (
                  <div key={e.id} onClick={() => openHistoricSlip(e)} className="py-3 flex justify-between items-center text-xs hover:bg-slate-50 px-2 rounded-xl cursor-pointer transition">
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
                  <div><p className="text-[10px] text-slate-500 uppercase">Kisan</p><p className="font-black text-sm text-slate-900">{currentSlip.farmerName}</p></div>
                  <div className="text-right"><span className="bg-slate-900 text-white text-[11px] font-black px-2 py-0.5 rounded">ID: #{currentSlip.farmerCode}</span><p className="text-[10px] text-slate-500 mt-0.5">{currentSlip.shift}</p></div>
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
                <button type="button" onClick={() => sendWhatsAppSlip(currentSlip)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition"><span>💬</span><span>WhatsApp</span></button>
                <button type="button" onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition"><span>🖨️</span><span>Print</span></button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 4. DAIRY OWNER ADMIN DASHBOARD
  let viewingFarmerEntries: MilkEntry[] = [];
  let viewingFarmerPayments: PaymentRecord[] = [];
  let viewingTotalMilk = 0;
  let viewingTotalBill = 0;
  let viewingTotalPaid = 0;
  let viewingBalance = 0;

  if (viewingFarmer) {
    viewingFarmerEntries = allEntries.filter((e) => e.farmer_id === viewingFarmer.id);
    viewingFarmerPayments = allPayments.filter((p) => p.party_type === "farmer" && p.farmer_id === viewingFarmer.id);
    viewingTotalMilk = viewingFarmerEntries.reduce((acc, c) => acc + Number(c.quantity_litres || c.quantity_liters || 0), 0);
    viewingTotalBill = viewingFarmerEntries.reduce((acc, c) => acc + Number(c.total_amount || 0), 0);
    viewingTotalPaid = viewingFarmerPayments.reduce((acc, c) => acc + Number(c.amount || 0), 0);
    viewingBalance = Math.round((viewingTotalBill - viewingTotalPaid) * 100) / 100;
  }

  return (
    <div className="min-h-screen bg-[#F3F6F4] text-slate-800 pb-24 font-sans antialiased">
      <header className="bg-[#00796B] text-white px-5 py-3 sticky top-0 z-30 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {dairy?.logo_url ? (
            <img src={dairy.logo_url} alt="Logo" className="w-10 h-10 rounded-full object-cover border-2 border-white" />
          ) : (
            <span className="text-2xl">🥛</span>
          )}
          <div>
            <h1 className="font-extrabold text-base leading-none tracking-tight">{dairy?.name || "Meri Dairy"}</h1>
            <span className="text-[11px] text-teal-100 font-medium">Code: <b>{dairy?.dairy_code}</b> • Owner: {dairy?.owner_name || "Admin"}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <select value={lang} onChange={(e) => setLang(e.target.value as any)} className="bg-white/10 text-white text-xs px-2.5 py-1.5 rounded-lg border border-white/20 font-bold outline-none cursor-pointer">
            <option value="en" className="text-slate-800">English</option>
            <option value="hi" className="text-slate-800">हिन्दी</option>
          </select>
          <button onClick={() => setActiveBottomNav("settings")} className="text-white hover:text-teal-200 transition p-1 text-base" title="Settings">⚙️</button>
          <button onClick={handleLogout} className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1" title="Logout">🚪 Logout</button>
        </div>
      </header>

      {activeBottomNav === "dashboard" && (
        <main className="max-w-5xl mx-auto px-4 py-5 space-y-6">
          <div>
            <h2 className="text-xs font-black text-slate-700 tracking-wider uppercase mb-3">{t.today}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                <div><p className="text-[11px] font-bold text-slate-500 uppercase">{t.todayCollection}</p><p className="text-2xl font-black text-slate-900 mt-2">{todayCollectionQty.toFixed(1)} L</p></div>
                <span className="text-slate-400 text-lg">🥛</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                <div><p className="text-[11px] font-bold text-slate-500 uppercase">{t.todayFarmers}</p><p className="text-2xl font-black text-slate-900 mt-2">{todayFarmersCount}</p></div>
                <span className="text-slate-400 text-lg">👥</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                <div><p className="text-[11px] font-bold text-slate-500 uppercase">{t.todayAmount}</p><p className="text-2xl font-black text-[#00796B] mt-2">₹{todayAmount.toFixed(0)}</p></div>
                <span className="text-slate-400 text-lg">₹</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                <div><p className="text-[11px] font-bold text-slate-500 uppercase">{t.totalSupply}</p><p className="text-2xl font-black text-slate-900 mt-2">{todaySupplyQty.toFixed(1)} L</p></div>
                <span className="text-slate-400 text-lg">🚚</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-black text-slate-700 tracking-wider uppercase mb-3">{t.totalCollection}</h2>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {["Today", "Yesterday", "Last 7 Days", "This Week", "This Month", "Last Month", "This Year"].map((pill) => (
                  <button key={pill} onClick={() => handlePillClick(pill)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${activeDatePill === pill ? "bg-[#00796B] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    {pill}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
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

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-500 uppercase">{t.totalCollection}</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{periodCollectionQty.toFixed(1)} L</p>
                <p className="text-xs font-bold text-slate-400 mt-0.5">₹{periodCollectionAmount.toFixed(0)}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-500 uppercase">{t.totalSupply}</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{periodSupplyQty.toFixed(1)} L</p>
                <p className="text-xs font-bold text-slate-400 mt-0.5">₹{periodSupplyAmount.toFixed(0)}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-500 uppercase">{t.rejectedMilk}</p>
                <p className="text-xl sm:text-2xl font-black text-rose-600 mt-1">{periodRejectedQty.toFixed(1)} L</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-500 uppercase">{t.remainingMilk}</p>
                <p className="text-xl sm:text-2xl font-black text-[#00796B] mt-1">{periodRemainingQty.toFixed(1)} L</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-black text-slate-700 tracking-wider uppercase mb-3">{t.quickActions}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <button onClick={openNewFarmerModal} className="bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center space-x-2.5 text-left shadow-sm transition">
                <span className="text-emerald-700 text-lg">👤+</span><span className="text-xs font-bold text-slate-800">{t.addFarmer}</span>
              </button>
              <button onClick={() => setActiveBottomNav("entry")} className="bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center space-x-2.5 text-left shadow-sm transition">
                <span className="text-emerald-700 text-lg">🥛</span><span className="text-xs font-bold text-slate-800">{t.addEntry}</span>
              </button>
              <button onClick={() => setActiveBottomNav("parchis")} className="bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center space-x-2.5 text-left shadow-sm transition">
                <span className="text-emerald-700 text-lg">🧾</span><span className="text-xs font-bold text-slate-800">{t.parchis}</span>
              </button>
              <button onClick={() => setShowSupplyModal(true)} className="bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center space-x-2.5 text-left shadow-sm transition">
                <span className="text-emerald-700 text-lg">🚚</span><span className="text-xs font-bold text-slate-800">{t.addSupply}</span>
              </button>
              <button onClick={() => setShowRejectedModal(true)} className="bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center space-x-2.5 text-left shadow-sm transition">
                <span className="text-rose-600 text-lg">⚠️</span><span className="text-xs font-bold text-slate-800">{t.addRejected}</span>
              </button>
              <button onClick={openNewSupplierModal} className="bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center space-x-2.5 text-left shadow-sm transition">
                <span className="text-emerald-700 text-lg">🏭+</span><span className="text-xs font-bold text-slate-800">Add Buyer / Supplier</span>
              </button>
              <button onClick={() => setActiveBottomNav("payments")} className="bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center space-x-2.5 text-left shadow-sm transition">
                <span className="text-emerald-700 text-lg">₹</span><span className="text-xs font-bold text-slate-800">{t.payments}</span>
              </button>
              <button onClick={() => setActiveBottomNav("farmers")} className="bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center space-x-2.5 text-left shadow-sm transition">
                <span className="text-emerald-700 text-lg">👥</span><span className="text-xs font-bold text-slate-800">{t.farmers}</span>
              </button>
              <button onClick={() => setActiveBottomNav("reports")} className="bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center space-x-2.5 text-left shadow-sm transition">
                <span className="text-emerald-700 text-lg">📊</span><span className="text-xs font-bold text-slate-800">{t.reports}</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {activeBottomNav === "entry" && (
        <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-xs font-black text-slate-700 tracking-wider uppercase">🥛 {t.addEntry}</h2>
              <button onClick={openNewFarmerModal} className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold px-3 py-1 rounded-xl">+ {t.addFarmer}</button>
            </div>
            <form onSubmit={handleMilkEntrySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{t.shift}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setEntryShift("morning")} className={`py-2 text-xs font-bold rounded-xl border ${entryShift === "morning" ? "bg-amber-500 text-white border-amber-600" : "bg-slate-50 text-slate-600"}`}>☀️ {t.morning}</button>
                    <button type="button" onClick={() => setEntryShift("evening")} className={`py-2 text-xs font-bold rounded-xl border ${entryShift === "evening" ? "bg-indigo-600 text-white border-indigo-700" : "bg-slate-50 text-slate-600"}`}>🌙 {t.evening}</button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">पशु (Animal Type)</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button type="button" onClick={() => setEntryType("cow")} className={`py-2 text-xs font-bold rounded-xl border ${entryType === "cow" ? "bg-[#00796B] text-white border-teal-700" : "bg-slate-50 text-slate-600"}`}>🐄 {t.cow}</button>
                    <button type="button" onClick={() => setEntryType("buffalo")} className={`py-2 text-xs font-bold rounded-xl border ${entryType === "buffalo" ? "bg-[#00796B] text-white border-teal-700" : "bg-slate-50 text-slate-600"}`}>🐃 {t.buffalo}</button>
                    <button type="button" onClick={() => setEntryType("other")} className={`py-2 text-xs font-bold rounded-xl border ${entryType === "other" ? "bg-[#00796B] text-white border-teal-700" : "bg-slate-50 text-slate-600"}`}>{t.other}</button>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kisan No. / ID</label>
                    <input type="text" placeholder="e.g. shyam101" value={entryFarmerCode} onChange={(e) => handleFarmerCodeSearch(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-emerald-800 outline-none" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Farmer Name</label>
                    <select value={entryFarmerId} onChange={(e) => { setEntryFarmerId(e.target.value); const m = farmers.find((f: Farmer) => f.id === e.target.value); if (m && m.farmer_code) setEntryFarmerCode(m.farmer_code); }} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none">
                      {farmers.map((f: Farmer) => (<option key={f.id} value={f.id}>#{f.farmer_code} • {f.name} (📞 {f.phone})</option>))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div><label className="block text-[10px] font-bold text-slate-600 mb-1">Quantity (Liters) *</label><input type="number" step="0.1" required placeholder="10.5" value={entryQty} onChange={(e) => setEntryQty(e.target.value === "" ? "" : Number(e.target.value))} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold outline-none" /></div>
                <div><label className="block text-[10px] font-bold text-slate-600 mb-1">Fat %</label><input type="number" step="0.1" placeholder="6.5" value={entryFat} onChange={(e) => { setIsManualRate(false); setEntryFat(e.target.value === "" ? "" : Number(e.target.value)); }} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold outline-none" /></div>
                <div><label className="block text-[10px] font-bold text-slate-600 mb-1">SNF %</label><input type="number" step="0.1" placeholder="8.5" value={entrySnf} onChange={(e) => { setIsManualRate(false); setEntrySnf(e.target.value === "" ? "" : Number(e.target.value)); }} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold outline-none" /></div>
                <div><label className="block text-[10px] font-bold text-slate-600 mb-1">Water % (पानी)</label><input type="number" step="0.1" placeholder="0.0" value={entryWater} onChange={(e) => setEntryWater(e.target.value === "" ? "" : Number(e.target.value))} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold outline-none" /></div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-800 uppercase mb-0.5">Rate (₹/L) — {isManualRate ? "✏️ Manually Set" : "⚡ Auto Calculated"}</label>
                  <div className="flex items-center gap-1.5"><span className="font-bold text-emerald-900">₹</span><input type="number" step="0.5" required value={entryRate} onChange={(e) => { setIsManualRate(true); setEntryRate(e.target.value === "" ? "" : Number(e.target.value)); }} className="w-24 bg-white border border-emerald-300 rounded-lg px-2.5 py-1 text-base font-black text-emerald-950 outline-none" /></div>
                </div>
                <div className="text-right"><p className="text-[10px] font-bold text-emerald-800 uppercase">Kul Rashi</p><p className="text-2xl font-black text-emerald-950">₹{((Number(entryQty) || 0) * (Number(entryRate) || 0)).toFixed(2)}</p></div>
              </div>
              <button type="submit" className="w-full bg-[#00796B] hover:bg-[#004D40] text-white py-3 rounded-xl font-bold text-sm shadow-sm transition">Save Milk Entry & Generate Parchi</button>
            </form>
          </div>
        </main>
      )}

      {activeBottomNav === "farmers" && (
        <main className="max-w-3xl mx-auto px-4 py-5 space-y-4">
          <div className="flex justify-between items-center">
            <div><h2 className="text-xs font-black text-slate-700 tracking-wider uppercase">{t.farmers} ({farmers.length})</h2><p className="text-[11px] text-slate-400">Profile, Full History, WhatsApp & Actions</p></div>
            <button onClick={openNewFarmerModal} className="bg-[#00796B] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm">+ {t.addFarmer}</button>
          </div>
          <div className="space-y-3">
            {farmers.map((f: Farmer) => {
              const isActive = f.is_active !== false;
              return (
                <div key={f.id} className={`bg-white border p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${isActive ? "border-slate-200" : "border-rose-200 bg-rose-50/20 opacity-80"}`}>
                  <div className="flex items-center space-x-3">
                    <span className={`w-14 h-10 rounded-2xl flex items-center justify-center font-black text-[11px] border ${isActive ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>#{f.farmer_code}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-extrabold text-sm text-slate-900">{f.name}</p>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>{isActive ? "Active" : "Deactivated"}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">📞 {f.phone} {f.village ? `• 🏡 ${f.village}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button onClick={() => setViewingFarmer(f)} className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition"><span>👁️</span><span>View</span></button>
                    <button onClick={() => sendWhatsAppToFarmer(f.whatsapp_number || f.phone, f.name, f.farmer_code)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition"><span>💬</span><span>WhatsApp</span></button>
                    <a href={`tel:${f.phone}`} className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition"><span>📞</span><span>Call</span></a>
                    <button onClick={() => toggleFarmerStatus(f)} className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition ${isActive ? "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100" : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"}`}>{isActive ? "Deactivate" : "Activate"}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {activeBottomNav === "payments" && (
        <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
          <div className="bg-slate-200 p-1 rounded-2xl flex">
            <button onClick={() => { setPaymentSubTab("farmer"); setSelectedPayTargetId(farmers[0]?.id || ""); }} className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition ${paymentSubTab === "farmer" ? "bg-white text-emerald-900 shadow-sm" : "text-slate-600"}`}>{t.farmerPayments}</button>
            <button onClick={() => { setPaymentSubTab("buyer"); setSelectedPayTargetId(suppliers[0]?.id || ""); }} className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition ${paymentSubTab === "buyer" ? "bg-white text-amber-900 shadow-sm" : "text-slate-600"}`}>{t.buyerPayments}</button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-black text-slate-700 tracking-wider uppercase">{paymentSubTab === "farmer" ? "🔴 Record Payment Given to Farmer (Paid)" : "🟢 Record Payment Received from Buyer (Received)"}</h2>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">{paymentSubTab === "farmer" ? "Select Farmer *" : "Select Buyer / Supplier *"}</label>
                {paymentSubTab === "farmer" ? (
                  <select value={selectedPayTargetId} onChange={(e) => setSelectedPayTargetId(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none">
                    {farmers.map((f: Farmer) => (<option key={f.id} value={f.id}>{f.farmer_code} • {f.name}</option>))}
                  </select>
                ) : (
                  <select value={selectedPayTargetId} onChange={(e) => setSelectedPayTargetId(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none">
                    {suppliers.map((s: Supplier) => (<option key={s.id} value={s.id}>{s.supplier_code} • {s.name}</option>))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Amount (₹) *</label>
                <input type="number" required placeholder="e.g. 1500" value={payAmount} onChange={(e) => setPayAmount(e.target.value === "" ? "" : Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none" />
              </div>
              <button type="submit" className="w-full bg-[#52B788] hover:bg-[#40916C] text-white py-3 rounded-xl font-bold text-sm shadow-sm transition">{t.save}</button>
            </form>
          </div>
        </main>
      )}

      {activeBottomNav === "settings" && (
        <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h2 className="text-base font-black text-slate-900 border-b pb-2">⚙️ Dairy Settings & Profile</h2>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div><label className="block text-xs font-bold text-slate-600 mb-1">Dairy Name</label><input type="text" required value={settingDairyName} onChange={(e) => setSettingDairyName(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none" /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-1">Owner Name</label><input type="text" required value={settingOwnerName} onChange={(e) => setSettingOwnerName(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none" /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-1">Phone</label><input type="tel" required maxLength={10} value={settingPhone} onChange={(e) => setSettingPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none" /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-1">New Password</label><input type="password" placeholder="Leave blank to keep old" value={settingNewPassword} onChange={(e) => setSettingNewPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none" /></div>
              <button type="submit" className="w-full bg-[#00796B] hover:bg-[#004D40] text-white py-3.5 rounded-xl font-bold text-xs shadow-md transition">Save Settings</button>
            </form>
          </div>
        </main>
      )}

      {activeBottomNav === "parchis" && (
        <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
          <h2 className="text-xs font-black text-slate-700 tracking-wider uppercase">{t.parchis}</h2>
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <input type="text" placeholder="Search farmer name or code..." value={parchiSearchQuery} onChange={(e) => setParchiSearchQuery(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none" />
          </div>
          <div className="space-y-2.5">
            {periodEntries.filter((e: MilkEntry) => {
              if (!parchiSearchQuery) return true;
              const q = parchiSearchQuery.toLowerCase();
              return e.farmers?.name?.toLowerCase().includes(q) || e.farmers?.farmer_code?.toLowerCase().includes(q);
            }).map((e: MilkEntry, idx: number) => (
              <div key={e.id} onClick={() => openHistoricSlip(e)} className="bg-white border border-slate-200 hover:border-[#00796B] p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer transition">
                <div>
                  <p className="font-extrabold text-xs text-slate-900">Entry #{idx + 1} • {formatAnimalLabel(e.milk_type)}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{e.farmers?.name || "Kisan"} (#{e.farmers?.farmer_code}) • {Number(e.quantity_litres || e.quantity_liters)} L</p>
                </div>
                <div className="text-right"><p className="font-black text-sm text-slate-900">₹{e.total_amount}</p><span className="text-[10px] text-slate-400 capitalize">{e.shift}</span></div>
              </div>
            ))}
          </div>
        </main>
      )}

      {activeBottomNav === "reports" && (
        <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
          <h2 className="text-xs font-black text-slate-700 tracking-wider uppercase">{t.reports}</h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
            {periodEntries.map((e: MilkEntry) => (
              <div key={e.id} className="p-3 flex justify-between items-center text-xs">
                <div><p className="font-bold text-slate-900">{e.farmers?.name} ({formatAnimalLabel(e.milk_type)})</p><p className="text-[10px] text-slate-400">{e.shift} • {e.created_at.slice(0, 10)}</p></div>
                <div className="text-right"><p className="font-black text-slate-900">{Number(e.quantity_litres || e.quantity_liters)} L</p><p className="text-emerald-700 font-bold">₹{e.total_amount}</p></div>
              </div>
            ))}
          </div>
        </main>
      )}

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-3 py-2 z-40 shadow-lg flex items-center justify-around">
        <button onClick={() => setActiveBottomNav("dashboard")} className={`flex flex-col items-center space-y-0.5 ${activeBottomNav === "dashboard" ? "text-[#00796B] font-bold" : "text-slate-400"}`}><span className="text-lg">🏠</span><span className="text-[10px]">{t.dashboard}</span></button>
        <button onClick={() => setActiveBottomNav("entry")} className={`flex flex-col items-center space-y-0.5 ${activeBottomNav === "entry" ? "text-[#00796B] font-bold" : "text-slate-400"}`}><span className="text-lg">🥛</span><span className="text-[10px]">{t.milkEntry}</span></button>
        <button onClick={() => setActiveBottomNav("farmers")} className={`flex flex-col items-center space-y-0.5 ${activeBottomNav === "farmers" ? "text-[#00796B] font-bold" : "text-slate-400"}`}><span className="text-lg">👥</span><span className="text-[10px]">{t.farmers}</span></button>
        <button onClick={() => setActiveBottomNav("payments")} className={`flex flex-col items-center space-y-0.5 ${activeBottomNav === "payments" ? "text-[#00796B] font-bold" : "text-slate-400"}`}><span className="text-lg">₹</span><span className="text-[10px]">{t.payments}</span></button>
        <button onClick={() => setActiveBottomNav("reports")} className={`flex flex-col items-center space-y-0.5 ${activeBottomNav === "reports" ? "text-[#00796B] font-bold" : "text-slate-400"}`}><span className="text-lg">📊</span><span className="text-[10px]">{t.reports}</span></button>
        <button onClick={() => setActiveBottomNav("settings")} className={`flex flex-col items-center space-y-0.5 ${activeBottomNav === "settings" ? "text-[#00796B] font-bold" : "text-slate-400"}`}><span className="text-lg">⚙️</span><span className="text-[10px]">{t.settings}</span></button>
      </nav>

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
                <div><p className="text-[10px] text-slate-500 uppercase">Kisan</p><p className="font-black text-sm text-slate-900">{currentSlip.farmerName}</p></div>
                <div className="text-right"><span className="bg-slate-900 text-white text-[11px] font-black px-2 py-0.5 rounded">ID: #{currentSlip.farmerCode}</span><p className="text-[10px] text-slate-500 mt-0.5">{currentSlip.shift}</p></div>
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
              <button type="button" onClick={() => sendWhatsAppSlip(currentSlip)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition"><span>💬</span><span>WhatsApp</span></button>
              <button type="button" onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition"><span>🖨️</span><span>Print</span></button>
            </div>
          </div>
        </div>
      )}

      {viewingFarmer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <span className="text-[10px] bg-slate-900 text-white font-bold px-2 py-0.5 rounded">Kisan ID: #{viewingFarmer.farmer_code}</span>
                <h3 className="font-extrabold text-base text-slate-900 mt-1">{viewingFarmer.name}</h3>
                <p className="text-xs text-slate-500">📞 {viewingFarmer.phone} {viewingFarmer.village ? `• 🏡 ${viewingFarmer.village}` : ""}</p>
              </div>
              <button onClick={() => setViewingFarmer(null)} className="text-slate-400 hover:text-slate-800 text-xl font-bold">✕</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200"><p className="text-[9px] font-bold text-slate-400 uppercase">Kul Doodh</p><p className="text-sm font-black text-slate-900 mt-0.5">{viewingTotalMilk.toFixed(1)} L</p></div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200"><p className="text-[9px] font-bold text-slate-400 uppercase">Kul Bill (+)</p><p className="text-sm font-black text-emerald-700 mt-0.5">₹{viewingTotalBill.toFixed(0)}</p></div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200"><p className="text-[9px] font-bold text-slate-400 uppercase">Diya Bhugtan (-)</p><p className="text-sm font-black text-rose-600 mt-0.5">₹{viewingTotalPaid.toFixed(0)}</p></div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200"><p className="text-[9px] font-bold text-slate-400 uppercase">Balance</p><p className={`text-sm font-black mt-0.5 ${viewingBalance > 0 ? "text-rose-600" : "text-emerald-700"}`}>₹{viewingBalance.toFixed(0)}</p></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => sendWhatsAppToFarmer(viewingFarmer.whatsapp_number || viewingFarmer.phone, viewingFarmer.name, viewingFarmer.farmer_code)} className="flex-1 bg-emerald-600 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm"><span>💬</span><span>WhatsApp</span></button>
              <a href={`tel:${viewingFarmer.phone}`} className="flex-1 bg-teal-600 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm text-center"><span>📞</span><span>Call</span></a>
              <button onClick={() => toggleFarmerStatus(viewingFarmer)} className={`flex-1 text-xs font-bold py-2 rounded-xl border ${viewingFarmer.is_active !== false ? "bg-rose-50 text-rose-700 border-rose-300" : "bg-emerald-50 text-emerald-800 border-emerald-300"}`}>{viewingFarmer.is_active !== false ? "Deactivate" : "Activate"}</button>
            </div>
            <button onClick={() => setViewingFarmer(null)} className="w-full bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl">Close</button>
          </div>
        </div>
      )}

      {showAddFarmerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-2"><h3 className="font-extrabold text-base text-slate-900">Add New Farmer</h3><button onClick={() => setShowAddFarmerModal(false)} className="text-slate-400 text-lg">✕</button></div>
            <form onSubmit={handleAddFarmerSubmit} className="space-y-3.5">
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Farmer ID (Code) *</label><input type="text" required placeholder="e.g. shyam101" value={fCode} onChange={(e) => setFCode(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-[#00796B] outline-none" /></div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Farmer Name *</label><input type="text" required placeholder="e.g. Ajay Yadav" value={fName} onChange={(e) => setFName(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Mobile *</label><input type="tel" required maxLength={10} placeholder="10 digit" value={fPhone} onChange={(e) => setFPhone(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold outline-none" /></div>
                <div><label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp</label><input type="tel" maxLength={10} placeholder="WhatsApp" value={fWhatsapp} onChange={(e) => setFWhatsapp(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold outline-none" /></div>
              </div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Village</label><input type="text" placeholder="Village" value={fVillage} onChange={(e) => setFVillage(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold outline-none" /></div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Login PIN *</label><input type="text" required placeholder="min 4 chars" value={fPin} onChange={(e) => setFPin(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold outline-none" /></div>
              <button type="submit" className="w-full bg-[#52B788] hover:bg-[#40916C] text-white py-3 rounded-xl font-bold text-sm shadow-sm mt-2 transition">Save Farmer</button>
            </form>
          </div>
        </div>
      )}

      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-2"><h3 className="font-extrabold text-base text-slate-900">Add Buyer / Supplier</h3><button onClick={() => setShowAddSupplierModal(false)} className="text-slate-400 text-lg">✕</button></div>
            <form onSubmit={handleAddSupplierSubmit} className="space-y-3.5">
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Supplier Code *</label><input type="text" required placeholder="e.g. sup101" value={sCode} onChange={(e) => setSCode(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-amber-700 outline-none" /></div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Buyer Name *</label><input type="text" required placeholder="Buyer Name" value={sName} onChange={(e) => setSName(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none" /></div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Mobile *</label><input type="tel" required maxLength={10} placeholder="Phone" value={sPhone} onChange={(e) => setSPhone(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold outline-none" /></div>
              <button type="submit" className="w-full bg-[#52B788] hover:bg-[#40916C] text-white py-3 rounded-xl font-bold text-sm shadow-sm mt-2 transition">Save Buyer</button>
            </form>
          </div>
        </div>
      )}

      {showSupplyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4 border-b pb-2"><h3 className="font-extrabold text-sm text-slate-900">Add Milk Supply</h3><button onClick={() => setShowSupplyModal(false)} className="text-slate-400 text-lg">✕</button></div>
            <form onSubmit={handleSupplySubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Select Buyer</label>
                <select value={saleSupplierId} onChange={(e) => setSaleSupplierId(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none">
                  {suppliers.map((s: Supplier) => (<option key={s.id} value={s.id}>{s.supplier_code} • {s.name}</option>))}
                </select>
              </div>
              <div><label className="block text-[11px] font-bold text-slate-600 mb-1">Quantity (Liters) *</label><input type="number" step="0.5" required placeholder="50" value={saleQty} onChange={(e) => setSaleQty(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold outline-none" /></div>
              <div><label className="block text-[11px] font-bold text-slate-600 mb-1">Rate (₹ / Liter) *</label><input type="number" step="0.5" required placeholder="60" value={saleRate} onChange={(e) => setSaleRate(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold outline-none" /></div>
              <button type="submit" className="w-full bg-[#00796B] text-white py-2.5 rounded-xl font-bold text-xs shadow-sm mt-2">Record Supply</button>
            </form>
          </div>
        </div>
      )}

      {showRejectedModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4 border-b pb-2"><h3 className="font-extrabold text-sm text-rose-700">Add Bad Milk</h3><button onClick={() => setShowRejectedModal(false)} className="text-slate-400 text-lg">✕</button></div>
            <form onSubmit={handleRejectedSubmit} className="space-y-3">
              <div><label className="block text-[11px] font-bold text-slate-600 mb-1">Quantity (Liters) *</label><input type="number" step="0.1" required placeholder="5.0" value={wasteQty} onChange={(e) => setWasteQty(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-rose-700 outline-none" /></div>
              <div><label className="block text-[11px] font-bold text-slate-600 mb-1">Estimated Loss (₹) *</label><input type="number" step="1" required placeholder="250" value={wastePrice} onChange={(e) => setWastePrice(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-rose-700 outline-none" /></div>
              <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm mt-2">Record Bad Milk</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}