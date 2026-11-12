import type { Language } from './language'

export type Messages = {
  meta: { title: string; description: string }
  brand: string
  signIn: string
  signOut: string
  signedIn: string
  language: { label: string; en: string; bn: string }
  home: {
    kicker: string
    title: string
    lede: string
    searchLabel: string
    searchPlaceholder: string
    searchButton: string
    stepsTitle: string
    steps: { title: string; body: string }[]
  }
  login: {
    title: string
    lede: string
    google: string
    or: string
    emailLabel: string
    emailPlaceholder: string
    send: string
    sent: string
    errorEmail: string
    errorSend: string
    errorGoogle: string
    errorLink: string
  }
  nav: { report: string; myReports: string; admin: string }
  report: {
    title: string
    lede: string
    identifierHint: string
    phonesLabel: string
    phonesHint: string
    shopLabel: string
    shopHint: string
    websiteLabel: string
    websiteHint: string
    socialLabel: string
    socialHint: string
    descriptionLabel: string
    descriptionHint: string
    amountLabel: string
    amountHint: string
    dateLabel: string
    dateHint: string
    evidenceLabel: string
    evidenceHint: string
    submit: string
    errors: Record<
      | 'identifier'
      | 'phone'
      | 'shop'
      | 'website'
      | 'social'
      | 'description'
      | 'amount'
      | 'date'
      | 'file_type'
      | 'file_size'
      | 'file_count'
      | 'file_required'
      | 'rate'
      | 'save',
      string
    >
  }
  myReports: {
    title: string
    lede: string
    empty: string
    emptyLink: string
    submitted: string
    loadError: string
    happened: string
    filed: string
    lost: string
    notes: string
    status: { pending: string; approved: string; rejected: string; needs_info: string }
    kinds: { phone: string; shop_name: string; url: string; social: string }
  }
  admin: {
    title: string
    lede: string
    empty: string
    approvedTitle: string
    approvedLede: string
    approvedEmpty: string
    open: string
    filed: string
    loadError: string
    back: string
    forbiddenTitle: string
    forbiddenBody: string
    home: string
    detail: {
      missing: string
      identifiers: string
      noIdentifiers: string
      loadError: string
      happened: string
      filed: string
      lost: string
      filedBy: string
      evidence: string
      evidenceHint: string
      evidenceEmpty: string
      evidenceError: string
      evidenceAlt: string
      otherReports: string
      approvedNow: string
      severityNow: string
      severityIfApproved: string
      severityIfUnpublished: string
      currentNote: string
      noteLabel: string
      noteHint: string
      approve: string
      reject: string
      needsInfo: string
      unpublish: string
      unpublishHint: string
      reviewed: string
      saved: string
      effect: { pending: string; approved: string; rejected: string; needs_info: string }
      errors: { note: string; state: string; missing: string; save: string }
      severity: { none: string; low: string; medium: string; high: string; critical: string }
    }
  }
}

