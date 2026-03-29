type EntityType = 'branch' | 'audit' | 'issue' | 'escalation' | 'stockRequest' | 'promoCheck';

interface ScopeUser {
  id: string;
  role: string;
  regionId?: string | null;
  areaId?: string | null;
  branchId?: string | null;
}

const GLOBAL_ROLES = ['HQ_DIRECTOR', 'FRANCHISE_MANAGER', 'EXECUTIVE_VIEWER'];

const NONE_FILTER = { id: '__NONE__' };

export function getDataScope(
  user: ScopeUser,
  entity: EntityType,
): Record<string, any> {
  // Global roles see everything (read-only enforced elsewhere for EXECUTIVE_VIEWER)
  if (GLOBAL_ROLES.includes(user.role)) {
    return {};
  }

  if (user.role === 'REGIONAL_MANAGER') {
    if (!user.regionId) return NONE_FILTER;
    if (entity === 'branch') {
      return { area: { regionId: user.regionId } };
    }
    if (entity === 'escalation') {
      return { issue: { branch: { area: { regionId: user.regionId } } } };
    }
    // audit, issue, stockRequest, promoCheck
    return { branch: { area: { regionId: user.regionId } } };
  }

  if (user.role === 'AREA_MANAGER') {
    if (!user.areaId) return NONE_FILTER;
    if (entity === 'branch') {
      return { areaId: user.areaId };
    }
    if (entity === 'escalation') {
      return { issue: { branch: { areaId: user.areaId } } };
    }
    // audit, issue, stockRequest, promoCheck
    return { branch: { areaId: user.areaId } };
  }

  if (user.role === 'BRANCH_MANAGER') {
    if (!user.branchId) return NONE_FILTER;
    if (entity === 'branch') {
      return { id: user.branchId };
    }
    if (entity === 'escalation') {
      return { issue: { branchId: user.branchId } };
    }
    // audit, issue, stockRequest, promoCheck
    return { branchId: user.branchId };
  }

  if (user.role === 'FIELD_AUDITOR') {
    if (entity === 'audit') {
      return { auditorId: user.id };
    }
    if (entity === 'issue') {
      return { audit: { auditorId: user.id } };
    }
    if (entity === 'branch') {
      return { audits: { some: { auditorId: user.id } } };
    }
    // escalation, stockRequest, promoCheck -- not generically scoped for auditor
    return {};
  }

  // Unknown role: return empty result
  return NONE_FILTER;
}
