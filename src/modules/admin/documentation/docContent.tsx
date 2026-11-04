import React from 'react';
import {
  RocketLaunch as GettingStartedIcon,
  People as UsersIcon,
  AccountTree as DirectoratesIcon,
  Groups as GroupsIcon,
  Description as FormsIcon,
  ViewList as FieldsIcon,
  Widgets as ControlsIcon,
  GridOn as TablesIcon,
  EventRepeat as FrequencyIcon,
  Security as PermissionsIcon,
  HelpOutline as FaqIcon,
} from '@mui/icons-material';
import type { CategoryColor } from '../../../core/constants/theme';

// ─── Content model ────────────────────────────────────────────────────────────
// Inline text in every block supports **bold** and `code` markers.
// Every user-facing string is stored in English and Arabic, then resolved
// to the active language before the page renders it.

export type CalloutTone = 'tip' | 'warning' | 'info';

/** One piece of copy in both portal languages. */
interface L10n {
  en: string;
  ar: string;
}

export interface DocStep {
  title: string;
  detail?: string;
}

export interface DocListItem {
  /** Optional bold lead-in shown before the text. */
  term?: string;
  text: string;
}

export interface DocFaqItem {
  question: string;
  answer: string;
}

export interface ParagraphBlock {
  kind: 'paragraph';
  text: string;
}

export interface StepsBlock {
  kind: 'steps';
  title?: string;
  steps: DocStep[];
}

export interface ListBlock {
  kind: 'list';
  title?: string;
  items: DocListItem[];
}

export interface CalloutBlock {
  kind: 'callout';
  tone: CalloutTone;
  title: string;
  text: string;
}

export interface TableBlock {
  kind: 'table';
  title?: string;
  columns: string[];
  rows: string[][];
}

export interface ExampleBlock {
  kind: 'example';
  title: string;
  code: string;
  caption?: string;
}

export interface FaqBlock {
  kind: 'faq';
  items: DocFaqItem[];
}

export type DocBlock =
  | ParagraphBlock
  | StepsBlock
  | ListBlock
  | CalloutBlock
  | TableBlock
  | ExampleBlock
  | FaqBlock;

export interface DocSection {
  /** Used as the URL hash, e.g. /admin/docs#users. Stable across languages. */
  id: string;
  title: string;
  summary: string;
  icon: React.ReactNode;
  /** Resolved to a hex value per theme mode at render time. */
  color: CategoryColor;
  /** Optional shortcut to the screen this section describes. */
  related?: { label: string; path: string };
  blocks: DocBlock[];
}

interface L10nStep {
  title: L10n;
  detail?: L10n;
}

interface L10nListItem {
  term?: L10n;
  text: L10n;
}

interface L10nFaqItem {
  question: L10n;
  answer: L10n;
}

interface L10nParagraphBlock {
  kind: 'paragraph';
  text: L10n;
}

interface L10nStepsBlock {
  kind: 'steps';
  title?: L10n;
  steps: L10nStep[];
}

interface L10nListBlock {
  kind: 'list';
  title?: L10n;
  items: L10nListItem[];
}

interface L10nCalloutBlock {
  kind: 'callout';
  tone: CalloutTone;
  title: L10n;
  text: L10n;
}

interface L10nTableBlock {
  kind: 'table';
  title?: L10n;
  columns: L10n[];
  rows: L10n[][];
}

interface L10nExampleBlock {
  kind: 'example';
  title: L10n;
  code: L10n;
  caption?: L10n;
}

interface L10nFaqBlock {
  kind: 'faq';
  items: L10nFaqItem[];
}

type L10nBlock =
  | L10nParagraphBlock
  | L10nStepsBlock
  | L10nListBlock
  | L10nCalloutBlock
  | L10nTableBlock
  | L10nExampleBlock
  | L10nFaqBlock;

interface L10nDocSection {
  id: string;
  title: L10n;
  summary: L10n;
  icon: React.ReactNode;
  color: CategoryColor;
  related?: { label: L10n; path: string };
  blocks: L10nBlock[];
}

/** Builds a bilingual string. Both languages are required. */
const bilingual = (en: string, ar: string): L10n => ({ en, ar });

/**
 * Picks the active language, and falls back to the other language
 * when the preferred text is missing or blank.
 */
const readL10n = (value: L10n, isAr: boolean): string => {
  const english = typeof value.en === 'string' ? value.en : '';
  const arabic = typeof value.ar === 'string' ? value.ar : '';
  const preferred = isAr ? arabic : english;
  const fallback = isAr ? english : arabic;
  return preferred.trim().length > 0 ? preferred : fallback;
};

/** Resolves an optional bilingual string. Undefined stays undefined. */
const readOptionalL10n = (value: L10n | undefined, isAr: boolean): string | undefined => {
  if (value === undefined) return undefined;
  const resolved = readL10n(value, isAr);
  return resolved.length > 0 ? resolved : undefined;
};

/** Turns one bilingual block into the plain block the page renders. */
const resolveBlock = (block: L10nBlock, isAr: boolean): DocBlock => {
  switch (block.kind) {
    case 'paragraph':
      return { kind: 'paragraph', text: readL10n(block.text, isAr) };
    case 'steps':
      return {
        kind: 'steps',
        title: readOptionalL10n(block.title, isAr),
        steps: block.steps.map((step) => ({
          title: readL10n(step.title, isAr),
          detail: readOptionalL10n(step.detail, isAr),
        })),
      };
    case 'list':
      return {
        kind: 'list',
        title: readOptionalL10n(block.title, isAr),
        items: block.items.map((item) => ({
          term: readOptionalL10n(item.term, isAr),
          text: readL10n(item.text, isAr),
        })),
      };
    case 'callout':
      return {
        kind: 'callout',
        tone: block.tone,
        title: readL10n(block.title, isAr),
        text: readL10n(block.text, isAr),
      };
    case 'table':
      return {
        kind: 'table',
        title: readOptionalL10n(block.title, isAr),
        columns: block.columns.map((column) => readL10n(column, isAr)),
        rows: block.rows.map((row) => row.map((cell) => readL10n(cell, isAr))),
      };
    case 'example':
      return {
        kind: 'example',
        title: readL10n(block.title, isAr),
        code: readL10n(block.code, isAr),
        caption: readOptionalL10n(block.caption, isAr),
      };
    case 'faq':
      return {
        kind: 'faq',
        items: block.items.map((item) => ({
          question: readL10n(item.question, isAr),
          answer: readL10n(item.answer, isAr),
        })),
      };
    default: {
      const unreachable: never = block;
      return unreachable;
    }
  }
};

/** Resolves one section, keeping its id, icon and colour in both languages. */
const resolveSection = (section: L10nDocSection, isAr: boolean): DocSection => {
  const related = section.related;
  return {
    id: section.id,
    title: readL10n(section.title, isAr),
    summary: readL10n(section.summary, isAr),
    icon: section.icon,
    color: section.color,
    related: related === undefined
      ? undefined
      : { label: readL10n(related.label, isAr), path: related.path },
    blocks: section.blocks.map((block) => resolveBlock(block, isAr)),
  };
};

// ─── Sections (English + Arabic) ──────────────────────────────────────────────

