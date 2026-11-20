import { createClient } from "npm:@supabase/supabase-js@2";
import { AccessToken } from "npm:livekit-server-sdk@2.20.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-livekit-admin-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LIVEKIT_URL = Deno.env.get("LIVEKIT_URL");
    const LIVEKIT_API_KEY = Deno.env.get("LIVEKIT_API_KEY");
    const LIVEKIT_API_SECRET = Deno.env.get("LIVEKIT_API_SECRET");
    const LIVEKIT_ADMIN_SECRET = Deno.env.get("LIVEKIT_ADMIN_SECRET");
    if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_ADMIN_SECRET) {
      return json({ error: "إعدادات LiveKit غير مكتملة في Supabase Secrets." }, 500);
    }

    const body = await req.json();
    const role = body?.role;
    const roomName = String(body?.roomName || "");
    const identity = String(body?.identity || "").slice(0, 100);
    if (!identity || !/^dawha-live-[a-zA-Z0-9_-]{1,80}$/.test(roomName)) {
      return json({ error: "بيانات غرفة البث غير صالحة." }, 400);
    }

    if (role === "host") {
      const supplied = req.headers.get("x-livekit-admin-secret") || "";
      if (!LIVEKIT_ADMIN_SECRET || supplied.length !== LIVEKIT_ADMIN_SECRET.length || supplied !== LIVEKIT_ADMIN_SECRET) {
        return json({ error: "غير مصرح للبدء بالبث. تحقق من رمز المدير." }, 403);
      }
    } else if (role === "viewer") {
      const authHeader = req.headers.get("Authorization") || "";
      const jwt = authHeader.replace(/^Bearer\s+/i, "");
      if (!jwt) return json({ error: "يجب تسجيل الدخول لمشاهدة البث." }, 401);
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await supabase.auth.getUser(jwt);
      if (error || !data.user) return json({ error: "جلسة المستخدم غير صالحة. سجّل الدخول مرة أخرى." }, 401);
    } else {
      return json({ error: "نوع صلاحية غير صالح." }, 400);
    }

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity,
      name: role === "host" ? "مدير البث" : "مشاهد",
      ttl: "1h",
    });
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: role === "host",
      canPublishData: false,
      canSubscribe: true,
    });
    const token = await at.toJwt();
    return json({ serverUrl: LIVEKIT_URL, token });
  } catch (error) {
    console.error("livekit-token error", error);
    return json({ error: "حدث خطأ أثناء تجهيز اتصال البث." }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
