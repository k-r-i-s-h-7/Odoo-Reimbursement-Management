# Conditional Approval Flow - Visual Guide

## 🎯 Three Approval Rule Types

```
┌─────────────────────────────────────────────────────────────────────┐
│                   CONDITIONAL APPROVAL FLOW                         │
│                                                                     │
│  Select one of these approval strategies:                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ○ PERCENTAGE RULE                                                 │
│    "Approve if X% of approvers agree"                              │
│                                                                     │
│    [Input: Percentage 1-100%]                                      │
│                                                                     │
│    Example: 60% threshold with 5 approvers = 3 must approve        │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ○ SPECIFIC APPROVER RULE                                          │
│    "Auto-approve if specific person (e.g., CFO) approves"         │
│                                                                     │
│    [Dropdown: Select Approver]                                     │
│                                                                     │
│    Example: CFO approval = instant expense approval               │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ○ HYBRID RULE                                                     │
│    "Combine both percentage and specific approver rules"           │
│                                                                     │
│    [Dropdown: OR | AND]                                            │
│    [Input: Percentage 1-100%]                                      │
│    [Dropdown: Select Approver]                                     │
│                                                                     │
│    Example OR:  60% approve OR CFO approves = APPROVED             │
│    Example AND: 60% approve AND CFO approves = APPROVED            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Use Case Comparisons

### Scenario: 4 Approvers (CFO, Audit Lead, Manager, Accountant)

#### PERCENTAGE RULE (60% threshold)
```
Approvals:
✓ CFO (25%)
✓ Audit Lead (25%)
✗ Manager
✗ Accountant

Status: WAITING... need 1 more = 50% (need 60%)

Then:
✓ Manager (50%)
Status: APPROVED ✓ (75% = exceeds 60%)
```

#### SPECIFIC APPROVER RULE (CFO is auto-approver)
```
Approvals:
✓ CFO
Status: INSTANTLY APPROVED ✓
(Other approvers irrelevant)

