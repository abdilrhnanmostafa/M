# إعداد البث المباشر LiveKit — الدوحة المحمدية

## طريقة التشغيل
- المدير فقط يبدأ التصوير من `admin.html`.
- المشاهدون يشاهدون من قسم البث داخل `index.html` بعد تسجيل الدخول.
- المشاهد يحصل على صلاحية مشاهدة فقط (`canPublish=false`) ولا يستطيع إرسال كاميرا أو ميكروفون.
- لا يتم حذف أي جدول أو بيانات موجودة. يستمر استخدام جدول `live_streams` الحالي، وتُحفظ سجلات البث فيه بعنوان `livekit://camera`.

## 1) إنشاء مشروع LiveKit
1. أنشئ مشروعاً في LiveKit Cloud من https://cloud.livekit.io/ .
2. انسخ عنوان الخادم (عادة يبدأ بـ `wss://`) وAPI Key وAPI Secret.
3. لا تضع API Secret داخل ملفات HTML أو JavaScript.

## 2) إعداد Supabase Edge Function
من مجلد المشروع نفّذ أو ارفع الدالة `functions/livekit-token` إلى مشروع Supabase الحالي. يمكن استخدام Supabase CLI: `supabase functions deploy livekit-token --project-ref pxgrawollyqwixgupnrx`.

أضف القيم التالية في Supabase → Edge Functions → Secrets (أو عبر CLI):
- `LIVEKIT_URL` = عنوان LiveKit الذي يبدأ بـ `wss://`
- `LIVEKIT_API_KEY` = API Key
- `LIVEKIT_API_SECRET` = API Secret
- `LIVEKIT_ADMIN_SECRET` = رمز سري قوي تختاره أنت، لا يقل عن 32 حرفاً.

مثال CLI (استبدل القيم بنفسك):
`supabase secrets set LIVEKIT_URL='wss://YOUR-PROJECT.livekit.cloud' LIVEKIT_API_KEY='YOUR_KEY' LIVEKIT_API_SECRET='YOUR_SECRET' LIVEKIT_ADMIN_SECRET='YOUR_LONG_RANDOM_ADMIN_SECRET' --project-ref pxgrawollyqwixgupnrx`

مهم: لا ترسل لي ولا تضع أسرار LiveKit داخل ملفات الموقع.

## 3) تشغيل البث من لوحة الإدارة
1. افتح `admin.html` عبر HTTPS.
2. أدخل مفتاح الإدارة الحالي كما كنت تفعل سابقاً.
3. في قسم التصوير المباشر، أدخل نفس قيمة `LIVEKIT_ADMIN_SECRET` في خانة «رمز تشغيل البث الآمن».
4. اختر الكاميرا والميكروفون ثم اضغط «بدء التصوير والبث للجميع».
5. أوقفه من زر إيقاف التصوير.

## 4) تشغيل المشاهدة
المستخدم يسجل الدخول، يفتح قسم «البث المباشر»، ويشاهد تلقائياً عند وجود بث نشط. لا توجد أزرار بث للمستخدم ولا يُطلب منه إذن كاميرا أو ميكروفون.

## ملاحظات مهمة قبل النشر
- يلزم HTTPS.
- يجب تفعيل سياسات قراءة `live_streams` للمستخدم المسجل كما هو الحال في إعدادك الحالي.
- الكود لا يغيّر الجداول الحالية ولا يمس الوظائف الأخرى.
- لوحة الإدارة الأصلية تستخدم مفتاح Supabase الإداري داخل المتصفح لإدارة وظائف أخرى؛ هذا تصميم قديم عالي الصلاحية ويجب لاحقاً نقله إلى Backend/Edge Functions. مفتاح LiveKit API Secret نفسه يبقى على الخادم فقط.
- لا أستطيع تأكيد البث الفعلي قبل إدخال بيانات مشروع LiveKit ونشر الدالة وتجربة المدير والمشاهد على جهازين وشبكتين مختلفتين.
