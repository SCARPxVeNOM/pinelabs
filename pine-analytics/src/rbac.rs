//! Role-Based Access Control (RBAC) for Pine Analytics
//! 
//! Provides multi-tier permission system for enterprise deployments.

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

use crate::state::Owner;

/// User roles with different permission levels
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum Role {
    /// Full control over the system
    SuperAdmin,
    /// Can add/remove apps, configure system
    Admin,
    /// Can manage monitored applications
    Operator,
    /// Can submit events only
    DataIngester,
    /// Read-only access via service
    Viewer,
}

impl Default for Role {
    fn default() -> Self {
        Role::Viewer
    }
}

/// Granular permissions for operations
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum Permission {
    /// Add new monitored applications
    AddApplication,
    /// Remove monitored applications
    RemoveApplication,
    /// Capture and submit events
    CaptureEvents,
    /// Modify metric definitions
    ModifyMetrics,
    /// Configure system settings
    ConfigureSystem,
    /// View data (read-only)
    ViewData,
    /// Manage other users' roles
    ManageRoles,
    /// Pause/resume ingestion
    ControlIngestion,
}

/// RBAC state for managing roles and permissions
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RBACState {
    /// Role assignments: Owner -> Role
    pub roles: BTreeMap<Owner, Role>,
    /// Super admin (cannot be demoted)
    pub super_admin: Option<Owner>,
}

impl RBACState {
    /// Create new RBAC state with a super admin
    pub fn new(super_admin: Owner) -> Self {
        let mut roles = BTreeMap::new();
        roles.insert(super_admin.clone(), Role::SuperAdmin);
        Self {
            roles,
            super_admin: Some(super_admin),
        }
    }

    /// Get role for an owner
    pub fn get_role(&self, owner: &Owner) -> Role {
        self.roles.get(owner).cloned().unwrap_or(Role::Viewer)
    }

    /// Assign role to an owner
    pub fn assign_role(&mut self, owner: Owner, role: Role) -> Result<(), RBACError> {
        // Cannot change super admin's role
        if Some(&owner) == self.super_admin.as_ref() && role != Role::SuperAdmin {
            return Err(RBACError::CannotDemoteSuperAdmin);
        }
        self.roles.insert(owner, role);
        Ok(())
    }

    /// Remove role assignment (reverts to Viewer)
    pub fn remove_role(&mut self, owner: &Owner) -> Result<(), RBACError> {
        if Some(owner) == self.super_admin.as_ref() {
            return Err(RBACError::CannotDemoteSuperAdmin);
        }
        self.roles.remove(owner);
        Ok(())
    }

    /// Check if owner has a specific permission
    pub fn has_permission(&self, owner: &Owner, permission: &Permission) -> bool {
        let role = self.get_role(owner);
        Self::role_has_permission(&role, permission)
    }

    /// Check if a role grants a specific permission
    pub fn role_has_permission(role: &Role, permission: &Permission) -> bool {
        match role {
            Role::SuperAdmin => true, // SuperAdmin has all permissions
            Role::Admin => matches!(
                permission,
                Permission::AddApplication
                    | Permission::RemoveApplication
                    | Permission::CaptureEvents
                    | Permission::ModifyMetrics
                    | Permission::ViewData
                    | Permission::ManageRoles
                    | Permission::ControlIngestion
            ),
            Role::Operator => matches!(
                permission,
                Permission::AddApplication
                    | Permission::RemoveApplication
                    | Permission::CaptureEvents
                    | Permission::ViewData
            ),
            Role::DataIngester => matches!(permission, Permission::CaptureEvents | Permission::ViewData),
            Role::Viewer => matches!(permission, Permission::ViewData),
        }
    }

    /// Validate that caller can perform an action on target
    pub fn can_manage(&self, caller: &Owner, target: &Owner) -> bool {
        let caller_role = self.get_role(caller);
        let target_role = self.get_role(target);
        
        // SuperAdmin can manage anyone except themselves being demoted
        if caller_role == Role::SuperAdmin {
            return true;
        }
        
        // Admin can manage Operators and below
        if caller_role == Role::Admin {
            return matches!(target_role, Role::Operator | Role::DataIngester | Role::Viewer);
        }
        
        false
    }
}

/// RBAC-related errors
#[derive(Debug, Clone, Serialize, Deserialize, thiserror::Error)]
pub enum RBACError {
    #[error("Cannot demote the super admin")]
    CannotDemoteSuperAdmin,
    #[error("Insufficient permissions for this operation")]
    InsufficientPermissions,
    #[error("Cannot manage users with equal or higher role")]
    CannotManageHigherRole,
}

#[cfg(test)]
mod tests {
    use super::*;
    use linera_sdk::linera_base_types::AccountOwner;

    fn test_owner(id: u8) -> Owner {
        AccountOwner::Address20([id; 20])
    }

    #[test]
    fn test_super_admin_has_all_permissions() {
        let admin = test_owner(1);
        let state = RBACState::new(admin.clone());
        
        assert!(state.has_permission(&admin, &Permission::AddApplication));
        assert!(state.has_permission(&admin, &Permission::ManageRoles));
        assert!(state.has_permission(&admin, &Permission::ConfigureSystem));
    }

    #[test]
    fn test_viewer_only_has_view_permission() {
        let admin = test_owner(1);
        let viewer = test_owner(2);
        let state = RBACState::new(admin);
        
        assert!(state.has_permission(&viewer, &Permission::ViewData));
        assert!(!state.has_permission(&viewer, &Permission::AddApplication));
        assert!(!state.has_permission(&viewer, &Permission::CaptureEvents));
    }

    #[test]
    fn test_cannot_demote_super_admin() {
        let admin = test_owner(1);
        let mut state = RBACState::new(admin.clone());
        
        let result = state.assign_role(admin, Role::Viewer);
        assert!(matches!(result, Err(RBACError::CannotDemoteSuperAdmin)));
    }
}