Alternative:
✗ CFO
✓ Audit Lead
✓ Manager
✓ Accountant
Status: WAITING (CFO hasn't approved yet)
```

#### HYBRID RULE - OR (60% OR CFO)
```
Path A:
✓ CFO
Status: INSTANTLY APPROVED ✓

Path B:
✓ Audit Lead (25%)
✓ Manager (25%)
✓ Accountant (25%)
Status: APPROVED ✓ (75% = exceeds 60%)

Either path = APPROVED
```

#### HYBRID RULE - AND (60% AND CFO)
```
Attempt 1:
✓ Audit Lead (25%)
✓ Manager (25%)
✓ Accountant (25%)
Status: REJECTED ✗ (75% but CFO hasn't approved)

Then:
✓ CFO
Status: APPROVED ✓ (75% AND CFO both satisfied)

Both conditions = APPROVED
```

---

## 🎨 Form Layout Visual

```
┌─ ADMIN DASHBOARD: APPROVALS ────────────────────────────────────┐
│                                                                 │
│  User: John Doe                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  LEFT COLUMN                    │  RIGHT COLUMN                │
│  ════════════════════════════════════════════════════════════  │
│                                 │                              │
│  [User Name: John Doe]          │  [Manager Selection]        │
│                                 │  [Dropdown] Add | Remove     │
│                                 │                              │
│  [Rule Title Input]             │  [Is Manager Approver?]     │
│  e.g., "Standard Expenses"      │  ☑ Yes / ☐ No              │
│                                 │                              │
│  ┌─ CONDITIONAL APPROVAL ───┐  │  [Add More Approvers]       │
│  │ FLOW (Radio Buttons)      │  │  [Dropdown] [Add Button]    │
│  │                           │  │                              │
│  │ ○ Percentage Rule         │  │  ┌─ APPROVERS LIST ──────┐ │
│  │ ○ Specific Approver       │  │  │ # Name    Required  Actn│ │
│  │ ○ Hybrid Rule             │  │  ├──────────────────────┤ │
│  │                           │  │  │ 1 Manager ☑      ✕   │ │
│  └───────────────────────────┘  │  │ 2 Finance ☐      ✕   │ │
│                                 │  │ 3 Audit   ☐      ✕   │ │
│  ┌─ CONFIGURATION ───────────┐  │  └──────────────────────┘ │
│  │ (based on selection)       │  │                              │
│  │                           │  │  [Sequence?]                │
│  │ Percentage Rule:          │  │  ☑ Enable Sequential       │
│  │ [60] % of approvers       │  │                              │
│  │                           │  │  [Minimum %]                │
│  │ OR                        │  │  [60] %                     │
│  │                           │  │                              │
│  │ Specific Approver:        │  │  [SAVE] [CANCEL]           │
│  │ [Select CFO]             │  │                              │
│  │                           │  │                              │
│  │ OR                        │  │                              │
│  │                           │  │                              │
│  │ Hybrid (Logic):           │  │                              │
│  │ ○ OR ○ AND                │  │                              │
│  │ [60]% [Select Approver]   │  │                              │
│  │                           │  │                              │
│  │ Preview: "Approve if:     │  │                              │
│  │  60% approve OR CFO       │  │                              │
│  │  approves"                │  │                              │
│  └───────────────────────────┘  │                              │
│                                 │                              │
└─────────────────────────────────┴──────────────────────────────┘
```

---

## 🔄 Approval Flow Decision Tree

```
                    EXPENSE SUBMITTED
                           │
                           ▼
                ┌───────────────────┐
                │ Fetch Approval    │
                │ Rule for Employee │
                └───────┬───────────┘
                        │
                        ▼
            ┌─────────────────────────┐
            │ What Rule Type?         │
            └─┬─────────────┬────────┬─┘
              │             │        │
              ▼             ▼        ▼
        ┌─────────┐  ┌──────────┐  ┌──────────┐
        │PERCENTAGE│  │ SPECIFIC │  │  HYBRID  │
        │  RULE    │  │APPROVER  │  │  RULE    │
        └────┬─────┘  └────┬─────┘  └────┬─────┘
             │             │             │
             ▼             ▼             ▼
        Count approved  Check if    Check logic:
        approvers       specific    AND / OR
             │          approver    /    \
             ▼          approved    ▼      ▼
        Compare %       │      Check    Check %
        to threshold    ▼      specific  & specific
             │      ┌────────┐ approver
             │      │YES/NO?│ approved
             ▼      └───┬───┘
        ┌────────┐      │
        │YES/NO?│      ▼
        └───┬───┘   ┌──────────┐
            │       │ YES      │
            │       │ APPROVED │
            │       └──────────┘
            │
        ┌───┴──┐
        │YES   │
        ▼      ▼
      ┌────┐ ┌─────────────┐
      │APPRO││ PENDING /   │
      │VED  ││ AWAITING    │
      └────┘ └─────────────┘
```

---

## 💡 Quick Reference

| Rule | When to Use | Approval Needed | Complexity |
|------|------------|-----------------|-----------|
| **Percentage** | Standard workflow | X% of all approvers | Low |
| **Specific Approver** | VIP override / Executive sign-off | Specific person only | Low |
| **Hybrid OR** | Flexible (any path works) | 60% OR CFO approves | Medium |
| **Hybrid AND** | Strict (all conditions needed) | 60% AND CFO approves | High |

---

## 🚀 Key Features

✅ **Easy Selection** - Radio buttons for clear rule type choice  
✅ **Conditional Display** - Only show relevant fields  
✅ **Color Coding** - Blue/Green/Purple for visual distinction  
✅ **Explanations** - Help text for each rule type  
✅ **Live Preview** - See exact approval logic (hybrid)  
✅ **Flexible Approvers** - Add/remove/reorder as needed  
✅ **Required Marking** - Flag critical approvers  
✅ **Sequential Option** - Sequential or parallel approval  

---

## 📱 Responsive Design

The form is fully responsive:
- **Desktop (1200px+):** 2-column layout (left config, right approvers)
- **Tablet (768px-1199px):** 2-column with adjusted widths
- **Mobile (<768px):** Single column, stacked vertically

---

## Status

✅ **Frontend Implementation:** COMPLETE  
✅ **UI/UX Design:** COMPLETE  
✅ **Form Validation:** Ready  
⏳ **Backend Integration:** Pending

The conditional approval flow is now ready for use in the Admin Dashboard! 🎉
