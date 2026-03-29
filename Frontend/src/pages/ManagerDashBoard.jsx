import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const categoryConfig = {
  Food:       { emoji: '🍽️' },
  Stationery: { emoji: '📎' },
  Travel:     { emoji: '✈️' },
  Software:   { emoji: '💻' },
};

const statusConfig = {
  PENDING:  { label: 'Pending',  cls: 'status-pending'  },
  APPROVED: { label: 'Approved', cls: 'status-approved' },
  REJECTED: { label: 'Rejected', cls: 'status-rejected' },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');

  :root {
    --background:           oklch(0.9842 0.0034 247.8575);
    --foreground:           oklch(0.2795 0.0368 260.0310);
    --card:                 oklch(1.0000 0 0);
    --card-foreground:      oklch(0.2795 0.0368 260.0310);
    --primary:              oklch(0.4346 0.0501 343.6708);
    --primary-foreground:   oklch(1.0000 0 0);
    --secondary:            oklch(0.9276 0.0058 264.5313);
    --secondary-foreground: oklch(0.3729 0.0306 259.7328);
    --muted:                oklch(0.9670 0.0029 264.5419);
    --muted-foreground:     oklch(0.5510 0.0234 264.3637);
    --accent:               oklch(0.9299 0.0334 272.7879);
    --accent-foreground:    oklch(0.3729 0.0306 259.7328);
    --destructive:          oklch(0.6368 0.2078 25.3313);
    --border:               oklch(0.8717 0.0093 258.3382);
    --ring:                 oklch(0.5854 0.2041 277.1173);
    --radius:               0.5rem;
    --font-sans:            'Manrope', sans-serif;
    --font-mono:            'JetBrains Mono', monospace;
    --shadow-sm:            0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 1px 2px -2px hsl(0 0% 0% / 0.10);
    --shadow-md:            0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 2px 4px -2px hsl(0 0% 0% / 0.10);
    --success:              oklch(0.55 0.17 145);
    --success-muted:        oklch(0.94 0.05 145);
    --success-border:       oklch(0.80 0.09 145);
    --success-fg:           oklch(0.35 0.12 145);
    --warning:              oklch(0.72 0.15 72);
    --warning-muted:        oklch(0.96 0.06 72);
    --warning-border:       oklch(0.82 0.10 72);
    --warning-fg:           oklch(0.42 0.10 72);
    --danger-muted:         oklch(0.96 0.03 25);
    --danger-border:        oklch(0.84 0.10 25);
    --danger-fg:            oklch(0.48 0.18 25);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .mgr-wrap { font-family: var(--font-sans); background: var(--background); color: var(--foreground); min-height: 100vh; padding: 40px 48px; }
  .mgr-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; flex-wrap: wrap; margin-bottom: 28px; }
  .mgr-eyebrow { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted-foreground); margin-bottom: 5px; }
  .mgr-title { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.15; }
  .mgr-title-accent { color: var(--primary); }
  .mgr-stats { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .stat-chip { display: flex; align-items: center; gap: 7px; background: var(--card); border: 1px solid var(--border); border-radius: 999px; padding: 7px 14px; box-shadow: var(--shadow-sm); }
  .stat-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .stat-dot.pending  { background: var(--warning); animation: blink 1.8s infinite; }
  .stat-num   { font-size: 14px; font-weight: 700; }
  .stat-label { font-family: var(--font-mono); font-size: 10px; color: var(--muted-foreground); }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
  .mgr-card { background: var(--card); border: 1px solid var(--border); border-radius: calc(var(--radius) * 2); box-shadow: var(--shadow-md); overflow: hidden; }
  .mgr-card-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; background: var(--muted); border-bottom: 1px solid var(--border); }
  .mgr-card-title { font-size: 13px; font-weight: 600; }
  .mgr-count-badge { font-family: var(--font-mono); font-size: 10px; background: var(--accent); color: var(--accent-foreground); border: 1px solid var(--border); border-radius: 999px; padding: 2px 10px; }
  table { width: 100%; border-collapse: collapse; }
  thead { background: var(--muted); }
  th { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted-foreground); font-weight: 400; padding: 11px 24px; text-align: left; border-bottom: 1px solid var(--border); }
  tbody tr { border-bottom: 1px solid var(--border); transition: background 0.12s; }
  tbody tr:hover { background: var(--muted); }
  td { padding: 15px 24px; vertical-align: middle; font-size: 13px; }
  .desc-title { font-weight: 600; color: var(--foreground); }
  .desc-date  { font-family: var(--font-mono); font-size: 10px; color: var(--muted-foreground); margin-top: 2px; }
  .owner-wrap { display: flex; align-items: center; gap: 9px; }
  .owner-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--accent); border: 1.5px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: var(--accent-foreground); flex-shrink: 0; }
  .owner-name { font-size: 13px; font-weight: 500; }
  .cat-pill { display: inline-flex; align-items: center; gap: 5px; background: var(--secondary); border: 1px solid var(--border); border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 600; color: var(--secondary-foreground); white-space: nowrap; }
  .status-pill { display: inline-flex; align-items: center; gap: 5px; border-radius: var(--radius); padding: 3px 9px; font-family: var(--font-mono); font-size: 10px; font-weight: 500; letter-spacing: 0.06em; border: 1px solid; }
  .status-pill .sdot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
  .status-pending  { background: var(--warning-muted); color: var(--warning-fg); border-color: var(--warning-border); }
  .status-pending .sdot  { background: var(--warning); animation: blink 1.8s infinite; }
  .amount-main { font-family: var(--font-mono); font-size: 13px; font-weight: 500; }
  .amount-sub  { font-family: var(--font-mono); font-size: 10px; color: var(--muted-foreground); margin-top: 2px; }
  .amount-arrow { margin: 0 3px; opacity: 0.35; }
  .actions-wrap { display: flex; align-items: center; gap: 7px; }
  .btn { display: inline-flex; align-items: center; gap: 4px; border-radius: var(--radius); padding: 6px 13px; font-family: var(--font-sans); font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.14s ease; border: 1px solid; }
  .btn-approve { background: var(--success-muted); color: var(--success-fg); border-color: var(--success-border); }
  .btn-reject { background: var(--danger-muted); color: var(--danger-fg); border-color: var(--danger-border); }
  .toast { position: fixed; bottom: 24px; right: 24px; background: var(--card); border: 1px solid var(--border); border-radius: calc(var(--radius) + 4px); padding: 12px 18px; font-size: 13px; color: var(--foreground); display: flex; align-items: center; gap: 10px; z-index: 9999; animation: toastIn 0.28s ease; box-shadow: var(--shadow-md); }
  .toast-dot { width: 8px; height: 8px; border-radius: 50%; }
