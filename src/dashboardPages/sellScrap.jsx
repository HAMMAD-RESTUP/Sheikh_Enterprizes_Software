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
  TrendingUp,
  Printer,
} from "lucide-react";

/* ================= Helpers ================= */
const cn = (...c) => c.filter(Boolean).join(" ");
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const money = (n) => (Number.isFinite(n) ? n.toLocaleString() : "0");

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

  /* ====== Theme (same as Purchase page) ====== */
  const pageWrap = "min-h-screen relative bg-[#F8FAFC] text-slate-900";
  const bg = (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[#F8FAFC]" />
      <div className="absolute inset-0 bg-[radial-gradient(950px_circle_at_18%_18%,rgba(59,130,246,0.12),transparent_55%),radial-gradient(900px_circle_at_84%_26%,rgba(14,165,233,0.1),transparent_55%)]" />
      <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:40px_40px]" />
    </div>
  );

  const card =
    "bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_10px_30px_rgba(15,23,42,0.06)] rounded-[2.4rem] overflow-hidden";
  const cardHeader = "bg-white/20 border-b border-white/60";
  const softInset =
    "bg-white/20 border border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]";
  const inputBase =
    "w-full rounded-2xl bg-white/30 border border-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] text-slate-800 placeholder:text-slate-400/80 outline-none transition";
  const inputFocus = "focus:bg-white/45 focus:border-blue-300 focus:ring-4 focus:ring-blue-100/60";

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
    <div className={pageWrap}>
      {bg}

      {/* HEADER (same vibe as Purchase) */}
      <header className="sticky top-0 z-30 px-6 md:px-10 py-6 flex items-center justify-between bg-transparent backdrop-blur-sm">
        <div className="flex items-center gap-5">
          <div className={cn("w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-slate-800", softInset)}>
            <Truck size={24} />
          </div>
          <div className="leading-tight">
            <h1 className="text-[18px] md:text-[20px] font-extrabold tracking-tight text-slate-900">
              Sales Dispatch
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
              Profit enabled
            </p>
          </div>
        </div>

        <div className={cn("px-5 py-3 rounded-2xl flex items-center gap-3", softInset)}>
          <Hash size={18} className="text-blue-600" />
          <p className="text-[13px] md:text-[15px] font-black text-slate-900">{customerData.invoiceNo}</p>
        </div>
      </header>

      {/* BODY */}
      <main className="relative z-10 px-6 md:px-10 pb-12 max-w-[1400px] mx-auto">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* CUSTOMER */}
            <section className={cn(card, "hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition")}>
              <div className={cn("p-7", cardHeader)}>
                <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Customer
                </h2>
              </div>

              <div className="p-7 grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <section className={cn(card, "hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition")}>
              <div className={cn("p-7 flex items-center justify-between gap-4", cardHeader)}>
                <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-500">
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

              <div className="p-7 space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "grid grid-cols-1 md:grid-cols-12 gap-3 rounded-2xl p-4 transition",
                      "bg-white/20 border border-white/60 hover:bg-white/30"
                    )}
                  >
                    <div className="md:col-span-3">
                      <input
                        className={cn(inputBase, inputFocus, "px-4 py-3 font-bold bg-white/15 border-white/60")}
                        placeholder="Item Name"
                        value={item.itemDescription}
                        onChange={(e) => handleItemChange(item.id, "itemDescription", e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <input
                        type="number"
                        className={cn(inputBase, inputFocus, "px-4 py-3 font-black text-center text-blue-700 bg-white/15 border-white/60")}
                        placeholder="Qty (KG)"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <input
                        type="number"
                        className={cn(inputBase, inputFocus, "px-4 py-3 font-black text-center text-emerald-700 bg-white/15 border-white/60")}
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
                        className={cn(inputBase, inputFocus, "px-4 py-3 font-black text-center text-blue-700 bg-white/15 border-white/60")}
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
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Subtotal</p>
                        <p className="text-[16px] font-black text-slate-900">Rs {money(item.total)}</p>
                        <p className="text-[10px] font-black text-indigo-600 mt-1">
                          Profit: Rs {money(item.itemProfit)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="md:col-span-1 flex md:justify-end items-center justify-end text-rose-500 hover:bg-rose-50/60 rounded-xl px-2 transition"
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
              {/* Summary Card */}
              <section className={cn(card, "shadow-[0_25px_70px_rgba(15,23,42,0.08)]")}>
                <div className={cn("p-7", cardHeader)}>
                  <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Summary
                  </h2>
                </div>

                <div className="p-7 space-y-5">
                  <div className={cn("rounded-[2rem] p-6", softInset, "bg-white/25")}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Total</p>
                        <p className="mt-2 text-[34px] font-black tracking-tighter text-slate-900 leading-none">
                          Rs. {money(totals.totalAmount)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Profit</p>
                        <p className="mt-2 text-[16px] font-black text-indigo-700">
                          Rs. {money(totals.totalProfit)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 h-px bg-white/70" />

                    <label className="mt-5 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                      Received
                    </label>
                    <div className="relative mt-2">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400/80">
                        Rs.
                      </span>
                      <input
                        type="number"
                        value={receivedAmount}
                        onChange={(e) => setReceivedAmount(e.target.value)}
                        className={cn(inputBase, inputFocus, "pl-14 pr-5 py-4 font-black text-2xl bg-white/30 border-white/70")}
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
                        : "bg-white/30 text-slate-400 cursor-not-allowed border border-white/60"
                    )}
                  >
                    <Printer size={18} />
                    {loading ? "Saving..." : "Finalize & Print"}
                  </button>

                  {/* Mini stat strip (optional but clean) */}
                  <div className="grid grid-cols-3 gap-3">
                    <MiniStat icon={Calculator} label="Bill" value={`Rs ${money(totals.totalAmount)}`} softInset={softInset} />
                    <MiniStat icon={Banknote} label="Recv" value={`Rs ${money(totals.received)}`} softInset={softInset} />
                    <MiniStat icon={Clock} label="Due" value={`Rs ${money(totals.remaining)}`} softInset={softInset} danger />
                  </div>
                </div>
              </section>

              {/* (You had a profit gradient box before — now it’s integrated cleanly in summary.) */}
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
    <div className={cn("rounded-2xl p-3", softInset, "bg-white/25")}>
      <div className="flex items-center gap-2">
        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", softInset, "bg-white/20")}>
          <Icon size={16} className={danger ? "text-rose-600" : "text-blue-600"} />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">{label}</p>
          <p className={cn("text-[12px] font-black truncate", danger ? "text-rose-700" : "text-slate-900")}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}