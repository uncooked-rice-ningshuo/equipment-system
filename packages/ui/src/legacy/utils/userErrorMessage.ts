const APPROVED_BUSINESS_MESSAGES = [
  '用户名或密码错误',
  '会话已过期，请重新登录',
  '会话已过期',
  '原密码错误',
  '缺少必填字段：设备类型名称',
  '创建设备类型失败',
  '创建设备失败',
  '设备不存在',
  '设备已借出，无法删除',
  '该设备当前不可借，请选择其他设备',
  '创建借出记录失败',
  '借出记录不存在',
] as const;

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return '';
}

/**
 * Converts an unknown failure into a controlled user-facing message.
 * Raw errors stay in developer logs; only explicitly approved business
 * messages may cross the UI boundary.
 */
export function getUserErrorMessage(error: unknown, fallback: string): string {
  console.error(`[UI Error] ${fallback}`, error);

  const rawMessage = readErrorMessage(error);
  return (
    APPROVED_BUSINESS_MESSAGES.find((message) =>
      rawMessage.includes(message),
    ) ?? fallback
  );
}
