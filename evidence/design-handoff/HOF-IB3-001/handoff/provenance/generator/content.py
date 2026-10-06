# Synthetic, product-neutral content for HOF-IB3-001 (DWP-IB3-001 §12). All data fictional.
# Arabic and Hebrew strings are DESIGN FIXTURES and need native-speaker review before use as evidence.
EN = {
 'product': 'Acme Platform',
 'product_long': 'Acme Platform — Enterprise Operations Workspace (Extended Name Test)',
 'env': 'Staging',
 'tenant': 'Northwind Holdings', 'site': 'Site 04',
 'tenant_long': 'Northwind Holdings International Group (Southern Africa Regional Operations)',
 'site_long': 'Site 04: Distribution Campus North-East Extension',
 'tenant_id': 'tnt-0000-0004',
 'user': 'Alex Morgan', 'user_long': 'Maximiliana Oyelaran-Van der Westhuizen',
 'impersonator': 'Support agent',
}
# Navigation manifest sample (app-supplied, typed, build-time; filtered by host access information).
# availability: 'available' | ('locked', reason) | 'denied'
NAV = [
 ('overview', 'Overview', 'home', [
   ('home', 'Home', 'available', None), ('activity', 'Activity', 'available', None)]),
 ('records', 'Records', 'list', [
   ('all', 'All records', 'available', None), ('recent', 'Recently viewed', 'available', None),
   ('pending', 'Pending approvals awaiting second-level review', 'available', None)]),
 ('operations', 'Operations', 'tasks', [
   ('work', 'Work items', 'available', '12'), ('schedules', 'Schedules', 'available', None),
   ('tasks', 'Tasks', 'available', '99+')]),
 ('reports', 'Reports', 'document', [
   ('documents', 'Documents', 'available', None), ('archive', 'Archive', ('locked', 'edition'), None),
   ('templates', 'Templates', ('locked', 'configuration'), None)]),
 ('admin', 'Administration', 'shield', [
   ('users', 'Users and access', 'denied', None), ('settings', 'Settings', 'available', None),
   ('audit', 'Audit log', 'available', None), ('integrations', 'Integrations', ('locked', 'environment'), None)]),
]
# Optional manifest shortLabel for the collapsed rail (PROPOSED field; falls back to label with hyphenation)
SHORT = {'admin': 'Admin'}
REASONS = {
 'permission':    ('lock',    'Not available to your role',        'You do not have access to this area. Your administrator manages access. This screen only explains the restriction; access is decided by the server.', 'Request access'),
 'edition':       ('edition', 'Not included in your edition',       'This capability is part of a different edition of Acme Platform. Contact your account owner to discuss your plan.', 'Learn about editions'),
 'configuration': ('sliders', 'Not configured for this deployment', 'This capability has not been set up for Northwind Holdings. An administrator can enable it in the deployment configuration.', 'Contact administrator'),
 'environment':   ('device',  'Not available in this environment',  'This capability is not available in the current environment (for example this device, browser or deployment type).', 'See requirements'),
}
AR = {
 'product': 'منصة أكمي', 'tenant': 'نورثويند القابضة', 'site': 'الموقع 04', 'user': 'أليكس مورغان', 'env': 'بيئة الاختبار',
 'groups': {'overview': 'نظرة عامة', 'records': 'السجلات', 'operations': 'العمليات', 'reports': 'التقارير', 'admin': 'الإدارة'},
 'items': {'home': 'الرئيسية', 'activity': 'النشاط', 'all': 'كل السجلات', 'recent': 'المعروضة مؤخرًا',
           'pending': 'الموافقات المعلقة بانتظار المراجعة من المستوى الثاني', 'work': 'بنود العمل', 'schedules': 'الجداول',
           'tasks': 'المهام', 'documents': 'المستندات', 'archive': 'الأرشيف', 'templates': 'القوالب', 'users': 'المستخدمون والوصول',
           'settings': 'الإعدادات', 'audit': 'سجل التدقيق', 'integrations': 'عمليات التكامل'},
 'search': 'ابحث أو انتقل إلى…', 'title': 'كل السجلات', 'record': 'تم تحديث السجل REC-000184',
}
HE = {
 'product': 'פלטפורמת אקמי', 'tenant': 'נורת׳ווינד החזקות', 'site': 'אתר 04', 'user': 'אלכס מורגן', 'env': 'סביבת בדיקות',
 'groups': {'overview': 'סקירה כללית', 'records': 'רשומות', 'operations': 'תפעול', 'reports': 'דוחות', 'admin': 'ניהול'},
 'items': {'home': 'בית', 'activity': 'פעילות', 'all': 'כל הרשומות', 'recent': 'נצפו לאחרונה',
           'pending': 'אישורים ממתינים לבדיקה בדרג שני', 'work': 'פריטי עבודה', 'schedules': 'לוחות זמנים', 'tasks': 'משימות',
           'documents': 'מסמכים', 'archive': 'ארכיון', 'templates': 'תבניות', 'users': 'משתמשים והרשאות', 'settings': 'הגדרות',
           'audit': 'יומן ביקורת', 'integrations': 'שילובים'},
 'search': 'חיפוש או מעבר אל…', 'title': 'כל הרשומות', 'record': 'רשומה REC-000184 עודכנה',
}

# Page-body fixture strings for RTL boards (design fixtures; native-speaker review required)
PAGE = {
 'ar': {'Assign owner': 'تعيين المالك', 'New record': 'سجل جديد', '6 records': '6 سجلات', 'Sorted by reference': 'مرتبة حسب المرجع', 'Status': 'الحالة', 'Owner': 'المالك',
        'Any status': 'أي حالة', 'Apply': 'تطبيق', 'Reset': 'إعادة تعيين', 'Reference': 'المرجع', 'Title': 'العنوان', 'Records': 'السجلات', 'Filters': 'عوامل التصفية',
        'Quarterly inspection summary': 'ملخص الفحص الفصلي', 'Supplier onboarding pack': 'حزمة تأهيل المورّد', 'Maintenance window notice': 'إشعار نافذة الصيانة',
        'Access review for Site 04': 'مراجعة الوصول للموقع 04', 'Incident follow-up actions': 'إجراءات متابعة الحادث', 'Training attendance list': 'قائمة حضور التدريب',
        'In review': 'قيد المراجعة', 'Approved': 'معتمد', 'Draft': 'مسودة', 'Rejected': 'مرفوض', 'Details': 'التفاصيل', 'Site': 'الموقع'},
 'he': {'Assign owner': 'הקצאת בעלים', 'New record': 'רשומה חדשה', '6 records': '6 רשומות', 'Sorted by reference': 'ממוין לפי מזהה', 'Status': 'סטטוס', 'Owner': 'בעלים',
        'Any status': 'כל סטטוס', 'Apply': 'החלה', 'Reset': 'איפוס', 'Reference': 'מזהה', 'Title': 'כותרת', 'Records': 'רשומות', 'Filters': 'מסננים',
        'Quarterly inspection summary': 'סיכום בדיקה רבעוני', 'Supplier onboarding pack': 'חבילת קליטת ספק', 'Maintenance window notice': 'הודעת חלון תחזוקה',
        'Access review for Site 04': 'סקירת גישה לאתר 04', 'Incident follow-up actions': 'פעולות המשך לאירוע', 'Training attendance list': 'רשימת נוכחות בהדרכה',
        'In review': 'בבדיקה', 'Approved': 'מאושר', 'Draft': 'טיוטה', 'Rejected': 'נדחה', 'Details': 'פרטים', 'Site': 'אתר'},
}
def t(s, lang):
    return PAGE.get(lang, {}).get(s, s)
