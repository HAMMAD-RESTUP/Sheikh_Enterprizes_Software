import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import PurchaseInvoiceBill from '../invoices components/purchaseInvoiceBill';
import { 
  User, Weight, Calculator, Save, Printer, Plus, Trash2, MapPin, ClipboardList, Zap
} from 'lucide-react';

export default function PurchaseScrap() {
  const [customerData, setCustomerData] = useState({
    customerName: '', customerContact: '', address: '',
  });

  const [items, setItems] = useState([
    { id: Date.now(), itemDescription: '', quantity: '', ratePerKg: '', total: 0 }
  ]);

  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Theme Colors - Matching your "Net Stock" box
  const themeDarkBlue = "bg-[#001D3D]";
  const textDarkBlue = "text-[#001D3D]";

  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Invoice_${customerData.customerName}`,
  });

  useEffect(() => {
    const grandTotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    setTotalAmount(grandTotal);
    setIsSaved(false);
  }, [items]);

  const handleCustomerChange = (e) => {
    setCustomerData({ ...customerData, [e.target.name]: e.target.value });
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const qty = field === 'quantity' ? value : item.quantity;
        const rate = field === 'ratePerKg' ? value : item.ratePerKg;
        return {
          ...item,
          [field]: value,
          total: (Number(qty) || 0) * (Number(rate) || 0)
        };
      }
      return item;
    }));
  };

  const addItem = () => setItems([...items, { id: Date.now(), itemDescription: '', quantity: '', ratePerKg: '', total: 0 }]);
  const removeItem = (id) => items.length > 1 && setItems(items.filter(item => item.id !== id));

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsSaved(true);
      alert('Record saved successfully at Sheikh Traders');
    }, 1000);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER - Modern & Clean */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className={`w-14 h-14 ${themeDarkBlue} rounded-[1.2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-200`}>
            <ClipboardList size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Purchase <span className="text-blue-600">Entry</span></h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Sheikh Traders Inventory Management</p>
          </div>
        </div>
        
        {isSaved && (
          <button onClick={handlePrint} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-xl shadow-emerald-100 transition-all flex items-center gap-3 animate-bounce">
            <Printer size={18} /> PRINT INVOICE
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SELLER DETAILS CARD */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-8">
            <div className={`p-2 rounded-lg bg-blue-50 ${textDarkBlue}`}><User size={18} /></div>
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Seller Personal Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Full Name</label>
              <input required name="customerName" value={customerData.customerName} onChange={handleCustomerChange} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 font-bold focus:border-[#001D3D] focus:bg-white transition-all outline-none text-slate-900 shadow-inner" placeholder="Enter name..." />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Contact Number</label>
              <input required name="customerContact" value={customerData.customerContact} onChange={handleCustomerChange} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 font-bold focus:border-[#001D3D] focus:bg-white transition-all outline-none text-slate-900 shadow-inner" placeholder="03xx-xxxxxxx" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Location / Address</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input name="address" value={customerData.address} onChange={handleCustomerChange} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 pl-12 font-bold focus:border-[#001D3D] focus:bg-white transition-all outline-none text-slate-900 shadow-inner" placeholder="City or Warehouse" />
              </div>
            </div>
          </div>
        </div>

        {/* ITEMS SECTION */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><Weight size={18} /></div>
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Items & Weights</h2>
            </div>
            <button type="button" onClick={addItem} className={`${themeDarkBlue} hover:bg-blue-900 text-white px-6 py-3 rounded-xl font-black text-[10px] tracking-[0.1em] flex items-center gap-2 transition-all shadow-lg shadow-blue-100`}>
              <Plus size={16} /> ADD ITEM
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50 p-6 rounded-[2rem] items-center group transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-100 border border-transparent hover:border-slate-100">
                <div className="md:col-span-5">
                  <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block ml-1">Material Description</label>
                  <input required value={item.itemDescription} onChange={(e) => handleItemChange(item.id, 'itemDescription', e.target.value)} className="w-full bg-transparent p-1 font-black text-slate-800 text-lg outline-none" placeholder="e.g. Mixed Iron Scrap" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block ml-1">Buying Quantity (KG)</label>
                  <input required type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} className="w-full bg-white border border-slate-100 rounded-xl p-3 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-100" placeholder="0" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block ml-1">Buying Rate / KG</label>
                  <input required type="number" value={item.ratePerKg} onChange={(e) => handleItemChange(item.id, 'ratePerKg', e.target.value)} className="w-full bg-white border border-slate-100 rounded-xl p-3 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-100" placeholder="0" />
                </div>
                <div className="md:col-span-2 text-right">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">buying Item Total</p>
                   <p className={`font-black ${textDarkBlue} text-xl italic tracking-tighter`}>Rs {item.total.toLocaleString()}</p>
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <button type="button" onClick={() => removeItem(item.id)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TOTAL SUMMARY - MATCHING THE "NET STOCK" BOX STYLE */}
        <div className={`${themeDarkBlue} rounded-[3rem] p-10 text-white flex flex-col md:flex-row justify-between items-center shadow-2xl shadow-blue-900/40 relative overflow-hidden min-h-[180px]`}>
          <div className="flex items-center gap-8 relative z-10">
            <div className="bg-white/10 p-5 rounded-[1.5rem] backdrop-blur-md border border-white/10 hidden sm:block">
              <Calculator size={40} className="text-white" />
            </div>
            <div>
              <p className="text-blue-300 font-bold text-[11px] uppercase tracking-[0.4em] mb-2 opacity-80">Fixed Amount Payable</p>
              <h1 className="text-5xl font-black italic tracking-tighter flex items-baseline gap-3">
                <span className="text-xl font-normal opacity-40 uppercase not-italic">PKR</span>
                {totalAmount.toLocaleString()}
              </h1>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="mt-8 md:mt-0 w-full md:w-auto flex items-center justify-center gap-4 bg-white text-[#001D3D] px-16 py-5 rounded-2xl font-black tracking-[0.1em] text-sm hover:bg-blue-50 transition-all shadow-2xl active:scale-95 group relative z-10"
          >
            {loading ? "SAVING..." : <><Save size={20} className="group-hover:animate-pulse" /> Save Buying</>}
          </button>

          {/* Background Decorative Circles like Net Stock box */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full -ml-20 -mb-20 blur-2xl"></div>
        </div>

      </form>

      {/* INVOICE COMPONENT (HIDDEN) */}
      <div className="hidden">
        <PurchaseInvoiceBill ref={componentRef} data={{...customerData, items}} totalAmount={totalAmount} />
      </div>
    </div>
  );
}