import React, { useEffect, useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import SalesInvoiceBill from "../invoices components/salesinvoicebill";
import { db } from "../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import {
  Truck,
  Hash,
  Plus,
  Trash2,
  Calculator,
  Banknote,
  Clock,
  Printer,
} from "lucide-react";

/* ================= Helpers ================= */
const cn = (...c) => c.filter(Boolean).join(" ");
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const money = (n) => (Number.isFinite(n) ? n.toLocaleString() : "0");

/* ================= Glass Background (same as your new dashboard) ================= */
const GlassBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-[#F8FAFC]" />

    {/* left biased glow (glass nazar aata hai) */}
    <div className="absolute inset-0 bg-[radial-gradient(980px_circle_at_12%_18%,rgba(99,102,241,0.26),transparent_58%),radial-gradient(980px_circle_at_18%_72%,rgba(59,130,246,0.22),transparent_62%),radial-gradient(980px_circle_at_82%_22%,rgba(14,165,233,0.12),transparent_60%)]" />

    {/* subtle grid */}
    <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:44px_44px]" />

    {/* premium noise */}
    <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay [background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22160%22 height=%22160%22 filter=%22url(%23n)%22 opacity=%220.25%22/%3E%3C/svg%3E')]" />
  </div>
);

/* ========= Invoice No Generator ========= */
const getNextInvoiceID = async (type) => {
  const prefix = type === "sales" ? "SHK-" : "PSK-";
  const q = query(collection(db, "transactions"), orderBy("invoiceNo", "desc"), limit(50));
  const querySnapshot = await getDocs(q);

  let lastNumber = 0;
  querySnapshot.forEach((doc) => {
    const id = doc.data().invoiceNo;
    if (id && id.startsWith(prefix)) {
      const num = parseInt(id.split("-")[1], 10);
      if (num > lastNumber) lastNumber = num;
    }
  });

  return `${prefix}${(lastNumber + 1).toString().padStart(4, "0")}`;
};

