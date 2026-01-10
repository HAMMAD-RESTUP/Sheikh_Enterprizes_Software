import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../firebase/firebaseMethods';
import { fetchTransactions } from '../redux/reducers/scrapReducer';

import { 
  LayoutDashboard, PlusSquare, History, LogOut, 
  ArrowDownLeft, ArrowUpRight, Wallet, Receipt, Package, Zap, Menu, ShoppingCart 
} from 'lucide-react'; 

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Redux se data nikalna
  const { 
    transactions = [], 
    totalScrapIn = 0, 
    totalScrapOut = 0, 
    totalPayable = 0, 
    totalReceivable = 0 
  } = useSelector((state) => state.scrap || {});

  // Current Stock Logic
  const currentStock = totalScrapIn - totalScrapOut;

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  const handleLogout = async () => {
    const res = await logoutUser();
    if (res.success) navigate('/');
  };

  const isOverview = location.pathname === '/dashboard' || location.pathname === '/dashboard/';

  const OverviewContent = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Business Inventory</h1>
          <p className="text-slate-500 font-medium text-sm">Monitoring Sheikh Traders Warehouse</p>
        </div>
        <button className="bg-[#001D3D] text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-lg flex items-center gap-2 transition-all hover:bg-blue-900">
          <Zap size={14} fill="white" /> Export Insights
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          
       

          {/* 2. Total Scrap In (History) */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-blue-200 transition-all">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
              <ArrowDownLeft />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Stock In WareHouse</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2">
               {totalScrapIn.toLocaleString()} <span className="text-sm font-bold text-slate-400">KG</span>
            </h3>
          </div>

          {/* 3. Total Scrap Out (History) */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-slate-200 transition-all">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-[#001D3D]">
              <ArrowUpRight />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Stock Sold</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2">
               {totalScrapOut.toLocaleString()} <span className="text-sm font-bold text-slate-400">KG</span>
            </h3>
          </div>

          {/* 4. Payable */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-rose-200 transition-all">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 text-rose-600">
              <Wallet />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Payable (Dues)</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2">
               {totalPayable.toLocaleString()} <span className="text-sm font-bold text-slate-400">PKR</span>
            </h3>
          </div>

          {/* 5. Receivable */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-amber-200 transition-all">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 text-amber-600">
              <Receipt />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receivable Amount</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2">
               {totalReceivable.toLocaleString()} <span className="text-sm font-bold text-slate-400">PKR</span>
            </h3>
          </div>

          {/* Warehouse Stock Visual Progress */}
          <div className="md:col-span-2 bg-[#001D3D] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
               <h2 className="text-2xl font-black uppercase italic tracking-tighter">Warehouse Capacity</h2>
               <div className="flex justify-between items-end mt-4">
                  <p className="text-4xl font-black">{currentStock} <span className="text-lg opacity-50">KG</span></p>
                  <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest">Live Net Inventory</p>
               </div>
               <div className="h-3 w-full bg-white/10 rounded-full mt-4 overflow-hidden">
                  <div 
                    className="bg-blue-400 h-full transition-all duration-1000 shadow-[0_0_15px_rgba(96,165,250,0.5)]"
                    style={{ width: `${Math.min((currentStock / 10000) * 100, 100)}%` }}
                  ></div>
               </div>
            </div>
          </div>
        </div>

        {/* RECENT DUES LIST */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm overflow-hidden">
          <h3 className="font-black text-[#001D3D] flex items-center gap-3 mb-6 uppercase text-xs tracking-widest border-b pb-4">
            <Package size={16} /> Pending Payments
          </h3>
          <div className="space-y-5 h-[400px] overflow-y-auto pr-2 scrollbar-hide">
            {transactions
              .filter(t => t.remainingAmount > 0)
              .slice(0, 8)
              .map((item) => (
              <div key={item.id} className="flex items-center justify-between group border-b border-slate-50 pb-3 last:border-0">
                <div>
                  <p className="text-sm font-black text-slate-800 tracking-tight">{item.customerName}</p>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase ${item.type === 'purchase' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {item.type}
                    </span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{item.invoiceNo}</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-full">
                  Rs. {item.remainingAmount?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F0F4F8] font-sans overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-slate-50">
          <h2 className="text-xl font-black text-[#001D3D] italic uppercase tracking-tighter">Sheikh <span className="text-blue-600">Traders</span></h2>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-4 p-4 rounded-2xl font-bold text-sm transition-all ${isOverview ? 'bg-[#001D3D] text-white shadow-xl shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-50'}`}>
            <LayoutDashboard size={20} /> Overview
          </Link>
          <Link to="/dashboard/purchase" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-4 p-4 rounded-2xl font-bold text-sm transition-all ${location.pathname.includes('purchase') ? 'bg-[#001D3D] text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
            <PlusSquare size={20} /> New Purchase
          </Link>
          <Link to="/dashboard/sale" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-4 p-4 rounded-2xl font-bold text-sm transition-all ${location.pathname.includes('sale') ? 'bg-[#001D3D] text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
            <ShoppingCart size={20} /> New Sale
          </Link>
          <Link to="/dashboard/records" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-4 p-4 rounded-2xl font-bold text-sm transition-all ${location.pathname.includes('records') ? 'bg-[#001D3D] text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
            <History size={20} /> History & Pay
          </Link>
        </nav>
        <div className="p-6">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 text-rose-500 font-bold text-sm hover:bg-rose-50 rounded-2xl transition-all">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-24 min-h-[96px] flex items-center justify-between px-10 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
           <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-slate-500"><Menu /></button>
           <div className="hidden md:block">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Inventory Control System v2.0</p>
           </div>
           <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-900 leading-none">Admin Panel</p>
                <p className="text-[10px] text-blue-600 font-bold uppercase mt-1">Live Updates</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#001D3D] text-white flex items-center justify-center font-black">ST</div>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 bg-[#F8FAFC]">
          {isOverview ? <OverviewContent /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}