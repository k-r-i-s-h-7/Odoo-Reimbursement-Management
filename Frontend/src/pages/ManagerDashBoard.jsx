import React, { useState } from 'react';

const initialApprovals = [
  {
    id: "1",
    description: "Client Lunch",
    owner: "Sarah",
    ownerInitials: "S",
    category: "Food",
    status: "PENDING",
    submittedAmount: 567,
    submittedCurrency: "USD",
    baseAmount: 49896,
    baseCurrency: "INR",
    date: "Jun 12, 2025"
  },
  {
    id: "2",
    description: "Office Supplies",
    owner: "John",
    ownerInitials: "J",
    category: "Stationery",
    status: "APPROVED",
    submittedAmount: 100,
    submittedCurrency: "USD",
    baseAmount: 8800,
    baseCurrency: "INR",
    date: "Jun 10, 2025"
  },
  {
    id: "3",
    description: "Team Offsite Travel",
    owner: "Priya",
    ownerInitials: "P",
    category: "Travel",
    status: "PENDING",
    submittedAmount: 1200,
    submittedCurrency: "USD",
    baseAmount: 105600,
    baseCurrency: "INR",
    date: "Jun 14, 2025"
  },
  {
    id: "4",
    description: "SaaS Subscription",
    owner: "Mike",
    ownerInitials: "M",
    category: "Software",
    status: "REJECTED",
    submittedAmount: 49,
    submittedCurrency: "USD",
    baseAmount: 4312,
    baseCurrency: "INR",
    date: "Jun 8, 2025"
  }
];

const categoryColors = {
  Food: { bg: '#2a1f0e', text: '#f4a535', dot: '#f4a535' },
  Stationery: { bg: '#0e1a2a', text: '#4da3f5', dot: '#4da3f5' },
  Travel: { bg: '#1a0e2a', text: '#b46ef5', dot: '#b46ef5' },
  Software: { bg: '#0e2a1a', text: '#3dd68c', dot: '#3dd68c' },
};

