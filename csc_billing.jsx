import { useState, useRef } from "react";

const INITIAL_SERVICES = [
  { id: "aadhaar", name: "Aadhaar Update / Correction", category: "Government ID", price: 0, unit: "per application", variable: false },
  { id: "pan_new", name: "PAN Card (New)", category: "Government ID", price: 0, unit: "per application", variable: false },
  { id: "pan_correction", name: "PAN Card (Correction)", category: "Government ID", price: 0, unit: "per application", variable: false },
  { id: "passport", name: "Passport Form Filling", category: "Government ID", price: 0, unit: "per application", variable: false },
  { id: "voter_id", name: "Voter ID Card", category: "Government ID", price: 0, unit: "per application", variable: false },
  { id: "driving_license", name: "Driving License", category: "Government ID", price: 0, unit: "per application", variable: false },
  { id: "income_cert", name: "Income Certificate", category: "Certificates", price: 0, unit: "per certificate", variable: false },
  { id: "caste_cert", name: "Caste Certificate", category: "Certificates", price: 0, unit: "per certificate", variable: false },
  { id: "domicile_cert", name: "Domicile Certificate", category: "Certificates", price: 0, unit: "per certificate", variable: false },
  { id: "date_cert", name: "Date Certificate", category: "Certificates", price: 0, unit: "per certificate", variable: false },
  { id: "life_cert", name: "Life Certificate", category: "Certificates", price: 0, unit: "per certificate", variable: false },
  { id: "ayushman", name: "Ayushman Card", category: "Certificates", price: 0, unit: "per card", variable: false },
  { id: "affidavit", name: "Affidavit / Stamp Paper", category: "Legal & Docs", price: 0, unit: "per document", variable: true },
  { id: "gazette", name: "Gazette Notification", category: "Legal & Docs", price: 0, unit: "per application", variable: true },
  { id: "rent_agreement", name: "Rent Agreement", category: "Legal & Docs", price: 0, unit: "per agreement", variable: true },
  { id: "deed", name: "Deed / Agreement Work", category: "Legal & Docs", price: 0, unit: "per document", variable: true },
  { id: "ration_card", name: "Ration Card", category: "Government Services", price: 0, unit: "per application", variable: false },
  { id: "pf", name: "Provident Fund (PF)", category: "Government Services", price: 0, unit: "per application", variable: false },
  { id: "pension", name: "Pension", category: "Government Services", price: 0, unit: "per application", variable: false },
  { id: "resume", name: "Resume / Biodata Making", category: "Typing & Print", price: 0, unit: "per resume", variable: false },
  { id: "typing_hindi", name: "Hindi Typing", category: "Typing & Print", price: 0, unit: "per page", variable: true },
  { id: "typing_english", name: "English Typing", category: "Typing & Print", price: 0, unit: "per page", variable: true },
  { id: "photocopy", name: "Photocopy", category: "Typing & Print", price: 0, unit: "per page", variable: true },
  { id: "lamination", name: "Lamination", category: "Typing & Print", price: 0, unit: "per piece", variable: false },
  { id: "pvc_card", name: "PVC Card (Aadhaar/PAN)", category: "Typing & Print", price: 0, unit: "per card", variable: false },
];

const CATEGORIES = ["Government ID", "Certificates", "Legal & Docs", "Government Services", "Typing & Print"];
const CAT_COLORS = {
  "Government ID": "#14B8A6", // Indigo
  "Certificates": "#0284C7",   // Sky Blue
  "Legal & Docs": "#0D9488",   // Teal
  "Government Services": "#16A34A", // Emerald
  "Typing & Print": "#0E7490", // Violet
};

const OPERATORS = ["Samar", "Navneet Mam"];

function generateBillNo() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const mon = String(d.getMonth() + 1).padStart(2, "0");
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `SLP-${day}${mon}-${seq}`;
}