const en: Messages = {
  meta: {
    title: 'Fraud Alert',
    description:
      'Check a bKash or Nagad number, shop name, or link before you pay.',
  },
  brand: 'Fraud Alert',
  signIn: 'Sign in',
  signOut: 'Sign out',
  signedIn: 'Signed in as',
  language: { label: 'Language', en: 'English', bn: 'বাংলা' },
  home: {
    kicker: 'bKash · Nagad',
    title: 'Check before you pay',
    lede: 'Search a phone number, shop name, or link. Only reports an admin has verified are shown to everyone.',
    searchLabel: 'Search',
    searchPlaceholder: '01XXXXXXXXX, shop name, or link',
    searchButton: 'Search',
    stepsTitle: 'How a report becomes public',
    steps: [
      {
        title: 'Report',
        body: 'A victim submits the number they paid, the shop or link, and screenshots.',
      },
      {
        title: 'Review',
        body: 'An admin approves it, rejects it, or asks for more information.',
      },
      {
        title: 'Lookup',
        body: 'Anyone can search. One or two approved reports is low. Nine or more is critical.',
      },
    ],
  },
  login: {
    title: 'Sign in',
    lede: 'Use Google, or get a link by email. No password.',
    google: 'Continue with Google',
    or: 'or',
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    send: 'Email me a link',
    sent: 'Check your email and click the sign-in link.',
    errorEmail: 'Enter a valid email address.',
    errorSend: 'The link could not be sent. Is Supabase running?',
    errorGoogle:
      'Google sign-in is not available yet. Add the Google client id and secret, or use email.',
    errorLink: 'That sign-in link is invalid or expired.',
  },
  nav: { report: 'Report a scam', myReports: 'My reports', admin: 'Review' },
  report: {
    title: 'Report a scam',
    lede: 'Add the number, shop, or link. Only you can see this until an admin approves it.',
    identifierHint: 'At least one of these is required: phone, shop, website, or social link.',
    phonesLabel: 'Scammer phone numbers',
    phonesHint: 'One per line. 017…, +88017…, and ০১৭… all work.',
    shopLabel: 'Shop or page name',
    shopHint: 'The name you saw on the page or shop.',
    websiteLabel: 'Website',
    websiteHint: 'For example, https://example.com',
    socialLabel: 'Social links',
    socialHint: 'One link per line.',
    descriptionLabel: 'What happened',
    descriptionHint: 'How the money was taken. At least a sentence or two.',
    amountLabel: 'Amount lost (BDT)',
    amountHint: 'Optional.',
    dateLabel: 'Date',
    dateHint: 'The day you paid, or the day you noticed.',
    evidenceLabel: 'Screenshots',
    evidenceHint: 'Payment, chat, or email. JPEG, PNG, or WebP. Up to 3 files, 5 MB each.',
    submit: 'Submit report',
    errors: {
      identifier: 'Add at least one phone number, shop name, website, or social link.',
      phone: 'Enter a valid Bangladeshi mobile number.',
      shop: 'A shop name needs 2 to 120 characters.',
      website: 'Enter a valid website address.',
      social: 'Enter a valid social link.',
      description: 'Describe what happened in at least 20 characters.',
      amount: 'Amount must be zero or more, in taka.',
      date: 'Choose a date that is today or earlier.',
      file_type: 'Only JPEG, PNG, and WebP images are accepted.',
      file_size: 'Each image must be 5 MB or smaller.',
      file_count: 'You can attach up to 3 images.',
      file_required: 'Attach at least one screenshot.',
      rate: 'You have already submitted 5 reports today. Try again tomorrow.',
      save: 'The report could not be saved. Please try again.',
    },
  },
  myReports: {
    title: 'My reports',
    lede: 'Reports you filed, and any note from the admin.',
    empty: 'You have not filed a report yet.',
    emptyLink: 'Report a scam',
    submitted: 'Report submitted. An admin will review it.',
    loadError: 'Your reports could not be loaded.',
    happened: 'Happened',
    filed: 'Filed',
    lost: 'Lost',
    notes: 'Admin note',
    status: {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      needs_info: 'Needs info',
    },
    kinds: { phone: 'Phone', shop_name: 'Shop', url: 'Website', social: 'Social' },
  },
  admin: {
    title: 'Review queue',
    lede: 'Reports waiting for a decision, oldest first.',
    empty: 'Nothing is waiting for review.',
    approvedTitle: 'Approved',
    approvedLede: 'These are public. Unpublish one if the listing is wrong.',
    approvedEmpty: 'No approved reports.',
    open: 'Review',
    filed: 'Filed',
    loadError: 'The queue could not be loaded.',
    back: 'Back to the queue',
    forbiddenTitle: 'Admins only',
    forbiddenBody: 'This page is for admins. A normal account cannot review reports.',
    home: 'Back home',
    detail: {
      missing: 'That report was not found.',
      identifiers: 'Identifiers',
      noIdentifiers: 'No phone, shop, or link was saved with this report.',
      loadError: 'The report could not be loaded.',
      happened: 'Happened',
      filed: 'Filed',
      lost: 'Lost',
      filedBy: 'Filed by',
      evidence: 'Screenshots',
      evidenceHint: 'These links expire after a few minutes.',
      evidenceEmpty: 'No screenshots were attached.',
      evidenceError: 'A screenshot could not be opened.',
      evidenceAlt: 'Evidence screenshot',
      otherReports: 'Other reports from this person',
      approvedNow: 'Approved reports now',
      severityNow: 'Severity now',
      severityIfApproved: 'If you approve',
      severityIfUnpublished: 'If you unpublish',
      currentNote: 'Current note',
      noteLabel: 'Note to the reporter',
      noteHint: 'This replaces the note they see on My reports.',
      approve: 'Approve',
      reject: 'Reject',
      needsInfo: 'Ask for more information',
      unpublish: 'Unpublish',
      unpublishHint: 'Unpublish sets the report to rejected. It leaves the public list and no longer counts.',
      reviewed: 'Last review',
      saved: 'Saved. The reporter can see your note.',
      effect: {
        pending: 'Only the reporter and admins can see this.',
        needs_info: 'Only the reporter and admins can see this.',
        approved: 'This report is public, and it counts toward severity.',
        rejected: 'This report is not public, and it does not count.',
      },
      errors: {
        note: 'Write a note. The reporter will see it.',
        state: 'That action does not apply to this report anymore.',
        missing: 'That report was not found.',
        save: 'The review could not be saved.',
      },
      severity: {
        none: 'None',
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        critical: 'Critical',
      },
    },
  },
}

