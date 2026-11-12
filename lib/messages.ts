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
}

export const messages: Record<Language, Messages> = { en, bn }
