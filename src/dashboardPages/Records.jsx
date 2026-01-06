import React, { useState } from 'react';
import { 
  Search, Filter, ArrowDownCircle, ArrowUpCircle, Download, 
  Calendar, MoreVertical, ChevronLeft, ChevronRight, Hash
} from 'lucide-react';

export default function Records() {
  const [activeTab, setActiveTab] = useState('purchase'); // 'purchase' or 'sales'

  // Deep Navy Theme Constants
  const themeDarkBlue = "bg-[#001D3D]";
  const textDarkBlue = "text-[#001D3D]";

  // Demo Data
  const purchaseData = [
    { id: 'TXN-001', name: 'Malik Steels', weight: '12', contact: '03001234567', date: '2026-01-05', status: 'Completed' },
    { id: 'TXN-002', name: 'Aslam Bhai', weight: '8.5', contact: '03129876543', date: '2026-01-04', status: 'Pending' },
    { id: 'TXN-003', name: 'Karachi Scraps', weight: '22', contact: '03335554433', date: '2026-01-04', status: 'Completed' },
  ];

  const salesData = [
    { id: 'SLS-992', name: 'Lucky Cement', weight: '15', contact: '0423123456', date: '2026-01-06', status: 'Dispatched' },
    { id: 'SLS-993', name: 'Ittehad Foundaries', weight: '45', contact: '03210009988', date: '2026-01-05', status: 'Dispatched' },
  ];

  const currentData = activeTab === 'purchase' ? purchaseData : salesData;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER & MODERN TAB SWITCHER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Archive <span className="text-blue-600">Logs</span></h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Sheikh Traders Transaction History</p>
        </div>

        <div className="flex bg-slate-200/50 p-1.5 rounded-[1.5rem] border border-slate-200 shadow-inner">
          <button 
            onClick={() => setActiveTab('purchase')}
            className={`flex items-center gap-2 px-8 py-3 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'purchase' ? `${themeDarkBlue} text-white shadow-xl shadow-blue-900/20` : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ArrowDownCircle size={14} /> Purchases
          </button>
          <button 
            onClick={() => setActiveTab('sales')}
            className={`flex items-center gap-2 px-8 py-3 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'sales' ? `${themeDarkBlue} text-white shadow-xl shadow-blue-900/20` : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ArrowUpCircle size={14} /> Sales
          </button>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#001D3D] transition-colors" size={18} />
          <input 
            type="text" 
            placeholder={`Search ${activeTab} records by name, ID or weight...`} 
            className="w-full bg-white border border-slate-200 rounded-[1.5rem] py-4 pl-14 pr-6 text-sm font-bold text-slate-900 shadow-sm focus:ring-4 focus:ring-blue-50 outline-none transition-all"
          />
        </div>
        <div className="lg:col-span-4 flex gap-3">
          <button className="flex-1 bg-white border border-slate-200 text-slate-700 rounded-[1.5rem] flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <Filter size={16} className={textDarkBlue} /> Filter
          </button>
          <button className={`p-4 ${themeDarkBlue} text-white rounded-[1.5rem] hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20`}>
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* DATA TABLE CARD */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[2px]">
                  <div className="flex items-center gap-2"><Hash size={12}/> Transaction ID</div>
                </th>
                <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[2px]">Entity / Company</th>
                <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[2px]">Net Weight</th>
                <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[2px]">Contact Info</th>
                <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[2px]">Date</th>
                <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[2px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentData.map((row) => (
                <tr key={row.id} className="hover:bg-blue-50/30 transition-colors group cursor-default">
                  <td className="px-8 py-5 text-sm font-black text-[#001D3D]">{row.id}</td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-black text-slate-800 leading-none">{row.name}</p>
                    <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 block">Verified Account</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className={`inline-flex items-center px-4 py-1.5 rounded-full font-black text-[10px] tracking-tighter ${activeTab === 'purchase' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {row.weight} TONS
                    </div>
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-slate-500 italic">{row.contact}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-[11px] font-black text-slate-600 uppercase">
                      <Calendar size={14} className="text-slate-300" /> {row.date}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <button className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-[#001D3D] transition-all">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="px-10 py-8 bg-slate-50/30 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Showing 1-10 of 240 Sheikh Traders Records</p>
          <div className="flex items-center gap-3">
            <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-[#001D3D] hover:shadow-md transition-all">
              <ChevronLeft size={18}/>
            </button>
            <div className="flex gap-1">
              {[1, 2, 3].map(n => (
                <button key={n} className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${n === 1 ? `${themeDarkBlue} text-white shadow-lg shadow-blue-900/20` : 'bg-white text-slate-400 hover:bg-slate-100'}`}>
                  {n}
                </button>
              ))}
            </div>
            <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-[#001D3D] hover:shadow-md transition-all">
              <ChevronRight size={18}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}