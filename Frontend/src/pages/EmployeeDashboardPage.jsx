import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/apiClient';

const EXPENSE_CATEGORIES = [
  'Travel',
  'Meals',
  'Lodging',
  'Supplies',
  'Transport',
  'Medical',
  'Utilities',
  'Other',
];

const createInitialManual = (employeeName) => ({
  description: '',
  expenseDate: '',
  category: '',
  paidBy: employeeName || '',
  remarks: '',
  amount: '',
  submittedCurrency: 'USD',
  detailedNotes: '',
});

const createInitialUpload = (employeeName) => ({
  description: '',
  category: '',
  expenseDate: '',
  paidBy: employeeName || '',
  remarks: '',
  submittedCurrency: 'USD',
  detailedNotes: '',
});

const EmployeeDashboardPage = () => {
  const navigate = useNavigate();
  const employeeId = localStorage.getItem('employeeId') || '';
  const employeeName = localStorage.getItem('employeeName') || '';
  const [manualForm, setManualForm] = useState(() => createInitialManual(employeeName));
  const [uploadForm, setUploadForm] = useState(() => createInitialUpload(employeeName));
  const [receiptFile, setReceiptFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const token = localStorage.getItem('accessToken') || '';

  const statusCounts = useMemo(() => {
    return {
      draft: rows.filter((item) => item.status === 'DRAFT').length,
      waiting: rows.filter((item) => item.status === 'WAITING_APPROVAL').length,
      approved: rows.filter((item) => item.status === 'APPROVED').length,
    };
  }, [rows]);

  const loadRows = useCallback(async (id) => {
    if (!id) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await apiFetch(`/employee/expenses?employeeId=${encodeURIComponent(id)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      setRows([]);
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (employeeId) {
      loadRows(employeeId);
    }
  }, [employeeId, loadRows]);

  const handleManualChange = (event) => {
    const { name, value } = event.target;
    setManualForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUploadChange = (event) => {
    const { name, value } = event.target;
    setUploadForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveManual = async (status) => {
    if (!employeeId) {
      setErrorMessage('Employee is not available in session. Please sign in again.');
      return;
    }

    try {
      setErrorMessage('');
      setSuccessMessage('');

      await apiFetch('/employee/expenses/manual', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...manualForm,
          amount: Number(manualForm.amount),
          status,
          employeeId,
          paidBy: manualForm.paidBy || employeeName,
        }),
      });

      setSuccessMessage(status === 'DRAFT' ? 'Expense saved as draft.' : 'Expense sent for approval.');
      setManualForm(createInitialManual(employeeName));
      loadRows(employeeId);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const saveUploadDraft = async () => {
    if (!employeeId) {
      setErrorMessage('Employee is not available in session. Please sign in again.');
      return;
    }

    if (!receiptFile) {
      setErrorMessage('Attach an image or PDF file.');
      return;
    }

    try {
      setErrorMessage('');
      setSuccessMessage('');

      const formData = new FormData();
      formData.append('receipt', receiptFile);
      formData.append('employeeId', employeeId);

      Object.entries(uploadForm).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      await apiFetch('/employee/expenses/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      setSuccessMessage('Receipt uploaded and amount extracted. Expense saved in draft.');
      setUploadForm(createInitialUpload(employeeName));
      setReceiptFile(null);
      loadRows(employeeId);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <main className="min-h-screen bg-background p-5 text-foreground sm:p-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Employee Dashboard</p>
          <h1 className="mt-1 text-2xl font-bold">Expense Draft and Submission</h1>
          <p className="mt-1 text-sm text-muted-foreground">Flow: Draft to Waiting Approval to Approved</p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="flex h-10 items-center rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">
              Employee ID: {employeeId || '-'}
            </div>
            <div className="flex h-10 items-center rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">
              Employee Name: {employeeName || '-'}
            </div>
            <button
              type="button"
              onClick={() => navigate('/signin')}
              className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold transition hover:bg-muted"
            >
              Back to Sign In
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded bg-muted px-2 py-1">Draft: {statusCounts.draft}</span>
            <span className="rounded bg-muted px-2 py-1">Waiting approval: {statusCounts.waiting}</span>
            <span className="rounded bg-muted px-2 py-1">Approved: {statusCounts.approved}</span>
          </div>
        </header>

        {successMessage ? <p className="rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-700">{successMessage}</p> : null}
        {errorMessage ? <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">{errorMessage}</p> : null}

        <section className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Upload Receipt (Image/PDF)</h2>
            <p className="mt-1 text-sm text-muted-foreground">OCR extracts total amount and saves as draft.</p>

            <div className="mt-4 grid gap-3">
              <input type="file" accept="image/*,.pdf" onChange={(event) => setReceiptFile(event.target.files?.[0] || null)} />
              <input className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="description" placeholder="Description" value={uploadForm.description} onChange={handleUploadChange} />
              <input className="h-10 rounded-md border border-input bg-background px-3 text-sm" type="date" name="expenseDate" value={uploadForm.expenseDate} onChange={handleUploadChange} />
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="category" value={uploadForm.category} onChange={handleUploadChange}>
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <input className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="paidBy" placeholder="Paid by" value={uploadForm.paidBy} onChange={handleUploadChange} />
              <input className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="remarks" placeholder="Remarks" value={uploadForm.remarks} onChange={handleUploadChange} />
              <input className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="submittedCurrency" placeholder="Currency" value={uploadForm.submittedCurrency} onChange={handleUploadChange} />

              <button
                type="button"
                onClick={saveUploadDraft}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Upload and Save Draft
              </button>
            </div>
          </article>

          <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Manual Entry</h2>
            <p className="mt-1 text-sm text-muted-foreground">Create expense manually and save as draft or submit.</p>

            <div className="mt-4 grid gap-3">
              <input className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="description" placeholder="Description" value={manualForm.description} onChange={handleManualChange} />
              <input className="h-10 rounded-md border border-input bg-background px-3 text-sm" type="date" name="expenseDate" value={manualForm.expenseDate} onChange={handleManualChange} />
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="category" value={manualForm.category} onChange={handleManualChange}>
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <input className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="paidBy" placeholder="Paid by" value={manualForm.paidBy} onChange={handleManualChange} />
              <input className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="remarks" placeholder="Remarks" value={manualForm.remarks} onChange={handleManualChange} />

              <div className="grid grid-cols-2 gap-2">
                <input className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="amount" placeholder="Amount" value={manualForm.amount} onChange={handleManualChange} />
                <input className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="submittedCurrency" placeholder="Currency" value={manualForm.submittedCurrency} onChange={handleManualChange} />
              </div>

              <textarea className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm" name="detailedNotes" placeholder="Description notes" value={manualForm.detailedNotes} onChange={handleManualChange} />

              <div className="flex gap-2">
                <button type="button" onClick={() => saveManual('DRAFT')} className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold transition hover:bg-muted">
                  Save Draft
                </button>
                <button type="button" onClick={() => saveManual('WAITING_APPROVAL')} className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                  Submit
                </button>
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Expenses Table</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-175 border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-2">Employee</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Paid By</th>
                  <th className="px-3 py-2">Remarks</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Approved Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id} className="border-b border-border/70">
                    <td className="px-3 py-2">{item.employee}</td>
                    <td className="px-3 py-2">{item.description}</td>
                    <td className="px-3 py-2">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="px-3 py-2">{item.category}</td>
                    <td className="px-3 py-2">{item.paidBy}</td>
                    <td className="px-3 py-2">{item.remarks}</td>
                    <td className="px-3 py-2">{item.amount} {item.currency}</td>
                    <td className="px-3 py-2">{item.status}</td>
                    <td className="px-3 py-2">{item.approvedAmount ?? '-'}</td>
                  </tr>
                ))}

                {!isLoading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">No expenses found.</td>
                  </tr>
                ) : null}

                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">Loading expenses...</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
};

export default EmployeeDashboardPage;
