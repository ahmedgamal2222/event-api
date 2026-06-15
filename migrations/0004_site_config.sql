-- 0004_site_config.sql
-- Add site_config JSON column to events for full landing page control

ALTER TABLE events ADD COLUMN site_config TEXT DEFAULT NULL;

UPDATE events SET site_config = '{
  "hero_abbr": "S3",
  "hero_btn_primary": "🚀 سجّل شركتك الناشئة",
  "hero_btn_secondary": "حضور عام",
  "stats": [
    {"label": "أيام من الإلهام", "field": "days_count", "fallback": 3},
    {"label": "شركة ناشئة", "field": "startup_count", "fallback": 50},
    {"label": "متحدث متميز", "field": "speaker_count", "fallback": 20},
    {"label": "مشارك", "field": "total_registrations", "fallback": 500}
  ],
  "about_title": "لماذا S³ Summit؟",
  "about_badge": "عن الفعالية",
  "about_cards": [
    {"emoji": "🚀", "title": "إطلاق الأفكار", "desc": "منصة لعرض شركاتك الناشئة أمام مستثمرين وشركاء من سوريا والمنطقة العربية"},
    {"emoji": "🤝", "title": "التواصل والشبكات", "desc": "فرصة ذهبية للتواصل مع رواد أعمال، مستثمرين، وخبراء في الاقتصاد الرقمي"},
    {"emoji": "💡", "title": "ورش عمل مكثفة", "desc": "جلسات تدريبية متخصصة في بناء المنتج، التسويق الرقمي، وجذب التمويل"},
    {"emoji": "🏆", "title": "مسابقة الشركات", "desc": "تنافس أفضل الشركات الناشئة السورية للفوز بجوائز وفرص تمويل حقيقية"}
  ]
}' WHERE site_config IS NULL;
