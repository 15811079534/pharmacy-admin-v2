const FULL_WILDCARD = '*:*:*'

const matchPermission = (owned: string, required: string) => {
  if (!owned) return false
  if (owned === FULL_WILDCARD || owned === '*') return true
  if (owned === required) return true

  const ownedParts = owned.split(':')
  const requiredParts = required.split(':')
  if (ownedParts.length !== requiredParts.length) {
    return false
  }
  return ownedParts.every((part, index) => part === '*' || part === requiredParts[index])
}

export const hasPermission = (permissions: string[] | undefined, required?: string) => {
  if (!required) return true
  if (!permissions || permissions.length === 0) {
    // 权限列表不可用时放行，避免因为权限信息获取失败导致页面全部不可见
    return true
  }
  return permissions.some((permission) => matchPermission(permission, required))
}

export const hasAnyPermission = (permissions: string[] | undefined, requiredList: string[]) => {
  if (!requiredList.length) return true
  return requiredList.some((permission) => hasPermission(permissions, permission))
}
