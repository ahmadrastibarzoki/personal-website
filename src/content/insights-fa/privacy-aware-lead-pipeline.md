---
title: "ساخت یک پایپ‌لاین دریافت Lead با Astro، Cloudflare Workers و GitHub با رویکرد حفظ حریم خصوصی"
description: "تجربه طراحی یک پایپ‌لاین کوچک برای فرم همکاری سایت با Astro، Cloudflare Workers، ذخیره‌سازی خصوصی در GitHub، ساخت خودکار CSV، اعلان ایمیلی و تحلیل مبتنی بر رضایت کاربر."
summary: "فرم تماس زمانی ارزشمندتر می‌شود که مسیر داده بعد از Submit روشن باشد. در این پیاده‌سازی، درخواست در Worker اعتبارسنجی می‌شود، هر Lead به‌صورت JSON در مخزن خصوصی ذخیره می‌شود، CSV به‌طور خودکار ساخته می‌شود، اعلان ایمیلی بعد از ذخیره موفق ارسال می‌شود و Analytics فقط پس از رضایت کاربر فعال است."
category: "مهندسی کاربردی"
datePublished: 2026-09-29
dateModified: 2026-09-29
keywords:
  - "Cloudflare Workers"
  - "Astro"
  - "پایپ‌لاین Lead"
  - "GitHub API"
  - "Serverless"
  - "حریم خصوصی"
  - "GA4 Consent"
image: "/images/lead-pipeline-architecture.png"
imageAlt: "معماری فرم همکاری مبتنی بر Astro، Cloudflare Workers، ذخیره‌سازی خصوصی GitHub، اعلان ایمیلی و Analytics مبتنی بر رضایت"
draft: false
sources:
  - title: "GitHub REST API — Repository contents"
    url: "https://docs.github.com/en/rest/repos/contents"
  - title: "Google — Set up consent mode on websites"
    url: "https://developers.google.com/tag-platform/security/guides/consent"
  - title: "Cloudflare Email Service — Configure send bindings"
    url: "https://developers.cloudflare.com/email-service/configuration/send-bindings/"
---

یک فرم تماس در ظاهر قابلیت کوچکی است؛ تا وقتی که این سؤال را مطرح کنیم: **بعد از زدن دکمه ارسال دقیقاً چه اتفاقی باید بیفتد؟**

برای وب‌سایت شخصی‌ام نمی‌خواستم اطلاعات فرم صرفاً وارد یک Inbox شوند و ساختار مشخصی نداشته باشند. هدفم یک جریان کوچک و قابل‌فهم بود که درخواست را دریافت و اعتبارسنجی کند، یک نسخه خصوصی از آن نگه دارد، سریع به من اطلاع دهد و در عین حال امکان تحلیل بعدی را هم فراهم کند.

این سیستم عمداً ساده نگه داشته شده است. CRM نیست و قرار هم نیست نقش CRM را بازی کند. برای حجم پایین یک وب‌سایت حرفه‌ای طراحی شده؛ جایی که شفاف‌بودن مسیر داده برای من مهم‌تر از پیچیده‌کردن معماری بود.

![معماری پایپ‌لاین دریافت Lead](/images/lead-pipeline-architecture.png)

## جریان کلی سیستم

مسیر فعلی به این شکل است:

1. کاربر فرم دو‌زبانه ساخته‌شده با Astro را ارسال می‌کند.
2. Frontend داده را به‌صورت JSON برای یک Cloudflare Worker می‌فرستد.
3. Worker مبدا درخواست، ساختار Payload، فیلدهای ضروری و Honeypot را بررسی می‌کند.
4. درخواست معتبر به‌صورت یک فایل JSON در یک **مخزن خصوصی GitHub** ذخیره می‌شود.
5. یک GitHub Actions workflow فایل تجمیعی `leads.csv` را بازسازی می‌کند.
6. بعد از موفقیت ذخیره‌سازی، Worker تلاش می‌کند یک اعلان ایمیلی برای من بفرستد.
7. اگر کاربر قبلاً Analytics را پذیرفته باشد، Frontend رویداد `lead_form_submit` را هم برای GA4 ارسال می‌کند.

