// Backend uses these exact values
export type UserRole = "USER" | "STATE_ADMIN" | "SUPER_ADMIN"

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  role: UserRole
  stateCode?: string // Only for STATE_ADMIN
  isActive: boolean
  createdAt: string
  lastLogin?: string
  permissions?: Permission[]
}

export interface Permission {
  id: string
  name: string
  description: string
  resource: string
  action: string
}

export interface StateAdmin {
  id: string
  userId: string
  stateCode: string
  authorityName: string
  permissions: StateAdminPermission[]
  isActive: boolean
  createdBy: string // Super admin ID
  createdAt: string
  lastLogin?: string
}

export interface StateAdminPermission {
  id: string
  name: string
  description: string
  canView: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

export const DEFAULT_STATE_ADMIN_PERMISSIONS: StateAdminPermission[] = [
  {
    id: "bills",
    name: "Bill Management",
    description: "Manage waste bills for the state",
    canView: true,
    canCreate: true,
    canUpdate: true,
    canDelete: false,
  },
  {
    id: "payments",
    name: "Payment Management",
    description: "View and manage payments",
    canView: true,
    canCreate: false,
    canUpdate: true,
    canDelete: false,
  },
  {
    id: "users",
    name: "User Management",
    description: "Manage users in the state",
    canView: true,
    canCreate: false,
    canUpdate: true,
    canDelete: false,
  },
  {
    id: "reports",
    name: "Reports & Analytics",
    description: "Access state reports and analytics",
    canView: true,
    canCreate: true,
    canUpdate: false,
    canDelete: false,
  },
  {
    id: "settings",
    name: "State Settings",
    description: "Manage state-specific settings",
    canView: true,
    canCreate: false,
    canUpdate: true,
    canDelete: false,
  },
]