const DOC_SECTION_SOURCE: L10nDocSection[] = [
  {
    id: 'getting-started',
    title: bilingual('Getting Started', 'البدء'),
    summary: bilingual(
      'What the admin portal does and the recommended order for setting things up.',
      'ماذا تفعل بوابة الإدارة، والترتيب الموصى به لإعداد الأشياء.',
    ),
    icon: <GettingStartedIcon />,
    color: 'navy',
    related: {
      label: bilingual('Open Dashboard', 'فتح لوحة التحكم'),
      path: '/admin',
    },
    blocks: [
      {
        kind: 'paragraph',
        text: bilingual(
          'The ASEZA Admin portal controls who can use the reporting system and what they see. You manage **Users** (accounts and roles), **Directorates** (organisational units and which forms they can access), **Group mappings** (Azure AD groups to portal roles), and **Forms** (the dynamic data-collection forms that users fill in).',
          'تتحكم بوابة إدارة ASEZA في من يمكنه استخدام نظام التقارير وما يراه. تدير **المستخدمين** (الحسابات والأدوار)، و**المديريات** (الوحدات التنظيمية والنماذج التي يمكنها الوصول إليها)، و**تعيين المجموعات** (مجموعات Azure AD إلى أدوار البوابة)، و**النماذج** (نماذج جمع البيانات الديناميكية التي يملؤها المستخدمون).',
        ),
      },
      {
        kind: 'list',
        title: bilingual('Finding your way around', 'التعرّف على الواجهة'),
        items: [
          {
            term: bilingual('Sidebar', 'الشريط الجانبي'),
            text: bilingual(
              'Switch between Dashboard, Users, Directorates, Group mappings, Forms and this Documentation. Use the arrow button at the top-left of the header to collapse it to icons only.',
              'انتقل بين لوحة التحكم والمستخدمين والمديريات وتعيين المجموعات والنماذج وهذا الدليل. استخدم زر السهم في أعلى الترويسة لطيّه إلى أيقونات فقط.',
            ),
          },
          {
            term: bilingual('Language switcher', 'مبدّل اللغة'),
            text: bilingual(
              'Toggle between English and Arabic from the header. The layout flips to right-to-left automatically for Arabic.',
              'بدّل بين الإنجليزية والعربية من الترويسة. ينقلب التخطيط تلقائيًا من اليمين إلى اليسار عند اختيار العربية.',
            ),
          },
          {
            term: bilingual('Profile menu', 'قائمة الملف الشخصي'),
            text: bilingual(
              'Click your avatar at the top-right to see your account and to log out.',
              'انقر صورتك في طرف الترويسة لعرض حسابك أو تسجيل الخروج.',
            ),
          },
          {
            term: bilingual('Refresh buttons', 'أزرار التحديث'),
            text: bilingual(
              'Every list has a refresh icon that reloads the latest data from the server without reloading the page.',
              'كل قائمة فيها أيقونة تحديث تعيد تحميل أحدث البيانات من الخادم دون إعادة تحميل الصفحة.',
            ),
          },
        ],
      },
      {
        kind: 'steps',
        title: bilingual('Recommended setup order for a new form', 'ترتيب الإعداد الموصى به لنموذج جديد'),
        steps: [
          {
            title: bilingual('Create the directorate', 'إنشاء المديرية'),
            detail: bilingual(
              'In **Directorates**, click **New directorate** and fill in the unique key plus English and Arabic names.',
              'في **المديريات**، انقر **مديرية جديدة** واملأ المفتاح الفريد والأسماء الإنجليزية والعربية.',
            ),
          },
          {
            title: bilingual('Create the form', 'إنشاء النموذج'),
            detail: bilingual(
              'Go to **Forms → Create Form** and fill in the key, names, owning directorate and reporting frequency.',
              'انتقل إلى **النماذج ← نموذج جديد** واملأ المفتاح والأسماء والمديرية المالكة وتكرار التقارير.',
            ),
          },
          {
            title: bilingual('Build its structure', 'بناء هيكله'),
            detail: bilingual(
              'Open the form with **Configure structure** and add its fields and tables.',
              'افتح النموذج عبر **إعداد الهيكل** وأضف حقوله وجداوله.',
            ),
          },
          {
            title: bilingual('Give directorates access', 'منح المديريات الوصول'),
            detail: bilingual(
              'In **Directorates**, assign the form to each unit that should view, submit or approve it.',
              'في **المديريات**، عيّن النموذج لكل وحدة يجب أن تعرضه أو تقدّمه أو تعتمده.',
            ),
          },
          {
            title: bilingual('Map Azure groups', 'تعيين مجموعات Azure'),
            detail: bilingual(
              'In **Group mappings**, link each Azure AD group to a portal role and directorate so SSO users receive access automatically.',
              'في **تعيين المجموعات**، اربط كل مجموعة Azure AD بدور ومديرية في البوابة ليحصل مستخدمو تسجيل الدخول الموحد على الوصول تلقائيًا.',
            ),
          },
          {
            title: bilingual('Prepare the users', 'تجهيز المستخدمين'),
            detail: bilingual(
              'In **Users**, make sure each person has the right role and the correct primary directorate.',
              'في **المستخدمين**، تأكد أن لكل شخص الدور المناسب والمديرية الأساسية الصحيحة.',
            ),
          },
          {
            title: bilingual('Verify', 'التحقق'),
            detail: bilingual(
              'Ask a user from the directorate to sign in to the main portal and confirm the form appears under **New Request**.',
              'اطلب من مستخدم في المديرية تسجيل الدخول إلى البوابة الرئيسية والتأكد من ظهور النموذج ضمن **طلب جديد**.',
            ),
          },
        ],
      },
      {
        kind: 'callout',
        tone: 'tip',
        title: bilingual('Bilingual by design', 'ثنائي اللغة بالتصميم'),
        text: bilingual(
          'Almost every name, label, help text and message has an English and an Arabic version. Fill in both so the form looks complete for every user, whatever language they choose.',
          'كل اسم وتسمية ونص مساعدة ورسالة تقريبًا له نسخة إنجليزية وأخرى عربية. املأ الاثنتين ليظهر النموذج مكتملًا لكل مستخدم مهما كانت اللغة التي يختارها.',
        ),
      },
    ],
  },
  {
    id: 'users',
    title: bilingual('Managing Users', 'إدارة المستخدمين'),
    summary: bilingual(
      'Search accounts, assign roles, and set each user’s primary directorate.',
      'ابحث في الحسابات، وعيّن الأدوار، وحدّد المديرية الأساسية لكل مستخدم.',
    ),
    icon: <UsersIcon />,
    color: 'navy',
    related: {
      label: bilingual('Open Users', 'فتح المستخدمين'),
      path: '/admin/users',
    },
    blocks: [
      {
        kind: 'paragraph',
        text: bilingual(
          'The Users screen lists every account in the system with its directorate, status and last login date. This screen manages existing accounts; it does not create or delete them.',
          'تعرض شاشة المستخدمين كل حساب في النظام مع مديريته وحالته وتاريخ آخر دخول. تدير هذه الشاشة الحسابات الموجودة، ولا تنشئها ولا تحذفها.',
        ),
      },
      {
        kind: 'list',
        title: bilingual('Finding a user', 'العثور على مستخدم'),
        items: [
          {
            term: bilingual('Search', 'البحث'),
            text: bilingual(
              'Type an email in **Search by email…**. The list updates shortly after you pause, across all pages. Click **×** or delete the email to show every user again.',
              'اكتب بريدًا إلكترونيًا في **ابحث بالبريد الإلكتروني…**. تتحدث القائمة بعد لحظات من التوقف عن الكتابة، عبر كل الصفحات. انقر **×** أو امسح البريد لإظهار كل المستخدمين من جديد.',
            ),
          },
          {
            term: bilingual('Status filter', 'تصفية الحالة'),
            text: bilingual(
              'Choose **All Status**, **Active Only** or **Inactive** to narrow the list.',
              'اختر **كل الحالات** أو **النشط فقط** أو **غير نشط** لتضييق القائمة.',
            ),
          },
          {
            term: bilingual('Pagination', 'ترقيم الصفحات'),
            text: bilingual(
              'Show 10, 20 or 50 users per page using the controls at the bottom of the table.',
              'اعرض 10 أو 20 أو 50 مستخدمًا في الصفحة باستخدام عناصر التحكم أسفل الجدول.',
            ),
          },
        ],
      },
      {
        kind: 'steps',
        title: bilingual('Assigning or removing a role', 'منح دور أو سحبه'),
        steps: [
          {
            title: bilingual('Open the user', 'فتح المستخدم'),
            detail: bilingual(
              'Click the **Manage User** icon at the end of the user’s row.',
              'انقر أيقونة **إدارة المستخدم** في نهاية صف المستخدم.',
            ),
          },
          {
            title: bilingual('Pick a role', 'اختيار دور'),
            detail: bilingual(
              'Under **User Roles**, choose a role from **Add a new role**.',
              'ضمن **أدوار المستخدم**، اختر دورًا من **إضافة دور جديد**.',
            ),
          },
          {
            title: bilingual('Click Add', 'انقر إضافة'),
            detail: bilingual(
              'The role appears as a chip straight away. A user can hold several roles at once.',
              'يظهر الدور كشارة فورًا. يمكن للمستخدم أن يحمل عدة أدوار في الوقت نفسه.',
            ),
          },
          {
            title: bilingual('Remove a role', 'سحب دور'),
            detail: bilingual(
              'Click the small **×** on the role chip. The role is removed immediately with no confirmation step.',
              'انقر علامة **×** الصغيرة على شارة الدور. يُسحب الدور فورًا دون خطوة تأكيد.',
            ),
          },
        ],
      },
      {
        kind: 'steps',
        title: bilingual('Setting the primary directorate', 'تعيين المديرية الأساسية'),
        steps: [
          {
            title: bilingual('Choose the directorate', 'اختيار المديرية'),
            detail: bilingual(
              'Under **Primary Directorate**, select the unit the user belongs to, or **None (unassign)** to clear it.',
              'ضمن **المديرية الأساسية**، اختر الوحدة التي ينتمي إليها المستخدم، أو **بدون (إلغاء التعيين)** لمسحها.',
            ),
          },
          {
            title: bilingual('Click Save', 'انقر حفظ'),
            detail: bilingual(
              'The **Currently assigned to** panel confirms the change. Click **Finished** to close the dialog.',
              'تؤكد لوحة **معيّن حاليًا إلى** التغيير. انقر **تم** لإغلاق النافذة.',
            ),
          },
        ],
      },
      {
        kind: 'callout',
        tone: 'info',
        title: bilingual('Why the directorate matters', 'لماذا تهم المديرية'),
        text: bilingual(
          'A user only sees the forms that their directorate has access to. If a user reports a missing form, check their primary directorate first, then the form permissions on that directorate.',
          'لا يرى المستخدم إلا النماذج التي تملك مديريته صلاحية الوصول إليها. إذا أبلغ مستخدم عن نموذج مفقود، تحقق أولًا من مديريته الأساسية، ثم من صلاحيات النموذج على تلك المديرية.',
        ),
      },
      {
        kind: 'callout',
        tone: 'warning',
        title: bilingual('Changes apply right away', 'التغييرات تُطبَّق فورًا'),
        text: bilingual(
          'Role and directorate changes are saved the moment you click Add, × or Save. The user may need to sign out and back in before their new permissions take effect in the main portal.',
          'تُحفظ تغييرات الدور والمديرية لحظة النقر على إضافة أو × أو حفظ. قد يحتاج المستخدم إلى تسجيل الخروج ثم الدخول مجددًا قبل أن تسري صلاحياته الجديدة في البوابة الرئيسية.',
        ),
      },
    ],
  },
  {
    id: 'directorates',
    title: bilingual('Directorates & Form Access', 'المديريات والوصول إلى النماذج'),
    summary: bilingual(
      'Control which forms each directorate can view, submit and approve.',
      'تحكّم في النماذج التي يمكن لكل مديرية عرضها أو تقديمها أو اعتمادها.',
    ),
    icon: <DirectoratesIcon />,
    color: 'purple',
    related: {
      label: bilingual('Open Directorates', 'فتح المديريات'),
      path: '/admin/directorates',
    },
    blocks: [
      {
        kind: 'paragraph',
        text: bilingual(
          'Each directorate is shown as an expandable card with its name, unique key and status. Expand a card to see the forms it has been given access to, along with the permissions granted for each one.',
          'تظهر كل مديرية كبطاقة قابلة للتوسيع تحمل اسمها ومفتاحها الفريد وحالتها. وسّع البطاقة لترى النماذج التي مُنحت الوصول إليها، مع الصلاحيات الممنوحة لكل نموذج.',
        ),
      },
      {
        kind: 'steps',
        title: bilingual('Creating a directorate', 'إنشاء مديرية'),
        steps: [
          {
            title: bilingual('Click New directorate', 'انقر مديرية جديدة'),
            detail: bilingual(
              'The **Create directorate** dialog opens from the page header, or from the empty state when no units exist yet.',
              'تُفتح نافذة **إنشاء مديرية** من ترويسة الصفحة، أو من الحالة الفارغة عندما لا توجد وحدات بعد.',
            ),
          },
          {
            title: bilingual('Fill in identity', 'ملء الهوية'),
            detail: bilingual(
              'Enter a unique **key** (for example `DIRECTORATE_001`) plus the English and Arabic names. Tick **Directorate is active** unless the unit should stay hidden.',
              'أدخل **مفتاحًا** فريدًا (مثل `DIRECTORATE_001`) بالإضافة إلى الاسمين الإنجليزي والعربي. أبقِ **المديرية نشطة** محددة ما لم يجب أن تبقى الوحدة مخفية.',
            ),
          },
          {
            title: bilingual('Click Create directorate', 'انقر إنشاء المديرية'),
            detail: bilingual(
              'The new unit appears in the list immediately and can be assigned forms and users.',
              'تظهر الوحدة الجديدة في القائمة فورًا ويمكن تعيين النماذج والمستخدمين إليها.',
            ),
          },
        ],
      },
      {
        kind: 'steps',
        title: bilingual('Giving a directorate access to a form', 'منح مديرية الوصول إلى نموذج'),
        steps: [
          {
            title: bilingual('Expand the directorate', 'توسيع المديرية'),
            detail: bilingual(
              'Click the directorate card to open its **Assigned Forms** list.',
              'انقر بطاقة المديرية لفتح قائمة **النماذج المعيّنة**.',
            ),
          },
          {
            title: bilingual('Click Assign New', 'انقر تعيين جديد'),
            detail: bilingual(
              'The **Assign Form** dialog opens for that directorate.',
              'تُفتح نافذة **تعيين نموذج** لتلك المديرية.',
            ),
          },
          {
            title: bilingual('Select the form', 'اختيار النموذج'),
            detail: bilingual(
              'Only **active** forms that are **not yet assigned** to this directorate appear in the list.',
              'لا تظهر في القائمة إلا النماذج **النشطة** التي **لم تُعيَّن بعد** لهذه المديرية.',
            ),
          },
          {
            title: bilingual('Choose permissions', 'اختيار الصلاحيات'),
            detail: bilingual(
              'Tick **Can View Submissions**, **Can Submit New Data** and/or **Can Approve/Reject**. View is ticked by default.',
              'حدّد **يمكنه عرض الطلبات** و/أو **يمكنه تقديم بيانات جديدة** و/أو **يمكنه الاعتماد أو الرفض**. يكون العرض محددًا افتراضيًا.',
            ),
          },
          {
            title: bilingual('Click Assign Form', 'انقر تعيين النموذج'),
            detail: bilingual(
              'The form appears in the list with green badges for the permissions that were granted.',
              'يظهر النموذج في القائمة مع شارات خضراء للصلاحيات التي مُنحت.',
            ),
          },
        ],
      },
      {
        kind: 'callout',
        tone: 'tip',
        title: bilingual('Changing permissions', 'تغيير الصلاحيات'),
        text: bilingual(
          'Permissions cannot be edited in place. To change them, remove the assignment with the delete icon and assign the form again with the new permissions.',
          'لا يمكن تعديل الصلاحيات في مكانها. لتغييرها، أزل التعيين بأيقونة الحذف ثم عيّن النموذج من جديد بالصلاحيات الجديدة.',
        ),
      },
      {
        kind: 'callout',
        tone: 'warning',
        title: bilingual('Removing access is immediate', 'إزالة الوصول فورية'),
        text: bilingual(
          'Clicking the delete icon on an assigned form removes access straight away, with no confirmation. Users in that directorate will stop seeing the form.',
          'النقر على أيقونة الحذف لنموذج معيّن يزيل الوصول فورًا دون تأكيد. سيتوقف مستخدمو تلك المديرية عن رؤية النموذج.',
        ),
      },
    ],
  },
  {
    id: 'group-mappings',
    title: bilingual('Azure Group Role Mappings', 'تعيين أدوار مجموعات Azure'),
    summary: bilingual(
      'Map Microsoft Entra ID groups to portal roles and directorates.',
      'اربط مجموعات Microsoft Entra ID بأدوار البوابة والمديريات.',
    ),
    icon: <GroupsIcon />,
    color: 'teal',
    related: {
      label: bilingual('Open Group mappings', 'فتح تعيين المجموعات'),
      path: '/admin/group-mappings',
    },
    blocks: [
      {
        kind: 'paragraph',
        text: bilingual(
          'When a user signs in with Azure AD, the portal looks up their Entra ID groups and applies the matching **role** and **directorate**. Create a mapping for each Azure group that should receive access.',
          'عندما يسجّل مستخدم الدخول عبر Azure AD، تبحث البوابة عن مجموعاته في Entra ID وتطبّق **الدور** و**المديرية** المطابقين. أنشئ تعيينًا لكل مجموعة Azure يجب أن تحصل على الوصول.',
        ),
      },
      {
        kind: 'steps',
        title: bilingual('Creating a group mapping', 'إنشاء تعيين مجموعة'),
        steps: [
          {
            title: bilingual('Open Group mappings', 'افتح تعيين المجموعات'),
            detail: bilingual(
              'Click **New mapping** in the page header.',
              'انقر **تعيين جديد** في ترويسة الصفحة.',
            ),
          },
          {
            title: bilingual('Paste the Azure Object ID', 'الصق معرّف كائن Azure'),
            detail: bilingual(
              'Copy the group’s **Object ID** from Microsoft Entra ID and paste it into **Azure group object ID**.',
              'انسخ **معرّف الكائن** للمجموعة من Microsoft Entra ID والصقه في **معرّف كائن مجموعة Azure**.',
            ),
          },
          {
            title: bilingual('Name the group', 'تسمية المجموعة'),
            detail: bilingual(
              'Enter a unique **key** (for example `IT_ADMIN_GROUP`) plus English and Arabic display names.',
              'أدخل **مفتاحًا** فريدًا (مثل `IT_ADMIN_GROUP`) بالإضافة إلى الاسمين الإنجليزي والعربي.',
            ),
          },
          {
            title: bilingual('Choose role and directorate', 'اختيار الدور والمديرية'),
            detail: bilingual(
              'Select the portal **role** members should receive and the **directorate** they belong to.',
              'اختر **دور** البوابة الذي يجب أن يحصل عليه الأعضاء و**المديرية** التي ينتمون إليها.',
            ),
          },
          {
            title: bilingual('Click Create mapping', 'انقر إنشاء التعيين'),
            detail: bilingual(
              'The mapping appears in the list. Members of that Azure group receive the role and directorate on their next sign-in.',
              'يظهر التعيين في القائمة. يحصل أعضاء تلك المجموعة على الدور والمديرية في تسجيل الدخول التالي.',
            ),
          },
        ],
      },
      {
        kind: 'callout',
        tone: 'tip',
        title: bilingual('Create the directorate first', 'أنشئ المديرية أولًا'),
        text: bilingual(
          'The directorate dropdown only lists units that already exist. Create the directorate on the **Directorates** screen before mapping a group to it.',
          'لا تعرض قائمة المديريات إلا الوحدات الموجودة بالفعل. أنشئ المديرية في شاشة **المديريات** قبل ربط مجموعة بها.',
        ),
      },
    ],
  },
  {
    id: 'permissions',
    title: bilingual('Permission Reference', 'مرجع الصلاحيات'),
    summary: bilingual(
      'What View, Submit and Approve allow a directorate to do.',
      'ماذا تسمح صلاحيات العرض والتقديم والاعتماد للمديرية أن تفعله.',
    ),
    icon: <PermissionsIcon />,
    color: 'purple',
    blocks: [
      {
        kind: 'table',
        columns: [
          bilingual('Permission', 'الصلاحية'),
          bilingual('What it allows', 'ما تسمح به'),
          bilingual('Typical use', 'الاستخدام المعتاد'),
        ],
        rows: [
          [
            bilingual('View', 'عرض'),
            bilingual(
              'See submissions made for this form and open their details.',
              'رؤية الطلبات المقدَّمة لهذا النموذج وفتح تفاصيلها.',
            ),
            bilingual(
              'Every directorate that works with the form.',
              'كل مديرية تتعامل مع النموذج.',
            ),
          ],
          [
            bilingual('Submit', 'تقديم'),
            bilingual(
              'Create and send new submissions of the form.',
              'إنشاء طلبات جديدة للنموذج وإرسالها.',
            ),
            bilingual(
              'Directorates that report the data.',
              'المديريات التي تُبلغ بالبيانات.',
            ),
          ],
          [
            bilingual('Approve', 'اعتماد'),
            bilingual(
              'Approve or reject submitted requests.',
              'اعتماد الطلبات المقدَّمة أو رفضها.',
            ),
            bilingual(
              'Reviewing or supervising directorates.',
              'مديريات المراجعة أو الإشراف.',
            ),
          ],
        ],
      },
      {
        kind: 'callout',
        tone: 'info',
        title: bilingual('Combine permissions', 'اجمع الصلاحيات'),
        text: bilingual(
          'A directorate can hold any combination. A unit that both reports and reviews its own data needs all three; a read-only observer only needs View.',
          'يمكن للمديرية أن تحمل أي مجموعة. الوحدة التي تُبلغ وتراجع بياناتها بنفسها تحتاج الصلاحيات الثلاث، أما المراقب للقراءة فقط فيحتاج العرض وحده.',
        ),
      },
    ],
  },
  {
    id: 'forms',
    title: bilingual('Managing Forms', 'إدارة النماذج'),
    summary: bilingual(
      'Create forms, configure their basic details, and deactivate old ones.',
      'أنشئ النماذج، واضبط بياناتها الأساسية، وأوقف النماذج القديمة.',
    ),
    icon: <FormsIcon />,
    color: 'teal',
    related: {
      label: bilingual('Open Forms', 'فتح النماذج'),
      path: '/admin/forms',
    },
    blocks: [
      {
        kind: 'paragraph',
        text: bilingual(
          'The Forms screen shows totals for all, active and inactive forms, followed by a searchable table with each form’s identifier, display name, owning directorate, structure and status.',
          'تعرض شاشة النماذج إجمالي كل النماذج والنشطة وغير النشطة، ثم جدولًا قابلًا للبحث يبيّن معرّف كل نموذج واسمه المعروض ومديريته المالكة وهيكله وحالته.',
        ),
      },
      {
        kind: 'steps',
        title: bilingual('Creating a form', 'إنشاء نموذج'),
        steps: [
          {
            title: bilingual('Click Create Form', 'انقر نموذج جديد'),
            detail: bilingual(
              'The **Create New Form** dialog opens.',
              'تُفتح نافذة **إنشاء نموذج جديد**.',
            ),
          },
          {
            title: bilingual('Enter a Form Unique Key', 'أدخل المعرّف الفريد للنموذج'),
            detail: bilingual(
              'A short identifier such as `TOURISM_STATS`. It is saved in upper case and should never change once the form is in use.',
              'معرّف قصير مثل `TOURISM_STATS`. يُحفظ بأحرف كبيرة ولا ينبغي تغييره بعد أن يصبح النموذج قيد الاستخدام.',
            ),
          },
          {
            title: bilingual('Add names and descriptions', 'أضف الأسماء والأوصاف'),
            detail: bilingual(
              'English and Arabic names are required. Descriptions are optional but help users understand the form’s purpose.',
              'الأسماء بالإنجليزية والعربية مطلوبة. الأوصاف اختيارية لكنها تساعد المستخدمين على فهم غرض النموذج.',
            ),
          },
          {
            title: bilingual('Choose directorate and frequency', 'اختر المديرية والتكرار'),
            detail: bilingual(
              'Both are required. The frequency defines how often the form is reported (for example monthly or quarterly).',
              'كلاهما مطلوب. يحدد التكرار عدد مرات الإبلاغ بالنموذج (مثلًا شهريًا أو ربعيًا).',
            ),
          },
          {
            title: bilingual('Set effective dates (optional)', 'حدّد تواريخ السريان (اختياري)'),
            detail: bilingual(
              '**Effective From** and **Effective To** limit when the form is valid. The end date must be on or after the start date.',
              'يحدّد **ساري من** و**ساري حتى** الفترة التي يكون فيها النموذج صالحًا. يجب أن يكون تاريخ الانتهاء في يوم البداية أو بعده.',
            ),
          },
          {
            title: bilingual('Save', 'الحفظ'),
            detail: bilingual(
              'The form appears in the table. Open it with **Configure structure** to start adding fields.',
              'يظهر النموذج في الجدول. افتحه عبر **إعداد الهيكل** لتبدأ بإضافة الحقول.',
            ),
          },
        ],
      },
      {
        kind: 'list',
        title: bilingual('Form actions', 'إجراءات النموذج'),
        items: [
          {
            term: bilingual('Configure structure', 'إعداد الهيكل'),
            text: bilingual(
              'Opens the form builder, where you manage fields, tables and frequencies.',
              'يفتح منشئ النماذج، حيث تدير الحقول والجداول والتكرارات.',
            ),
          },
          {
            term: bilingual('Deactivate', 'إيقاف'),
            text: bilingual(
              'Archives the form. It stays in the system for existing data but can no longer receive new submissions. The button only appears on active forms.',
              'يؤرشف النموذج. يبقى في النظام من أجل البيانات الموجودة، لكنه لا يعود يستقبل طلبات جديدة. يظهر الزر فقط على النماذج النشطة.',
            ),
          },
        ],
      },
      {
        kind: 'callout',
        tone: 'warning',
        title: bilingual('Deactivate instead of rebuilding', 'أوقف النموذج بدل إعادة بنائه'),
        text: bilingual(
          'If a form is no longer needed, deactivate it rather than deleting its fields. Deactivating keeps historical submissions intact.',
          'إذا لم يعد النموذج مطلوبًا، أوقفه بدل حذف حقوله. الإيقاف يُبقي الطلبات السابقة سليمة.',
        ),
      },
    ],
  },
  {
    id: 'fields',
    title: bilingual('Form Builder & Fields', 'منشئ النماذج والحقول'),
    summary: bilingual(
      'Add, edit, order and validate the fields that make up a form.',
      'أضف حقول النموذج وعدّلها ورتّبها وتحقق منها.',
    ),
    icon: <FieldsIcon />,
    color: 'teal',
    blocks: [
      {
        kind: 'paragraph',
        text: bilingual(
          'Opening a form shows its status, version and description, followed by the **Fields** table. Each row shows the field’s order, label and key, control type, type-specific configuration, the number of active dependency rules, and status badges (Active, Required, Read-only, Hidden).',
          'فتح النموذج يعرض حالته وإصداره ووصفه، ثم جدول **الحقول**. يبيّن كل صف ترتيب الحقل وتسميته ومفتاحه ونوع التحكم وإعداده الخاص بالنوع وعدد قواعد الاعتماد النشطة وشارات الحالة (نشط، مطلوب، للقراءة فقط، مخفي).',
        ),
      },
      {
        kind: 'callout',
        tone: 'info',
        title: bilingual('Changes are saved automatically', 'تُحفظ التغييرات تلقائيًا'),
        text: bilingual(
          'There is no global Save button in the form builder. Each dialog saves its own changes when you confirm it.',
          'لا يوجد زر حفظ عام في منشئ النماذج. كل نافذة تحفظ تغييراتها عند تأكيدها.',
        ),
      },
      {
        kind: 'steps',
        title: bilingual('Adding a field', 'إضافة حقل'),
        steps: [
          {
            title: bilingual('Click Add Field', 'انقر إضافة حقل'),
            detail: bilingual(
              'On an empty form you can also use **Add First Field**.',
              'في النموذج الفارغ يمكنك أيضًا استخدام **إضافة أول حقل**.',
            ),
          },
          {
            title: bilingual('Set the identifier and labels', 'حدّد المعرّف والتسميات'),
            detail: bilingual(
              '**Field Identifier (Key)** is the internal name used in stored data. **Label (EN)** and **Label (AR)** are what users see.',
              '**معرّف الحقل (المفتاح)** هو الاسم الداخلي المستخدم في البيانات المحفوظة. **التسمية (EN)** و**التسمية (AR)** هما ما يراه المستخدمون.',
            ),
          },
          {
            title: bilingual('Pick the control type', 'اختر نوع التحكم'),
            detail: bilingual(
              'The control type decides how the field looks and which settings are shown. A matching data type is suggested automatically. See the Control Types Reference below.',
              'يحدد نوع التحكم شكل الحقل والإعدادات التي تظهر. يُقترح نوع بيانات مطابق تلقائيًا. راجع مرجع أنواع التحكم أدناه.',
            ),
          },
          {
            title: bilingual('Set the display order', 'حدّد ترتيب العرض'),
            detail: bilingual(
              'Lower numbers appear first in the form.',
              'الأرقام الأصغر تظهر أولًا في النموذج.',
            ),
          },
          {
            title: bilingual('Choose flags', 'اختر العلامات'),
            detail: bilingual(
              '**Required field** forces users to fill it in; untick **Visible** to hide it from users while keeping it on the form.',
              '**حقل مطلوب** يُلزم المستخدمين بملئه. أزل تحديد **ظاهر** لإخفائه عن المستخدمين مع الإبقاء عليه في النموذج.',
            ),
          },
          {
            title: bilingual('Configure validation and content', 'اضبط التحقق والمحتوى'),
            detail: bilingual(
              'Fill in the sections that apply to the control type, then save.',
              'املأ الأقسام التي تنطبق على نوع التحكم، ثم احفظ.',
            ),
          },
        ],
      },
      {
        kind: 'list',
        title: bilingual('Field settings explained', 'شرح إعدادات الحقل'),
        items: [
          {
            term: bilingual('Min / Max Value', 'الحد الأدنى / الأقصى للقيمة'),
            text: bilingual(
              'Allowed numeric range for Number and Percentage fields.',
              'النطاق الرقمي المسموح لحقول الرقم والنسبة المئوية.',
            ),
          },
          {
            term: bilingual('Min / Max Length', 'الحد الأدنى / الأقصى للطول'),
            text: bilingual(
              'Allowed number of characters for text fields.',
              'عدد الأحرف المسموح لحقول النص.',
            ),
          },
          {
            term: bilingual('Input pattern', 'نمط الإدخال'),
            text: bilingual(
              'A ready-made rule such as Numbers only, Decimal (up to 2 places), Email address, Letters only (English/Arabic) or Jordan mobile number.',
              'قاعدة جاهزة مثل أرقام فقط، أو عشري (حتى منزلتين)، أو البريد الإلكتروني، أو حروف فقط (إنجليزية/عربية)، أو رقم هاتف أردني.',
            ),
          },
          {
            term: bilingual('Validation Message (EN/AR)', 'رسالة التحقق (EN/AR)'),
            text: bilingual(
              'Shown to the user when their input breaks a rule. Write it as a clear instruction, for example “Enter a value between 0 and 100”.',
              'تظهر للمستخدم عندما يخالف إدخاله قاعدة. اكتبها كتعليمة واضحة، مثل «أدخل قيمة بين 0 و 100».',
            ),
          },
          {
            term: bilingual('Help Text (EN/AR)', 'نص المساعدة (EN/AR)'),
            text: bilingual(
              'Short guidance shown with the field.',
              'إرشاد قصير يظهر مع الحقل.',
            ),
          },
          {
            term: bilingual('Placeholder (EN/AR)', 'النص التوضيحي (EN/AR)'),
            text: bilingual(
              'Example text shown inside an empty input. For Label controls, this is the text that is displayed.',
              'نص مثال يظهر داخل حقل فارغ. في عناصر التسمية، هذا هو النص الذي يُعرض.',
            ),
          },
          {
            term: bilingual('Default Value', 'القيمة الافتراضية'),
            text: bilingual(
              'Pre-filled value for new submissions.',
              'قيمة تُملأ مسبقًا في الطلبات الجديدة.',
            ),
          },
          {
            term: bilingual('Lookup Type', 'نوع القائمة'),
            text: bilingual(
              'The list of options for Dropdown, Radio and Multi-select controls.',
              'قائمة الخيارات لعناصر القائمة المنسدلة وأزرار الاختيار والاختيار المتعدد.',
            ),
          },
          {
            term: bilingual('KPI ID', 'معرّف المؤشر'),
            text: bilingual(
              'Links the field to a KPI definition. The KPI is what holds the field’s reporting frequency.',
              'يربط الحقل بتعريف مؤشر. المؤشر هو ما يحمل تكرار تقارير الحقل.',
            ),
          },
        ],
      },
      {
        kind: 'list',
        title: bilingual('Working with existing fields', 'العمل على الحقول الموجودة'),
        items: [
          {
            term: bilingual('Edit Field', 'تعديل الحقل'),
            text: bilingual(
              'Opens the same dialog used to add a field, pre-filled with the current settings.',
              'يفتح النافذة نفسها المستخدمة لإضافة حقل، معبأة بالإعدادات الحالية.',
            ),
          },
          {
            term: bilingual('Delete field', 'حذف الحقل'),
            text: bilingual(
              'Permanently removes the field after a confirmation.',
              'يزيل الحقل نهائيًا بعد التأكيد.',
            ),
          },
          {
            term: bilingual('Status filter', 'تصفية الحالة'),
            text: bilingual(
              'Show all fields, active only or inactive only. The counter shows how many fields match.',
              'اعرض كل الحقول، أو النشط فقط، أو غير النشط فقط. يبيّن العداد عدد الحقول المطابقة.',
            ),
          },
        ],
      },
      {
        kind: 'callout',
        tone: 'warning',
        title: bilingual('Deleting a field can lose data', 'حذف الحقل قد يفقد بيانات'),
        text: bilingual(
          'Deleting a field removes it permanently, and data already submitted for it may be lost. If the field is simply no longer needed on screen, consider unticking **Visible** instead.',
          'حذف الحقل يزيله نهائيًا، وقد تُفقد البيانات التي قُدّمت له سابقًا. إذا لم يعد الحقل مطلوبًا على الشاشة فقط، فكّر في إلغاء تحديد **ظاهر** بدل ذلك.',
        ),
      },
    ],
  },
  {
    id: 'control-types',
    title: bilingual('Control Types Reference', 'مرجع أنواع التحكم'),
    summary: bilingual(
      'Which control to choose and what extra setup each one needs.',
      'أي نوع تحكم تختار، وما الإعداد الإضافي الذي يحتاجه كل نوع.',
    ),
    icon: <ControlsIcon />,
    color: 'teal',
    blocks: [
      {
        kind: 'table',
        columns: [
          bilingual('Control', 'التحكم'),
          bilingual('Use it for', 'يُستخدم لـ'),
          bilingual('Suggested data type', 'نوع البيانات المقترح'),
          bilingual('Extra setup', 'إعداد إضافي'),
        ],
        rows: [
          [
            bilingual('Text', 'نص'),
            bilingual('Short single-line answers', 'إجابات قصيرة في سطر واحد'),
            bilingual('TEXT', 'TEXT'),
            bilingual('Length and pattern validation', 'التحقق من الطول والنمط'),
          ],
          [
            bilingual('Textarea', 'منطقة نص'),
            bilingual('Longer, multi-line answers', 'إجابات أطول متعددة الأسطر'),
            bilingual('TEXT', 'TEXT'),
            bilingual('Length validation', 'التحقق من الطول'),
          ],
          [
            bilingual('Number', 'رقم'),
            bilingual('Any numeric value', 'أي قيمة رقمية'),
            bilingual('NUMBER', 'NUMBER'),
            bilingual('Min/max value and pattern', 'الحد الأدنى/الأقصى والنمط'),
          ],
          [
            bilingual('Percentage', 'نسبة مئوية'),
            bilingual('Values from 0 to 100', 'قيم من 0 إلى 100'),
            bilingual('NUMBER', 'NUMBER'),
            bilingual('Min/max value and pattern', 'الحد الأدنى/الأقصى والنمط'),
          ],
          [
            bilingual('Date picker', 'منتقي التاريخ'),
            bilingual('Dates', 'التواريخ'),
            bilingual('DATE', 'DATE'),
            bilingual('None', 'لا يوجد'),
          ],
          [
            bilingual('Dropdown', 'قائمة منسدلة'),
            bilingual('One option from a long list', 'خيار واحد من قائمة طويلة'),
            bilingual('TEXT', 'TEXT'),
            bilingual('Lookup type required', 'نوع القائمة مطلوب'),
          ],
          [
            bilingual('Radio', 'أزرار اختيار'),
            bilingual('One option from a short, visible list', 'خيار واحد من قائمة قصيرة ظاهرة'),
            bilingual('TEXT', 'TEXT'),
            bilingual('Lookup type required', 'نوع القائمة مطلوب'),
          ],
          [
            bilingual('Multi-select', 'اختيار متعدد'),
            bilingual('Several options from a list', 'عدة خيارات من قائمة'),
            bilingual('TEXT', 'TEXT'),
            bilingual('Lookup type required', 'نوع القائمة مطلوب'),
          ],
          [
            bilingual('Checkbox', 'مربع اختيار'),
            bilingual('Yes / no answers', 'إجابات نعم / لا'),
            bilingual('BOOLEAN', 'BOOLEAN'),
            bilingual('Always optional, no validation', 'اختياري دائمًا، بلا تحقق'),
          ],
          [
            bilingual('File upload', 'رفع ملف'),
            bilingual('Attachments and evidence', 'المرفقات والإثباتات'),
            bilingual('TEXT', 'TEXT'),
            bilingual('No validation', 'بلا تحقق'),
          ],
          [
            bilingual('Table', 'جدول'),
            bilingual('A list where users add their own rows', 'قائمة يضيف المستخدم صفوفها بنفسه'),
            bilingual('TEXT', 'TEXT'),
            bilingual('Columns via Configure Columns', 'الأعمدة عبر إعداد الأعمدة'),
          ],
          [
            bilingual('Raw table', 'جدول خام'),
            bilingual('A fixed grid of rows × columns', 'شبكة ثابتة من صفوف × أعمدة'),
            bilingual('TEXT', 'TEXT'),
            bilingual('Columns and rows via Configure Grid', 'الأعمدة والصفوف عبر إعداد الشبكة'),
          ],
          [
            bilingual('Label', 'تسمية'),
            bilingual('Read-only text or headings inside the form', 'نص أو عناوين للقراءة فقط داخل النموذج'),
            bilingual('TEXT', 'TEXT'),
            bilingual('Placeholder EN/AR is the displayed text', 'النص التوضيحي EN/AR هو النص المعروض'),
          ],
        ],
      },
      {
        kind: 'callout',
        tone: 'tip',
        title: bilingual('Red text in the Configuration column', 'النص الأحمر في عمود الإعداد'),
        text: bilingual(
          'If the table shows **Not assigned** or **Not configured** in red, the field is missing required setup, such as a lookup, and will not work for users until it is fixed.',
          'إذا أظهر الجدول **غير معيّن** أو **غير مُعدّ** باللون الأحمر، فالحقل ينقصه إعداد مطلوب، مثل قائمة، ولن يعمل للمستخدمين حتى يُصلح.',
        ),
      },
    ],
  },
  {
    id: 'tables',
    title: bilingual('Tables & Grids', 'الجداول والشبكات'),
    summary: bilingual(
      'Configure the columns and rows for Table and Raw table controls.',
      'اضبط أعمدة وصفوف عنصري الجدول والجدول الخام.',
    ),
    icon: <TablesIcon />,
    color: 'amber',
    blocks: [
      {
        kind: 'table',
        columns: [
          bilingual('', ''),
          bilingual('Table', 'جدول'),
          bilingual('Raw table', 'جدول خام'),
        ],
        rows: [
          [
            bilingual('Rows', 'الصفوف'),
            bilingual('Users add as many rows as they need', 'يضيف المستخدمون العدد الذي يحتاجونه من الصفوف'),
            bilingual('Fixed rows defined by you', 'صفوف ثابتة تحددها أنت'),
          ],
          [
            bilingual('Setup button', 'زر الإعداد'),
            bilingual('Configure Columns', 'إعداد الأعمدة'),
            bilingual('Configure Grid', 'إعداد الـ Table'),
          ],
          [
            bilingual('Best for', 'الأنسب لـ'),
            bilingual('Lists of items (e.g. projects, events)', 'قوائم العناصر (مثل المشاريع والفعاليات)'),
            bilingual('Fixed matrices (e.g. month × category)', 'مصفوفات ثابتة (مثل شهر × فئة)'),
          ],
        ],
      },
      {
        kind: 'steps',
        title: bilingual('Setting up a table', 'إعداد جدول'),
        steps: [
          {
            title: bilingual('Add the field', 'أضف الحقل'),
            detail: bilingual(
              'Choose the **Table** or **Raw table** control and enter the help text users should see above the table.',
              'اختر عنصر **جدول** أو **جدول خام** وأدخل نص المساعدة الذي يجب أن يراه المستخدمون فوق الجدول.',
            ),
          },
          {
            title: bilingual('Open the structure dialog', 'افتح نافذة الهيكل'),
            detail: bilingual(
              'Click **Configure Columns** (Table) or **Configure Grid** (Raw table) on the field row.',
              'انقر **إعداد الأعمدة** (جدول) أو **إعداد الـ Table** (جدول خام) في صف الحقل.',
            ),
          },
          {
            title: bilingual('Add columns', 'أضف الأعمدة'),
            detail: bilingual(
              'Give each column a key and English and Arabic labels, and choose how the cell is entered.',
              'أعطِ كل عمود مفتاحًا وتسميتين بالإنجليزية والعربية، واختر طريقة إدخال الخلية.',
            ),
          },
          {
            title: bilingual('Add rows (Raw table only)', 'أضف الصفوف (الجدول الخام فقط)'),
            detail: bilingual(
              'Define each fixed row with a key and labels. These rows appear as row headers in the grid.',
              'عرّف كل صف ثابت بمفتاح وتسميات. تظهر هذه الصفوف كعناوين صفوف في الشبكة.',
            ),
          },
        ],
      },
      {
        kind: 'callout',
        tone: 'info',
        title: bilingual('Counters on the field row', 'العدادات في صف الحقل'),
        text: bilingual(
          'The Configuration column shows how many columns and rows a table has. A count shown in orange means nothing has been configured yet.',
          'يبيّن عمود الإعداد عدد أعمدة الجدول وصفوفه. العدد الظاهر باللون البرتقالي يعني أنه لم يُعدّ شيء بعد.',
        ),
      },
    ],
  },
  {
    id: 'frequency',
    title: bilingual('Field Frequency & Periods', 'تكرار الحقل والفترات'),
    summary: bilingual(
      'Set how often a KPI field is reported and preview its reporting windows.',
      'حدّد عدد مرات الإبلاغ بحقل المؤشر، وعاين نوافذ تقاريره.',
    ),
    icon: <FrequencyIcon />,
    color: 'amber',
    blocks: [
      {
        kind: 'paragraph',
        text: bilingual(
          'Fields linked to a KPI can have their own reporting frequency. Click **Assign Frequency** (or **Manage Frequency** if one is already set) on the field row to open the **Field Frequency** dialog.',
          'يمكن للحقول المرتبطة بمؤشر أن يكون لها تكرار تقارير خاص. انقر **تعيين التكرار** (أو **إدارة الـ Frequency** إذا كان معيّنًا بالفعل) في صف الحقل لفتح نافذة التكرار.',
        ),
      },
      {
        kind: 'steps',
        title: bilingual('Assigning a frequency', 'تعيين تكرار'),
        steps: [
          {
            title: bilingual('Choose a frequency', 'اختر تكرارًا'),
            detail: bilingual(
              'Options marked **discrete periods** split the year into separate reporting windows.',
              'الخيارات المعلَّمة بـ **فترات منفصلة** تقسم السنة إلى نوافذ تقارير منفصلة.',
            ),
          },
          {
            title: bilingual('Pick a year', 'اختر سنة'),
            detail: bilingual(
              'The year (between 1900 and 2100) is used to preview windows. For daily or weekly frequencies, also choose a month.',
              'تُستخدم السنة (بين 1900 و 2100) لمعاينة النوافذ. للتكرار اليومي أو الأسبوعي، اختر شهرًا أيضًا.',
            ),
          },
          {
            title: bilingual('Set a custom start (optional)', 'حدّد بداية مخصصة (اختياري)'),
            detail: bilingual(
              'Use **Period start date** if the reporting year does not start on 1 January. Only the month and day are used, and they repeat every year.',
              'استخدم **تاريخ بداية الفترة** إذا كانت سنة التقارير لا تبدأ في 1 يناير. يُستخدم الشهر واليوم فقط، ويتكرران كل سنة.',
            ),
          },
          {
            title: bilingual('Review and save', 'راجع ثم احفظ'),
            detail: bilingual(
              'Check the **Preview windows**, **Expected periods** and the number of submitted periods for the year, then save.',
              'راجع **معاينة النوافذ** و**الفترات المتوقعة** وعدد الفترات المقدَّمة لهذه السنة، ثم احفظ.',
            ),
          },
        ],
      },
      {
        kind: 'callout',
        tone: 'warning',
        title: bilingual('A KPI is required', 'المؤشر مطلوب'),
        text: bilingual(
          'The frequency is stored on the field’s KPI definition. If saving fails, edit the field and set its **KPI ID** first.',
          'يُخزَّن التكرار على تعريف مؤشر الحقل. إذا فشل الحفظ، عدّل الحقل وعيّن **معرّف المؤشر** أولًا.',
        ),
      },
    ],
  },
  {
    id: 'faq',
    title: bilingual('Troubleshooting & FAQ', 'استكشاف الأخطاء والأسئلة الشائعة'),
    summary: bilingual(
      'Quick answers to the most common problems.',
      'إجابات سريعة لأكثر المشكلات شيوعًا.',
    ),
    icon: <FaqIcon />,
    color: 'navy',
    blocks: [
      {
        kind: 'faq',
        items: [
          {
            question: bilingual(
              'An SSO user has no role or directorate after sign-in.',
              'مستخدم تسجيل الدخول الموحد بلا دور أو مديرية بعد الدخول.',
            ),
            answer: bilingual(
              'Confirm the user’s Azure AD group **Object ID** is mapped on **Group mappings**, the mapping is **active**, and the user belongs to that group in Entra ID. They may need to sign out and back in.',
              'تأكد أن **معرّف كائن** مجموعة Azure AD للمستخدم مُعيَّن في **تعيين المجموعات**، وأن التعيين **نشط**، وأن المستخدم عضو في تلك المجموعة في Entra ID. قد يحتاج إلى تسجيل الخروج ثم الدخول مجددًا.',
            ),
          },
          {
            question: bilingual(
              'A user says they cannot see a form.',
              'يقول مستخدم إنه لا يرى نموذجًا.',
            ),
            answer: bilingual(
              'Check three things in order: the user has a **primary directorate**, that directorate has the form assigned with the right **permission** (View or Submit), and the form is **active**.',
              'تحقق من ثلاثة أشياء بالترتيب: أن للمستخدم **مديرية أساسية**، وأن تلك المديرية عُيّن لها النموذج بالـ **صلاحية** المناسبة (عرض أو تقديم)، وأن النموذج **نشط**.',
            ),
          },
          {
            question: bilingual(
              'A form is missing from the Assign Form list.',
              'نموذج غير موجود في قائمة تعيين النموذج.',
            ),
            answer: bilingual(
              'The list only shows active forms that are not already assigned to that directorate. Check the form’s status on the Forms screen, or look for it in the directorate’s existing assignments.',
              'لا تعرض القائمة إلا النماذج النشطة غير المعيّنة بالفعل لتلك المديرية. تحقق من حالة النموذج في شاشة النماذج، أو ابحث عنه ضمن تعيينات المديرية الحالية.',
            ),
          },
          {
            question: bilingual(
              'A dropdown shows no options to users.',
              'القائمة المنسدلة لا تعرض خيارات للمستخدمين.',
            ),
            answer: bilingual(
              'Dropdown, Radio and Multi-select controls need a **Lookup Type**. Edit the field and assign one; the Configuration column shows **Not assigned** in red until you do.',
              'تحتاج عناصر القائمة المنسدلة وأزرار الاختيار والاختيار المتعدد إلى **نوع قائمة**. عدّل الحقل وعيّن واحدًا. يظهر عمود الإعداد **غير معيّن** باللون الأحمر إلى أن تفعل ذلك.',
            ),
          },
          {
            question: bilingual(
              'Saving a field frequency fails.',
              'يفشل حفظ تكرار الحقل.',
            ),
            answer: bilingual(
              'The frequency is stored on the KPI definition, so the field needs a **KPI ID**. Edit the field, set the KPI ID, then try again.',
              'يُخزَّن التكرار على تعريف المؤشر، لذلك يحتاج الحقل إلى **معرّف مؤشر**. عدّل الحقل وعيّن معرّف المؤشر ثم أعد المحاولة.',
            ),
          },
          {
            question: bilingual(
              'How do I change the permissions a directorate has on a form?',
              'كيف أغيّر صلاحيات مديرية على نموذج؟',
            ),
            answer: bilingual(
              'Remove the form from the directorate, then assign it again with the new permissions.',
              'أزل النموذج من المديرية، ثم عيّنه من جديد بالصلاحيات الجديدة.',
            ),
          },
          {
            question: bilingual(
              'I see “Unable to load” on a screen.',
              'أرى «تعذر التحميل» على شاشة.',
            ),
            answer: bilingual(
              'Click **Retry** or the refresh icon. If it keeps failing, your session may have expired: log out from the profile menu and sign in again. If the problem continues, contact the development team.',
              'انقر **إعادة المحاولة** أو أيقونة التحديث. إذا استمر الفشل، فقد تكون جلستك انتهت: سجّل الخروج من قائمة الملف الشخصي ثم ادخل مجددًا. إذا استمرت المشكلة، تواصل مع فريق التطوير.',
            ),
          },
          {
            question: bilingual(
              'Should I delete or deactivate?',
              'هل أحذف أم أوقف؟',
            ),
            answer: bilingual(
              'Prefer deactivating forms and hiding fields. Deleting a field is permanent and may lose submitted data.',
              'فضّل إيقاف النماذج وإخفاء الحقول. حذف الحقل نهائي وقد يفقد البيانات المقدَّمة.',
            ),
          },
        ],
      },
    ],
  },
];