const bn: Messages = {
  meta: {
    title: 'প্রতারণা সতর্কতা',
    description: 'টাকা পাঠানোর আগে বিকাশ বা নগদ নম্বর, দোকান, বা লিংক যাচাই করুন।',
  },
  brand: 'প্রতারণা সতর্কতা',
  signIn: 'প্রবেশ',
  signOut: 'বের হন',
  signedIn: 'প্রবেশ করেছেন',
  language: { label: 'ভাষা', en: 'English', bn: 'বাংলা' },
  home: {
    kicker: 'বিকাশ · নগদ',
    title: 'টাকা পাঠানোর আগে যাচাই করুন',
    lede: 'ফোন নম্বর, দোকানের নাম, বা লিংক খুঁজুন। অ্যাডমিন যাচাই করা রিপোর্টই শুধু সবাই দেখতে পাবে।',
    searchLabel: 'খুঁজুন',
    searchPlaceholder: '০১XXXXXXXXX, দোকানের নাম, বা লিংক',
    searchButton: 'খুঁজুন',
    stepsTitle: 'একটি রিপোর্ট কীভাবে প্রকাশ পায়',
    steps: [
      {
        title: 'রিপোর্ট',
        body: 'ভুক্তভোগী যে নম্বরে টাকা পাঠিয়েছেন, দোকান বা লিংক, আর স্ক্রিনশট জমা দেন।',
      },
      {
        title: 'যাচাই',
        body: 'অ্যাডমিন অনুমোদন করেন, বাতিল করেন, অথবা আরও তথ্য চান।',
      },
      {
        title: 'খোঁজ',
        body: 'যে কেউ খুঁজতে পারেন। অনুমোদিত রিপোর্ট ১–২ হলে কম, ৯ বা তার বেশি হলে সর্বোচ্চ সতর্কতা।',
      },
    ],
  },
  login: {
    title: 'প্রবেশ',
    lede: 'Google ব্যবহার করুন, অথবা ইমেইলে একটি লিংক নিন। পাসওয়ার্ড লাগবে না।',
    google: 'Google দিয়ে প্রবেশ',
    or: 'অথবা',
    emailLabel: 'ইমেইল',
    emailPlaceholder: 'you@example.com',
    send: 'লিংক পাঠান',
    sent: 'ইমেইল দেখে সাইন-ইন লিংকে ক্লিক করুন।',
    errorEmail: 'সঠিক ইমেইল লিখুন।',
    errorSend: 'লিংক পাঠানো যায়নি। Supabase চালু আছে কি?',
    errorGoogle:
      'Google দিয়ে প্রবেশ এখনো প্রস্তুত নয়। ক্লায়েন্ট আইডি ও সিক্রেট যোগ করুন, অথবা ইমেইল ব্যবহার করুন।',
    errorLink: 'এই লিংকটি সঠিক নয়, অথবা এর মেয়াদ শেষ।',
  },
  nav: { report: 'প্রতারণার রিপোর্ট', myReports: 'আমার রিপোর্ট', admin: 'যাচাই' },
  report: {
    title: 'প্রতারণার খবর দিন',
    lede: 'নম্বর, দোকান, বা লিংক লিখুন। অ্যাডমিন অনুমোদন না করা পর্যন্ত এটি শুধু আপনি দেখতে পাবেন।',
    identifierHint: 'ফোন, দোকান, ওয়েবসাইট, বা সামাজিক লিংকের অন্তত একটি লাগবে।',
    phonesLabel: 'প্রতারকের ফোন নম্বর',
    phonesHint: 'এক লাইনে একটি। 017…, +88017…, বা ০১৭… লেখা যাবে।',
    shopLabel: 'দোকান বা পেজের নাম',
    shopHint: 'পেজ বা দোকানে যে নাম দেখেছেন।',
    websiteLabel: 'ওয়েবসাইট',
    websiteHint: 'যেমন https://example.com',
    socialLabel: 'সামাজিক মাধ্যমের লিংক',
    socialHint: 'এক লাইনে একটি লিংক।',
    descriptionLabel: 'কী হয়েছিল',
    descriptionHint: 'টাকা কীভাবে গেছে, অন্তত এক-দুই বাক্যে লিখুন।',
    amountLabel: 'ক্ষতির পরিমাণ (টাকা)',
    amountHint: 'না দিলেও চলবে।',
    dateLabel: 'তারিখ',
    dateHint: 'যেদিন টাকা পাঠিয়েছেন, বা যেদিন বুঝতে পেরেছেন।',
    evidenceLabel: 'স্ক্রিনশট',
    evidenceHint: 'পেমেন্ট, চ্যাট, বা ইমেইল। JPEG, PNG, বা WebP। সর্বোচ্চ ৩টি, প্রতিটি ৫ মেগাবাইট।',
    submit: 'রিপোর্ট জমা দিন',
    errors: {
      identifier: 'অন্তত একটি ফোন নম্বর, দোকানের নাম, ওয়েবসাইট, বা সামাজিক লিংক দিন।',
      phone: 'বাংলাদেশের একটি সঠিক মোবাইল নম্বর লিখুন।',
      shop: 'দোকানের নাম ২ থেকে ১২০ অক্ষরের মধ্যে লিখুন।',
      website: 'সঠিক ওয়েবসাইটের ঠিকানা লিখুন।',
      social: 'সঠিক সামাজিক লিংক লিখুন।',
      description: 'কী হয়েছিল, অন্তত ২০ অক্ষরে লিখুন।',
      amount: 'পরিমাণ ০ বা তার বেশি একটি সংখ্যা হতে হবে।',
      date: 'আজকের দিন বা তার আগের একটি তারিখ বেছে নিন।',
      file_type: 'শুধু JPEG, PNG, বা WebP ছবি দেওয়া যাবে।',
      file_size: 'প্রতিটি ছবি ৫ মেগাবাইট বা তার কম হতে হবে।',
      file_count: 'সর্বোচ্চ ৩টি ছবি দেওয়া যাবে।',
      file_required: 'অন্তত একটি স্ক্রিনশট দিন।',
      rate: 'আজ ৫টি রিপোর্ট জমা হয়েছে। আগামীকাল আবার চেষ্টা করুন।',
      save: 'রিপোর্ট সেভ করা যায়নি। আবার চেষ্টা করুন।',
    },
  },
  myReports: {
    title: 'আমার রিপোর্ট',
    lede: 'আপনার জমা দেওয়া রিপোর্ট, আর অ্যাডমিনের নোট থাকলে সেটি।',
    empty: 'আপনি এখনো কোনো রিপোর্ট দেননি।',
    emptyLink: 'প্রতারণার খবর দিন',
    submitted: 'রিপোর্ট জমা হয়েছে। অ্যাডমিন যাচাই করবেন।',
    loadError: 'রিপোর্টগুলো এখন লোড করা যায়নি।',
    happened: 'ঘটনার তারিখ',
    filed: 'জমা',
    lost: 'ক্ষতি',
    notes: 'অ্যাডমিনের নোট',
    status: {
      pending: 'অপেক্ষমাণ',
      approved: 'অনুমোদিত',
      rejected: 'বাতিল',
      needs_info: 'আরও তথ্য দরকার',
    },
    kinds: { phone: 'ফোন', shop_name: 'দোকান', url: 'ওয়েবসাইট', social: 'সামাজিক' },
  },
  admin: {
    title: 'যাচাইয়ের তালিকা',
    lede: 'যে রিপোর্টগুলোর সিদ্ধান্ত বাকি, পুরোনোগুলো আগে।',
    empty: 'যাচাইয়ের জন্য কিছু নেই।',
    approvedTitle: 'অনুমোদিত',
    approvedLede: 'এগুলো সবাই দেখতে পায়। ভুল তালিকা হলে প্রকাশ বাতিল করুন।',
    approvedEmpty: 'কোনো অনুমোদিত রিপোর্ট নেই।',
    open: 'দেখুন',
    filed: 'জমা',
    loadError: 'তালিকা এখন লোড করা যায়নি।',
    back: 'তালিকায় ফিরুন',
    forbiddenTitle: 'শুধু অ্যাডমিন',
    forbiddenBody: 'এই পাতা অ্যাডমিনের জন্য। সাধারণ অ্যাকাউন্ট থেকে রিপোর্ট যাচাই করা যায় না।',
    home: 'হোমে ফিরুন',
    detail: {
      missing: 'এই রিপোর্টটি পাওয়া যায়নি।',
      identifiers: 'শনাক্তকারী তথ্য',
      noIdentifiers: 'এই রিপোর্টের সাথে কোনো ফোন, দোকান, বা লিংক সেভ হয়নি।',
      loadError: 'রিপোর্টটি এখন লোড করা যায়নি।',
      happened: 'ঘটনার তারিখ',
      filed: 'জমা',
      lost: 'ক্ষতি',
      filedBy: 'জমা দিয়েছেন',
      evidence: 'স্ক্রিনশট',
      evidenceHint: 'এই লিংক কয়েক মিনিট পর আর কাজ করবে না।',
      evidenceEmpty: 'কোনো স্ক্রিনশট নেই।',
      evidenceError: 'একটি স্ক্রিনশট খোলা যায়নি।',
      evidenceAlt: 'প্রমাণের স্ক্রিনশট',
      otherReports: 'এই ব্যক্তির অন্য রিপোর্ট',
      approvedNow: 'এখন অনুমোদিত রিপোর্ট',
      severityNow: 'এখনকার সতর্কতা',
      severityIfApproved: 'অনুমোদন করলে',
      severityIfUnpublished: 'প্রকাশ বাতিল করলে',
      currentNote: 'বর্তমান নোট',
      noteLabel: 'রিপোর্টকারীর জন্য নোট',
      noteHint: 'এটি আমার রিপোর্টে যে নোট তারা দেখেন, সেটি বদলে দেয়।',
      approve: 'অনুমোদন',
      reject: 'বাতিল',
      needsInfo: 'আরও তথ্য চান',
      unpublish: 'প্রকাশ বাতিল',
      unpublishHint:
        'প্রকাশ বাতিল করলে রিপোর্টটি বাতিল অবস্থায় যায়। এটি আর প্রকাশ্য থাকে না এবং গণনাতেও আসে না।',
      reviewed: 'সর্বশেষ যাচাই',
      saved: 'সেভ হয়েছে। রিপোর্টকারী আপনার নোট দেখতে পাবেন।',
      effect: {
        pending: 'এটি শুধু রিপোর্টকারী আর অ্যাডমিন দেখতে পাবেন।',
        needs_info: 'এটি শুধু রিপোর্টকারী আর অ্যাডমিন দেখতে পাবেন।',
        approved: 'এই রিপোর্ট প্রকাশ্য, এবং এটি সতর্কতার গণনায় ধরা হয়।',
        rejected: 'এই রিপোর্ট প্রকাশ্য নয়, এবং এটি গণনায় আসে না।',
      },
      errors: {
        note: 'একটি নোট লিখুন। রিপোর্টকারী এটি দেখবেন।',
        state: 'এই রিপোর্টে এখন এই কাজটি করা যায় না।',
        missing: 'এই রিপোর্টটি পাওয়া যায়নি।',
        save: 'যাচাই সেভ করা যায়নি।',
      },
      severity: {
        none: 'নেই',
        low: 'কম',
        medium: 'মাঝারি',
        high: 'বেশি',
        critical: 'সর্বোচ্চ',
      },
    },
  },
}

export const messages: Record<Language, Messages> = { en, bn }
