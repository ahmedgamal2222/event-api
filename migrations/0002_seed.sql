-- 0002_seed.sql
-- Default admin + demo event seed data

-- Default super admin (password: admin123 – change immediately!)
-- bcrypt hash of "admin123" with 10 rounds
INSERT OR IGNORE INTO admins (email, password_hash, name, role)
VALUES ('admin@event.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LjTsyJB72.u', 'مدير النظام', 'super_admin');

-- Default demo event (Syria Startups Summit 2026)
INSERT OR IGNORE INTO events (
  slug, name, name_ar, tagline, tagline_ar,
  description, description_ar,
  location, location_ar, country, city,
  start_date, end_date,
  primary_color, status, registration_open,
  max_attendees, email,
  twitter, instagram, linkedin
) VALUES (
  's3-summit-2026',
  'S3 Summit 2026',
  'قمة الشركات الناشئة السورية 2026',
  'Syria Startups Summit',
  'قمة الشركات الناشئة السورية',
  'Three days of inspiration, networking, and innovation – building the future of entrepreneurship in Syria.',
  'ثلاثة أيام من الإلهام، التواصل، والابتكار — لبناء مستقبل ريادة الأعمال في سوريا',
  'Damascus, Syria', 'دمشق، سوريا', 'Syria', 'Damascus',
  '2026-12-25', '2026-12-27',
  '#6C63FF', 'published', 1,
  500, 'info@s3-summit.com',
  '@s3summit', 's3summit', 'S3Summit'
);

-- Agenda days
INSERT OR IGNORE INTO agenda_days (event_id, day_number, date, label, label_en)
VALUES
  (1, 1, '2026-12-25', 'اليوم الأول',  'Day One'),
  (1, 2, '2026-12-26', 'اليوم الثاني', 'Day Two'),
  (1, 3, '2026-12-27', 'اليوم الثالث', 'Day Three');

-- Day 1 sessions
INSERT OR IGNORE INTO agenda_sessions (event_id, day_id, time_start, time_end, title, title_ar, description_ar, session_type, sort_order) VALUES
  (1, 1, '09:00','10:00','Welcome & Registration','التسجيل والترحيب','استقبال المشاركين وتوزيع المواد','networking',1),
  (1, 1, '10:00','11:30','Opening Ceremony','الجلسة الافتتاحية الرسمية','كلمة ترحيبية ورؤية قمة S³ لعام 2026','keynote',2),
  (1, 1, '11:30','13:00','Syrian Entrepreneurship Map','خريطة ريادة الأعمال السورية','نظرة شاملة على المشهد الريادي في سوريا اليوم','panel',3),
  (1, 1, '13:00','14:30','Lunch Break','استراحة الغداء والتواصل','فرصة للتعارف والتواصل بين المشاركين','break',4),
  (1, 1, '14:30','16:00','Workshop: Idea to MVP','ورشة: من الفكرة إلى MVP','كيف تبني نموذجك الأولي في أقل من 30 يوماً','workshop',5),
  (1, 1, '16:00','17:30','Early Stage Funding','التمويل الأولي للشركات الناشئة','أدوات وقنوات تمويل المشاريع في المرحلة الأولى','talk',6),
  (1, 1, '17:30','19:00','Evening Networking','جلسة تواصل مسائية','اختتام اليوم الأول بجلسة تواصل حرة','networking',7);

-- Day 2 sessions
INSERT OR IGNORE INTO agenda_sessions (event_id, day_id, time_start, time_end, title, title_ar, description_ar, session_type, sort_order) VALUES
  (1, 2, '09:00','10:00','Morning Registration','التسجيل الصباحي','','networking',1),
  (1, 2, '10:00','11:30','Startup Pitches Round 1','جلسة عروض الشركات – الجولة الأولى','عروض مختصرة من الشركات الناشئة أمام المستثمرين','competition',2),
  (1, 2, '11:30','13:00','Digital Marketing Workshop','ورشة: التسويق الرقمي للناشئين','استراتيجيات نمو فعّالة بميزانيات محدودة','workshop',3),
  (1, 2, '13:00','14:30','Lunch & Investor Meetings','غداء ولقاءات مع المستثمرين','','break',4),
  (1, 2, '14:30','16:00','Panel: Scaling in MENA','نقاش: التوسع في منطقة الشرق الأوسط','تجارب وتحديات التوسع خارج الحدود','panel',5),
  (1, 2, '16:00','17:30','Legal & Regulatory Landscape','البيئة القانونية والتنظيمية','إطار العمل القانوني لتأسيس شركات ناشئة في سوريا','talk',6),
  (1, 2, '17:30','19:00','Gala Networking Dinner','عشاء التواصل الرسمي','','networking',7);