function todayStr() {
  const d = new Date();
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function timeStr() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

//  Tab Button 
function TabBtn({ label, icon, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "12px 20px",
      border: "none",
      borderBottom: active ? "3px solid #14B8A6" : "3px solid transparent",
      background: active ? "rgba(255,255,255,0.14)" : "transparent",
      color: active ? "#F4FAF9" : "#9FB2BE",
      fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif",
      fontWeight: active ? 700 : 500,
      fontSize: 14,
      cursor: "pointer",
      transition: "all 0.2s ease-in-out",
      display: "flex", alignItems: "center", gap: 8,
      borderRadius: "8px 8px 0 0",
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span> {label}
    </button>
  );
}

//  RATE CARD TAB 
function RateCard({ services, setServices }) {
  const [editingId, setEditingId] = useState(null);
  const [addingCustom, setAddingCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCat, setCustomCat] = useState("Typing & Print");
  const [customPrice, setCustomPrice] = useState("");
  const [customUnit, setCustomUnit] = useState("per service");

  const updatePrice = (id, val) => {
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, price: Number(val) || 0 } : s));
  };

  const addCustom = () => {
    if (!customName.trim()) return;
    const newId = "custom_" + Date.now();
    setServices((prev) => [...prev, {
      id: newId, name: customName.trim(), category: customCat,
      price: Number(customPrice) || 0, unit: customUnit, variable: false,
    }]);
    setCustomName(""); setCustomPrice(""); setAddingCustom(false);
  };

  const unpriced = services.filter((s) => s.price === 0).length;

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      {unpriced > 0 && (
        <div style={{
          background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 12,
          padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12,
          fontSize: 14, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", color: "#991B1B",
          boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
        }}>
          <span style={{ fontSize: 20 }}>!</span>
          <span><strong>{unpriced} services</strong> have a Rs. 0 rate. Tap any price to update your backend pricing.</span>
        </div>
      )}

      {CATEGORIES.map((cat) => {
        const catServices = services.filter((s) => s.category === cat);
        if (catServices.length === 0) return null;
        const color = CAT_COLORS[cat];
        return (
          <div key={cat} style={{ marginBottom: 20, borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid rgba(255,255,255,0.16)" }}>
            <div style={{
              background: color, color: "white", padding: "12px 18px",
              fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif",
              fontWeight: 600, fontSize: 14, letterSpacing: 0.5, textTransform: "uppercase"
            }}>
              {cat}
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)" }}>
              {catServices.map((s, i) => (
                <div key={s.id} style={{
                  display: "flex", alignItems: "center", padding: "12px 18px",
                  borderBottom: i < catServices.length - 1 ? "1px solid #F1F5F9" : "none",
                  gap: 12, transition: "background 0.2s",
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#050607'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#F5F7FA", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#A3B2BE", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", marginTop: 2 }}>
                      {s.unit} {s.variable && <span style={{ color: "#F59E0B", fontWeight: 600 }}> variable</span>}
                    </div>
                  </div>
                  {editingId === s.id ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: "#14B8A6" }}>Rs.</span>
                      <input
                        autoFocus
                        type="number"
                        defaultValue={s.price || ""}
                        placeholder="0"
                        onBlur={(e) => { updatePrice(s.id, e.target.value); setEditingId(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { updatePrice(s.id, e.target.value); setEditingId(null); } }}
                        style={{
                          width: 80, padding: "8px 10px", border: "2px solid #14B8A6",
                          borderRadius: 8, fontSize: 14, fontWeight: 600,
                          fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", outline: "none",
                          textAlign: "right",
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      onClick={() => setEditingId(s.id)}
                      style={{
                        cursor: "pointer", padding: "6px 14px",
                        borderRadius: 8, fontSize: 14, fontWeight: 600,
                        fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif",
                        color: s.price > 0 ? "#14B8A6" : "#94A3B8",
                        background: s.price > 0 ? "rgba(20, 184, 166, 0.16)" : "#050607",
                        border: s.price > 0 ? "1px solid rgba(45, 212, 191, 0.5)" : "1px dashed #CBD5E1",
                        minWidth: 80, textAlign: "right",
                        transition: "all 0.2s",
                      }}
                    >
                      {s.price > 0 ? `Rs. ${s.price}` : "Rs. ---"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Add Custom Service */}
      {!addingCustom ? (
        <button onClick={() => setAddingCustom(true)} style={{
          width: "100%", padding: "14px", border: "2px dashed rgba(255,255,255,0.25)",
          borderRadius: 12, background: "rgba(255,255,255,0.06)", cursor: "pointer",
          fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", fontSize: 14, color: "#64748B",
          fontWeight: 600, transition: "all 0.2s",
        }}>
          + Add New Service
        </button>
      ) : (
        <div style={{
          border: "2px solid #14B8A6", borderRadius: 12, padding: 20,
          background: "rgba(255,255,255,0.06)", boxShadow: "0 4px 12px rgba(20, 184, 166, 0.14)"
        }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <input placeholder="Service name" value={customName} onChange={(e) => setCustomName(e.target.value)}
              style={{ flex: 2, minWidth: 160, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 8, fontSize: 14, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", outline: "none" }} />
            <div style={{ display: "flex", alignItems: "center", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 8, background: "#050607", paddingRight: 10 }}>
              <span style={{ paddingLeft: 12, color: "#B3BDC7", fontWeight: 600 }}>Rs.</span>
              <input placeholder="Price" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} type="number"
                style={{ width: 80, padding: "10px", border: "none", background: "transparent", fontSize: 14, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", outline: "none", textAlign: "right" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <select value={customCat} onChange={(e) => setCustomCat(e.target.value)}
              style={{ flex: 1, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 8, fontSize: 14, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", outline: "none", background: "rgba(255,255,255,0.06)" }}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input placeholder="Unit (e.g. per page)" value={customUnit} onChange={(e) => setCustomUnit(e.target.value)}
              style={{ flex: 1, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 8, fontSize: 14, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={addCustom} style={{ flex: 1, padding: "12px", background: "#14B8A6", color: "white", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>
              Save Service
            </button>
            <button onClick={() => setAddingCustom(false)} style={{ padding: "12px 20px", background: "rgba(255,255,255,0.08)", color: "#64748B", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


//  NEW ENTRY (FORMERLY NEW BILL) 
function NewEntry({ services, onSave }) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [qty, setQty] = useState(1);
  const [customAmt, setCustomAmt] = useState("");
  const [payMode, setPayMode] = useState("Cash");
  const [operator, setOperator] = useState("Samar");
  const [saved, setSaved] = useState(null);

  const addItem = () => {
    if (!selectedService) return;
    const svc = services.find((s) => s.id === selectedService);
    if (!svc) return;
    const amt = svc.variable && customAmt ? Number(customAmt) : svc.price;
    setItems((prev) => [...prev, { ...svc, qty: Number(qty) || 1, amount: amt * (Number(qty) || 1) }]);
    setSelectedService(""); setQty(1); setCustomAmt("");
  };

  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const total = items.reduce((s, it) => s + it.amount, 0);

  const saveEntry = () => {
    if (items.length === 0) return;
    const entry = {
      billNo: generateBillNo(),
      date: todayStr(),
      time: timeStr(),
      customerName: customerName.trim() || "Walk-in Customer",
      customerPhone: customerPhone.trim(),
      items: [...items],
      total,
      payMode,
      operator,
    };
    onSave(entry);
    setSaved(entry);
  };

  const resetEntry = () => {
    setCustomerName(""); setCustomerPhone(""); setItems([]);
    setPayMode("Cash"); setSaved(null);
  };

  //  Customer Slip View (No Prices) 
  if (saved) {
    return (
      <div style={{ animation: "fadeIn 0.4s ease-out" }}>
        <div id="receipt" style={{
          background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 22,
          padding: "30px 24px", maxWidth: 420, margin: "0 auto",
          fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif",
          boxShadow: "0 18px 45px rgba(0,0,0,0.45)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Top Edge Detail */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: "#14B8A6" }} />

          {/* Slip Header */}
          <div style={{ textAlign: "center", borderBottom: "1px dashed rgba(255,255,255,0.3)", paddingBottom: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#F8FAFC", letterSpacing: 1 }}>
              CSC CENTRE
            </div>
            <div style={{ fontSize: 12, color: "#C6D0D9", marginTop: 6, lineHeight: 1.6 }}>
              Govt. Recognised Common Service Centre<br />
              Blue Sapphire Plaza, Greater Noida West
            </div>
            <div style={{ display: "inline-block", marginTop: 12, padding: "4px 12px", background: "rgba(255,255,255,0.12)", borderRadius: 100, fontSize: 11, fontWeight: 600, color: "#DCE6EE", letterSpacing: 0.5 }}>
              SERVICE SLIP
            </div>
          </div>

          {/* Customer & Slip Info */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#E6ECF2", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: "#AAB7C4", textTransform: "uppercase", fontWeight: 600, marginBottom: 2 }}>Customer Details</div>
              <div style={{ fontWeight: 600, color: "#F8FAFC" }}>{saved.customerName}</div>
              {saved.customerPhone && <div style={{ color: "#C6D0D9" }}>{saved.customerPhone}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#AAB7C4", textTransform: "uppercase", fontWeight: 600, marginBottom: 2 }}>Date & Time</div>
              <div style={{ fontWeight: 500 }}>{saved.date}</div>
              <div style={{ color: "#C6D0D9" }}>{saved.time}</div>
            </div>
          </div>

          {/* Items Table (No Prices) */}
          <div style={{ padding: "12px 0", borderTop: "2px solid rgba(255,255,255,0.2)", borderBottom: "2px solid rgba(255,255,255,0.2)" }}>
            <div style={{ display: "flex", fontSize: 11, fontWeight: 700, color: "#AAB7C4", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
              <div style={{ flex: 1 }}>Services Requested</div>
              <div style={{ width: 40, textAlign: "right" }}>Qty</div>
            </div>
            {saved.items.map((it, i) => (
              <div key={i} style={{ display: "flex", fontSize: 14, color: "#F8FAFC", padding: "6px 0", alignItems: "flex-start" }}>
                <div style={{ flex: 1, fontWeight: 500 }}>{it.name}</div>
                <div style={{ width: 40, textAlign: "right", color: "#C6D0D9", fontWeight: 600 }}>{it.qty}</div>
              </div>
            ))}
          </div>

          {/* Footer Info */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, fontSize: 11, color: "#C6D0D9" }}>
             <div>Ref: <strong>{saved.billNo}</strong></div>
             <div>Operator: <strong>{saved.operator}</strong></div>
          </div>

          <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#AAB7C4", lineHeight: 1.6 }}>
            Thank you for visiting!<br />
            Please keep this slip for your reference.
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "center" }}>
          <button onClick={() => window.print()} style={{
            padding: "12px 24px", background: "rgba(255,255,255,0.06)", color: "#14B8A6",
            border: "1px solid #14B8A6", borderRadius: 8, fontWeight: 600, fontSize: 14,
            cursor: "pointer", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif",
          }}>
             Print Slip
          </button>
          <button onClick={resetEntry} style={{
            padding: "12px 24px", background: "#14B8A6", color: "white",
            border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14,
            cursor: "pointer", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif",
            boxShadow: "0 4px 12px rgba(20, 184, 166, 0.24)"
          }}>
            + New Entry
          </button>
        </div>
      </div>
    );
  }

  //  Entry Form 
  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      {/* Customer Info */}
      <div style={{
        background: "rgba(255,255,255,0.06)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.16)",
        padding: 20, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 12, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>
          Customer Info <span style={{ fontWeight: 400, color: "#94A3B8", textTransform: "none", letterSpacing: 0 }}>(optional)</span>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
            style={{ flex: 2, minWidth: 150, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, fontSize: 14, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", outline: "none", transition: "border 0.2s" }} 
            onFocus={(e) => e.target.style.borderColor = '#14B8A6'}
            onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
          />
          <input placeholder="Phone Number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
            style={{ flex: 1, minWidth: 130, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, fontSize: 14, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", outline: "none", transition: "border 0.2s" }} 
            onFocus={(e) => e.target.style.borderColor = '#14B8A6'}
            onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
          />
        </div>
      </div>

      {/* Add Items */}
      <div style={{
        background: "rgba(255,255,255,0.06)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.16)",
        padding: 20, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 12, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>
          Select Services
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <select value={selectedService} onChange={(e) => { setSelectedService(e.target.value); setCustomAmt(""); }}
            style={{ flex: 3, minWidth: 180, padding: "11px 14px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, fontSize: 14, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", outline: "none", background: "rgba(255,255,255,0.06)", color: selectedService ? "#F5F7FA" : "#B3BDC7" }}>
            <option value="">Select a service...</option>
            {CATEGORIES.map((cat) => (
              <optgroup key={cat} label={cat}>
                {services.filter((s) => s.category === cat).map((s) => (
                  <option key={s.id} value={s.id}>{s.name} {s.price > 0 ? ` - Rs. ${s.price}` : ""}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>Qty</span>
            <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)}
              style={{ width: 60, padding: "10px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, fontSize: 14, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", outline: "none", textAlign: "center" }} />
          </div>
          {selectedService && services.find((s) => s.id === selectedService)?.variable && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#D97706", fontWeight: 600 }}>Custom Rs.</span>
              <input type="number" value={customAmt} onChange={(e) => setCustomAmt(e.target.value)} placeholder="0"
                style={{ width: 80, padding: "10px", border: "1px solid #F59E0B", borderRadius: 8, fontSize: 14, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", outline: "none", textAlign: "right", background: "#FFFBEB" }} />
            </div>
          )}
          <button onClick={addItem} style={{
            padding: "11px 20px", background: "rgba(255,255,255,0.08)", color: "#14B8A6",
            border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14,
            cursor: "pointer", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", whiteSpace: "nowrap",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(20, 184, 166, 0.24)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            Add
          </button>
        </div>
      </div>

      {/* Internal Item Review (Shows prices for operator reference) */}
      {items.length > 0 && (
        <div style={{
          background: "rgba(255,255,255,0.06)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.16)",
          padding: 20, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#F5F7FA", marginBottom: 12, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Internal Summary <span style={{ fontWeight: 400, color: "#A3B2BE", textTransform: "none", letterSpacing: 0 }}>(Prices not shown on slip)</span>
          </div>
          {items.map((it, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", padding: "12px 0",
              borderBottom: i < items.length - 1 ? "1px solid #F1F5F9" : "none",
              gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#F5F7FA", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>{it.name}</div>
                <div style={{ fontSize: 12, color: "#B3BDC7", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", marginTop: 2 }}>
                  {it.qty > 1 ? `${it.qty} x Rs. ${Math.round(it.amount / it.qty)}` : it.unit}
                </div>
              </div>
              <div style={{ fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", fontSize: 15, fontWeight: 600, color: "#14B8A6" }}>
                Rs. {it.amount}
              </div>
              <button onClick={() => removeItem(i)} style={{
                width: 28, height: 28, border: "none", borderRadius: 6,
                background: "#FEF2F2", color: "#EF4444", cursor: "pointer",
                fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s"
              }}>
                x
              </button>
            </div>
          ))}

          {/* Operator Total Bar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "16px 16px", marginTop: 12, background: "#050607", borderRadius: 8, border: "1px solid rgba(255,255,255,0.16)"
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#B3BDC7", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>AMOUNT TO COLLECT</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#F5F7FA", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>Rs. {total}</span>
          </div>
        </div>
      )}

      {/* Payment & Operator */}
      {items.length > 0 && (
        <div style={{
          background: "rgba(255,255,255,0.06)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.16)",
          padding: 20, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center",
        }}>
          <div style={{ flex: 1, minWidth: 150 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>
              Payment Mode
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["Cash", "UPI"].map((m) => (
                <button key={m} onClick={() => setPayMode(m)} style={{
                  flex: 1, padding: "10px", border: payMode === m ? "2px solid #14B8A6" : "1px solid rgba(255,255,255,0.24)",
                  borderRadius: 8, background: payMode === m ? "rgba(20, 184, 166, 0.16)" : "rgba(255,255,255,0.06)",
                  color: payMode === m ? "#14B8A6" : "#B3BDC7",
                  fontWeight: payMode === m ? 600 : 500, fontSize: 13, cursor: "pointer",
                  fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", transition: "all 0.2s"
                }}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>
              Operator
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {OPERATORS.map((op) => (
                <button key={op} onClick={() => setOperator(op)} style={{
                  flex: 1, padding: "10px", border: operator === op ? "2px solid #14B8A6" : "1px solid rgba(255,255,255,0.24)",
                  borderRadius: 8, background: operator === op ? "rgba(20, 184, 166, 0.16)" : "rgba(255,255,255,0.06)",
                  color: operator === op ? "#14B8A6" : "#B3BDC7",
                  fontWeight: operator === op ? 600 : 500, fontSize: 13, cursor: "pointer",
                  fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", transition: "all 0.2s"
                }}>
                  {op}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      {items.length > 0 && (
        <button onClick={saveEntry} style={{
          width: "100%", padding: "16px", background: "#14B8A6",
          color: "white", border: "none", borderRadius: 12, fontWeight: 700,
          fontSize: 15, cursor: "pointer", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif",
          boxShadow: "0 4px 14px rgba(20, 184, 166, 0.32)",
          letterSpacing: 0.5, transition: "transform 0.1s, boxShadow 0.2s"
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Save Entry & Generate Slip
        </button>
      )}
    </div>
  );
}


//  DASHBOARD (FORMERLY DAILY LOG) 
function Dashboard({ bills }) {
  const todayBills = bills; 
  const totalRevenue = todayBills.reduce((s, b) => s + b.total, 0);
  const cashTotal = todayBills.filter((b) => b.payMode === "Cash").reduce((s, b) => s + b.total, 0);
  const upiTotal = todayBills.filter((b) => b.payMode === "UPI").reduce((s, b) => s + b.total, 0);

  // Service-wise breakdown
  const svcMap = {};
  todayBills.forEach((b) => {
    b.items.forEach((it) => {
      if (!svcMap[it.name]) svcMap[it.name] = { count: 0, revenue: 0 };
      svcMap[it.name].count += it.qty;
      svcMap[it.name].revenue += it.amount;
    });
  });
  const svcList = Object.entries(svcMap).sort((a, b) => b[1].revenue - a[1].revenue);

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      {/* Revenue Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#14B8A6", borderRadius: 16, padding: "20px", color: "white", boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)" }}>
          <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.8, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>Today's Revenue</div>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", marginTop: 8 }}>{totalRevenue}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px", border: "1px solid rgba(255,255,255,0.16)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}> Cash Collection</div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", marginTop: 8, color: "#10B981" }}>{cashTotal}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px", border: "1px solid rgba(255,255,255,0.16)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}> UPI Collection</div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", marginTop: 8, color: "#22D3EE" }}>{upiTotal}</div>
        </div>
      </div>

      {/* Analytics Stats */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px", border: "1px solid rgba(255,255,255,0.16)", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1E293B", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>{todayBills.length}</div>
          <div style={{ fontSize: 12, color: "#64748B", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", fontWeight: 500, marginTop: 4 }}>Total Entries</div>
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px", border: "1px solid rgba(255,255,255,0.16)", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1E293B", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>
            {todayBills.length > 0 ? `${Math.round(totalRevenue / todayBills.length)}` : ""}
          </div>
          <div style={{ fontSize: 12, color: "#64748B", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", fontWeight: 500, marginTop: 4 }}>Average Order</div>
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px", border: "1px solid rgba(255,255,255,0.16)", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1E293B", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>{svcList.length}</div>
          <div style={{ fontSize: 12, color: "#64748B", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", fontWeight: 500, marginTop: 4 }}>Unique Services</div>
        </div>
      </div>

      {/* Detailed Service Breakdown */}
      {svcList.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.16)", padding: 24, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 16, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", letterSpacing: 0.5 }}>
            Revenue by Service
          </div>
          {svcList.map(([name, data], i) => (
            <div key={name} style={{
              display: "flex", alignItems: "center", padding: "12px 0",
              borderBottom: i < svcList.length - 1 ? "1px solid #F1F5F9" : "none",
            }}>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "#334155", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>{name}</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginRight: 16, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", background: "rgba(255,255,255,0.08)", padding: "4px 8px", borderRadius: 6 }}>{data.count} units</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#14B8A6", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", width: 80, textAlign: "right" }}>{data.revenue}</div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction History */}
      {todayBills.length > 0 ? (
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.16)", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <div style={{ padding: "16px 24px", fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", letterSpacing: 0.5, borderBottom: "1px solid #E2E8F0", background: "#050607" }}>
            Backend Transaction Log
          </div>
          {[...todayBills].reverse().map((b) => (
            <div key={b.billNo} style={{
              padding: "16px 24px", borderBottom: "1px solid #F1F5F9",
              display: "flex", alignItems: "center", gap: 16, transition: "background 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#050607'}
            onMouseOut={(e) => e.currentTarget.style.background = 'white'}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1E293B", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>{b.customerName}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 6,
                    background: b.payMode === "Cash" ? "#ECFDF5" : "rgba(34, 211, 238, 0.14)",
                    color: b.payMode === "Cash" ? "#059669" : "#0891B2",
                    fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", letterSpacing: 0.5
                  }}>{b.payMode}</span>
                </div>
                <div style={{ fontSize: 12, color: "#64748B", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", lineHeight: 1.4 }}>
                  {b.billNo}  {b.time}  Op: {b.operator}<br/>
                  <span style={{ color: "#94A3B8" }}>{b.items.map((it) => it.name).join(", ")}</span>
                </div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>
                {b.total}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: "center", padding: "60px 24px", color: "#94A3B8",
          fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", background: "rgba(255,255,255,0.06)", borderRadius: 16, border: "1px dashed #CBD5E1"
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}></div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#475569" }}>No analytics available yet</div>
          <div style={{ fontSize: 14, marginTop: 6 }}>Record a service entry to see your dashboard populate</div>
        </div>
      )}
    </div>
  );
}

function TicketWorkspace({ services, onSaveTicket }) {
  const [step, setStep] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [operator, setOperator] = useState(OPERATORS[0]);
  const [payMode, setPayMode] = useState("Cash");
  const [selectedService, setSelectedService] = useState("");
  const [qty, setQty] = useState(1);
  const [customAmt, setCustomAmt] = useState("");
  const [items, setItems] = useState([]);
  const [ticketMeta, setTicketMeta] = useState(null);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState("");

  const total = items.reduce((sum, it) => sum + it.amount, 0);

  const createTicket = () => {
    if (!customerName.trim()) {
      setError("Customer name is required.");
      return;
    }
    setTicketMeta({
      ticketNo: generateBillNo(),
      date: todayStr(),
      time: timeStr(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      operator,
    });
    setStep(2);
    setError("");
  };

  const addTask = () => {
    if (!selectedService) return;
    const svc = services.find((s) => s.id === selectedService);
    if (!svc) return;
    const qtyNum = Number(qty) || 1;
    const unitPrice = svc.variable ? Number(customAmt) || 0 : svc.price;
    setItems((prev) => [...prev, {
      ...svc,
      qty: qtyNum,
      unitPrice,
      amount: unitPrice * qtyNum,
      done: false,
    }]);
    setSelectedService("");
    setQty(1);
    setCustomAmt("");
  };

  const removeTask = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const saveTicket = (status) => {
    if (!ticketMeta || items.length === 0) return;
    const ticket = {
      ...ticketMeta,
      status,
      payMode,
      operator,
      items: [...items],
      total,
      updatedAt: `${todayStr()} ${timeStr()}`,
    };
    onSaveTicket(ticket);
    setSaved(ticket);
  };

  const resetTicket = () => {
    setStep(1);
    setCustomerName("");
    setCustomerPhone("");
    setOperator(OPERATORS[0]);
    setPayMode("Cash");
    setSelectedService("");
    setQty(1);
    setCustomAmt("");
    setItems([]);
    setTicketMeta(null);
    setSaved(null);
    setError("");
  };

  if (saved) {
    return (
      <div style={{ animation: "fadeIn 0.3s ease-out" }}>
        <div id="receipt" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 22, padding: "26px 22px", maxWidth: 420, margin: "0 auto", color: "#E6ECF2" }}>
          <div style={{ fontSize: 18, fontWeight: 800, textAlign: "center", marginBottom: 10 }}>CSC TICKET SLIP</div>
          <div style={{ fontSize: 12, textAlign: "center", color: saved.status === "Open" ? "#F59E0B" : "#10B981", fontWeight: 700, marginBottom: 14 }}>
            STATUS: {saved.status.toUpperCase()}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: "#A3B2BE" }}>Customer</div>
              <div style={{ fontWeight: 700 }}>{saved.customerName}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "#A3B2BE" }}>Ticket</div>
              <div style={{ fontWeight: 700 }}>{saved.ticketNo}</div>
            </div>
          </div>
          <div style={{ borderTop: "1px dashed rgba(255,255,255,0.3)", borderBottom: "1px dashed rgba(255,255,255,0.3)", padding: "10px 0" }}>
            {saved.items.map((it, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13 }}>
                <span>{it.name}</span>
                <span>x{it.qty}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span>Operator: {saved.operator}</span>
            <span>Pay: {saved.payMode}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 18 }}>
          <button onClick={() => window.print()} style={{ padding: "11px 18px", borderRadius: 8, border: "1px solid #14B8A6", background: "rgba(255,255,255,0.06)", color: "#14B8A6", cursor: "pointer", fontWeight: 700 }}>Print Ticket</button>
          <button onClick={resetTicket} style={{ padding: "11px 18px", borderRadius: 8, border: "none", background: "#14B8A6", color: "white", cursor: "pointer", fontWeight: 700 }}>+ New Ticket</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      {step === 1 && (
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.16)", padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#E6ECF2", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Step 1: Create Customer Ticket
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ flex: 2, minWidth: 180, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.24)", borderRadius: 8, background: "rgba(255,255,255,0.04)", color: "#F5F7FA", outline: "none" }} />
            <input placeholder="Phone Number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} style={{ flex: 1, minWidth: 150, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.24)", borderRadius: 8, background: "rgba(255,255,255,0.04)", color: "#F5F7FA", outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {OPERATORS.map((op) => (
              <button key={op} onClick={() => setOperator(op)} style={{ padding: "8px 12px", borderRadius: 8, border: operator === op ? "2px solid #14B8A6" : "1px solid rgba(255,255,255,0.24)", background: operator === op ? "rgba(20, 184, 166, 0.16)" : "rgba(255,255,255,0.06)", color: operator === op ? "#14B8A6" : "#B3BDC7", cursor: "pointer", fontWeight: 600 }}>{op}</button>
            ))}
          </div>
          {error && <div style={{ marginTop: 8, color: "#FCA5A5", fontSize: 12 }}>{error}</div>}
          <button onClick={createTicket} style={{ width: "100%", marginTop: 12, padding: "12px", borderRadius: 8, border: "none", background: "#14B8A6", color: "white", fontWeight: 700, cursor: "pointer" }}>
            Continue To Ticket Tasks
          </button>
        </div>
      )}

      {step === 2 && (
        <>
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.16)", padding: 14, marginBottom: 12, color: "#E6ECF2" }}>
            <strong>{ticketMeta?.ticketNo}</strong> | {ticketMeta?.customerName}
          </div>
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.16)", padding: 18, marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
              <select value={selectedService} onChange={(e) => { setSelectedService(e.target.value); setCustomAmt(""); }} style={{ flex: 1, minWidth: 220, padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.24)", background: "rgba(255,255,255,0.04)", color: "#F5F7FA" }}>
                <option value="">Select service...</option>
                {CATEGORIES.map((cat) => (
                  <optgroup key={cat} label={cat}>
                    {services.filter((s) => s.category === cat).map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} style={{ width: 70, padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.24)", background: "rgba(255,255,255,0.04)", color: "#F5F7FA", textAlign: "center" }} />
              {selectedService && services.find((s) => s.id === selectedService)?.variable && (
                <input type="number" value={customAmt} onChange={(e) => setCustomAmt(e.target.value)} placeholder="Custom Rs." style={{ width: 120, padding: "10px", borderRadius: 8, border: "1px solid #F59E0B", background: "rgba(255,255,255,0.04)", color: "#F5F7FA" }} />
              )}
              <button onClick={addTask} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(20,184,166,0.5)", background: "rgba(20,184,166,0.16)", color: "#14B8A6", fontWeight: 700, cursor: "pointer" }}>Add Task</button>
            </div>
          </div>

          {items.length > 0 && (
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.16)", padding: 16 }}>
              {items.map((it, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.14)" : "none" }}>
                  <div style={{ flex: 1, color: "#E6ECF2" }}>
                    <div style={{ fontWeight: 600 }}>{it.name}</div>
                    <div style={{ fontSize: 12, color: "#A3B2BE" }}>Qty {it.qty} | Rs. {it.unitPrice}</div>
                  </div>
                  <div style={{ color: "#14B8A6", fontWeight: 700 }}>Rs. {it.amount}</div>
                  <button onClick={() => removeTask(i)} style={{ width: 26, height: 26, border: "none", borderRadius: 6, background: "#FEF2F2", color: "#EF4444", cursor: "pointer", fontWeight: 700 }}>x</button>
                </div>
              ))}
              <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", color: "#E6ECF2", fontWeight: 700 }}>
                <span>Total</span>
                <span>Rs. {total}</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {["Cash", "UPI"].map((m) => (
                  <button key={m} onClick={() => setPayMode(m)} style={{ padding: "8px 12px", borderRadius: 8, border: payMode === m ? "2px solid #14B8A6" : "1px solid rgba(255,255,255,0.24)", background: payMode === m ? "rgba(20, 184, 166, 0.16)" : "rgba(255,255,255,0.06)", color: payMode === m ? "#14B8A6" : "#B3BDC7", cursor: "pointer", fontWeight: 600 }}>{m}</button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                <button onClick={() => saveTicket("Open")} style={{ padding: "12px", borderRadius: 8, border: "none", background: "#F59E0B", color: "white", fontWeight: 700, cursor: "pointer" }}>Save Open Ticket</button>
                <button onClick={() => saveTicket("Closed")} style={{ padding: "12px", borderRadius: 8, border: "none", background: "#10B981", color: "white", fontWeight: 700, cursor: "pointer" }}>Close Ticket</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TicketDashboard({ tickets, onToggleTicketStatus, onToggleTaskDone }) {
  const openTickets = tickets.filter((t) => t.status === "Open");
  const closedTickets = tickets.filter((t) => t.status === "Closed");
  const totalTasks = tickets.reduce((sum, t) => sum + t.items.length, 0);
  const doneTasks = tickets.reduce((sum, t) => sum + t.items.filter((it) => it.done).length, 0);

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 16 }}>
        <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 10, padding: 14, color: "#E6ECF2" }}><div style={{ fontSize: 12, color: "#A3B2BE" }}>Total Tickets</div><div style={{ fontSize: 24, fontWeight: 800 }}>{tickets.length}</div></div>
        <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 10, padding: 14, color: "#E6ECF2" }}><div style={{ fontSize: 12, color: "#A3B2BE" }}>Open</div><div style={{ fontSize: 24, fontWeight: 800, color: "#F59E0B" }}>{openTickets.length}</div></div>
        <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 10, padding: 14, color: "#E6ECF2" }}><div style={{ fontSize: 12, color: "#A3B2BE" }}>Closed</div><div style={{ fontSize: 24, fontWeight: 800, color: "#10B981" }}>{closedTickets.length}</div></div>
        <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 10, padding: 14, color: "#E6ECF2" }}><div style={{ fontSize: 12, color: "#A3B2BE" }}>Task Progress</div><div style={{ fontSize: 22, fontWeight: 800, color: "#14B8A6" }}>{doneTasks}/{totalTasks || 0}</div></div>
      </div>

      <div style={{ color: "#E6ECF2", fontWeight: 700, marginBottom: 8 }}>Open Tickets</div>
      {openTickets.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.06)", border: "1px dashed rgba(255,255,255,0.25)", borderRadius: 10, padding: 14, color: "#A3B2BE" }}>No open tickets.</div>
      ) : (
        <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
          {openTickets.map((t) => (
            <div key={t.ticketNo} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <div style={{ color: "#E6ECF2", fontWeight: 700 }}>{t.ticketNo} | {t.customerName}</div>
                <button onClick={() => onToggleTicketStatus(t.ticketNo, "Closed")} style={{ border: "none", borderRadius: 8, padding: "8px 10px", background: "#10B981", color: "white", fontWeight: 700, cursor: "pointer" }}>Close</button>
              </div>
              {t.items.map((it, idx) => (
                <label key={`${t.ticketNo}_${idx}`} style={{ display: "flex", alignItems: "center", gap: 8, color: "#DCE4EA", padding: "6px 0", borderBottom: idx < t.items.length - 1 ? "1px solid rgba(255,255,255,0.14)" : "none" }}>
                  <input type="checkbox" checked={!!it.done} onChange={() => onToggleTaskDone(t.ticketNo, idx)} />
                  <span style={{ flex: 1, textDecoration: it.done ? "line-through" : "none" }}>{it.name}</span>
                  <span style={{ fontSize: 12, color: "#A3B2BE" }}>x{it.qty}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      )}

      <div style={{ color: "#E6ECF2", fontWeight: 700, marginBottom: 8 }}>Closed Tickets</div>
      {closedTickets.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.06)", border: "1px dashed rgba(255,255,255,0.25)", borderRadius: 10, padding: 14, color: "#A3B2BE" }}>No closed tickets yet.</div>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 10, overflow: "hidden" }}>
          {[...closedTickets].reverse().map((t, idx) => (
            <div key={t.ticketNo} style={{ padding: "12px 14px", borderBottom: idx < closedTickets.length - 1 ? "1px solid rgba(255,255,255,0.14)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ color: "#E6ECF2" }}>{t.ticketNo} | {t.customerName} | Rs. {t.total}</div>
              <button onClick={() => onToggleTicketStatus(t.ticketNo, "Open")} style={{ border: "1px solid rgba(245,158,11,0.5)", borderRadius: 8, padding: "7px 10px", background: "rgba(245,158,11,0.2)", color: "#F59E0B", fontWeight: 700, cursor: "pointer" }}>Reopen</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- B2B TAB ---
function B2BWorkspace() {
  const b2bServices = [
    { name: "Bulk Form Filing Support", unit: "per batch", note: "Ideal for partners with recurring submissions" },
    { name: "Enterprise Document Printing", unit: "per order", note: "Bulk print, scan, and dispatch workflow" },
    { name: "Staff Onboarding KYC Desk", unit: "per employee", note: "Structured verification with tracking" },
    { name: "Vendor Certificate Processing", unit: "per request", note: "Fast turnaround for compliance docs" },
  ];

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div style={{
        background: "linear-gradient(135deg, #0C1115 0%, #14B8A6 100%)",
        borderRadius: 16,
        padding: "22px 24px",
        color: "white",
        marginBottom: 18,
        boxShadow: "0 6px 16px rgba(79, 70, 229, 0.2)"
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85, textTransform: "uppercase", letterSpacing: 0.6, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>
          Partner Desk
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, letterSpacing: -0.4, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>
          B2B Workspace
        </div>
        <div style={{ fontSize: 13, marginTop: 8, opacity: 0.85, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>
          Manage business clients, bulk service requests, and partner operations from one place.
        </div>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.06)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.16)",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
        marginBottom: 16
      }}>
        <div style={{
          padding: "14px 20px",
          borderBottom: "1px solid #E2E8F0",
          background: "#050607",
          fontSize: 14,
          fontWeight: 700,
          color: "#1E293B",
          fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif",
          letterSpacing: 0.4
        }}>
          B2B Services
        </div>
        {b2bServices.map((svc, i) => (
          <div key={svc.name} style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 20px",
            borderBottom: i < b2bServices.length - 1 ? "1px solid #F1F5F9" : "none",
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1E293B", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>
                {svc.name}
              </div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 3, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>
                {svc.note}
              </div>
            </div>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#14B8A6",
              background: "rgba(20, 184, 166, 0.16)",
              border: "1px solid rgba(45, 212, 191, 0.5)",
              borderRadius: 999,
              padding: "5px 10px",
              fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif"
            }}>
              {svc.unit}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: "rgba(255,255,255,0.06)",
        borderRadius: 16,
        border: "1px dashed #CBD5E1",
        padding: "24px 20px",
        textAlign: "center",
        color: "#64748B",
        fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif"
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#334155", marginBottom: 8 }}>
          B2B billing board is ready for expansion
        </div>
        <div style={{ fontSize: 13 }}>
          We can plug in corporate client profiles, credit cycles, and GST invoices in this tab next.
        </div>
      </div>
    </div>
  );
}

// --- MAIN APP ---
export default function CSCBilling() {
  const [tab, setTab] = useState("entry");
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [tickets, setTickets] = useState([]);

  const saveTicket = (ticket) => setTickets((prev) => [...prev, ticket]);
  const toggleTicketStatus = (ticketNo, status) => {
    setTickets((prev) => prev.map((t) => t.ticketNo === ticketNo ? { ...t, status, updatedAt: `${todayStr()} ${timeStr()}` } : t));
  };
  const toggleTaskDone = (ticketNo, taskIdx) => {
    setTickets((prev) => prev.map((t) => {
      if (t.ticketNo !== ticketNo) return t;
      return {
        ...t,
        items: t.items.map((it, idx) => idx === taskIdx ? { ...it, done: !it.done } : it),
        updatedAt: `${todayStr()} ${timeStr()}`,
      };
    }));
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050607",
      fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif",
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media print {
          @page { margin: 8mm; }
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #receipt, #receipt * {
            visibility: visible !important;
          }
          #receipt {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            margin: 0 auto !important;
            width: min(420px, 100%) !important;
            max-width: 420px !important;
            border: 1px solid #D1D5DB !important;
            border-radius: 20px !important;
            background: white !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
          button {
            display: none !important;
          }
        }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #020202 0%, #0C1115 100%)",
        padding: "30px 24px 0",
        color: "white",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>CSC Centre Workspace</h1>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(255,255,255,0.7)", letterSpacing: 0.3, fontWeight: 500 }}>
                Blue Sapphire Plaza
              </p>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.1)", borderRadius: 10,
              padding: "8px 16px", fontSize: 13, fontWeight: 600,
              fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", backdropFilter: "blur(4px)"
            }}>
              {todayStr()}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{
            display: "flex", gap: 4,
          }}>
            <TabBtn label="Service Entry" icon="" active={tab === "entry"} onClick={() => setTab("entry")} />
            <TabBtn label="Rate Card" icon="" active={tab === "rates"} onClick={() => setTab("rates")} />
            <TabBtn label="Dashboard" icon="" active={tab === "log"} onClick={() => setTab("log")} />
            <TabBtn label="B2B" icon="" active={tab === "b2b"} onClick={() => setTab("b2b")} />
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px 60px" }}>
        {tab === "rates" && <RateCard services={services} setServices={setServices} />}
        {tab === "entry" && <TicketWorkspace services={services} onSaveTicket={saveTicket} />}
        {tab === "log" && <TicketDashboard tickets={tickets} onToggleTicketStatus={toggleTicketStatus} onToggleTaskDone={toggleTaskDone} />}
        {tab === "b2b" && <B2BWorkspace />}
      </div>
    </div>
  );
}



