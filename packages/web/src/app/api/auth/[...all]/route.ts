/**
 * Better Auth API 路由
 * 处理所有认证相关的请求
 */

import { getAuth } from '@/lib/auth';

// 导出 GET 处理器
export const GET = (request: Request) => getAuth().handler(request);

// 导出 POST 处理器
export const POST = (request: Request) => getAuth().handler(request);
