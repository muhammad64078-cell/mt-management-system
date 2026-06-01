import React from 'react';
import { X } from 'lucide-react';
import { Card, Button } from './ui';

export const InvoiceModal = ({ isOpen, onClose, lead, payments }) => {
  if (!isOpen || !lead) return null;

  const totalBudget = parseFloat(lead.budget?.replace(/[^0-9.-]+/g, "")) || 0;
  const totalReceived = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const balanceDue = totalBudget - totalReceived;

  // For the invoice number we can use the lead ID or just a placeholder for now
  const invoiceNum = lead.id ? lead.id.toString().slice(-4).padStart(4, '0') : "0092";

  // Extract latest payment for Payment Info
  const latestPayment = payments && payments.length > 0 ? payments[0] : null;
  const paymentMethod = latestPayment?.payment_type || latestPayment?.paymentType || "Bank Transfer";
  const paymentNote = latestPayment?.note || "Account: MT Nexus Global\nBank: HBL — 0123456789\nIBAN: PK00HABB00000000000";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 transform scale-95">
        {/* Close Button & Print Button */}
        <div className="flex justify-end gap-3 mb-4">
          <Button onClick={() => window.print()} className="bg-orange-500 hover:bg-orange-600 text-white">
            Print / Save PDF
          </Button>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-white bg-black/50 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Invoice Card */}
        <Card id="invoice-content" className="p-6 bg-[#121212] border border-[#27272a] shadow-2xl rounded-2xl print:shadow-none print:border-none">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b border-[#27272a] pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex flex-col items-center justify-center font-black text-white leading-none shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                <span className="text-sm">M</span>
                <span className="text-sm">T</span>
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tighter">MT Nexus</h1>
                <h2 className="text-base font-bold text-white tracking-widest uppercase">Global</h2>
                <div className="text-[10px] text-gray-500 mt-1">
                  <p>Karachi, Pakistan | info@mtnexusglobal.com</p>
                  <p>+92 300 000 0000</p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-gray-500 text-[10px] tracking-widest uppercase mb-1">Invoice</p>
              <h1 className="text-2xl font-black text-orange-500 mb-1">INV-2024-{invoiceNum}</h1>
              <div className="text-[10px] text-gray-500">
                <p>Issued: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                <p>Due: {new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
          </div>

          {/* Billing Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-gray-500 text-[10px] tracking-widest uppercase mb-1">Billed To</p>
              <h3 className="text-base font-bold text-white mb-0.5">{lead.company || lead.clientName}</h3>
              <p className="text-xs text-gray-400">{lead.contactPerson || lead.clientName}</p>
              <p className="text-xs text-gray-400">{lead.email}</p>
              <p className="text-xs text-gray-400">{lead.phone}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px] tracking-widest uppercase mb-1">Payment Info</p>
              <h3 className="text-base font-bold text-white mb-0.5">{paymentMethod}</h3>
              {paymentNote.split('\n').map((line, idx) => (
                <p key={idx} className="text-xs text-gray-400">{line}</p>
              ))}
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 pb-2 border-b border-[#27272a] text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <div className="col-span-4">Service</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-1 text-center">Qty</div>
            <div className="col-span-1 text-right">Rate</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          {/* Table Body */}
          <div className="grid grid-cols-12 gap-4 py-3 border-b border-[#27272a] text-xs text-white items-center">
            <div className="col-span-4 font-bold">{lead.service || "General Service"}</div>
            <div className="col-span-4 text-gray-400">{lead.notes ? lead.notes.substring(0, 50) + '...' : "Custom Service Package"}</div>
            <div className="col-span-1 text-center">1</div>
            <div className="col-span-1 text-right">${totalBudget}</div>
            <div className="col-span-2 text-right font-bold">${totalBudget}</div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mt-6">
            <div className="w-56 space-y-2">
              <div className="flex justify-between text-xs text-white">
                <span className="text-gray-400">Subtotal</span>
                <span className="font-bold">${totalBudget}</span>
              </div>
              {payments && payments.length > 0 ? (
                payments.map((p, idx) => (
                  <div key={p.id || idx} className="flex justify-between text-xs text-emerald-500">
                    <span>Payment ({new Date(p.payment_date || p.paymentDate || p.createdAt).toLocaleDateString()})</span>
                    <span>- ${parseFloat(p.amount) || 0}</span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between text-xs text-emerald-500">
                  <span>Advance Received</span>
                  <span>- $0</span>
                </div>
              )}
              <div className="flex justify-between items-end border-t border-[#27272a] pt-3 mt-3">
                <span className="text-lg font-black text-white tracking-widest uppercase">Balance Due</span>
                <span className="text-2xl font-black text-orange-500">${Math.max(0, balanceDue)}</span>
              </div>
            </div>
          </div>

          {/* Footer Status Box */}
          <div className="mt-8 bg-[#121212] border border-emerald-900/50 rounded-lg p-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-emerald-500 font-bold text-xs">
                {totalReceived >= totalBudget ? "Payment Completed" : "Partial Payment Received"}
              </span>
            </div>
            <div className="text-gray-400 text-xs">
              Paid: <span className="text-emerald-500 font-bold">${totalReceived}</span> / ${totalBudget}
            </div>
          </div>

        </Card>

        {/* CSS for printing to hide other elements and ensure dark theme prints correctly */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #invoice-content, #invoice-content * {
              visibility: visible;
              color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #invoice-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background-color: #121212 !important;
            }
          }
        `}} />
      </div>
    </div>
  );
};