`;

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const API_BASE = "http://localhost:5000/api/manager";

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/pending`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) setApprovals(data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const handleAction = async (requestId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const item = approvals.find(a => a.id === requestId);
      const response = await fetch(`${API_BASE}/action`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ requestId, status: newStatus, comments: "Dashboard action" })
      });

      if (response.ok) {
        setApprovals(prev => prev.filter(a => a.id !== requestId));
        setToast({ status: newStatus, desc: item?.expense?.description });
        setTimeout(() => setToast(null), 2800);
      }
    } catch {
      alert("Action failed.");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(140deg,#f8fafc_0%,#eef3ff_48%,#f9f6f2_100%)] text-foreground">
        <div className="mx-auto flex max-w-[1500px] gap-4 p-3 sm:p-5">
          <aside className={`${isSidebarCollapsed ? 'w-[76px]' : 'w-[280px]'} sticky top-3 hidden h-[calc(100vh-1.5rem)] shrink-0 flex-col rounded-2xl border border-border/70 bg-card/90 p-4 shadow-lg backdrop-blur md:flex`}>
            <div className="flex items-center justify-between gap-2">
              {!isSidebarCollapsed ? <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Manager Space</h2> : null}
              <button type="button" onClick={() => setIsSidebarCollapsed((prev) => !prev)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-lg hover:bg-muted">{isSidebarCollapsed ? '>' : '<'}</button>
            </div>

            <div className="mt-5 rounded-xl border border-border/70 bg-background p-3">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">M</div>
              {!isSidebarCollapsed ? (
                <>
                  <p className="mt-2 text-center text-sm font-semibold">Manager</p>
                  <p className="text-center text-xs text-muted-foreground">Role: Manager</p>
                </>
              ) : null}
            </div>

            {!isSidebarCollapsed ? (
              <div className="mt-5 space-y-2 text-sm">
                <div className="rounded-lg border border-border/60 bg-muted/50 px-3 py-2">To Review: {approvals.length}</div>
              </div>
            ) : null}

            <div className="mt-5 space-y-2">
              <button type="button" onClick={() => {}} className={`inline-flex h-10 w-full items-center justify-center rounded-lg border px-3 text-sm font-semibold transition border-border bg-background hover:bg-muted`}>{isSidebarCollapsed ? 'A' : 'Approvals'}</button>
            </div>

            <button type="button" onClick={handleLogout} className="mt-auto inline-flex h-10 items-center justify-center rounded-lg border border-destructive/40 bg-destructive/10 px-3 text-sm font-semibold text-destructive hover:bg-destructive/20">{isSidebarCollapsed ? 'X' : 'Logout'}</button>
          </aside>

          <section className="flex-1 space-y-4">
            <div className="rounded-2xl border border-border/70 bg-card/90 p-5 shadow-md backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Manager Dashboard</p>
                  <h1 className="mt-1 text-2xl font-bold">Approvals</h1>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm text-center">Loading approvals...</div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(140deg,#f8fafc_0%,#eef3ff_48%,#f9f6f2_100%)] text-foreground">
      <style>{css}</style>
      <div className="mx-auto flex max-w-[1500px] gap-4 p-3 sm:p-5">
        <aside className={`${isSidebarCollapsed ? 'w-[76px]' : 'w-[280px]'} sticky top-3 hidden h-[calc(100vh-1.5rem)] shrink-0 flex-col rounded-2xl border border-border/70 bg-card/90 p-4 shadow-lg backdrop-blur md:flex`}>
          <div className="flex items-center justify-between gap-2">
            {!isSidebarCollapsed ? <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Manager Space</h2> : null}
            <button type="button" onClick={() => setIsSidebarCollapsed((prev) => !prev)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-lg hover:bg-muted">{isSidebarCollapsed ? '>' : '<'}</button>
          </div>

          <div className="mt-5 rounded-xl border border-border/70 bg-background p-3">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">M</div>
            {!isSidebarCollapsed ? (
              <>
                <p className="mt-2 text-center text-sm font-semibold">Manager</p>
                <p className="text-center text-xs text-muted-foreground">Role: Manager</p>
              </>
            ) : null}
          </div>

          {!isSidebarCollapsed ? (
            <div className="mt-5 space-y-2 text-sm">
              <div className="rounded-lg border border-border/60 bg-muted/50 px-3 py-2">To Review: {approvals.length}</div>
            </div>
          ) : null}

          <div className="mt-5 space-y-2">
            <button type="button" onClick={() => {}} className={`inline-flex h-10 w-full items-center justify-center rounded-lg border px-3 text-sm font-semibold transition border-border bg-background hover:bg-muted`}>{isSidebarCollapsed ? 'A' : 'Approvals'}</button>
          </div>

          <button type="button" onClick={handleLogout} className="mt-auto inline-flex h-10 items-center justify-center rounded-lg border border-destructive/40 bg-destructive/10 px-3 text-sm font-semibold text-destructive hover:bg-destructive/20">{isSidebarCollapsed ? 'X' : 'Logout'}</button>
        </aside>

        <section className="flex-1 space-y-4">
          <div className="mgr-header">
            <div>
              <div className="mgr-eyebrow">Expense Management</div>
              <h1 className="mgr-title">Manager<span className="mgr-title-accent">'s</span> Dashboard</h1>
            </div>
            <div className="mgr-stats">
              <div className="stat-chip">
                <div className="stat-dot pending" />
                <span className="stat-num">{approvals.length}</span>
                <span className="stat-label">To Review</span>
              </div>
            </div>
          </div>

          <div className="mgr-card">
            <div className="mgr-card-head">
              <span className="mgr-card-title">Approvals to Review</span>
              <span className="mgr-count-badge">{approvals.length} requests</span>
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
                  const cat = categoryConfig[item.expense.category] || { emoji: '📁' };
                  const st = statusConfig[item.status];
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="desc-title">{item.expense.description}</div>
                        <div className="desc-date">{new Date(item.expense.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td>
                        <div className="owner-wrap">
                          <div className="owner-avatar">{item.expense.employee.name.charAt(0)}</div>
                          <span className="owner-name">{item.expense.employee.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="cat-pill">{cat.emoji} {item.expense.category}</span>
                      </td>
                      <td>
                        <span className={`status-pill ${st.cls}`}>
                          <span className="sdot" />
                          {st.label}
                        </span>
                      </td>
                      <td>
                        <div className="amount-main">{item.expense.submittedAmount} {item.expense.submittedCurrency}</div>
                        <div className="amount-sub">
                          <span className="amount-arrow">→</span>
                          ₹{item.calculatedBaseAmount} INR
                        </div>
                      </td>
                      <td>
                        <div className="actions-wrap">
                          <button className="btn btn-approve" onClick={() => handleAction(item.id, 'APPROVED')}>✓ Approve</button>
                          <button className="btn btn-reject" onClick={() => handleAction(item.id, 'REJECTED')}>✕ Reject</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {approvals.length === 0 && <div style={{padding:'40px',textAlign:'center',color:'var(--muted-foreground)'}}>All caught up!</div>}
          </div>

          {toast && (
            <div className="toast">
              <div className="toast-dot" style={{ background: toast.status === 'APPROVED' ? 'var(--success)' : 'var(--destructive)' }} />
              <span><strong>{toast.desc}</strong> {toast.status === 'APPROVED' ? 'approved' : 'rejected'}.</span>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}