import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import SalesInvoiceBill from '../invoices components/salesinvoicebill';
import { db } from '../firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { 
  User, Calculator, Trash2, Truck, Hash, Banknote, Clock, Plus, TrendingUp 
} from 'lucide-react';

const getNextInvoiceID = async (type) => {
  const prefix = type === 'sales' ? 'SHK-' : 'PSK-';
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

export default function SalesRecords() {
  const [customerData, setCustomerData] = useState({
    customerName: '', customerContact: '', address: '', invoiceNo: 'Loading...'
  });

  // Added 'purchaseRate' and 'itemProfit' to items
  const [items, setItems] = useState([
    { id: Date.now(), itemDescription: '', quantity: '', ratePerKg: '', purchaseRate: '', total: 0, itemProfit: 0 }
  ]);

  const [amounts, setAmounts] = useState({
    totalAmount: 0,
    receivedAmount: '',
    remainingAmount: 0,
    totalProfit: 0 // Overall profit for this invoice
  });

  const [loading, setLoading] = useState(false);
  const componentRef = useRef();
  const themeDarkBlue = "bg-[#001D3D]";

  useEffect(() => {
    const fetchID = async () => {
      const nextID = await getNextInvoiceID('sales');
      setCustomerData(prev => ({ ...prev, invoiceNo: nextID }));
    };
    fetchID();
  }, []);

  // Updated Calculation for Profit
  useEffect(() => {
    const grandTotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const grandProfit = items.reduce((sum, item) => sum + (Number(item.itemProfit) || 0), 0);
    const received = Number(amounts.receivedAmount) || 0;
    
    setAmounts(prev => ({
      ...prev,
      totalAmount: grandTotal,
      remainingAmount: grandTotal - received,
      totalProfit: grandProfit
    }));
  }, [items, amounts.receivedAmount]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Sales_Bill_${customerData.invoiceNo}`,
  });

  const handleCustomerChange = (e) => setCustomerData({ ...customerData, [e.target.name]: e.target.value });

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Logic: Profit = (Selling Rate - Purchase Rate) * Quantity
        const qty = Number(field === 'quantity' ? value : item.quantity) || 0;
        const sRate = Number(field === 'ratePerKg' ? value : item.ratePerKg) || 0;
        const pRate = Number(field === 'purchaseRate' ? value : item.purchaseRate) || 0;
        
        updatedItem.total = qty * sRate;
        updatedItem.itemProfit = (sRate - pRate) * qty;
        
        return updatedItem;
      }
      return item;
    }));
  };

  const addItem = () => setItems([...items, { id: Date.now(), itemDescription: '', quantity: '', ratePerKg: '', purchaseRate: '', total: 0, itemProfit: 0 }]);
  const removeItem = (id) => items.length > 1 && setItems(items.filter(item => item.id !== id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (amounts.totalAmount === 0) return alert("Please add at least one item.");
    
    setLoading(true);
    try {
      const finalInvoiceNo = await getNextInvoiceID('sales');
      const salesData = {
        invoiceNo: finalInvoiceNo,
        customerName: customerData.customerName,
        contact: customerData.customerContact,
        address: customerData.address,
        items,
        totalAmount: amounts.totalAmount,
        receivedAmount: Number(amounts.receivedAmount) || 0,
        remainingAmount: amounts.remainingAmount,
        profit: amounts.totalProfit, // Saving total profit to Firebase
        type: 'sales',
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, "transactions"), salesData);

      setTimeout(async () => {
        handlePrint();
        const nextID = await getNextInvoiceID('sales');
        setItems([{ id: Date.now(), itemDescription: '', quantity: '', ratePerKg: '', purchaseRate: '', total: 0, itemProfit: 0 }]);
        setCustomerData({ customerName: '', customerContact: '', address: '', invoiceNo: nextID });
        setAmounts({ totalAmount: 0, receivedAmount: '', remainingAmount: 0, totalProfit: 0 });
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error(error);
      alert("Error saving record.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* HEADER */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className={`w-14 h-14 ${themeDarkBlue} rounded-2xl flex items-center justify-center text-white shadow-xl`}>
            <Truck size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Sales <span className="text-blue-600">Dispatch</span></h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Net Profit Tracking Enabled</p>
          </div>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl border-2 border-blue-50 flex items-center gap-4">
           <Hash size={20} className="text-blue-600" />
           <p className="text-lg font-black text-[#001D3D]">{customerData.invoiceNo}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CUSTOMER INFO */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
            <input required name="customerName" value={customerData.customerName} onChange={handleCustomerChange} className="bg-slate-50 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-blue-500" placeholder="Buyer Name" />
            <input required name="customerContact" value={customerData.customerContact} onChange={handleCustomerChange} className="bg-slate-50 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-blue-500" placeholder="Contact" />
            <input name="address" value={customerData.address} onChange={handleCustomerChange} className="bg-slate-50 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-blue-500" placeholder="Address" />
        </div>

        {/* ITEMS LIST */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Dispatch Inventory & Costing</h2>
            <button type="button" onClick={addItem} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2"><Plus size={14}/> ADD ITEM</button>
          </div>
          
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-50 p-4 rounded-2xl items-center border border-transparent hover:border-blue-200 transition-all">
                <div className="md:col-span-3">
                    <input className="w-full bg-transparent font-bold outline-none text-slate-800" placeholder="Item Name" value={item.itemDescription} onChange={(e) => handleItemChange(item.id, 'itemDescription', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                    <input type="number" className="w-full bg-white p-2.5 rounded-xl font-black text-center text-blue-600 outline-none" placeholder="Qty (KG)" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                    <input type="number" className="w-full bg-white p-2.5 rounded-xl font-black text-center text-emerald-600 outline-none border-2 border-emerald-100" placeholder="My Cost" value={item.purchaseRate} onChange={(e) => handleItemChange(item.id, 'purchaseRate', e.target.value)} />
                    <p className="text-[8px] text-center font-bold text-emerald-500 mt-1 uppercase">Purchase Rate</p>
                </div>
                <div className="md:col-span-2">
                    <input type="number" className="w-full bg-white p-2.5 rounded-xl font-black text-center text-blue-600 outline-none border-2 border-blue-100" placeholder="Sale Rate" value={item.ratePerKg} onChange={(e) => handleItemChange(item.id, 'ratePerKg', e.target.value)} />
                    <p className="text-[8px] text-center font-bold text-blue-500 mt-1 uppercase">Selling Rate</p>
                </div>
                <div className="md:col-span-2 text-right font-black text-[#001D3D]">
                    <p className="text-[10px] text-slate-400 italic">Sub-Total</p>
                    Rs {item.total.toLocaleString()}
                </div>
                <button type="button" onClick={() => removeItem(item.id)} className="md:col-span-1 text-rose-400 flex justify-end"><Trash2 size={18}/></button>
              </div>
            ))}
          </div>
        </div>

        {/* TOTALS & PROFIT DISPLAY */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Calculator size={20}/></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Total Bill</p>
              <p className="text-xl font-black text-[#001D3D]">Rs {amounts.totalAmount.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Banknote size={20}/></div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase">Received</p>
              <input type="number" value={amounts.receivedAmount} onChange={(e) => setAmounts({...amounts, receivedAmount: e.target.value})} className="w-full text-xl font-black outline-none bg-transparent" placeholder="0" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><Clock size={20}/></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Dues</p>
              <p className="text-xl font-black text-rose-600">Rs {amounts.remainingAmount.toLocaleString()}</p>
            </div>
          </div>

          {/* NEW PROFIT BOX */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-800 p-6 rounded-3xl flex items-center gap-4 shadow-lg text-white">
            <div className="p-3 bg-white/20 text-white rounded-xl"><TrendingUp size={20}/></div>
            <div>
              <p className="text-[10px] font-black text-indigo-100 uppercase">Net Profit</p>
              <p className="text-xl font-black">Rs {amounts.totalProfit.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className={`${themeDarkBlue} w-full text-white py-6 rounded-[2rem] font-black text-xl shadow-xl hover:scale-[1.01] transition-all`}>
          {loading ? "SAVING..." : "FINALIZE DISPATCH & PRINT"}
        </button>
      </form>

      {/* PRINT PREVIEW */}
      <div style={{ display: 'none' }}>
        <div ref={componentRef}>
            <SalesInvoiceBill data={{ ...customerData, items, totalAmount: amounts.totalAmount, receivedAmount: amounts.receivedAmount, remainingAmount: amounts.remainingAmount }} />
        </div>
      </div>
    </div>
  );
}