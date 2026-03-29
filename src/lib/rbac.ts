type Action = 'read' | 'create' | 'update' | 'delete';

const PERMISSIONS: Record<string, Action[]> = {
  HQ_DIRECTOR: ['read', 'create', 'update', 'delete'],
  FRANCHISE_MANAGER: ['read', 'create', 'update', 'delete'],
  REGIONAL_MANAGER: ['read', 'create', 'update', 'delete'],
  AREA_MANAGER: ['read', 'create', 'update', 'delete'],
  BRANCH_MANAGER: ['read', 'create'],
  FIELD_AUDITOR: ['read', 'create'],
  EXECUTIVE_VIEWER: ['read'],
};

export function checkPermission(role: string, action: Action): boolean {
  return PERMISSIONS[role]?.includes(action) ?? false;
}

export function isReadOnly(role: string): boolean {
  return role === 'EXECUTIVE_VIEWER';
}
