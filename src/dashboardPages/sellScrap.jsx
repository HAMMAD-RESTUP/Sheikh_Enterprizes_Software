import React, { useState } from 'react';
import { User, Phone, MapPin, Weight, CreditCard, Save, CheckCircle, Truck, Calculator } from 'lucide-react';

export default function SalesRecords() {
  const [formData, setFormData] = useState({
    buyerName: '',
    buyerContact: '',
    deliveryAddress: '',
    saleWeight: '', // In Tons
    ratePerTon: ''  
  });

  const [loading, setLoading] = useState(false);

  // Theme Constants
  const themeDarkBlue = "bg-[#001D3D]";
  const textDarkBlue = "text-[#001D3D]";

  const handleChange = (e) => {
    const { name, value } = e.target;
    // 11 Digits validation for contact
    if (name === 'buyerContact' && value !== '') {
      if (!/^\d+$/.test(value) || value.length > 11) return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const totalSaleAmount = (Number(formData.saleWeight) || 0) * (Number(formData.ratePerTon) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Firebase logic yahan aayega
    setTimeout(() => {
      alert("Sales Record Saved Successfully at Sheikh Traders!");
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* HEADER SECTION */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-5">
          <div className={`w-14 h-14 ${themeDarkBlue} rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100`}>
            <Truck size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Sales <span className="text-blue-600">Dispatch</span></h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]"> Sheikh Traders • Outgoing Inventory</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* BUYER INFORMATION CARD */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
            <User size={14} className={textDarkBlue} /> 01. Buyer & Consignee Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Buyer / Company Name</label>
              <input 
                required
                name="buyerName"
                value={formData.buyerName}
                onChange={handleChange}
                placeholder="e.g. Lucky Steels Ltd"
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 font-bold focus:border-[#001D3D] focus:bg-white transition-all outline-none text-slate-900 shadow-inner"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Buyer Contact (11 Digits)</label>
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  required
                  name="buyerContact"
                  value={formData.buyerContact}
                  onChange={handleChange}
                  placeholder="03001234567"
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 pl-12 font-bold focus:border-[#001D3D] focus:bg-white transition-all outline-none text-slate-900 shadow-inner"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Delivery Destination Address</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-4 top-6 text-slate-300" />
                <textarea 
                  required
                  name="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Enter full factory or site address..."
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 pl-12 font-bold focus:border-[#001D3D] focus:bg-white transition-all outline-none text-slate-900 shadow-inner resize-none"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* LOADING & RATE CARD */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
            <Weight size={14} className="text-emerald-500" /> 02. Load Weight & Pricing
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Dispatch Quantity (Tons)</label>
              <input 
                required
                name="saleWeight"
                value={formData.saleWeight}
                onChange={handleChange}
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 font-bold focus:border-[#001D3D] focus:bg-white transition-all outline-none text-slate-900 shadow-inner"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Rate Per Ton (PKR)</label>
              <div className="relative">
                <CreditCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  required
                  name="ratePerTon"
                  value={formData.ratePerTon}
                  onChange={handleChange}
                  type="number"
                  placeholder="e.g. 245000"
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 pl-12 font-bold focus:border-[#001D3D] focus:bg-white transition-all outline-none text-slate-900 shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>

        {/* FINAL TOTAL & SUBMIT - MATCHING NET STOCK BOX */}
        <div className={`${themeDarkBlue} rounded-[3rem] p-10 text-white flex flex-col md:flex-row justify-between items-center shadow-2xl shadow-blue-900/30 relative overflow-hidden`}>
          <div className="flex items-center gap-8 relative z-10">
            <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/10 hidden sm:block">
              <Calculator size={36} />
            </div>
            <div>
              <p className="text-blue-300 font-bold text-[10px] uppercase tracking-[0.4em] mb-2">Grand Total Sale Value</p>
              <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter">
                <span className="text-lg font-normal opacity-40 mr-3 not-italic">PKR</span>
                {totalSaleAmount.toLocaleString()}
              </h1>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="mt-8 md:mt-0 w-full md:w-auto flex items-center justify-center gap-4 bg-white text-[#001D3D] px-12 py-5 rounded-2xl font-black tracking-[0.1em] text-sm hover:bg-blue-50 transition-all shadow-xl active:scale-95 group relative z-10"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-[#001D3D]/30 border-t-[#001D3D] rounded-full animate-spin"></div>
            ) : (
              <>
                <Truck size={20} className="group-hover:translate-x-1 transition-transform" />
                <span>CONFIRM DISPATCH</span>
                <CheckCircle size={18} className="opacity-40" />
              </>
            )}
          </button>

          {/* Decoration like Net Stock box */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        </div>
      </form>
    </div>
  );
}