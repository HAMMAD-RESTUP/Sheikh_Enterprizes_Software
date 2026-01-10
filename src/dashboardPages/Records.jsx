import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { db } from '../firebase/firebaseConfig';
import { collection, query, orderBy, onSnapshot, where, doc, updateDoc, increment } from 'firebase/firestore';
import PurchaseInvoiceBill from '../invoices components/purchaseInvoiceBill';
import SalesInvoiceBill from '../invoices components/salesinvoicebill';
import { 
  Search, ArrowDownCircle, ArrowUpCircle, X, CreditCard, 
  Printer, User, MapPin, Phone, Package, Calendar, CheckCircle2
} from 'lucide-react';

export default function Records() {
  const [activeTab, setActiveTab] = useState('purchase'); 
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null); 
  const [newPayment, setNewPayment] = useState("");
  const [updating, setUpdating] = useState(false);

  const componentRef = useRef();
  const themeDarkBlue = "bg-[#001D3D]";

  // Real-time listener: Auto-updates on database change
  useEffect(() => {
    const q = query(
      collection(db, "transactions"), 
      where("type", "==", activeTab),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecords(data);
      
      // Update modal data in real-time if open
      if (selectedRecord) {
        const updated = data.find(r => r.id === selectedRecord.id);
        if (updated) setSelectedRecord(updated);
      }
    });
    return () => unsubscribe();
  }, [activeTab]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Record_${selectedRecord?.invoiceNo}`,
  });

  const handleUpdatePayment = async () => {
    const amountToPay = Number(newPayment);
    if (!newPayment || amountToPay <= 0) return alert("Please Enter Valid Amount");
    if (amountToPay > selectedRecord.remainingAmount) return alert("The Amount is Greater than Balance.");

    setUpdating(true);
    try {
      const docRef = doc(db, "transactions", selectedRecord.id);
      
      // Update logic based on data structure
      const updatePayload = {
        remainingAmount: increment(-amountToPay)
      };

      // Handling different naming in Purchase vs Sales (paidAmount / receivedAmount)
      if (activeTab === 'purchase') {
        updatePayload.paidAmount = increment(amountToPay);
      } else {
        updatePayload.receivedAmount = increment(amountToPay);
      }
      
      await updateDoc(docRef, updatePayload);
      setNewPayment("");
      alert("Payment Success!");
    } catch (error) {
      alert("Update failed!");
    } finally {
      setUpdating(false);
    }
  };

  const filteredRecords = records.filter(rec => 
    rec.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Customer's <span className="text-blue-600">Records</span></h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Transaction History & Ledger</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button onClick={() => setActiveTab('purchase')} className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${activeTab === 'purchase' ? `${themeDarkBlue} text-white shadow-lg` : 'text-slate-500'}`}>
            <ArrowDownCircle size={14} /> Purchases
          </button>
          <button onClick={() => setActiveTab('sales')} className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${activeTab === 'sales' ? `${themeDarkBlue} text-white shadow-lg` : 'text-slate-500'}`}>
            <ArrowUpCircle size={14} /> Sales
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search party name or invoice number..." 
          className="w-full bg-white border border-slate-200 rounded-2xl py-5 pl-14 pr-6 font-bold outline-none focus:ring-2 ring-blue-500/20 transition-all shadow-sm"
        />
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Invoice</th>
              <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Party Details</th>
              <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredRecords.map((row) => (
              <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-8 py-5 text-sm font-black text-blue-900">{row.invoiceNo}</td>
                <td className="px-8 py-5">
                   <p className="font-black text-slate-800 uppercase">{row.customerName}</p>
                   <p className="text-[10px] text-slate-400 font-bold">{row.address || 'No Address'}</p>
                </td>
                <td className="px-8 py-5 text-center">
                  {row.remainingAmount > 0 ? (
                    <span className="bg-rose-50 text-rose-600 px-4 py-1.5 rounded-full font-black text-[9px] border border-rose-100 uppercase">
                      Rs. {row.remainingAmount.toLocaleString()} Due
                    </span>
                  ) : (
                    <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full font-black text-[9px] border border-emerald-100 uppercase">
                      Fully Cleared
                    </span>
                  )}
                </td>
                <td className="px-8 py-5 text-right">
                  <button onClick={() => setSelectedRecord(row)} className="bg-slate-900 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase hover:bg-blue-600 transition-all shadow-md">
                    View & Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- DETAIL & PAYMENT MODAL --- */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className={`${themeDarkBlue} p-8 text-white flex justify-between items-start`}>
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Package size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black italic tracking-tighter uppercase">{selectedRecord.invoiceNo}</h2>
                  <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={12}/> {selectedRecord.timestamp?.toDate().toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handlePrint} className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all"><Printer size={20}/></button>
                <button onClick={() => setSelectedRecord(null)} className="bg-white/10 hover:bg-rose-500 p-3 rounded-xl transition-all"><X size={20}/></button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Info Column */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Party Name</p>
                       <div className="flex items-center gap-3 text-slate-900 font-black"><User size={16} className="text-blue-600"/> {selectedRecord.customerName}</div>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact</p>
                       <div className="flex items-center gap-3 text-slate-900 font-black"><Phone size={16} className="text-blue-600"/> {selectedRecord.customerContact || selectedRecord.contact}</div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 text-blue-600">Material List</h3>
                    <div className="space-y-3">
                      {selectedRecord.items?.map((item, i) => (
                        <div key={i} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                          <div>
                            <p className="font-black text-slate-800 uppercase text-xs">{item.itemDescription}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{item.quantity} KG × Rs. {item.ratePerKg}</p>
                          </div>
                          <div className="font-black text-blue-900 text-sm">Rs. {item.total?.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Payment Action Column */}
                <div className="space-y-6">
                  <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
                     <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Total Amount</p>
                     <h4 className="text-2xl font-black text-blue-900 tracking-tighter">Rs. {selectedRecord.totalAmount?.toLocaleString()}</h4>
                     
                     <div className="mt-4 pt-4 border-t border-blue-100">
                        <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">Pending Balance</p>
                        <h4 className="text-2xl font-black text-rose-700 tracking-tighter">Rs. {selectedRecord.remainingAmount?.toLocaleString()}</h4>
                     </div>
                  </div>

                  {selectedRecord.remainingAmount > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase ml-2">Add New Payment</p>
                      <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="number" value={newPayment} onChange={(e) => setNewPayment(e.target.value)}
                          placeholder="Amount" 
                          className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-12 font-black text-blue-900 outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                      <button onClick={handleUpdatePayment} disabled={updating} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all">
                        {updating ? "Processing..." : "Confirm Payment"}
                      </button>
                    </div>
                  )}

                  {selectedRecord.remainingAmount <= 0 && (
                    <div className="bg-emerald-50 p-6 rounded-2xl flex flex-col items-center gap-3 text-emerald-600">
                      <CheckCircle2 size={40} />
                      <p className="font-black text-[10px] uppercase">Account Fully Cleared</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN PRINT COMPONENTS */}
      <div style={{ display: 'none' }}>
        <div ref={componentRef}>
          {activeTab === 'purchase' ? (
            <PurchaseInvoiceBill data={selectedRecord} />
          ) : (
            <SalesInvoiceBill data={selectedRecord} />
          )}
        </div>
      </div>
    </div>
  );
}