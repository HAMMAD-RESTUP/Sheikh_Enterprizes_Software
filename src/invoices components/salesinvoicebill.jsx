import React from 'react';
import LeftLogo from '../assets/logoleft.png';
import RightLogo from '../assets/logoright.png';

const SalesInvoiceBill = React.forwardRef(({ data }, ref) => {
  // Current Date and Time
  const date = new Date().toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="print-container">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 0mm; }
          body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; color: black; background: white; }
          .main-wrapper { padding: 12mm; width: 210mm; margin: 0 auto; box-shadow: none; }
          .no-print { display: none !important; }
        }
      `}} />

      <div 
        ref={ref} 
        className="main-wrapper bg-white font-sans mx-auto min-h-[297mm] p-10 relative"
        style={{ width: '210mm' }} 
      >
        
        {/* --- Header Section --- */}
        <div className="flex justify-between items-center border-b-4 border-black pb-6 mb-8">
          <div className="w-24 h-24">
            <img src={LeftLogo} alt="Logo" className="w-full h-full object-contain" />
          </div>

          <div className="text-center flex-1 px-4">
            <h1 className="text-4xl font-black text-black uppercase tracking-tighter mb-1 italic">
              Sales Invoice
            </h1>
            <h2 className="text-[16px] font-black text-black uppercase tracking-[0.2em] mb-2">
              Sheikh & Khan Trader's
            </h2>
            <p className="text-[10px] font-bold text-gray-700 leading-tight uppercase">
              Plot no 253, D N/R Farooq Masjid Haroonabad <br />
              Karachi West Site Town
            </p>
            
            <div className="flex justify-center gap-6 mt-4 pt-2 border-t border-gray-200">
              <div className="text-center">
                <p className="text-[9px] font-black uppercase text-gray-400">Jibran</p>
                <p className="text-[10px] font-bold text-black">0323-1203286 | 0302-0025093</p>
              </div>
              <div className="text-center border-l border-gray-300 pl-6">
                <p className="text-[9px] font-black uppercase text-gray-400">Shehroz</p>
                <p className="text-[10px] font-bold text-black">0300-9266210 | 0333-2088846</p>
              </div>
            </div>
          </div>

          <div className="w-24 h-24">
            <img src={RightLogo} alt="Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Info Section */}
        <div className="flex justify-between mb-8 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
          <div>
            <p className="text-[9px] font-black text-blue-400 uppercase mb-1 tracking-widest">Customer / Buyer</p>
            <h3 className="text-2xl font-black text-black uppercase">{data?.customerName || 'N/A'}</h3>
            <p className="text-sm font-bold text-gray-600 tracking-tight">{data?.customerContact || 'No Contact'}</p>
            <p className="text-[10px] mt-2 text-gray-500 font-bold uppercase tracking-tighter">
              Destination: <span className="text-black">{data?.address || 'N/A'}</span>
            </p>
          </div>
          
          <div className="text-right flex flex-col justify-center">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Dispatch Details</p>
            <p className="text-xl font-black text-black">INV #{data?.invoiceNo || 'SHK-XXXX'}</p>
            <p className="text-[11px] font-bold text-gray-600 uppercase mt-1">{date}</p>
            <div className="mt-2 text-[9px] font-black border-2 border-blue-600 px-3 py-1 rounded uppercase inline-block bg-white self-end text-blue-600">
              Delivery Challan
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="border-2 border-black rounded-xl overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-black text-black text-left">
                <th className="p-4 uppercase font-black text-[11px]">Item Description</th>
                <th className="p-4 uppercase font-black text-[11px] text-center">Qty / Weight</th>
                <th className="p-4 uppercase font-black text-[11px] text-center">Unit Price</th>
                <th className="p-4 uppercase font-black text-[11px] text-right">Sub Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.items?.map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="p-4">
                    <p className="font-black text-black text-base uppercase leading-tight">{item.itemDescription}</p>
                  </td>
                  <td className="p-4 text-center">
                    <p className="font-black text-black text-lg">{item.quantity} KG</p>
                  </td>
                  <td className="p-4 text-center font-bold text-gray-700 text-base">Rs. {Number(item.ratePerKg).toLocaleString()}</td>
                  <td className="p-4 text-right font-black text-xl text-black">Rs. {Number(item.total).toLocaleString()}</td>
                </tr>
              ))}
              <tr className="h-32 text-gray-300 italic"><td className="p-4 text-[10px]" colSpan="4 text-center">--- No More Items ---</td></tr>
            </tbody>
          </table>
        </div>

        {/* --- Summary & Payment Section --- */}
        <div className="flex justify-between items-start mt-10">
          {/* Terms & Signature */}
          <div className="w-1/2">
            <div className="border-l-4 border-blue-600 pl-4 mt-2">
              <p className="text-[10px] font-black uppercase text-blue-600 mb-2 underline">Sales Terms</p>
              <p className="text-[9px] text-gray-500 font-bold leading-tight italic">
                1. Please check the weight before unloading at destination.<br />
                2. We are not responsible for any damage after delivery.<br />
                3. Payment should be made as per agreed credit terms.
              </p>
            </div>
            <div className="mt-16 flex gap-10">
               <div className="text-center">
                 <div className="w-32 border-b border-black mb-1"></div>
                 <p className="text-[9px] font-black uppercase">Buyer's Sign</p>
               </div>
               <div className="text-center">
                 <div className="w-32 border-b border-black mb-1"></div>
                 <p className="text-[9px] font-black uppercase">Authorized Stamp</p>
               </div>
            </div>
          </div>

          {/* Totals */}
          <div className="w-72">
            <div className="border-2 border-black rounded-2xl overflow-hidden bg-white shadow-sm">
              {/* Grand Total */}
              <div className="flex justify-between p-3 border-b border-gray-100">
                <span className="text-[10px] font-black uppercase text-gray-500">Net Sales Value</span>
                <span className="font-bold text-black text-sm">Rs. {data?.totalAmount?.toLocaleString()}</span>
              </div>
              
              {/* Received Amount */}
              <div className="flex justify-between p-3 bg-blue-50 border-b border-black">
                <span className="text-[10px] font-black uppercase text-blue-700">Cash Received</span>
                <span className="font-black text-blue-800 text-base">Rs. {Number(data?.receivedAmount || 0).toLocaleString()}</span>
              </div>

              {/* Remaining Balance */}
              <div className={`flex justify-between p-4 ${data?.remainingAmount > 0 ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                <span className="text-[12px] font-black uppercase italic underline">Amount Receivable</span>
                <span className={`text-xl font-black ${data?.remainingAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  Rs. {Number(data?.remainingAmount || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="absolute bottom-10 left-0 right-0 text-center border-t border-gray-100 pt-4">
           <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">Inventory Outbound Receipt • Sheikh Traders</p>
        </div>

      </div>
    </div>
  );
});

export default SalesInvoiceBill;