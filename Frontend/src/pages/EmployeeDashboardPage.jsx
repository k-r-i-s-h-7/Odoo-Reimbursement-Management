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

const createInlineRow = (employeeName) => ({
  description: '',
  expenseDate: '',
  category: '',
  paidBy: employeeName || '',
  remarks: '',
  amount: '',
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
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('add-expense');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [inlineRow, setInlineRow] = useState(() => createInlineRow(employeeName));
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

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('employeeId');
    localStorage.removeItem('employeeName');
    localStorage.removeItem('role');
    navigate('/signin');
  };

  const handleManualChange = (event) => {
    const { name, value } = event.target;
    setManualForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUploadChange = (event) => {
    const { name, value } = event.target;
    setUploadForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleInlineChange = (event) => {
    const { name, value } = event.target;
    setInlineRow((prev) => ({ ...prev, [name]: value }));
  };

  const handleDropFile = (event) => {
    event.preventDefault();
    setIsDragOver(false);

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      setReceiptFile(file);
      setSuccessMessage(`Attached ${file.name}.`);
      setErrorMessage('');
    }
  };

  const validateInlineRow = () => {
    if (!inlineRow.description || !inlineRow.category || !inlineRow.amount || !inlineRow.submittedCurrency) {
      setErrorMessage('Quick row requires description, category, amount and currency.');
      return false;
    }

    const amountValue = Number(inlineRow.amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setErrorMessage('Amount must be a positive number.');
      return false;
    }

    return true;
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

  const saveInlineRow = async (status) => {
    if (!employeeId) {
      setErrorMessage('Employee is not available in session. Please sign in again.');
      return;
    }

    if (!validateInlineRow()) {
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
          ...inlineRow,
          amount: Number(inlineRow.amount),
          status,
          employeeId,
          paidBy: inlineRow.paidBy || employeeName,
        }),
      });

      setSuccessMessage(status === 'DRAFT' ? 'Quick row saved as draft.' : 'Quick row submitted for approval.');
      setInlineRow(createInlineRow(employeeName));
      loadRows(employeeId);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const loadExistingToInlineRow = (item) => {
    setInlineRow({
      description: item.description || '',
      expenseDate: item.date ? new Date(item.date).toISOString().slice(0, 10) : '',
      category: item.category || '',
      paidBy: item.paidBy || employeeName,
      remarks: item.remarks === '-' ? '' : (item.remarks || ''),
      amount: item.amount ?? '',
      submittedCurrency: item.currency || 'USD',
      detailedNotes: '',
    });
    setActiveTab('sheet');
    setSuccessMessage('Loaded row into editable quick entry. Save to create a new updated expense.');
    setErrorMessage('');
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
    <main className="min-h-screen bg-[linear-gradient(140deg,#f8fafc_0%,#eef3ff_48%,#f9f6f2_100%)] text-foreground">
      <div className="mx-auto flex max-w-[1500px] gap-4 p-3 sm:p-5">
        <aside className={`${isSidebarCollapsed ? 'w-[76px]' : 'w-[280px]'} sticky top-3 hidden h-[calc(100vh-1.5rem)] shrink-0 flex-col rounded-2xl border border-border/70 bg-card/90 p-4 shadow-lg backdrop-blur md:flex`}>
          <div className="flex items-center justify-between gap-2">
            {!isSidebarCollapsed ? <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Employee Space</h2> : null}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-lg hover:bg-muted"
            >
              {isSidebarCollapsed ? '>' : '<'}
            </button>
          </div>

          <div className="mt-5 rounded-xl border border-border/70 bg-background p-3">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {(employeeName || 'E').slice(0, 1).toUpperCase()}
            </div>
            {!isSidebarCollapsed ? (
              <>
                <p className="mt-2 text-center text-sm font-semibold">{employeeName || 'Employee'}</p>
                <p className="text-center text-xs text-muted-foreground">ID: {employeeId || '-'}</p>
              </>
            ) : null}
          </div>

          {!isSidebarCollapsed ? (
            <div className="mt-5 space-y-2 text-sm">
              <div className="rounded-lg border border-border/60 bg-muted/50 px-3 py-2">Draft: {statusCounts.draft}</div>
              <div className="rounded-lg border border-border/60 bg-muted/50 px-3 py-2">Waiting: {statusCounts.waiting}</div>
              <div className="rounded-lg border border-border/60 bg-muted/50 px-3 py-2">Approved: {statusCounts.approved}</div>
            </div>
          ) : null}

          <div className="mt-5 space-y-2">
            <button
              type="button"
              onClick={() => setActiveTab('add-expense')}
              className={`inline-flex h-10 w-full items-center justify-center rounded-lg border px-3 text-sm font-semibold transition ${activeTab === 'add-expense' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:bg-muted'}`}
            >
              {isSidebarCollapsed ? 'A' : 'Add Expense'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sheet')}
              className={`inline-flex h-10 w-full items-center justify-center rounded-lg border px-3 text-sm font-semibold transition ${activeTab === 'sheet' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:bg-muted'}`}
            >
              {isSidebarCollapsed ? 'S' : 'Expense Sheet'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-auto inline-flex h-10 items-center justify-center rounded-lg border border-destructive/40 bg-destructive/10 px-3 text-sm font-semibold text-destructive hover:bg-destructive/20"
          >
            {isSidebarCollapsed ? 'X' : 'Logout'}
          </button>
        </aside>

        <section className="flex-1 space-y-4">
          <header className="rounded-2xl border border-border/70 bg-card/90 p-5 shadow-md backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Employee Dashboard</p>
                <h1 className="mt-1 text-2xl font-bold">Create, Draft, and Submit Expenses</h1>
              </div>
              <div className="flex items-center gap-2 md:hidden">
                <button
                  type="button"
                  onClick={() => setActiveTab('add-expense')}
                  className={`inline-flex h-9 rounded-md border px-3 text-sm font-semibold ${activeTab === 'add-expense' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}`}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('sheet')}
                  className={`inline-flex h-9 rounded-md border px-3 text-sm font-semibold ${activeTab === 'sheet' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}`}
                >
                  Sheet
                </button>
              </div>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Upload a receipt fast or enter details directly in an editable grid.</p>

            {successMessage ? <p className="mt-3 rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-700">{successMessage}</p> : null}
            {errorMessage ? <p className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{errorMessage}</p> : null}
          </header>

          {activeTab === 'add-expense' ? (
            <section className="space-y-4">
              <article
                className={`rounded-2xl border-2 border-dashed p-6 transition ${isDragOver ? 'border-primary bg-primary/10' : 'border-border bg-card/90'} shadow-sm`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDropFile}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Upload Receipt</p>
                <h2 className="mt-1 text-xl font-semibold">Drag and drop receipt at the top</h2>
                <p className="mt-1 text-sm text-muted-foreground">Drop image or PDF here, or click to choose a file.</p>

                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                  Choose Receipt
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(event) => setReceiptFile(event.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                <p className="mt-2 text-sm text-muted-foreground">{receiptFile ? `Selected: ${receiptFile.name}` : 'No file selected'}</p>
              </article>

              <article className="rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">Receipt Details</h3>
                  <button
                    type="button"
                    onClick={saveUploadDraft}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    Upload and Save Draft
                  </button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
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
                </div>
              </article>
            </section>
          ) : null}

          {activeTab === 'sheet' ? (
            <section className="rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Expense Sheet (Excel Style Entry)</h2>
                  <p className="text-sm text-muted-foreground">Use the first editable row to add expense directly in table cells.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(true)}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-semibold hover:bg-muted"
                >
                  + New Expense
                </button>
              </div>

              <div className="mt-4 overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[1150px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/60 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Paid By</th>
                      <th className="px-3 py-2">Remarks</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Currency</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border bg-primary/5 align-top">
                      <td className="px-2 py-2">
                        <input name="description" value={inlineRow.description} onChange={handleInlineChange} className="h-9 w-full rounded border border-input bg-background px-2" placeholder="Expense description" />
                      </td>
                      <td className="px-2 py-2">
                        <input name="expenseDate" type="date" value={inlineRow.expenseDate} onChange={handleInlineChange} className="h-9 w-full rounded border border-input bg-background px-2" />
                      </td>
                      <td className="px-2 py-2">
                        <select name="category" value={inlineRow.category} onChange={handleInlineChange} className="h-9 w-full rounded border border-input bg-background px-2">
                          <option value="">Category</option>
                          {EXPENSE_CATEGORIES.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input name="paidBy" value={inlineRow.paidBy} onChange={handleInlineChange} className="h-9 w-full rounded border border-input bg-background px-2" placeholder="Paid by" />
                      </td>
                      <td className="px-2 py-2">
                        <input name="remarks" value={inlineRow.remarks} onChange={handleInlineChange} className="h-9 w-full rounded border border-input bg-background px-2" placeholder="Remarks" />
                      </td>
                      <td className="px-2 py-2">
                        <input name="amount" value={inlineRow.amount} onChange={handleInlineChange} className="h-9 w-full rounded border border-input bg-background px-2" placeholder="0.00" />
                      </td>
                      <td className="px-2 py-2">
                        <input name="submittedCurrency" value={inlineRow.submittedCurrency} onChange={handleInlineChange} className="h-9 w-full rounded border border-input bg-background px-2" placeholder="USD" />
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex rounded bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">New</span>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => saveInlineRow('DRAFT')} className="inline-flex h-9 items-center justify-center rounded border border-border px-3 text-xs font-semibold hover:bg-muted">Save</button>
                          <button type="button" onClick={() => saveInlineRow('WAITING_APPROVAL')} className="inline-flex h-9 items-center justify-center rounded bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90">Submit</button>
                        </div>
                      </td>
                    </tr>

                    {rows.map((item) => (
                      <tr key={item.id} className="border-b border-border/70">
                        <td className="px-3 py-2">{item.description}</td>
                        <td className="px-3 py-2">{item.date ? new Date(item.date).toLocaleDateString() : '-'}</td>
                        <td className="px-3 py-2">{item.category}</td>
                        <td className="px-3 py-2">{item.paidBy}</td>
                        <td className="px-3 py-2">{item.remarks}</td>
                        <td className="px-3 py-2">{item.amount}</td>
                        <td className="px-3 py-2">{item.currency}</td>
                        <td className="px-3 py-2">{item.status}</td>
                        <td className="px-3 py-2">
                          <button type="button" onClick={() => loadExistingToInlineRow(item)} className="rounded border border-border px-2 py-1 text-xs font-semibold hover:bg-muted">
                            Edit as New
                          </button>
                        </td>
                      </tr>
                    ))}

                    {!isLoading && rows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">No expenses found.</td>
                      </tr>
                    ) : null}

                    {isLoading ? (
                      <tr>
                        <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">Loading expenses...</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </section>
      </div>

      {isManualModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">New Manual Expense</h2>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-border hover:bg-muted"
              >
                x
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
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
              <input className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="amount" placeholder="Amount" value={manualForm.amount} onChange={handleManualChange} />
              <input className="h-10 rounded-md border border-input bg-background px-3 text-sm md:col-span-2" name="submittedCurrency" placeholder="Currency" value={manualForm.submittedCurrency} onChange={handleManualChange} />
              <textarea className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm md:col-span-2" name="detailedNotes" placeholder="Description notes" value={manualForm.detailedNotes} onChange={handleManualChange} />
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  saveManual('DRAFT');
                  setIsManualModalOpen(false);
                }}
                className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold hover:bg-muted"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => {
                  saveManual('WAITING_APPROVAL');
                  setIsManualModalOpen(false);
                }}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default EmployeeDashboardPage;