یک تصمیم ساده اما مهم در این معماری ترتیب مراحل است: **اول ذخیره، بعد اعلان**. شکست ایمیل نباید باعث شود Leadی که با موفقیت ثبت شده از دست برود.

## چرا بین فرم و Storage از Worker استفاده کردم؟

نمی‌خواستم مرورگر کاربر چیزی درباره Credentialهای ذخیره‌سازی بداند. Frontend فقط Endpoint عمومی Worker را می‌شناسد و Token مربوط به GitHub داخل محیط Worker باقی می‌ماند.

Worker در عین حال یک مرز مشخص برای Validation ایجاد می‌کند. Methodهای غیرمجاز را رد می‌کند، Origin را بررسی می‌کند، JSON بودن درخواست و اندازه Payload را کنترل می‌کند و قبل از ذخیره، داده‌ها را اعتبارسنجی و محدود می‌کند.

کد عمومی این بخش در مخزن سایت و فایل [`infrastructure/lead-worker/worker.js`](https://github.com/ahmadrastibarzoki/personal-website/blob/main/infrastructure/lead-worker/worker.js) قابل مشاهده است.

این موارد Endpoint را به‌صورت جادویی «امن» نمی‌کنند؛ مزیت اصلی این است که عملیات دارای دسترسی و Validation سمت Server انجام می‌شود و Secret داخل Client قرار نمی‌گیرد.

## GitHub به‌عنوان Storage کوچک و Append-oriented

در این سناریو، هر درخواست معتبر در یک فایل JSON مستقل با مسیر مبتنی بر تاریخ ذخیره می‌شود:

```text
leads/YYYY/MM/DD/<timestamp>_<uuid>.json
```

Worker برای ایجاد فایل از Repository Contents API گیت‌هاب استفاده می‌کند. طبق مستندات GitHub، محتوای فایل برای این Endpoint به‌صورت Base64 ارسال می‌شود و Worker این تبدیل را انجام می‌دهد.

برای یک سایت شخصی این ساختار چند مزیت دارد: هر Lead به‌صورت مستقل قابل ردگیری است، تاریخچه روشن می‌ماند و Raw Recordها از Dataset مشتق‌شده جدا هستند.

اما مرزش مهم است: **Git repository یک دیتابیس تراکنشی عمومی نیست**. مستندات GitHub نیز درباره تداخل عملیات هم‌زمان روی Contents API نکاتی دارد. اگر حجم این سیستم بالا برود، Storage را به یک Database یا Datastore مناسب منتقل می‌کنم و GitHub را برای Code و Artifactهای توسعه نگه می‌دارم.

## تبدیل JSONها به Dataset قابل استفاده

فایل‌های JSON برای ذخیره مستقل مناسب‌اند، اما برای تحلیل سریع یک جدول واحد راحت‌تر است.

هر بار JSON جدیدی ثبت شود، یک GitHub Actions workflow اجرا می‌شود. اسکریپت Python رکوردها را می‌خواند و `leads.csv` را بازسازی می‌کند. فیلدهایی مانند زمان ارسال، زبان فرم، حوزه همکاری، مرحله پروژه، Timeline، سازمان، پیام و Consent در Dataset قرار می‌گیرند.

در نتیجه Raw JSONها Source of Truth باقی می‌مانند و CSV یک نمای تحلیلی ساده و خودکار از همان داده‌هاست.

مخزن Leadها خصوصی باقی می‌ماند، چون شامل اطلاعاتی است که افراد واقعی در فرم وارد می‌کنند. مخزن عمومی سایت فقط معماری و کد Worker را نشان می‌دهد، نه داده‌های Lead.

## ایمیل فقط Notification است، نه Storage

بعد از اینکه GitHub ذخیره موفق Lead را تأیید کرد، Worker یک اعلان به ایمیل تأییدشده من می‌فرستد.

ایمیل شامل کد پیگیری و اطلاعات لازم درباره درخواست است و `Reply-To` روی ایمیل فردی قرار می‌گیرد که فرم را پر کرده است. در نتیجه می‌توانم همان Notification را باز کنم و مستقیماً Reply بزنم.

این مرحله عمداً **best-effort** طراحی شده است. اگر ارسال ایمیل خطا بدهد، Worker خطا را Log می‌کند اما Lead ذخیره‌شده همچنان موفق محسوب می‌شود. کانال ثانویه نباید Persistence اصلی را خراب کند.

## Analytics فقط بعد از Consent

می‌خواستم بفهمم صفحه همکاری چقدر کاربردی است، اما نه با این فرض که Analytics قبل از انتخاب کاربر فعال باشد.

در سایت، Analytics Storage در ابتدا `denied` است. Google tag فقط زمانی Load می‌شود که کاربر Analytics را پذیرفته باشد. بعد از Submit موفق فرم، در صورتی که Consent از قبل وجود داشته باشد، رویداد زیر ارسال می‌شود:

```text
lead_form_submit
```

همراه با پارامترهایی مثل حوزه همکاری، مرحله پروژه، زبان فرم و مسیر صفحه.

راهنمای Consent Mode گوگل بین Default consent state و Update بعد از انتخاب کاربر تمایز مشخصی قائل می‌شود. پیاده‌سازی این جریان به شکل صریح کمک می‌کند دقیق‌تر بدانیم چه داده‌ای و در چه زمانی ارسال می‌شود.

نکته مهم این است که Analytics و ثبت Lead دو موضوع مستقل‌اند: نپذیرفتن Analytics مانع ارسال فرم همکاری نمی‌شود.

## چند کنترل ساده برای Privacy و Abuse

فرم را عمداً محدود نگه داشته‌ام و فقط اطلاعاتی را می‌گیرد که برای فهمیدن درخواست و پاسخ‌دادن لازم است.

در نسخه فعلی این موارد هم وجود دارند:

- Consent checkbox مشخص،
- لینک Privacy Notice کنار فرم،
- Honeypot برای فیلتر ساده Botها،
- Origin allowlist در Worker،
- محدودیت طول و Validation سمت Server،
- ذخیره‌نشدن IP درخواست در Lead record،
- ذخیره‌سازی خصوصی Leadها،
- و فعال‌نشدن Analytics قبل از Consent.

Honeypot یک راهکار کامل Anti-spam نیست. اگر Spam واقعی ایجاد شود، لایه‌ای مثل Turnstile قدم بعدی منطقی خواهد بود. ترجیح من این است که چنین پیچیدگی‌ای را زمانی اضافه کنم که مسئله واقعاً وجود داشته باشد.

## اگر سیستم بزرگ‌تر شود چه چیزی را تغییر می‌دهم؟

این معماری برای سایت شخصی مناسب است چون حجم پایین است و همه اجزای مسیر را می‌توان راحت بررسی کرد. در مقیاس بالاتر، مسئولیت‌ها را بیشتر جدا می‌کنم:

- ذخیره Lead در Database با Access Control و Retention مناسب،
- Queue برای کارهای غیرهم‌زمان مثل Notification،
- Rate limiting و Abuse protection قوی‌تر،
- Monitoring و Retry policy،
- اتصال به CRM وقتی حجم Lead آن را توجیه کند،
- و فرآیند رسمی‌تر برای Retention و حذف داده.

بخش جالب این پروژه برای من انتخاب «پیچیده‌ترین Stack» نبود. مهم‌تر این بود که سیستمی بسازم که Failure modeهایش را بفهمم.

برای یک سیستم کوچک، شفافیت خودش یک قابلیت است.

## مطالب مرتبط

- [همکاری با من](/fa/services)
- [مخزن عمومی سایت](https://github.com/ahmadrastibarzoki/personal-website)
- [حریم خصوصی](/fa/privacy)
