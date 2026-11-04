import type { Step } from 'react-joyride';

// ─── Extended Step Type ───────────────────────────────────────────────────────

/**
 * Extends the base Joyride Step with the route this step belongs to,
 * so the AppTour component can navigate between pages automatically.
 */
export interface TourStep extends Step {
  /** The app route where this step's target element lives. */
  routePath: string;
}

// ─── Bilingual Step Definition ────────────────────────────────────────────────

interface BilingualStep {
  routePath: string;
  target: string;
  placement: Step['placement'];
  ar: { title: string; content: string };
  en: { title: string; content: string };
}

// ─── Raw bilingual data ───────────────────────────────────────────────────────

/**
 * Guided walkthrough of the current KPI portal:
 * Home dashboard → My Requests → new submission form.
 * Copy stays factual to the live UI (no unused filters or dialogs).
 */
const BILINGUAL_STEPS: BilingualStep[] = [
  // ── 1: Welcome ─────────────────────────────────────────────────────────────
  {
    routePath: '/home',
    target: 'body',
    placement: 'center',
    ar: {
      title: 'مرحباً بك في بوابة ASEZA',
      content:
        'هذه لوحة مؤشرات الأداء الخاصة بك. توضّح هذه الجولة المختصرة كيف تتابع تقديماتك وتُنشئ طلباً جديداً وتُرسله للمراجعة.',
    },
    en: {
      title: 'Welcome to the ASEZA Portal',
      content:
        'This is your KPI workspace. The tour walks through how you track submissions, start a new request, and send it for review.',
    },
  },

  // ── 2: Top navigation ──────────────────────────────────────────────────────
  {
    routePath: '/home',
    target: '[data-tour="navbar-nav"]',
    placement: 'bottom',
    ar: {
      title: 'التنقل في البوابة',
      content:
        'من الشريط العلوي تنتقل بين الرئيسية وطلباتي ودليل المستخدم. يمكنك أيضاً تغيير اللغة أو المظهر، وإدارة حسابك من الأيقونات المجاورة.',
    },
    en: {
      title: 'Portal Navigation',
      content:
        'Use the top bar to move between Home, My Requests, and the User Guide. Language, theme, and your account are in the icons beside it.',
    },
  },

  // ── 3: Dashboard stats ─────────────────────────────────────────────────────
  {
    routePath: '/home',
    target: '[data-tour="home-stats"]',
    placement: 'bottom',
    ar: {
      title: 'إجمالي الطلبات',
      content:
        'يعرض هذا الرقم إجمالي طلباتك. تُحدَّث القيمة تلقائياً عند كل زيارة.',
    },
    en: {
      title: 'Total Requests',
      content:
        'This shows the total number of your requests. The count refreshes each time you open Home.',
    },
  },

  // ── 4: Quick actions ───────────────────────────────────────────────────────
  {
    routePath: '/home',
    target: '[data-tour="home-quick-actions"]',
    placement: 'auto',
    ar: {
      title: 'الإجراءات السريعة',
      content:
        'ابدأ إدخال بيانات مؤشرات جديدة (لمستخدمي إدخال البيانات)، أو افتح قائمة تقديماتك كاملة من هنا.',
    },
    en: {
      title: 'Quick Actions',
      content:
        'Start a new KPI data entry if you have the Data Entry role, or open the full list of your submissions from here.',
    },
  },

  // ── 5: Recent submissions ──────────────────────────────────────────────────
  {
    routePath: '/home',
    target: '[data-tour="home-recent"]',
    placement: 'top',
    ar: {
      title: 'آخر التقديمات',
      content:
        'تظهر هنا أحدث خمسة تقديمات مع رقم الطلب والنموذج والفترة والحالة. اضغط «عرض الكل» أو أي صف للانتقال إلى صفحة طلباتي.',
    },
    en: {
      title: 'Recent Submissions',
      content:
        'Your five latest submissions appear here with request number, form, period, and status. Use View All or any row to open My Requests.',
    },
  },

  // ── 6: My Requests table ───────────────────────────────────────────────────
  {
    routePath: '/my-requests',
    target: '[data-tour="requests-table"]',
    placement: 'top',
    ar: {
      title: 'قائمة طلباتي',
      content:
        'تُعرض هنا جميع تقديماتك مع الرقم المرجعي والنموذج وعدد المؤشرات والتواريخ والحالة. اضغط الصف أو أيقونة العرض لفتح التفاصيل، أو صدّر نسخة Word. المعتمدون يمكنهم مراجعة الطلب من صفحة التفاصيل.',
    },
    en: {
      title: 'My Requests',
      content:
        'Every submission is listed here with its reference number, form, KPI count, dates, and status. Open a row or the view icon for details, or export a Word file. Approvers review a request from its detail page.',
    },
  },

  // ── 7: New request button ──────────────────────────────────────────────────
  {
    routePath: '/my-requests',
    target: '[data-tour="new-request-btn"]',
    placement: 'bottom',
    ar: {
      title: 'تقديم جديد',
      content:
        'يظهر هذا الزر لمستخدمي إدخال البيانات. يفتح مباشرة نموذج المؤشرات المرتبط بمديريتك والفترة النشطة — دون الحاجة لاختيار النموذج يدوياً.',
    },
    en: {
      title: 'New Submission',
      content:
        'This button is shown to Data Entry users. It opens the KPI form assigned to your directorate and the active reporting period — you do not pick the form yourself.',
    },
  },

  // ── 8: Form stepper ────────────────────────────────────────────────────────
  {
    routePath: '/my-requests/new',
    target: '[data-tour="stepper-header"]',
    placement: 'bottom',
    ar: {
      title: 'خطوات النموذج',
      content:
        'النموذج مقسّم إلى صفحات بيانات ثم خطوة «مراجعة وتأكيد». أكمل الحقول المطلوبة المعلَّمة بـ (*) قبل الضغط على «التالي». يمكنك الرجوع دون فقدان ما أدخلته.',
    },
    en: {
      title: 'Form Steps',
      content:
        'The form is split into data pages, then a Review & Confirm step. Fill required fields marked with (*) before pressing Next. You can go back without losing what you entered.',
    },
  },

  // ── 9: Progress sidebar ────────────────────────────────────────────────────
  {
    routePath: '/my-requests/new',
    target: '[data-tour="progress-sidebar"]',
    placement: 'auto',
    ar: {
      title: 'معلومات الطلب والتقدم',
      content:
        'تعرض هذه اللوحة نسبة الإنجاز، واسم النموذج، والمديرية، وفترة التقرير، وحالة المسودة، إضافة إلى إرشادات التقديم.',
    },
    en: {
      title: 'Request Information',
      content:
        'This panel shows completion progress, the assigned form, directorate, reporting period, draft status, and the submission guidelines.',
    },
  },

  // ── 10: Submit actions ─────────────────────────────────────────────────────
  {
    routePath: '/my-requests/new',
    target: '[data-tour="stepper-actions"]',
    placement: 'top',
    ar: {
      title: 'المراجعة والإرسال',
      content:
        'بعد إكمال الصفحات ستصل إلى المراجعة. تحقق من القيم، حدّد خانة التأكيد، ثم اضغط «تقديم». بعد الإرسال يُقفل الطلب للمراجعة، ولا يُعدَّل إلا إذا أُعيد للتصحيح. ستُعاد إلى طلباتي بعد التأكيد.',
    },
    en: {
      title: 'Review and Submit',
      content:
        'After the data pages you reach Review & Confirm. Check the values, tick the confirmation box, then press Submit. Once sent, the request is locked for review and can be edited only if it is returned. You are taken back to My Requests after confirmation.',
    },
  },
];

// ─── Factory function ─────────────────────────────────────────────────────────

/**
 * Returns the tour steps in the correct language.
 * Call this inside the component so it reacts to language changes.
 *
 * @param isAr - Whether the current app language is Arabic.
 */
export const getTourSteps = (isAr: boolean): TourStep[] =>
  BILINGUAL_STEPS.map((step) => ({
    routePath: step.routePath,
    target: step.target,
    placement: step.placement,
    skipBeacon: true,
    title: isAr ? step.ar.title : step.en.title,
    content: isAr ? step.ar.content : step.en.content,
  }));
