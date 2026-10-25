import { ETHICS_REFERENCE, TERMS_CONTACT, TERMS_OPERATOR } from "./termsContent";

export const PRIVACY_UPDATED = "25 October 2026";

export const PRIVACY_SUMMARY = [
  "We collect your account details, the planning information you enter and your chats with Eunice, so UniVise can show your plan and personalise suggestions.",
  "Your information is stored with Supabase and AWS. Parts of it are sent to OpenAI or Anthropic when you use an AI feature. Some of these providers may process it outside Australia.",
  "We do not sell your information, show ads or send your plan to UNSW or employers.",
  "You can download or delete your data at any time from My account.",
];

export const PRIVACY_SECTIONS = [
  {
    id: "who", title: "1. Who we are",
    paragraphs: [
      `UniVise is run by ${TERMS_OPERATOR}, the name used by the UNSW Honours student who built UniVise as part of a research thesis. ${TERMS_OPERATOR} is not a company, and UniVise is not an official UNSW service. UNSW does not operate UniVise or receive your UniVise data.`,
      `This policy explains what personal information UniVise handles, why, who it is shared with and the choices you have. Contact ${TERMS_CONTACT} with any privacy question or request.`,
    ],
  },
  {
    id: "collect", title: "2. What we collect",
    paragraphs: [
      "Account details: your name, email, date of birth, gender, profile picture, sign-in provider, account identifiers, sign-in times, and the date and version of the Terms you accepted. If you sign in with Google, some of these come from your Google account. Passwords are handled by Supabase authentication and are never stored with your plans or chats.",
      "Planning information: your survey and profile answers, interests, career priorities, program and specialisations, completed courses, chosen electives, saved items, notes, planning statuses and target dates. Optional hobbies and personality answers are collected only if you choose to give them.",
      "Chats: your questions to Eunice, Eunice's replies, and the UniVise page you asked from.",
      "Technical information: request and error records, identifiers and network information created when you use the service. These are used to run, troubleshoot and secure UniVise.",
    ],
  },
  {
    id: "use", title: "3. How we use it",
    paragraphs: [
      "We use your information to sign you in, show your progress, personalise course and career suggestions, let you return to saved work and chats, answer support requests, keep the service secure and meet legal obligations.",
      "We do not sell your information, use it for advertising, or share it with UNSW or employers. Your completed courses are self-reported and are not checked against a UNSW transcript.",
      "You choose what goes into optional fields, notes and chats. Leaving something out may make suggestions less personal. Please do not enter passwords, identity documents, payment details or private information about other people.",
    ],
  },
  {
    id: "share", title: "4. Who we share it with",
    paragraphs: [
      "Supabase stores accounts, profiles, plans, chats and saved items, and handles sign-in. AWS hosts the website and backend, including its operational logs.",
      "OpenAI and Anthropic process AI requests. When you chat with Eunice, the request can include recent messages and context such as your program, specialisations, interests, completed courses, progress, course suggestions, shortlisted careers and the page you asked from. Other AI features send only what their task needs, such as program details or career interests. Text you type is not automatically stripped of personal details.",
      "Job, internship and event searches send search terms such as a role, field or location to Adzuna, Eventbrite, Humanitix, Meetup and AI web search. They do not receive your account details.",
      "Each provider receives only what its function needs. We may also disclose information where the law requires it.",
    ],
  },
  {
    id: "overseas", title: "5. Storage outside Australia",
    paragraphs: [
      "Our providers may store or process information in other countries, including the United States. Their handling, retention and training settings depend on their own terms and our configuration. We do not promise that your information stays in Australia. Contact us for the current details of a provider.",
    ],
  },
  {
    id: "security", title: "6. Security",
    paragraphs: [
      "The website and API use HTTPS. Each account can reach only its own records through database access rules and backend ownership checks, and server credentials are kept out of the browser. Exporting or deleting data requires you to be signed in.",
      "No system is free of risk, so we cannot guarantee that a breach will never happen. If one affects your personal information, we will investigate and make any notifications the law requires. Keep your sign-in secure and sign out on shared devices.",
    ],
  },
  {
    id: "browser", title: "7. Browser storage",
    paragraphs: [
      "UniVise does not use advertising or tracking cookies. Your browser keeps your sign-in session, your theme, whether you have seen guided tours and whether you have closed the independence notice. An unfinished onboarding survey is saved for the current browser session.",
      "Clearing site data signs you out and resets these preferences, but does not delete your account. Google sign-in and other linked websites use their own cookies under their own policies.",
    ],
  },
  {
    id: "your-rights", title: "8. Access, correction and deletion",
    paragraphs: [
      "In My account you can update your profile, download a copy of your data or delete your account. Saved items and chats can also be removed where they appear. Contact us for anything the app cannot do, such as correcting a record you cannot edit.",
      "Deleting your account removes your Supabase account and the UniVise records linked to it. It cannot recall information already sent to an AI provider, and copies may remain for a time in backups or provider logs under their retention settings. Deleting UniVise data does not affect your UNSW records.",
    ],
  },
  {
    id: "retention", title: "9. How long we keep it",
    paragraphs: [
      "We keep your account information until you delete your account or ask us to delete it. Backups and provider logs follow their own retention periods. Contact us if you need to know how a particular record is handled.",
    ],
  },
  {
    id: "research", title: "10. Research",
    paragraphs: [
      `UniVise was built as part of an Honours research thesis approved by the UNSW Human Research Ethics process (reference ${ETHICS_REFERENCE}).`,
      "Using UniVise does not make you a research participant. The information described in this policy is used for the research only if you separately agree to take part, after being told what the study involves, how your information will be used and how to withdraw. If you are under 18, a parent or guardian must also agree. Research results will not identify you publicly.",
    ],
  },
  {
    id: "complaints", title: "11. Questions and complaints",
    paragraphs: [
      `Email ${TERMS_CONTACT} with your account email and a description of the issue. We may ask you to confirm your identity before sharing or changing account information. We will reply as soon as we can, and within 30 days.`,
      "If you are not satisfied with our response, you can contact the Office of the Australian Information Commissioner at oaic.gov.au.",
    ],
  },
  {
    id: "changes", title: "12. Changes to this policy",
    paragraphs: [
      "We will update this policy when UniVise or its providers change. The date at the top shows the latest version. For significant changes we will tell you in the app before they take effect.",
    ],
  },
];
