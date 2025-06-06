/**
 * Role-Based Access Control (RBAC) System
 * Granular permissions for user access to specific modules, matters, and document types
 */

import { getSupabaseAdmin } from "@/lib/supabase/server"

export interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
  isSystemRole: boolean
  organizationId?: string
  createdAt: string
  updatedAt: string
}

export interface Permission {
  id: string
  resource: string // documents, matters, modules, etc.
  action: string // read, write, delete, admin
  conditions?: PermissionCondition[]
  scope: "global" | "organization" | "team" | "personal"
}

export interface PermissionCondition {
  field: string
  operator: "equals" | "not_equals" | "contains" | "in" | "not_in"
  value: any
}

export interface UserRole {
  userId: string
  roleId: string
  assignedBy: string
  assignedAt: string
  expiresAt?: string
  isActive: boolean
}

export interface AccessRequest {
  userId: string
  resource: string
  action: string
  context: Record<string, any>
}

export interface AccessResult {
  granted: boolean
  reason: string
  conditions?: string[]
  auditTrail: string
}

/**
 * RBAC System for granular access control
 */
export class RBACSystem {
  private supabase = getSupabaseAdmin()

  // System roles
  private systemRoles: Role[] = [
    {
      id: "super_admin",
      name: "Super Administrator",
      description: "Full system access",
      permissions: [
        {
          id: "super_admin_all",
          resource: "*",
          action: "*",
          scope: "global",
        },
      ],
      isSystemRole: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "firm_admin",
      name: "Firm Administrator",
      description: "Full access within organization",
      permissions: [
        {
          id: "firm_admin_all",
          resource: "*",
          action: "*",
          scope: "organization",
        },
      ],
      isSystemRole: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "senior_attorney",
      name: "Senior Attorney",
      description: "Full legal practice access",
      permissions: [
        {
          id: "senior_attorney_documents",
          resource: "documents",
          action: "*",
          scope: "organization",
        },
        {
          id: "senior_attorney_matters",
          resource: "matters",
          action: "*",
          scope: "organization",
        },
        {
          id: "senior_attorney_research",
          resource: "research",
          action: "*",
          scope: "organization",
        },
        {
          id: "senior_attorney_ai",
          resource: "ai_tools",
          action: "read,write",
          scope: "organization",
        },
      ],
      isSystemRole: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "attorney",
      name: "Attorney",
      description: "Standard legal practice access",
      permissions: [
        {
          id: "attorney_documents",
          resource: "documents",
          action: "read,write",
          scope: "team",
          conditions: [
            {
              field: "matter_id",
              operator: "in",
              value: "user_assigned_matters",
            },
          ],
        },
        {
          id: "attorney_research",
          resource: "research",
          action: "read,write",
          scope: "organization",
        },
        {
          id: "attorney_ai",
          resource: "ai_tools",
          action: "read,write",
          scope: "personal",
        },
      ],
      isSystemRole: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "paralegal",
      name: "Paralegal",
      description: "Limited legal support access",
      permissions: [
        {
          id: "paralegal_documents",
          resource: "documents",
          action: "read,write",
          scope: "team",
          conditions: [
            {
              field: "document_type",
              operator: "not_in",
              value: ["privileged", "confidential"],
            },
          ],
        },
        {
          id: "paralegal_research",
          resource: "research",
          action: "read",
          scope: "organization",
        },
      ],
      isSystemRole: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "client",
      name: "Client",
      description: "Client portal access",
      permissions: [
        {
          id: "client_documents",
          resource: "documents",
          action: "read",
          scope: "personal",
          conditions: [
            {
              field: "client_id",
              operator: "equals",
              value: "current_user_client_id",
            },
          ],
        },
        {
          id: "client_matters",
          resource: "matters",
          action: "read",
          scope: "personal",
          conditions: [
            {
              field: "client_id",
              operator: "equals",
              value: "current_user_client_id",
            },
          ],
        },
      ],
      isSystemRole: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  /**
   * Initialize RBAC system
   */
  async initialize(): Promise<void> {
    try {
      // Create system roles
      for (const role of this.systemRoles) {
        await this.supabase.from("roles").upsert(role)
      }

      console.log("RBAC system initialized successfully")
    } catch (error) {
      console.error("RBAC initialization failed:", error)
      throw error
    }
  }

  /**
   * Check if user has access to perform action on resource
   */
  async checkAccess(request: AccessRequest): Promise<AccessResult> {
    try {
      // Get user roles
      const userRoles = await this.getUserRoles(request.userId)

      if (userRoles.length === 0) {
        return {
          granted: false,
          reason: "No roles assigned to user",
          auditTrail: `Access denied for user ${request.userId} - no roles`,
        }
      }

      // Check each role for permissions
      for (const userRole of userRoles) {
        const role = await this.getRole(userRole.roleId)
        if (!role) continue

        const accessResult = await this.checkRolePermissions(role, request)
        if (accessResult.granted) {
          return accessResult
        }
      }

      return {
        granted: false,
        reason: "Insufficient permissions",
        auditTrail: `Access denied for user ${request.userId} - insufficient permissions`,
      }
    } catch (error) {
      console.error("Access check failed:", error)
      return {
        granted: false,
        reason: "Access check error",
        auditTrail: `Access check error for user ${request.userId}`,
      }
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(
    userId: string,
    roleId: string,
    assignedBy: string,
    expiresAt?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if assigner has permission to assign this role
      const canAssign = await this.checkAccess({
        userId: assignedBy,
        resource: "roles",
        action: "assign",
        context: { targetRoleId: roleId },
      })

      if (!canAssign.granted) {
        return {
          success: false,
          message: "Insufficient permissions to assign role",
        }
      }

      // Create role assignment
      const userRole: UserRole = {
        userId,
        roleId,
        assignedBy,
        assignedAt: new Date().toISOString(),
        expiresAt,
        isActive: true,
      }

      await this.supabase.from("user_roles").insert(userRole)

      return {
        success: true,
        message: "Role assigned successfully",
      }
    } catch (error) {
      console.error("Role assignment failed:", error)
      return {
        success: false,
        message: "Role assignment failed",
      }
    }
  }

  /**
   * Create custom role
   */
  async createRole(
    role: Omit<Role, "id" | "createdAt" | "updatedAt">,
    createdBy: string,
  ): Promise<{ success: boolean; roleId?: string; message: string }> {
    try {
      // Check if user can create roles
      const canCreate = await this.checkAccess({
        userId: createdBy,
        resource: "roles",
        action: "create",
        context: {},
      })

      if (!canCreate.granted) {
        return {
          success: false,
          message: "Insufficient permissions to create role",
        }
      }

      const newRole: Role = {
        ...role,
        id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await this.supabase.from("roles").insert(newRole)

      return {
        success: true,
        roleId: newRole.id,
        message: "Role created successfully",
      }
    } catch (error) {
      console.error("Role creation failed:", error)
      return {
        success: false,
        message: "Role creation failed",
      }
    }
  }

  /**
   * Get user's effective permissions
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      const userRoles = await this.getUserRoles(userId)
      const permissions: Permission[] = []

      for (const userRole of userRoles) {
        const role = await this.getRole(userRole.roleId)
        if (role) {
          permissions.push(...role.permissions)
        }
      }

      // Remove duplicates and merge permissions
      return this.mergePermissions(permissions)
    } catch (error) {
      console.error("Failed to get user permissions:", error)
      return []
    }
  }

  // Private helper methods
  private async getUserRoles(userId: string): Promise<UserRole[]> {
    const { data, error } = await this.supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)

    if (error) {
      console.error("Failed to get user roles:", error)
      return []
    }

    return data || []
  }

  private async getRole(roleId: string): Promise<Role | null> {
    const { data, error } = await this.supabase.from("roles").select("*").eq("id", roleId).single()

    if (error) {
      console.error("Failed to get role:", error)
      return null
    }

    return data
  }

  private async checkRolePermissions(role: Role, request: AccessRequest): Promise<AccessResult> {
    for (const permission of role.permissions) {
      if (this.matchesPermission(permission, request)) {
        const conditionResult = await this.checkConditions(permission.conditions || [], request)
        if (conditionResult.passed) {
          return {
            granted: true,
            reason: `Access granted via role: ${role.name}`,
            conditions: conditionResult.appliedConditions,
            auditTrail: `Access granted for user ${request.userId} via role ${role.name}`,
          }
        }
      }
    }

    return {
      granted: false,
      reason: `Role ${role.name} does not grant required permissions`,
      auditTrail: `Access denied for user ${request.userId} via role ${role.name}`,
    }
  }

  private matchesPermission(permission: Permission, request: AccessRequest): boolean {
    // Check resource match
    if (permission.resource !== "*" && permission.resource !== request.resource) {
      return false
    }

    // Check action match
    if (permission.action !== "*") {
      const allowedActions = permission.action.split(",").map((a) => a.trim())
      if (!allowedActions.includes(request.action)) {
        return false
      }
    }

    return true
  }

  private async checkConditions(
    conditions: PermissionCondition[],
    request: AccessRequest,
  ): Promise<{ passed: boolean; appliedConditions: string[] }> {
    const appliedConditions: string[] = []

    for (const condition of conditions) {
      const contextValue = request.context[condition.field]
      let passed = false

      switch (condition.operator) {
        case "equals":
          passed = contextValue === condition.value
          break
        case "not_equals":
          passed = contextValue !== condition.value
          break
        case "contains":
          passed = Array.isArray(contextValue) && contextValue.includes(condition.value)
          break
        case "in":
          passed = Array.isArray(condition.value) && condition.value.includes(contextValue)
          break
        case "not_in":
          passed = Array.isArray(condition.value) && !condition.value.includes(contextValue)
          break
      }

      if (!passed) {
        return { passed: false, appliedConditions }
      }

      appliedConditions.push(`${condition.field} ${condition.operator} ${condition.value}`)
    }

    return { passed: true, appliedConditions }
  }

  private mergePermissions(permissions: Permission[]): Permission[] {
    const merged = new Map<string, Permission>()

    for (const permission of permissions) {
      const key = `${permission.resource}:${permission.action}`
      const existing = merged.get(key)

      if (!existing || this.isMorePermissive(permission, existing)) {
        merged.set(key, permission)
      }
    }

    return Array.from(merged.values())
  }

  private isMorePermissive(perm1: Permission, perm2: Permission): boolean {
    // Simplified comparison - in practice, this would be more sophisticated
    if (perm1.scope === "global" && perm2.scope !== "global") return true
    if (perm1.scope === "organization" && perm2.scope === "team") return true
    if (perm1.scope === "organization" && perm2.scope === "personal") return true
    if (perm1.scope === "team" && perm2.scope === "personal") return true
    return false
  }
}

export const rbacSystem = new RBACSystem()
