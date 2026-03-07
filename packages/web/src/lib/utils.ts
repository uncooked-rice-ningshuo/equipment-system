/**
 * 工具函数
 */

/**
 * 格式化错误响应
 */
export function errorResponse(message: string, status: number = 400) {
  return Response.json({ success: false, error: message }, { status });
}

/**
 * 格式化成功响应
 */
export function successResponse(data: any, status: number = 200) {
  return Response.json({ success: true, data }, { status });
}

/**
 * 验证用户是否已登录
 */
export async function requireAuth(request: Request) {
  const { getAuth } = await import('@/lib/auth');

  const session = await getAuth().api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}