const statusConfig = {
  PENDING:  { color: '#f4a535', bg: 'rgba(244,165,53,0.1)',  label: 'Pending'  },
  APPROVED: { color: '#3dd68c', bg: 'rgba(61,214,140,0.1)', label: 'Approved' },
  REJECTED: { color: '#f45353', bg: 'rgba(244,83,83,0.1)',  label: 'Rejected' },
};

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .mgr-root {
    font-family: 'Syne', sans-serif;
    background: #0a0a0f;
    min-height: 100vh;
    padding: 36px 40px;
    color: #e8e8f0;
    position: relative;
    overflow-x: hidden;
  }

  .mgr-root::before {
    content: '';
    position: fixed;
    top: -200px; right: -200px;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }
  .mgr-root::after {
    content: '';
    position: fixed;
    bottom: -200px; left: -100px;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(244,165,53,0.07) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .mgr-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 36px;
    position: relative;
    z-index: 1;
  }

  .mgr-title-group {}
  .mgr-eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #6366f1;
    margin-bottom: 6px;
  }
  .mgr-title {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #fff;
  }
  .mgr-title span { color: #6366f1; }

  .mgr-stats {
    display: flex;
    gap: 16px;
  }
  .mgr-stat {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 12px 18px;
    text-align: center;
    min-width: 80px;
  }
  .mgr-stat-num {
    font-size: 22px;
    font-weight: 700;
    color: #fff;
  }
  .mgr-stat-label {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #666;
    margin-top: 2px;
  }
  .mgr-stat.pending .mgr-stat-num { color: #f4a535; }
  .mgr-stat.approved .mgr-stat-num { color: #3dd68c; }
  .mgr-stat.rejected .mgr-stat-num { color: #f45353; }

  .mgr-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    overflow: hidden;
    position: relative;
    z-index: 1;
  }

  .mgr-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 28px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .mgr-card-title {
    font-size: 14px;
    font-weight: 600;
    color: #aaa;
    letter-spacing: 0.01em;
  }
  .mgr-badge {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    background: rgba(99,102,241,0.15);
    color: #6366f1;
    border: 1px solid rgba(99,102,241,0.3);
    border-radius: 20px;
    padding: 3px 12px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }
  thead tr {
    background: rgba(255,255,255,0.02);
  }
  th {
    font-family: 'DM Mono', monospace;
    font-size: 9.5px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #555;
    font-weight: 400;
    padding: 14px 28px;
    text-align: left;
    white-space: nowrap;
  }
  tbody tr {
    border-top: 1px solid rgba(255,255,255,0.045);
    transition: background 0.15s;
  }
  tbody tr:hover {
    background: rgba(255,255,255,0.03);
  }
  td {
    padding: 18px 28px;
    vertical-align: middle;
  }

  .desc-cell {}
  .desc-name {
    font-size: 14px;
    font-weight: 600;
    color: #e8e8f0;
  }
  .desc-date {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #555;
    margin-top: 3px;
  }

  .owner-cell {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .owner-avatar {
    width: 30px; height: 30px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: #fff;
    flex-shrink: 0;
  }
  .owner-name { font-size: 13px; font-weight: 500; color: #ccc; }

  .cat-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 11px;
    font-weight: 600;
    font-family: 'DM Mono', monospace;
  }
  .cat-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 600;
    font-family: 'DM Mono', monospace;
    letter-spacing: 0.06em;
  }
  .status-dot {
    width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
    animation: pulse 2s infinite;
  }
  .status-dot.pending { animation: pulse 2s infinite; }
  .status-dot.approved, .status-dot.rejected { animation: none; }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .amount-cell {}
  .amount-submitted {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    font-weight: 500;
    color: #e8e8f0;
  }
  .amount-converted {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #555;
    margin-top: 3px;
  }
  .amount-arrow { color: #444; margin: 0 4px; }

  .actions-cell {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: none;
    border-radius: 8px;
    padding: 7px 14px;
    font-family: 'Syne', sans-serif;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s;
    letter-spacing: 0.01em;
  }
  .btn-approve {
    background: rgba(61,214,140,0.12);
    color: #3dd68c;
    border: 1px solid rgba(61,214,140,0.25);
  }
  .btn-approve:hover {
    background: rgba(61,214,140,0.22);
    border-color: rgba(61,214,140,0.5);
    transform: translateY(-1px);
  }
  .btn-reject {
    background: rgba(244,83,83,0.1);
    color: #f45353;
    border: 1px solid rgba(244,83,83,0.2);
  }
  .btn-reject:hover {
    background: rgba(244,83,83,0.2);
    border-color: rgba(244,83,83,0.45);
    transform: translateY(-1px);
  }
  .readonly-tag {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #444;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .toast {
    position: fixed;
    bottom: 28px; right: 28px;
    background: #1a1a24;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 14px 20px;
    font-size: 13px;
    font-weight: 500;
    color: #e8e8f0;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 9999;
    animation: slideIn 0.3s ease;
    box-shadow: 0 8px 30px rgba(0,0,0,0.4);
  }
  .toast-dot { width: 8px; height: 8px; border-radius: 50%; }
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

export default function ManagerDashboard() {
  const [approvals, setApprovals] = useState(initialApprovals);
  const [toast, setToast] = useState(null);

  const handleAction = (id, newStatus) => {
    setApprovals(prev =>
      prev.map(item => item.id === id ? { ...item, status: newStatus } : item)
    );
    const item = approvals.find(a => a.id === id);
    setToast({ status: newStatus, desc: item?.description });
    setTimeout(() => setToast(null), 2800);
  };

  const counts = {
    pending:  approvals.filter(a => a.status === 'PENDING').length,
    approved: approvals.filter(a => a.status === 'APPROVED').length,
    rejected: approvals.filter(a => a.status === 'REJECTED').length,
  };

  return (
    <>
      <style>{style}</style>
      <div className="mgr-root">
        <div className="mgr-header">
          <div className="mgr-title-group">
            <div className="mgr-eyebrow">Expense Management</div>
            <h1 className="mgr-title">Manager<span>'s</span> Dashboard</h1>
          </div>
          <div className="mgr-stats">
            <div className="mgr-stat pending">
              <div className="mgr-stat-num">{counts.pending}</div>
              <div className="mgr-stat-label">Pending</div>
            </div>
            <div className="mgr-stat approved">
              <div className="mgr-stat-num">{counts.approved}</div>
              <div className="mgr-stat-label">Approved</div>
            </div>
            <div className="mgr-stat rejected">
              <div className="mgr-stat-num">{counts.rejected}</div>
              <div className="mgr-stat-label">Rejected</div>
            </div>
          </div>
        </div>

        <div className="mgr-card">
          <div className="mgr-card-header">
            <div className="mgr-card-title">Approvals to Review</div>
            <div className="mgr-badge">{approvals.length} requests</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Owner</th>
                <th>Category</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map(item => {
                const cat = categoryColors[item.category] || { bg: '#1a1a1a', text: '#aaa', dot: '#aaa' };
                const st = statusConfig[item.status];
                return (
                  <tr key={item.id}>
                    <td className="desc-cell">
                      <div className="desc-name">{item.description}</div>
                      <div className="desc-date">{item.date}</div>
                    </td>
                    <td>
                      <div className="owner-cell">
                        <div className="owner-avatar">{item.ownerInitials}</div>
                        <div className="owner-name">{item.owner}</div>
                      </div>
                    </td>
                    <td>
                      <span className="cat-pill" style={{ background: cat.bg, color: cat.text }}>
                        <span className="cat-dot" style={{ background: cat.dot }} />
                        {item.category}
                      </span>
                    </td>
                    <td>
                      <span className="status-pill" style={{ background: st.bg, color: st.color }}>
                        <span
                          className={`status-dot ${item.status.toLowerCase()}`}
                          style={{ background: st.color }}
                        />
                        {st.label}
                      </span>
                    </td>
                    <td className="amount-cell">
                      <div className="amount-submitted">
                        {item.submittedAmount.toLocaleString()} {item.submittedCurrency}
                      </div>
                      <div className="amount-converted">
                        <span className="amount-arrow">→</span>
                        ₹{item.baseAmount.toLocaleString()} {item.baseCurrency}
                      </div>
                    </td>
                    <td>
                      {item.status === 'PENDING' ? (
                        <div className="actions-cell">
                          <button className="btn btn-approve" onClick={() => handleAction(item.id, 'APPROVED')}>
                            ✓ Approve
                          </button>
                          <button className="btn btn-reject" onClick={() => handleAction(item.id, 'REJECTED')}>
                            ✕ Reject
                          </button>
                        </div>
                      ) : (
                        <span className="readonly-tag">Read-only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {toast && (
          <div className="toast">
            <div
              className="toast-dot"
              style={{ background: toast.status === 'APPROVED' ? '#3dd68c' : '#f45353' }}
            />
            <span>
              <strong>{toast.desc}</strong> {toast.status === 'APPROVED' ? 'approved' : 'rejected'} successfully
            </span>
          </div>
        )}
      </div>
    </>
  );
}