/**
 * Documentation sections in the active language.
 * Pass `true` for Arabic and `false` for English.
 */
export const getDocSections = (isAr: boolean): DocSection[] => {
  if (DOC_SECTION_SOURCE.length === 0) return [];
  return DOC_SECTION_SOURCE.map((section) => resolveSection(section, isAr));
};

/** English sections. Callers that only need the count or the stable ids can use this. */
export const DOC_SECTIONS: DocSection[] = getDocSections(false);

// ─── Search helpers ───────────────────────────────────────────────────────────

/** Flattens a block into plain text so it can be matched against a search query. */
const blockToText = (block: DocBlock): string => {
  switch (block.kind) {
    case 'paragraph':
      return block.text;
    case 'steps':
      return [block.title ?? '', ...block.steps.map((step) => `${step.title} ${step.detail ?? ''}`)].join(' ');
    case 'list':
      return [block.title ?? '', ...block.items.map((item) => `${item.term ?? ''} ${item.text}`)].join(' ');
    case 'callout':
      return `${block.title} ${block.text}`;
    case 'table':
      return [block.title ?? '', ...block.columns, ...block.rows.flat()].join(' ');
    case 'example':
      return [block.title, block.code, block.caption ?? ''].join(' ');
    case 'faq':
      return block.items.map((item) => `${item.question} ${item.answer}`).join(' ');
    default: {
      const unreachable: never = block;
      return String(unreachable);
    }
  }
};

/** Returns the full lower-cased searchable text of a section in its current language. */
export const sectionSearchText = (section: DocSection): string =>
  [section.title, section.summary, ...section.blocks.map(blockToText)].join(' ').toLowerCase();
