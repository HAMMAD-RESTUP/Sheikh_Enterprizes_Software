import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import PurchaseInvoiceBill from '../invoices components/purchaseInvoiceBill';
import { db } from '../firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { 
  User, Weight, Calculator, Save, Plus, Trash2, MapPin, ClipboardList, Hash, Banknote, Clock
} from 'lucide-react';

// --- HELPER FUNCTION ---
const getNextInvoiceID = async (type) => {
  const prefix = type === 'purchase' ? 'PSK-' : 'SHK-';
  const q = query(collection(db, "transactions"), orderBy("invoiceNo", "desc"), limit(50));
  const querySnapshot = await getDocs(q);
  let lastNumber = 0;
  querySnapshot.forEach((doc) => {
    const id = doc.data().invoiceNo;
    if (id && id.startsWith(prefix)) {
      const num = parseInt(id.split('-')[1]);
      if (num > lastNumber) lastNumber = num;
    }
  });
  return `${prefix}${(lastNumber + 1).toString().padStart(4, '0')}`;
};

export default function PurchaseScrap() {
  const [customerData, setCustomerData] = useState({
    customerName: '', customerContact: '', address: '', invoiceNo: 'Loading...'
  });

  const [items, setItems] = useState([
    { id: Date.now(), itemDescription: '', quantity: '', ratePerKg: '', total: 0 }
  ]);

  const [amounts, setAmounts] = useState({
    totalAmount: 0,
    paidAmount: '',
    remainingAmount: 0
  });

  const [loading, setLoading] = useState(false);
  const componentRef = useRef();
  const themeDarkBlue = "bg-[#001D3D]";
  const textDarkBlue = "text-[#001D3D]";

  // Load ID on Mount
  useEffect(() => {
    const fetchID = async () => {
      const nextID = await getNextInvoiceID('purchase');
      setCustomerData(prev => ({ ...prev, invoiceNo: nextID }));
    };
    fetchID();
  }, []);

  // Calculation Logic for Total, Paid and Remaining
  useEffect(() => {
    const grandTotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const paid = Number(amounts.paidAmount) || 0;
    setAmounts(prev => ({
      ...prev,
      totalAmount: grandTotal,
      remainingAmount: grandTotal - paid
    }));
  }, [items, amounts.paidAmount]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Bill_${customerData.invoiceNo}`,
  });

  const handleCustomerChange = (e) => setCustomerData({ ...customerData, [e.target.name]: e.target.value });

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const qty = field === 'quantity' ? value : item.quantity;
        const rate = field === 'ratePerKg' ? value : item.ratePerKg;
        return { ...item, [field]: value, total: (Number(qty) || 0) * (Number(rate) || 0) };
      }
      return item;
    }));
  };

  const addItem = () => setItems([...items, { id: Date.now(), itemDescription: '', quantity: '', ratePerKg: '', total: 0 }]);
  const removeItem = (id) => items.length > 1 && setItems(items.filter(item => item.id !== id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (amounts.totalAmount === 0) return alert("Please add at least one item");
    
    setLoading(true);
    try {
      const finalInvoiceNo = await getNextInvoiceID('purchase');
      const purchaseData = {
        invoiceNo: finalInvoiceNo,
        ...customerData,
        items,
        ...amounts,
        type: 'purchase',
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, "transactions"), purchaseData);
      setCustomerData(prev => ({ ...prev, invoiceNo: finalInvoiceNo }));

      setTimeout(async () => {
        handlePrint();
        const nextID = await getNextInvoiceID('purchase');
        setItems([{ id: Date.now(), itemDescription: '', quantity: '', ratePerKg: '', total: 0 }]);
        setCustomerData({ customerName: '', customerContact: '', address: '', invoiceNo: nextID });
        setAmounts({ totalAmount: 0, paidAmount: '', remainingAmount: 0 });
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className={`w-14 h-14 ${themeDarkBlue} rounded-[1.2rem] flex items-center justify-center text-white shadow-2xl`}><ClipboardList size={28} /></div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase italic">Purchase <span className="text-blue-600">Entry</span></h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Sheikh Traders Inventory</p>
          </div>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl border-2 border-blue-50 flex items-center gap-4 shadow-sm">
           <Hash size={20} className="text-blue-600" />
           <div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Number</p>
             <p className="text-lg font-black text-[#001D3D]">{customerData.invoiceNo}</p>
           </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SELLER INFO */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-8">
            <input required name="customerName" value={customerData.customerName} onChange={handleCustomerChange} className="bg-slate-50 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-blue-500" placeholder="Seller Name" />
            <input required name="customerContact" value={customerData.customerContact} onChange={handleCustomerChange} className="bg-slate-50 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-blue-500" placeholder="Contact Number" />
            <input name="address" value={customerData.address} onChange={handleCustomerChange} className="bg-slate-50 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-blue-500" placeholder="Location" />
        </div>

        {/* ITEMS LIST */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xs font-black uppercase tracking-widest">Items List</h2>
            <button type="button" onClick={addItem} className={`${themeDarkBlue} text-white px-4 py-2 rounded-xl text-[10px] font-bold flex items-center gap-2`}><Plus size={14}/> ADD ITEM</button>
          </div>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-2xl items-center">
                <input className="md:col-span-5 bg-transparent font-bold outline-none px-2" placeholder="Description" value={item.itemDescription} onChange={(e) => handleItemChange(item.id, 'itemDescription', e.target.value)} />
                <input type="number" className="md:col-span-2 bg-white p-2 rounded-lg font-bold text-center" placeholder="KG" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} />
                <input type="number" className="md:col-span-2 bg-white p-2 rounded-lg font-bold text-center" placeholder="Rate" value={item.ratePerKg} onChange={(e) => handleItemChange(item.id, 'ratePerKg', e.target.value)} />
                <div className="md:col-span-2 text-right font-black text-blue-900">Rs {item.total.toLocaleString()}</div>
                <button type="button" onClick={() => removeItem(item.id)} className="md:col-span-1 text-rose-500 flex justify-end"><Trash2 size={18}/></button>
              </div>
            ))}
          </div>
        </div>

        {/* PAYMENT SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Calculator size={24}/></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Grand Total</p>
              <p className="text-xl font-black">Rs {amounts.totalAmount.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border-2 border-emerald-500/20 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Banknote size={24}/></div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase">Paid Amount</p>
              <input 
                type="number" 
                value={amounts.paidAmount} 
                onChange={(e) => setAmounts({...amounts, paidAmount: e.target.value})}
                className="w-full text-xl font-black outline-none bg-transparent text-emerald-600" 
                placeholder="Enter Cash"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><Clock size={24}/></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Remaining Balance</p>
              <p className={`text-xl font-black ${amounts.remainingAmount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                Rs {amounts.remainingAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <button 
          type="submit" 
          disabled={loading}
          className={`${themeDarkBlue} w-full text-white py-6 rounded-[2rem] font-black text-lg shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.01] transition-all`}
        >
          {loading ? "SAVING DATA..." : <><Save size={24} /> CONFIRM & PRINT INVOICE</>}
        </button>
      </form>

      <div style={{ display: 'none' }}>
        <div ref={componentRef}>
           <PurchaseInvoiceBill data={{...customerData, items, ...amounts}} />
        </div>
      </div>
    </div>
  );
}