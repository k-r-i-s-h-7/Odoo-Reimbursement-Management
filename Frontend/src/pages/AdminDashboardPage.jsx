import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const initialCreateForm = {
  userType: 'EMPLOYEE',
  name: '',
  email: '',
  managerId: '',
}

const createId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)

// Helper to get Auth Headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

const UserPlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M19 8v6" />
    <path d="M16 11h6" />
  </svg>
)

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
)

const ApprovalsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
)

const createDefaultApprovalConfig = (user) => ({
  ruleType: 'percentage', // percentage | specific-approver | hybrid
  approvalManagerId: user?.role === 'EMPLOYEE' ? user?.managerId ?? '' : '',
  isManagerApprover: user?.role === 'EMPLOYEE' ? Boolean(user?.managerId) : false,
  approversSequence: false,
  minimumApprovalPercentage: '50',
  requiredApproverIds: user?.role === 'EMPLOYEE' && user?.managerId ? [user.managerId] : [],
  approverIds: user?.role === 'EMPLOYEE' && user?.managerId ? [user.managerId] : [],
  isSelfApprover: user?.role === 'MANAGER',
  specificApproverId: '', // for specific-approver rule
  hybridPercentage: '60', // for hybrid rule
})

const AdminDashboardPage = () => {
  const navigate = useNavigate()

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('create-users-managers')
  const [showCompanyCard, setShowCompanyCard] = useState(false)
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [approvalsByUser, setApprovalsByUser] = useState({})
  const [approverToAddId, setApproverToAddId] = useState('')
  const [sendingPasswordFor, setSendingPasswordFor] = useState(null)

  const [company, setCompany] = useState({
    name: localStorage.getItem('companyName') || '',
    email: '',
    country: '',
    baseCurrency: '',
  })

  const [users, setUsers] = useState([])
  const [createForm, setCreateForm] = useState(initialCreateForm)

  useEffect(() => {
    let isMounted = true

    const loadCompany = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/company-profile', {
          headers: getAuthHeaders(),
        })
        if (!response.ok) {
          if (response.status === 401) navigate('/signin')
          return
        }

        const data = await response.json()
        if (!isMounted) return

        setCompany({
          name: data?.name ?? localStorage.getItem('companyName') ?? '',
          email: data?.email ?? data?.adminEmail ?? '',
          country: data?.country ?? '',
          baseCurrency: data?.baseCurrency ?? '',
        })
        
        if (data?.name) {
          localStorage.setItem('companyName', data.name)
        }
      } catch (err) {
        console.error("Failed to load company:", err)
      }
    }

    const loadUsers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/users', {
          headers: getAuthHeaders(),
        })
        if (!response.ok) return

        const data = await response.json()
        if (!isMounted || !Array.isArray(data)) return

        setUsers(
          data.map((user) => ({
            id: user?.id ?? createId(),
            name: user?.name ?? '',
            email: user?.email ?? '',
            role: user?.role ?? 'EMPLOYEE',
            managerId: user?.managerId ?? null,
          })),
        )
      } catch (err) {
        console.error("Failed to load users:", err)
      }
    }

    loadCompany()
    loadUsers()

    return () => {
      isMounted = false
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.clear()
    navigate('/signin')
  }

  // Memoized logic
  const managers = useMemo(() => users.filter((user) => user.role === 'MANAGER'), [users])

  const usersWithManagerName = useMemo(
    () =>
      users.map((user) => ({
        ...user,
        managerName: users.find((candidate) => candidate.id === user.managerId)?.name ?? '-',
      })),
    [users],
  )

  const selectedUser = useMemo(() => users.find((user) => user.id === selectedUserId) ?? null, [users, selectedUserId])

  const approvalConfig = useMemo(() => {
    if (!selectedUserId || !selectedUser) return null
    return approvalsByUser[selectedUserId] ?? createDefaultApprovalConfig(selectedUser)
  }, [approvalsByUser, selectedUser, selectedUserId])

  const approvalCandidates = useMemo(() => {
    if (!selectedUserId) return []
    return users.filter((candidate) => candidate.id !== selectedUserId)
  }, [users, selectedUserId])

  const approverUsers = useMemo(() => {
    if (!approvalConfig) return []

    return (approvalConfig.approverIds ?? [])
      .map((approverId) => users.find((candidate) => candidate.id === approverId))
      .filter(Boolean)
  }, [approvalConfig, users])

  const availableApprovers = useMemo(() => {
    if (!approvalConfig) return []
    const current = new Set(approvalConfig.approverIds ?? [])
    return approvalCandidates.filter((candidate) => !current.has(candidate.id))
  }, [approvalCandidates, approvalConfig])

  const navItems = [
    { key: 'create-users-managers', label: 'Create Employees & Managers', icon: <UserPlusIcon /> },
    { key: 'approvals', label: 'Approvals', icon: <ApprovalsIcon />, disabled: !selectedUserId },
  ]

  const inputClass =
    'h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring/70'
  const panelClass = 'rounded-xl border border-border bg-card p-5 shadow-sm'

  // Form Handlers
  const handleCreateUser = async (event) => {
    event.preventDefault()
    setSubmitMessage('')

    if (!createForm.name.trim() || !createForm.email.trim()) {
      setSubmitMessage('Name and email are required.')
      return
    }

    const nextUserRole = createForm.userType === 'MANAGER' ? 'MANAGER' : 'EMPLOYEE'
    const payload = {
      name: createForm.name.trim(),
      email: createForm.email.trim().toLowerCase(),
      role: nextUserRole,
      managerId: nextUserRole === 'EMPLOYEE' ? createForm.managerId || null : null,
      sendResetPasswordLink: true,
    }

    try {
      const response = await fetch('http://localhost:5000/api/admin/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const created = await response.json()
        setUsers((prev) => [
          {
            id: created?.id ?? createId(),
            name: created?.name ?? payload.name,
            email: created?.email ?? payload.email,
            role: created?.role ?? payload.role,
            managerId: created?.managerId ?? payload.managerId,
          },
          ...prev,
        ])
        setCreateForm(initialCreateForm)
        setShowCreateDrawer(false)
        setSubmitMessage('User created and reset password link sent.')
        return
      }
    } catch (err) {
        console.error("Create user failed:", err)
    }

    // Local-only Fallback
    setUsers((prev) => [
      {
        id: createId(),
        name: payload.name,
        email: payload.email,
        role: payload.role,
        managerId: payload.managerId,
      },
      ...prev,
    ])
    setCreateForm(initialCreateForm)
    setShowCreateDrawer(false)
    setSubmitMessage('User created in local mode (API unreachable).')
  }

  const handleSendPassword = async (user, event) => {
    event.stopPropagation()
    setSendingPasswordFor(user.id)
    setSubmitMessage('')

    try {
      const response = await fetch('http://localhost:5000/api/auth/send-password', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitMessage(`✓ Temporary password sent to ${user.email}`)
      } else {
        setSubmitMessage(`✗ Failed to send password: ${data.error || data.message || 'Unknown error'}`)
      }
    } catch {
      setSubmitMessage('✗ Network error while sending password. Please try again.')
    } finally {
      setSendingPasswordFor(null)
    }
  }

  const openApprovalsForUser = (user) => {
    setSelectedUserId(user.id)
    setApprovalsByUser((prev) => ({
      ...prev,
      [user.id]: prev[user.id] ?? createDefaultApprovalConfig(user),
    }))
    setActiveTab('approvals')
  }

  const updateApprovalConfig = (patch) => {
    if (!selectedUserId || !selectedUser) return
    setApprovalsByUser((prev) => {
      const previous = prev[selectedUserId] ?? createDefaultApprovalConfig(selectedUser)
      const next = typeof patch === 'function' ? patch(previous) : { ...previous, ...patch }
      const uniqueApproverIds = [...new Set(next.approverIds ?? [])]
      const normalizedRequired = (next.requiredApproverIds ?? []).filter((id) => uniqueApproverIds.includes(id))
      return {
        ...prev,
        [selectedUserId]: {
          ...next,
          approverIds: uniqueApproverIds,
          requiredApproverIds: normalizedRequired,
        },
      }
    })
  }

  const toggleRequiredApprover = (approverId) => {
    if (!approvalConfig) return
    const exists = approvalConfig.requiredApproverIds.includes(approverId)
    const next = exists
      ? approvalConfig.requiredApproverIds.filter((id) => id !== approverId)
      : [...approvalConfig.requiredApproverIds, approverId]
    updateApprovalConfig({ requiredApproverIds: next })
  }

  const addApprover = (approverId) => {
    if (!approverId) return
    updateApprovalConfig((current) => {
      if ((current.approverIds ?? []).includes(approverId)) return current
      return {
        ...current,
        approverIds: [...(current.approverIds ?? []), approverId],
      }
    })
  }

  const removeApprover = (approverId) => {
    updateApprovalConfig((current) => ({
      ...current,
      approverIds: (current.approverIds ?? []).filter((id) => id !== approverId),
      requiredApproverIds: (current.requiredApproverIds ?? []).filter((id) => id !== approverId),
    }))
  }

  const moveApprover = (approverId, direction) => {
    updateApprovalConfig((current) => {
      const ids = [...(current.approverIds ?? [])]
      const index = ids.findIndex((id) => id === approverId)
      if (index === -1) return current

      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= ids.length) return current

      ;[ids[index], ids[target]] = [ids[target], ids[index]]
      return {
        ...current,
        approverIds: ids,
      }
    })
  }

  return (
    <main className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`relative flex h-full flex-col border-r border-border bg-card transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-80'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <button
            type="button"
            onClick={() => setShowCompanyCard((prev) => !prev)}
            className="min-w-0 overflow-hidden text-left"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Portal</p>
            <h1 className={`truncate text-sm font-bold ${isCollapsed ? 'hidden' : 'block'}`}>
              {company.name || 'Loading company...'}
            </h1>
            <p className={`truncate text-xs text-muted-foreground ${isCollapsed ? 'hidden' : 'block'}`}>
              {company.email || 'Admin Portal'}
            </p>
          </button>

          {showCompanyCard && !isCollapsed && (
            <div className="absolute left-4 top-20 z-20 w-64 rounded-lg border border-border bg-popover p-3 shadow-lg">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Company Details</p>
              <p className="mt-2 text-sm font-semibold">{company.name || 'Not set'}</p>
              <p className="text-sm text-muted-foreground">{company.email || '-'}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-muted/50 px-2 py-1">
                  <p className="text-muted-foreground">Country</p>
                  <p className="font-medium text-foreground">{company.country || '-'}</p>
                </div>
                <div className="rounded-md bg-muted/50 px-2 py-1">
                  <p className="text-muted-foreground">Currency</p>
                  <p className="font-medium text-foreground">{company.baseCurrency || '-'}</p>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted"
          >
            {isCollapsed ? '>' : '<'}
          </button>
        </div>

        <div className="space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => !item.disabled && setActiveTab(item.key)}
              disabled={item.disabled}
              className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm font-medium transition hover:cursor-pointer ${
                activeTab === item.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              } ${item.disabled ? 'cursor-not-allowed opacity-45' : ''}`}
            >
              <span className={isCollapsed ? 'mx-auto block' : 'mr-2'}>{item.icon}</span>
              <span className={isCollapsed ? 'hidden' : 'block'}>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto border-t border-border px-3 py-4">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-red-600 px-3 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            <span className={isCollapsed ? 'mx-auto block' : 'mr-2 block'}>
              <LogoutIcon />
            </span>
            <span className={isCollapsed ? 'hidden' : 'block'}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <section className="h-full flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
        <header className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">{company.name}</p>
            <h2 className="mt-1 text-2xl font-bold">
              {activeTab === 'approvals' ? 'Approvals' : 'Create Users and Managers'}
            </h2>
            {activeTab === 'approvals' && selectedUser && (
              <p className="mt-1 text-sm text-muted-foreground">User: {selectedUser.name}</p>
            )}
          </div>
          {activeTab === 'create-users-managers' && (
            <button
              type="button"
              onClick={() => setShowCreateDrawer((prev) => !prev)}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              New +
            </button>
          )}
        </header>

        {activeTab === 'create-users-managers' ? (
          <section className={panelClass}>
            <h3 className="mb-4 text-lg font-semibold">Manage Staff</h3>

            {showCreateDrawer && (
              <form onSubmit={handleCreateUser} className="mb-5 grid gap-3 rounded-lg border border-border bg-muted/30 p-4 lg:grid-cols-2">
                <select
                  className={inputClass}
                  value={createForm.userType}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, userType: e.target.value, managerId: e.target.value === 'MANAGER' ? '' : prev.managerId }))}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                </select>
                <input
                  className={inputClass}
                  placeholder="Full Name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                />
                <input
                  className={inputClass}
                  placeholder="Work Email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                />
                <select
                  className={inputClass}
                  value={createForm.managerId}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, managerId: e.target.value }))}
                  disabled={createForm.userType === 'MANAGER'}
                >
                  <option value="">Assign Manager</option>
                  {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <div className="flex items-center gap-2 lg:col-span-2">
                  <button type="submit" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
                    Create User
                  </button>
                  <button type="button" onClick={() => setShowCreateDrawer(false)} className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {submitMessage && <p className="mb-4 rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{submitMessage}</p>}

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-175 border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Manager</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersWithManagerName.map((user) => (
                    <tr
                      key={user.id}
                      className="cursor-pointer border-b border-border/70 transition hover:bg-muted/40"
                      onClick={() => openApprovalsForUser(user)}
                    >
                      <td className="px-3 py-2 font-medium text-primary">{user.name}</td>
                      <td className="px-3 py-2">{user.role}</td>
                      <td className="px-3 py-2">{user.managerName}</td>
                      <td className="px-3 py-2">{user.email}</td>
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          id={`send-password-${user.id}`}
                          disabled={sendingPasswordFor === user.id}
                          onClick={(e) => handleSendPassword(user, e)}
                          className="inline-flex h-8 items-center justify-center rounded-md border border-primary px-3 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {sendingPasswordFor === user.id ? (
                            <span className="flex items-center gap-1.5">
                              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                              </svg>
                              Sending…
                            </span>
                          ) : (
                            'Send Password'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          /* Approvals Tab Section */
          <section className={`${panelClass} space-y-6`}>
            {!selectedUser || !approvalConfig ? (
              <p className="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                Select a user to configure approval rules.
              </p>
            ) : (
              <>
                {selectedUser.role === 'MANAGER' ? (
                  <div className="max-w-xl space-y-4">
                    <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Manager Approval Permission</label>
                    <div className="flex items-center justify-between rounded-md border border-border px-3 py-3">
                      <p className="text-sm font-medium">Allow {selectedUser.name} to approve expenses?</p>
                      <input
                        type="checkbox"
                        className="h-5 w-5"
                        checked={approvalConfig.isSelfApprover}
                        onChange={(e) => updateApprovalConfig({ isSelfApprover: e.target.checked })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-5 lg:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground">User</label>
                        <input className={`${inputClass} mt-1`} value={selectedUser.name} readOnly />
                      </div>

                      <div>
                        <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Approval Rule</label>
                        <input
                          className={`${inputClass} mt-1`}
                          placeholder="Approval rule for miscellaneous expenses"
                          value={approvalConfig.ruleTitle}
                          onChange={(event) => updateApprovalConfig({ ruleTitle: event.target.value })}
                        />
                      </div>

                      <div>
                        <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Direct Manager</label>
                        <div className="mt-1 flex gap-2">
                          <select
                            className={inputClass}
                            value={approvalConfig.approvalManagerId ?? ''}
                            onChange={(e) => updateApprovalConfig({ approvalManagerId: e.target.value })}
                          >
                            <option value="">Select manager</option>
                            {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-lg border border-border p-3">
                        <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Add Additional Approver</label>
                        <div className="mt-2 flex gap-2">
                          <select className={inputClass} value={approverToAddId} onChange={(e) => setApproverToAddId(e.target.value)}>
                            <option value="">Select user</option>
                            {availableApprovers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <button onClick={() => { addApprover(approverToAddId); setApproverToAddId(''); }} className="bg-primary text-primary-foreground px-3 rounded-md text-sm font-semibold">Add</button>
                        </div>
                      </div>

                      <div className="rounded-lg border border-border divide-y divide-border">
                        {approverUsers.map((c, index) => (
                          <div key={c.id} className="flex items-center justify-between px-3 py-2 text-sm">
                            <span>{index + 1}. {c.name}</span>
                            <div className="flex items-center gap-2">
                              <label className="text-xs">Required</label>
                              <input type="checkbox" checked={approvalConfig.requiredApproverIds.includes(c.id)} onChange={() => toggleRequiredApprover(c.id)} />
                              <button onClick={() => removeApprover(c.id)} className="text-red-500 text-xs ml-2">Remove</button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Save Button and Message */}
                      <div className="col-span-1 flex flex-col gap-3 lg:col-span-2">
                        {approvalSaveMessage ? (
                          <p className={`rounded-md px-3 py-2 text-sm ${
                            approvalSaveMessage.startsWith('✓')
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {approvalSaveMessage}
                          </p>
                        ) : null}
                        <button
                          type="button"
                          onClick={handleSaveApprovalRule}
                          disabled={isSavingApprovals}
                          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSavingApprovals ? 'Saving...' : 'Save Approval Rule'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </section>
    </main>
  )
}

export default AdminDashboardPage