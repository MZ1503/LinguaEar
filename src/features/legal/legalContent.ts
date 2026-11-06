export type LegalSection = { heading: string; paragraphs: string[]; bullets?: string[] };

export type LegalDocument = { title: string; updated: string; intro: string; sections: LegalSection[] };

const UPDATED = '5 November 2026';
const CONTACT = 'linguaear@gmail.com';

export const TERMS: LegalDocument = {
  title: 'Terms & Conditions',
  updated: UPDATED,
  intro:
    'These terms govern your use of LinguaEar. By creating an account or using the app you agree to them.',
  sections: [
    {
      heading: '1. The service',
      paragraphs: [
        'LinguaEar helps you practise German with speech recognition, AI-generated feedback, a camera translator, quizzes and role-play scenarios. Features can change as the app improves.',
      ],
    },
    {
      heading: '2. Your account',
      paragraphs: [
        'You need an account to use LinguaEar. Give accurate details, keep your password private, and tell us if you think someone else has access. You are responsible for what happens under your account.',
        'You must verify your email address with the code we send before using the app.',
      ],
    },
    {
      heading: '3. Free trial and subscriptions',
      paragraphs: [
        'New accounts get a free trial of 7 days. No payment details are needed for the trial. When it ends, you need a paid plan (Standard or Pro) to keep using the app.',
        'Subscriptions renew every month until you cancel. Payments are handled by Stripe. You can cancel, change plan or update your card at any time from Settings → Subscription → Manage subscription. Cancelling stops the next renewal; you keep access until the end of the period you have paid for.',
        'Fees already paid are not refunded, except where the law says otherwise. If you delete your account, your subscription is cancelled.',
      ],
    },
    {
      heading: '4. Daily limits',
      paragraphs: [
        'Each plan includes daily limits on AI features (phrase analyses, camera scans, game replies and voice recordings) and a maximum number of saved phrases. The limits are shown in the app and reset at midnight UTC. We may adjust limits to keep the service fair and reliable.',
      ],
    },
    {
      heading: '5. AI-generated content',
      paragraphs: [
        'Corrections, translations, explanations and quizzes are produced by AI and can contain mistakes. Use them as learning help, not as certified translations. The immigration and everyday scenarios are for practice only and are not legal advice or an official preparation for any authority.',
      ],
    },
    {
      heading: '6. Acceptable use',
      paragraphs: ['You agree not to:'],
      bullets: [
        'misuse the service, try to break or overload it, or get around its limits',
        'use it to produce unlawful, abusive or harmful content',
        'copy, resell or reverse-engineer the app, except where the law allows',
        'share your account with others',
      ],
    },
    {
      heading: '7. Your content',
      paragraphs: [
        'You keep the rights to what you say, type and save. You allow us to process it to provide the service, as described in the Privacy Policy.',
      ],
    },
    {
      heading: '8. Ending your account',
      paragraphs: [
        'You can delete your account at any time in Settings. We may suspend or close accounts that break these terms. When an account is deleted, its data is removed as described in the Privacy Policy.',
      ],
    },
    {
      heading: '9. Availability and liability',
      paragraphs: [
        'We work to keep LinguaEar available but cannot promise it will always run without interruption or error. We are liable without limit for intent, gross negligence, injury to life, body or health, and where mandatory law requires. Otherwise, our liability is limited to foreseeable damage typical for this kind of contract, and only for breach of essential obligations.',
      ],
    },
    {
      heading: '10. Changes to these terms',
      paragraphs: [
        'We may update these terms. If a change is significant we will tell you in the app or by email. Continuing to use LinguaEar after a change means you accept it.',
      ],
    },
    {
      heading: '11. Governing law and contact',
      paragraphs: [
        `These terms are governed by German law, without taking away mandatory consumer rights in the country where you live. Questions: ${CONTACT}.`,
      ],
    },
  ],
};

export const PRIVACY: LegalDocument = {
  title: 'Privacy Policy',
  updated: UPDATED,
  intro:
    'This policy explains what data LinguaEar handles, why, who receives it and what rights you have. We keep it as small as we can.',
  sections: [
    {
      heading: '1. Who is responsible',
      paragraphs: [`LinguaEar, Cologne, Germany. Email: ${CONTACT}.`],
    },
    {
      heading: '2. What we collect',
      paragraphs: [],
      bullets: [
        'Account: username, email address, a securely hashed password, and optional name and bio.',
        'Learning data you choose to keep: saved phrases, quiz results, points and streaks, your goal and level.',
        'Usage counts: how many AI features you used today, to apply daily limits.',
        'Support: the messages you send through the app.',
        'Subscription status from Stripe. We never see or store your card details.',
        'Technical data our servers need to run, such as request logs and error reports.',
      ],
    },
    {
      heading: '3. Voice, text and camera photos',
      paragraphs: [
        'Recordings, the text of what you say, and photos you scan are sent through our servers to our AI provider to produce a transcript, a translation or feedback. We do not keep your audio or photos. The text you choose to save with "Save to history" is stored with your account until you delete it.',
      ],
    },
    {
      heading: '4. Why we use it (legal basis)',
      paragraphs: [],
      bullets: [
        'To provide the app and your account, including subscriptions (Art. 6(1)(b) GDPR, contract).',
        'To keep the service secure and prevent abuse (Art. 6(1)(f), legitimate interest).',
        'To send optional emails such as practice reminders, only if you switch them on in Settings (Art. 6(1)(a), consent). You can turn them off at any time.',
        'To meet legal duties, such as tax records for payments (Art. 6(1)(c)).',
      ],
    },
    {
      heading: '5. Who receives data',
      paragraphs: ['We use service providers who process data on our behalf:'],
      bullets: [
        'Groq: AI processing of speech, text and photos.',
        'Stripe: payments and subscriptions.',
        'Our email provider: verification codes, password resets, support and optional emails.',
        'Our hosting provider.',
      ],
    },
    {
      heading: '6. How long we keep it',
      paragraphs: [
        'Account data and saved phrases stay until you delete them or your account. Deleting your account removes your profile, saved phrases, scores, tickets and preferences. Payment records may be kept for as long as tax law requires.',
      ],
    },
    {
      heading: '7. Your rights',
      paragraphs: [
        'You can ask for access to your data, correction, deletion, restriction, a copy in a usable format, and you can object to processing. You can edit your profile and delete your account yourself in Settings. For anything else, write to us. You also have the right to complain to a data protection authority.',
      ],
    },
    {
      heading: '8. Emails we send',
      paragraphs: [
        'Security emails (verification and password reset codes) and replies to your support requests are always sent. Practice reminders and product updates are off unless you switch them on, and every such email has an unsubscribe link.',
      ],
    },
    {
      heading: '9. Children',
      paragraphs: ['LinguaEar is not meant for children under 16.'],
    },
    {
      heading: '10. Changes',
      paragraphs: [
        'If we change this policy in a significant way, we will let you know in the app or by email.',
      ],
    },
  ],
};

export const IMPRESSUM: LegalDocument = {
  title: 'Legal notice (Impressum)',
  updated: UPDATED,
  intro: 'Information about the provider of LinguaEar.',
  sections: [
    {
      heading: 'Provider',
      paragraphs: ['LinguaEar', 'Cologne, Germany'],
    },
    {
      heading: 'Contact',
      paragraphs: [`Email: ${CONTACT}`],
    },
  ],
};