-- Day 3 sessions
INSERT OR IGNORE INTO agenda_sessions (event_id, day_id, time_start, time_end, title, title_ar, description_ar, session_type, sort_order) VALUES
  (1, 3, '09:00','10:00','Registration & Coffee','التسجيل والقهوة الصباحية','','networking',1),
  (1, 3, '10:00','11:30','Startup Pitches Final','نهائي عروض الشركات الناشئة','المنافسة النهائية للشركات المتأهلة','competition',2),
  (1, 3, '11:30','13:00','Investor Fireside Chat','حوار مفتوح مع المستثمرين','أسئلة وأجوبة مع كبار المستثمرين في المنطقة','panel',3),
  (1, 3, '13:00','14:30','Lunch Break','استراحة الغداء','','break',4),
  (1, 3, '14:30','16:00','Future of Tech in Syria','مستقبل التكنولوجيا في سوريا','تقنيات AI، Blockchain وتأثيرها على الاقتصاد السوري','talk',5),
  (1, 3, '16:00','17:30','Awards Ceremony','حفل توزيع الجوائز','تكريم الفائزين وأفضل الشركات الناشئة','keynote',6),
  (1, 3, '17:30','19:00','Closing & Farewell','الختام والوداع','','networking',7);

-- Sample speakers
INSERT OR IGNORE INTO speakers (event_id, name, name_ar, title, title_ar, company, bio_ar, sort_order, is_featured) VALUES
  (1,'Mohammad Al-Ahmad','محمد الأحمد','Founder & CEO','مؤسس ومدير تنفيذي','TechSyria','رائد أعمال سوري بتجربة 10 سنوات في قطاع التكنولوجيا',1,1),
  (1,'Sara Al-Masri','سارة المصري','Venture Investor','مستثمرة مشاريع','MENA Ventures','مستثمرة في أكثر من 30 شركة ناشئة في المنطقة العربية',2,1),
  (1,'Karim Al-Ali','كريم العلي','Business Development Director','مدير تطوير الأعمال','Syria Digital Hub','خبير في تطوير النظام البيئي الرقمي السوري',3,1),
  (1,'Rana Al-Hassan','رنا الحسن','Digital Marketing Expert','خبيرة تسويق رقمي','Growth Labs','متخصصة في نمو الشركات الناشئة B2B وB2C',4,1),
  (1,'Omar Al-Zayat','عمر الزيات','Tech Entrepreneur','رائد أعمال تقني','StartupSY','مؤسس ثلاث شركات ناشئة ناجحة في مجال FinTech',5,1),
  (1,'Surprise Speaker','متحدث مفاجأة','Distinguished Personality','شخصية بارزة','يُعلن قريباً','',6,0);

-- Seed event stats
INSERT OR IGNORE INTO event_stats (event_id, total_registrations, approved_count, startup_count, speaker_count, days_count)
VALUES (1, 0, 0, 0, 6, 3);

-- Sample FAQs
INSERT OR IGNORE INTO faqs (event_id, question_ar, answer_ar, sort_order) VALUES
  (1,'من يمكنه التسجيل في القمة؟','يمكن لجميع رواد الأعمال، المستثمرين، وعشاق التكنولوجيا التسجيل. يوجد خياران: تسجيل شركة ناشئة أو حضور عام.',1),
  (1,'هل التسجيل مجاني؟','نعم، التسجيل مجاني للشركات الناشئة السورية المؤهلة. قد تنطبق رسوم رمزية على المشاركة العامة.',2),
  (1,'ما هو موعد آخر يوم للتسجيل؟','التسجيل مفتوح حتى 15 ديسمبر 2026 أو حتى اكتمال الأماكن.',3),
  (1,'هل ستكون هناك ترجمة فورية؟','نعم، ستتوفر ترجمة فورية للغات العربية والإنجليزية في جميع الجلسات الرئيسية.',4);
