import { getDb } from '@/lib/db';
import { errorResponse } from '@/lib/utils';
import { authUsers } from '@equipment/shared/db/auth-schema';
import { sql } from 'drizzle-orm';

function normalizeIdentifier(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isEmail(value: string): boolean {
  return value.includes('@');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = normalizeIdentifier(body?.identifier);
    const password =
      typeof body?.password === 'string' ? body.password : undefined;

    if (!identifier) {
      return errorResponse('账号不能为空', 400);
    }

    if (!password) {
      return errorResponse('密码不能为空', 400);
    }

    const normalizedIdentifier = identifier.toLowerCase();
    let loginEmail = normalizedIdentifier;

    if (!isEmail(identifier)) {
      const db = getDb();
      const row = await db
        .select({ email: authUsers.email })
        .from(authUsers)
        .where(sql`lower(${authUsers.username}) = ${normalizedIdentifier}`)
        .limit(1);

      if (!row.length || !row[0].email) {
        // 不暴露“用户名不存在”信息，统一返回认证失败
        return errorResponse('用户名或密码错误', 401);
      }

      loginEmail = row[0].email.toLowerCase();
    }

    // 由服务端转发登录，确保前端不直接调用 sign-in/email
    const origin =
      request.headers.get('origin') ||
      process.env.BETTER_AUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      new URL(request.url).origin;
    const upstream = await fetch(
      new URL('/api/auth/sign-in/email', request.url),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          origin,
          ...(request.headers.get('cookie')
            ? { cookie: request.headers.get('cookie') as string }
            : {}),
        },
        body: JSON.stringify({ email: loginEmail, password }),
      },
    );

    const text = await upstream.text();
    const setCookie = upstream.headers.get('set-cookie');

    if (upstream.ok) {
      // 成功时返回最小成功响应，cookie 透传给浏览器
      const headers = new Headers({
        'Content-Type': 'application/json',
      });
      if (setCookie) headers.set('set-cookie', setCookie);
      return new Response(
        JSON.stringify({ success: true, data: { email: loginEmail } }),
        { status: 200, headers },
      );
    }

    let message = '用户名或密码错误';
    try {
      const parsed = text ? JSON.parse(text) : null;
      message =
        parsed?.message ||
        parsed?.error?.message ||
        parsed?.error ||
        parsed?.msg ||
        message;
    } catch {
      message = text || message;
    }

    return errorResponse(message, upstream.status || 401);
  } catch (error) {
    const message = error instanceof Error ? error.message : '登录预处理失败';
    return errorResponse(message, 500);
  }
}
