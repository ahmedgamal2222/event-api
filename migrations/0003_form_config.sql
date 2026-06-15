-- 0003_form_config.sql
-- Add form_config JSON column to events for full registration form control

ALTER TABLE events ADD COLUMN form_config TEXT DEFAULT NULL;

-- Update existing event with sensible defaults
UPDATE events SET form_config = '{"enabled_types":["startup","general","investor","speaker","sponsor","media"],"form_title":"سجّل في القمة","form_subtitle":"كن جزءاً من أكبر تجمع لريادة الأعمال","show_phone":true,"require_phone":false,"show_city":true,"require_city":false,"show_motivation":false,"motivation_label":"لماذا تريد الحضور؟","terms_text":"أوافق على الشروط والأحكام وسياسة الخصوصية","cities":["دمشق","حلب","حمص","اللاذقية","طرطوس","حماة","دير الزور","الرقة","القامشلي","إدلب","درعا","خارج سوريا"],"sectors":["تكنولوجيا المعلومات","التجارة الإلكترونية","التعليم","الصحة","التمويل والدفع","الزراعة","الطاقة","التصنيع","الخدمات اللوجستية","أخرى"],"stages":["فكرة","نموذج أولي MVP","مرحلة مبكرة","نمو","توسع"],"type_labels":{"startup":"🚀 شركة ناشئة","general":"👤 حضور عام","investor":"💼 مستثمر","speaker":"🎙️ متحدث","sponsor":"🏅 راعي","media":"📹 إعلام"}}' WHERE form_config IS NULL;