export default function SalesRecords() {
  const [customerData, setCustomerData] = useState({
    customerName: "",
    customerContact: "",
    address: "",
    invoiceNo: "Loading...",
  });

  const [items, setItems] = useState([
    {
      id: Date.now(),
      itemDescription: "",
      quantity: "",
      ratePerKg: "",
      purchaseRate: "",
      total: 0,
      itemProfit: 0,
    },
  ]);

  const [receivedAmount, setReceivedAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const componentRef = useRef(null);

  /* ====== Theme (Glass like dashboard/purchase) ====== */
  const fontStack = "Inter, system-ui, -apple-system, sans-serif";
  const pageWrap = "min-h-screen relative bg-[#F8FAFC] text-slate-900";

  const card =
    "relative overflow-hidden bg-white/30 backdrop-blur-3xl backdrop-saturate-[180%] border border-white/55 ring-1 ring-white/25 shadow-[0_24px_80px_-55px_rgba(2,6,23,0.55)] rounded-[2.6rem]";
  const sheen =
    "before:absolute before:inset-0 before:pointer-events-none before:content-[''] before:bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(255,255,255,0.25),rgba(255,255,255,0.55))] before:opacity-45";
  const cardHeader = "bg-white/18 border-b border-white/45";
  const softInset =
    "bg-white/22 border border-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]";

  const inputBase =
    "w-full rounded-2xl bg-white/24 backdrop-blur-xl border border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] text-slate-900 placeholder:text-slate-400/80 outline-none transition";
  const inputFocus =
    "focus:bg-white/40 focus:border-blue-300 focus:ring-4 focus:ring-blue-100/60";

  const pillBtn =
    "bg-white/30 backdrop-blur-2xl border border-white/60 ring-1 ring-white/20 shadow-sm hover:bg-white/42 transition active:scale-95";

  /* ====== Invoice No Fetch ====== */
  useEffect(() => {
    const fetchID = async () => {
      const nextID = await getNextInvoiceID("sales");
      setCustomerData((prev) => ({ ...prev, invoiceNo: nextID }));
    };
    fetchID();
  }, []);

  /* ====== Calculations ====== */
  const totals = useMemo(() => {
    const totalAmount = items.reduce((sum, item) => sum + toNum(item.total), 0);
    const totalProfit = items.reduce((sum, item) => sum + toNum(item.itemProfit), 0);
    const received = toNum(receivedAmount);
    const remaining = totalAmount - received;
    return { totalAmount, totalProfit, received, remaining };
  }, [items, receivedAmount]);

  /* ====== Print ====== */
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Sales_Bill_${customerData.invoiceNo}`,
  });

  /* ====== Handlers ====== */
  const handleCustomerChange = (e) =>
    setCustomerData({ ...customerData, [e.target.name]: e.target.value });

  const handleItemChange = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        const qty = toNum(field === "quantity" ? value : updated.quantity);
        const sRate = toNum(field === "ratePerKg" ? value : updated.ratePerKg);
        const pRate = toNum(field === "purchaseRate" ? value : updated.purchaseRate);

        updated.total = qty * sRate;
        updated.itemProfit = (sRate - pRate) * qty;

        return updated;
      })
    );
  };

  const addItem = () =>
    setItems((p) => [
      ...p,
      {
        id: Date.now() + Math.random(),
        itemDescription: "",
        quantity: "",
        ratePerKg: "",
        purchaseRate: "",
        total: 0,
        itemProfit: 0,
      },
    ]);

  const removeItem = (id) =>
    setItems((p) => (p.length > 1 ? p.filter((x) => x.id !== id) : p));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totals.totalAmount === 0) return alert("Please add at least one item.");

    setLoading(true);
    try {
      const finalInvoiceNo = await getNextInvoiceID("sales");

      const salesData = {
        invoiceNo: finalInvoiceNo,
        customerName: customerData.customerName,
        contact: customerData.customerContact,
        address: customerData.address,
        items,
        totalAmount: totals.totalAmount,
        receivedAmount: totals.received,
        remainingAmount: totals.remaining,
        profit: totals.totalProfit,
        type: "sales",
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, "transactions"), salesData);

      setTimeout(async () => {
        handlePrint();
        const nextID = await getNextInvoiceID("sales");

        setItems([
          {
            id: Date.now(),
            itemDescription: "",
            quantity: "",
            ratePerKg: "",
            purchaseRate: "",
            total: 0,
            itemProfit: 0,
          },
        ]);

        setCustomerData({
          customerName: "",
          customerContact: "",
          address: "",
          invoiceNo: nextID,
        });

        setReceivedAmount("");
        setLoading(false);
      }, 600);
    } catch (error) {
      console.error(error);
      alert("Error saving record.");
      setLoading(false);
    }
  };

  const canSubmit = useMemo(() => {
    const hasCustomer = customerData.customerName.trim() && customerData.customerContact.trim();
    const hasItem = items.some(
      (i) => i.itemDescription.trim() && (toNum(i.quantity) > 0 || toNum(i.ratePerKg) > 0)
    );
    return hasCustomer && hasItem && totals.totalAmount > 0 && !loading;
  }, [customerData.customerName, customerData.customerContact, items, totals.totalAmount, loading]);

  return (
    <div className={pageWrap} style={{ fontFamily: fontStack }}>
      <GlassBackground />

      {/* HEADER (glassy) */}
      <header className="sticky top-0 z-30 px-6 md:px-10 py-6 flex items-center justify-between bg-transparent backdrop-blur-md">
        <div className="flex items-center gap-5">
          <div className={cn("w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-slate-900", softInset, "bg-white/25")}>
            <Truck size={24} />
          </div>
          <div className="leading-tight">
            <h1 className="text-[18px] md:text-[20px] font-extrabold tracking-tight text-slate-900">
              Sales Dispatch
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
              Profit enabled
            </p>
          </div>
        </div>

        <div className={cn("px-5 py-3 rounded-2xl flex items-center gap-3", pillBtn, "text-slate-900")}>
          <Hash size={18} className="text-blue-700" />
          <p className="text-[13px] md:text-[15px] font-black">{customerData.invoiceNo}</p>
        </div>
      </header>

      {/* BODY */}
      <main className="relative z-10 px-6 md:px-10 pb-12 max-w-[1400px] mx-auto">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* CUSTOMER */}
            <section className={cn(card, sheen, "hover:shadow-[0_34px_110px_-70px_rgba(2,6,23,0.70)] transition")}>
              <div className={cn("p-7", cardHeader)}>
                <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-600">
                  Customer
                </h2>
              </div>

              <div className="p-7 grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                <Input
                  required
                  name="customerName"
                  value={customerData.customerName}
                  onChange={handleCustomerChange}
                  placeholder="Buyer Name"
                  className={cn(inputBase, inputFocus, "px-5 py-4 font-bold")}
                />
                <Input
                  required
                  name="customerContact"
                  value={customerData.customerContact}
                  onChange={handleCustomerChange}
                  placeholder="Contact"
                  className={cn(inputBase, inputFocus, "px-5 py-4 font-bold")}
                />
                <Input
                  name="address"
                  value={customerData.address}
                  onChange={handleCustomerChange}
                  placeholder="Address (optional)"
                  className={cn(inputBase, inputFocus, "px-5 py-4 font-bold")}
                />
              </div>
            </section>

            {/* ITEMS */}
            <section className={cn(card, sheen, "hover:shadow-[0_34px_110px_-70px_rgba(2,6,23,0.70)] transition")}>
              <div className={cn("p-7 flex items-center justify-between gap-4", cardHeader)}>
                <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-600">
                  Items
                </h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-blue-900/20"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>

              <div className="p-7 space-y-3 relative">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "grid grid-cols-1 md:grid-cols-12 gap-3 rounded-2xl p-4 transition",
                      "bg-white/18 border border-white/45 hover:bg-white/26"
                    )}
                  >
                    <div className="md:col-span-3">
                      <input
                        className={cn(inputBase, inputFocus, "px-4 py-3 font-bold")}
                        placeholder="Item Name"
                        value={item.itemDescription}
                        onChange={(e) => handleItemChange(item.id, "itemDescription", e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <input
                        type="number"
                        className={cn(inputBase, inputFocus, "px-4 py-3 font-black text-center text-blue-700")}
                        placeholder="Qty (KG)"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <input
                        type="number"
                        className={cn(inputBase, inputFocus, "px-4 py-3 font-black text-center text-emerald-700")}
                        placeholder="My Cost"
                        value={item.purchaseRate}
                        onChange={(e) => handleItemChange(item.id, "purchaseRate", e.target.value)}
                      />
                      <p className="text-[9px] text-center font-black text-emerald-600 mt-1 uppercase tracking-wider">
                        Purchase
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <input
                        type="number"
                        className={cn(inputBase, inputFocus, "px-4 py-3 font-black text-center text-blue-700")}
                        placeholder="Sale Rate"
                        value={item.ratePerKg}
                        onChange={(e) => handleItemChange(item.id, "ratePerKg", e.target.value)}
                      />
                      <p className="text-[9px] text-center font-black text-blue-600 mt-1 uppercase tracking-wider">
                        Selling
                      </p>
                    </div>

                    <div className="md:col-span-2 flex md:block items-center justify-between md:text-right">
                      <div className="md:text-right">
                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-wider">
                          Subtotal
                        </p>
                        <p className="text-[16px] font-black text-slate-900">
                          Rs {money(item.total)}
                        </p>
                        <p className="text-[10px] font-black text-indigo-700 mt-1">
                          Profit: Rs {money(item.itemProfit)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="md:col-span-1 flex md:justify-end items-center justify-end text-rose-600 hover:bg-rose-50/60 rounded-xl px-2 transition"
                      title="Remove"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT: SUMMARY */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              <section className={cn(card, sheen, "shadow-[0_34px_110px_-70px_rgba(2,6,23,0.70)]")}>
                <div className={cn("p-7", cardHeader)}>
                  <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-600">
                    Summary
                  </h2>
                </div>

                <div className="p-7 space-y-5 relative">
                  <div className={cn("rounded-[2rem] p-6", softInset, "bg-white/18")}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                          Total
                        </p>
                        <p className="mt-2 text-[34px] font-black tracking-tighter text-slate-900 leading-none">
                          Rs. {money(totals.totalAmount)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                          Profit
                        </p>
                        <p className="mt-2 text-[16px] font-black text-indigo-700">
                          Rs. {money(totals.totalProfit)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 h-px bg-white/60" />

                    <label className="mt-5 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                      Received
                    </label>
                    <div className="relative mt-2">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-500">
                        Rs.
                      </span>
                      <input
                        type="number"
                        value={receivedAmount}
                        onChange={(e) => setReceivedAmount(e.target.value)}
                        className={cn(inputBase, inputFocus, "pl-14 pr-5 py-4 font-black text-2xl")}
                        placeholder="0"
                      />
                    </div>

                    <div
                      className={cn(
                        "mt-5 rounded-2xl p-4 border flex items-center justify-between",
                        totals.remaining > 0
                          ? "bg-rose-50/60 border-rose-100/70"
                          : "bg-emerald-50/60 border-emerald-100/70"
                      )}
                    >
                      <span
                        className={cn(
                          "text-[10px] font-black uppercase tracking-[0.2em]",
                          totals.remaining > 0 ? "text-rose-700" : "text-emerald-700"
                        )}
                      >
                        {totals.remaining > 0 ? "Balance" : "Paid"}
                      </span>
                      <span
                        className={cn(
                          "text-[16px] font-black",
                          totals.remaining > 0 ? "text-rose-700" : "text-emerald-700"
                        )}
                      >
                        Rs. {money(totals.remaining)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className={cn(
                      "w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2",
                      canSubmit
                        ? "bg-slate-900 hover:bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                        : "bg-white/20 text-slate-400 cursor-not-allowed border border-white/50"
                    )}
                  >
                    <Printer size={18} />
                    {loading ? "Saving..." : "Finalize & Print"}
                  </button>

                  <div className="grid grid-cols-3 gap-3">
                    <MiniStat icon={Calculator} label="Bill" value={`Rs ${money(totals.totalAmount)}`} softInset={softInset} />
                    <MiniStat icon={Banknote} label="Recv" value={`Rs ${money(totals.received)}`} softInset={softInset} />
                    <MiniStat icon={Clock} label="Due" value={`Rs ${money(totals.remaining)}`} softInset={softInset} danger />
                  </div>
                </div>
              </section>
            </div>
          </div>
        </form>

        {/* PRINT PREVIEW */}
        <div style={{ display: "none" }}>
          <div ref={componentRef}>
            <SalesInvoiceBill
              data={{
                ...customerData,
                items,
                totalAmount: totals.totalAmount,
                receivedAmount: totals.received,
                remainingAmount: totals.remaining,
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function Input({ className, ...props }) {
  return <input {...props} className={className} />;
}

function MiniStat({ icon: Icon, label, value, softInset, danger }) {
  return (
    <div className={cn("rounded-2xl p-3", softInset, "bg-white/18")}>
      <div className="flex items-center gap-2">
        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", softInset, "bg-white/18")}>
          <Icon size={16} className={danger ? "text-rose-600" : "text-blue-700"} />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-600">{label}</p>
          <p className={cn("text-[12px] font-black truncate", danger ? "text-rose-700" : "text-slate-900")}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}