import React from 'react';
import LeftLogo from '../assets/logoleft.png';
import RightLogo from '../assets/logoright.png';

const PurchaseInvoiceBill = React.forwardRef(({ data, totalAmount }, ref) => {
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
          body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; color: black; }
          header, footer { display: none !important; }
          .main-wrapper { padding: 15mm; width: 210mm; margin: 0 auto; }
        }
      `}} />

      <div 
        ref={ref} 
        className="main-wrapper bg-white font-sans mx-auto min-h-[297mm] p-10"
        style={{ width: '210mm' }} 
      >
        
        {/* --- Header Section --- */}
        <div className="flex justify-between items-center border-b-4 border-black pb-6 mb-8">
          <div className="w-28 h-28">
            <img src={LeftLogo} alt="Logo" className="w-full h-full object-contain" />
          </div>

          <div className="text-center flex-1 px-4">
            <h1 className="text-3xl font-black text-black uppercase tracking-tighter mb-1">
              Purchase Invoice
            </h1>
            <h2 className="text-[14px] font-black text-black uppercase tracking-[0.2em] mb-2">
              Sheikh & Khan Trader's
            </h2>
            <p className="text-[10px] font-bold text-gray-700 leading-tight uppercase">
              Plot no 253, D N/R Farooq Masjid Haroonabad <br />
              Karachi West Site Town
            </p>
            
            <div className="flex justify-center gap-8 mt-4 pt-2 border-t border-gray-100">
              <div className="text-center">
                <p className="text-[9px] font-black uppercase text-gray-500">Jibran</p>
                <p className="text-[11px] font-bold text-black tracking-tight">0323-1203286 | 0302-0025093</p>
              </div>
              <div className="text-center border-l border-gray-200 pl-8">
                <p className="text-[9px] font-black uppercase text-gray-500">Shehroz</p>
                <p className="text-[11px] font-bold text-black tracking-tight">0300-9266210 | 0333-2088846</p>
              </div>
            </div>
          </div>

          <div className="w-28 h-28">
            <img src={RightLogo} alt="Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Info Section */}
        <div className="flex justify-between mb-8 bg-gray-50 p-5 rounded-2xl border border-gray-200">
          <div>
            <p className="text-[9px] font-black text-gray-500 uppercase mb-1">Seller Details</p>
            <h3 className="text-xl font-black text-black uppercase">{data?.customerName || 'Walking Customer'}</h3>
            <p className="text-sm font-bold text-gray-600 italic">{data?.customerContact || 'No Contact'}</p>
            <p className="text-[10px] mt-2 text-gray-500 font-bold uppercase">Pickup: <span className="text-black normal-case">{data?.address || 'N/A'}</span></p>
          </div>
          
          <div className="text-right">
            <p className="text-[9px] font-black text-gray-400 uppercase">Invoice Info</p>
            <p className="text-base font-black text-black uppercase tracking-tight">ID: #ST-{Math.floor(1000 + Math.random() * 9000)}</p>
            <p className="text-[11px] font-bold text-gray-600 uppercase">{date}</p>
            <div className="mt-2 text-[9px] font-black border-2 border-black px-3 py-1 rounded uppercase inline-block bg-white">
              Original Receipt
            </div>
          </div>
        </div>

        {/* Items Table - Optimized for Printer */}
        <div className="border-2 border-black rounded-xl overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              {/* Solid Black bar removed, light grey added for better printing */}
              <tr className="bg-gray-200 border-b-2 border-black text-black text-left">
                <th className="p-4 uppercase font-black text-[11px] tracking-wider">Item Description</th>
                <th className="p-4 uppercase font-black text-[11px] text-center tracking-wider">Quantity</th>
                <th className="p-4 uppercase font-black text-[11px] text-center tracking-wider">Rate/KG</th>
                <th className="p-4 uppercase font-black text-[11px] text-right tracking-wider">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="p-5">
                  <p className="font-black text-black text-lg uppercase leading-tight">
                    {data?.itemDescription || 'Scrap Material'}
                  </p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase mt-1 italic">Unit: Kilogram (KG)</p>
                </td>
                <td className="p-5 text-center">
                  <p className="font-black text-black text-xl">{data?.quantity || 0} KG</p>
                </td>
                <td className="p-5 text-center font-bold text-gray-700 text-lg">Rs. {data?.ratePerKg || 0}</td>
                <td className="p-5 text-right font-black text-2xl text-black">Rs. {totalAmount?.toLocaleString()}</td>
              </tr>
              <tr className="h-40"><td colSpan="4"></td></tr>
            </tbody>
          </table>
        </div>

        {/* Summary Box */}
        <div className="flex justify-end mb-12">
          <div className="w-72 border-2 border-black p-5 rounded-2xl bg-white">
            <div className="flex justify-between text-[11px] font-bold uppercase text-gray-500 mb-2">
              <span>Gross Total</span>
              <span>{totalAmount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold uppercase text-gray-400 mb-3 pb-3 border-b-2 border-dotted border-gray-200">
              <span>Tax / VAT</span>
              <span>0.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-black text-[13px] uppercase italic text-black tracking-tighter underline decoration-2">Net Payable</span>
              <span className="text-2xl font-black text-black font-mono">
                {totalAmount?.toLocaleString()}
              </span>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
});

export default PurchaseInvoiceBill;