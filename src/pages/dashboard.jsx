import React, { useState } from 'react';
import { useNavigate, Link, useLocation, Outlet } from 'react-router-dom';
import { logoutUser } from '../firebase/firebaseMethods';
import { 
  LayoutDashboard, PlusSquare, Truck, History, LogOut, Bell, 
  Menu, Search, ArrowDownLeft, ArrowUpRight, Wallet, Receipt, Package, Clock, Zap,User
} from 'lucide-react'; 

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dark Blue Theme Color Constant
  const darkBlue = "bg-[#001D3D]"; // Deep Navy Blue
  const accentBlue = "bg-[#003566]"; // Mid Navy Blue

  const menuItems = [
    { name: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={20}/> },
    { name: 'Purchase Scrap', path: '/dashboard/purchase', icon: <PlusSquare size={20}/> },
    { name: 'Sales Records', path: '/dashboard/sales', icon: <Truck size={20}/> },
    { name: 'Records', path: '/dashboard/records', icon: <History size={20}/> },
  ];

  const handleLogout = async () => {
    const res = await logoutUser();
    if (res.success) navigate('/');
  };

  const OverviewContent = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Business Inventory</h1>
          <p className="text-slate-500 font-medium text-sm">Monitoring Sheikh Traders Warehouse</p>
        </div>
        <button className="bg-[#001D3D] hover:bg-[#003566] text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-lg shadow-blue-100 transition-all flex items-center gap-2">
          <Zap size={14} fill="white" /> Export Insights
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Purchase Card */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
              <ArrowDownLeft />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scrap In (Total)</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2">1,240 <span className="text-sm font-bold text-slate-400 uppercase">Tons</span></h3>
          </div>

          {/* Sales Card - Deep Blue Icon Container */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-[#001D3D] rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
              <ArrowUpRight />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scrap Out (Total)</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2">850 <span className="text-sm font-bold text-slate-400 uppercase">Tons</span></h3>
          </div>

          {/* Credit Card */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 text-rose-600">
              <Wallet />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payable Credit</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2">450k <span className="text-sm font-bold text-slate-400">PKR</span></h3>
          </div>

          {/* Debit Card */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 text-amber-600">
              <Receipt />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receivable Debit</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2">320k <span className="text-sm font-bold text-slate-400">PKR</span></h3>
          </div>

          {/* Stock Banner - Deep Dark Blue */}
          <div className="md:col-span-2 bg-[#001D3D] rounded-[3rem] p-10 text-white relative overflow-hidden min-h-[220px] flex items-center shadow-2xl shadow-blue-900/20">
            <div className="relative z-10 w-full">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-3xl font-black italic tracking-tighter uppercase">Net Stock</h2>
                  <p className="text-blue-200/60 text-sm font-medium uppercase tracking-widest">Available in Warehouse</p>
                </div>
                <div className="text-right">
                   <p className="text-4xl font-black tracking-tighter">390 <span className="text-lg font-light opacity-50">Tons</span></p>
                </div>
              </div>
              <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="bg-blue-400 h-full w-[65%] shadow-[0_0_20px_rgba(96,165,250,0.5)]"></div>
              </div>
              <p className="mt-4 text-[10px] font-black opacity-40 tracking-[0.3em]">CAPACITY UTILIZATION: 65%</p>
            </div>
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 h-[calc(50%-12px)] shadow-sm">
            <h3 className="font-black text-[#001D3D] flex items-center gap-3 mb-6 uppercase text-xs tracking-widest">
              <Package size={16} /> Recent Purchase
            </h3>
            <div className="space-y-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0 hover:translate-x-1 transition-transform cursor-pointer group">
                  <div>
                    <p className="text-sm font-bold text-slate-800 tracking-tight group-hover:text-[#003566] transition-colors">Copper Cables</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">8 Tons • Sector I-9</p>
                  </div>
                  <span className="text-[10px] font-black text-white bg-[#003566] px-3 py-1 rounded-full">LHR</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 h-[calc(50%-12px)] shadow-sm">
            <h3 className="font-black text-[#001D3D] flex items-center gap-3 mb-6 uppercase text-xs tracking-widest">
              <User size={16} /> Top Sellers
            </h3>
            <div className="space-y-6">
              {['Malik Steel', 'Aslam Jatt', 'Pindi Scraps'].map((seller, i) => (
                <div key={i} className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-[#001D3D] text-xs group-hover:bg-[#001D3D] group-hover:text-white transition-all">{seller[0]}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-none">{seller}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 flex items-center gap-1 uppercase tracking-tighter">
                      <Clock size={10} /> {i + 2} mins ago
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F0F4F8] font-sans text-slate-600 overflow-hidden">
      
      {/* SIDEBAR - DEEP DARK BLUE */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-[#001D3D] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200 font-black italic text-2xl">S</div>
            <h1 className="text-lg font-black tracking-tighter text-[#001D3D] uppercase leading-tight">Sheikh <br/> <span className="text-blue-500 font-bold">Traders</span></h1>
          </div>
        </div>
        
        <nav className="flex-1 px-6 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.name} to={item.path} onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group ${isActive ? 'bg-[#001D3D] text-white shadow-2xl shadow-blue-900/30' : 'text-slate-400 hover:bg-blue-50 hover:text-[#001D3D]'}`}>
                <div className="flex items-center space-x-4">
                  <span className={isActive ? 'text-white' : 'text-slate-300 group-hover:text-[#001D3D] transition-colors'}>{item.icon}</span>
                  <span className="font-bold text-[14px] uppercase tracking-wide">{item.name}</span>
                </div>
                {isActive && <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>}
              </Link>
            );
          })}
        </nav>

        <div className="p-6">
          <button onClick={handleLogout} className="w-full flex items-center space-x-4 px-5 py-4 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-all font-black text-sm border border-rose-100">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-24 flex items-center justify-between px-10 border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center space-x-4">
            <button className="lg:hidden p-2 bg-slate-100 rounded-lg text-slate-600" onClick={() => setIsMobileMenuOpen(true)}><Menu size={22} /></button>
            <div className="relative hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Search Sheikh Traders Records..." className="pl-12 pr-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-100 w-96 outline-none transition-all" />
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="relative p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-[#001D3D] cursor-pointer transition-all">
              <Bell size={18} />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white"></span>
            </div>
            
            <div className="flex items-center space-x-3 bg-[#001D3D] p-1.5 pr-5 rounded-2xl shadow-xl shadow-blue-900/10">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#001D3D] font-black text-xs">SA</div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white uppercase leading-none">Sheikh Admin</span>
                <span className="text-[9px] text-blue-300 font-bold mt-1 uppercase">Main Office</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-10 pt-10 pb-10">
          {location.pathname === '/dashboard' ? <OverviewContent /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}