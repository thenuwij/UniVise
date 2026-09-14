
// Reusable style configuration
const documentStyles = {
  scrollContainer: "max-h-[70vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600",
  title: "text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-200 dark:border-gray-700",
  subtitle: "text-xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4 first:mt-0",
  paragraph: "text-gray-700 dark:text-gray-300 leading-relaxed mb-4",
  strongText: "font-semibold text-gray-900 dark:text-white",
  list: "space-y-3 mb-6",
  listItem: "text-gray-700 dark:text-gray-300 leading-relaxed flex items-start",
  bulletPoint: "w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0",
  link: "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
};

export function TermsText() {
  return (
    <div>
      <div className={documentStyles.scrollContainer}>
        <h1 className={documentStyles.title}>
          UniVise Terms and Conditions
        </h1>
        
        <p className={documentStyles.paragraph}>
          These Terms and Conditions ("Terms") govern your use of the UniVise web
          application ("UniVise", "we", "our", "us"). By creating an account,
          accessing, or using UniVise, you agree to be bound by these Terms. If you
          do not agree, you must not use UniVise.
        </p>

        <h2 className={documentStyles.subtitle}>1. About UniVise</h2>
        <p className={documentStyles.paragraph}>
          UniVise is an educational and career guidance platform that provides
          students with recommendations, planning tools, and access to AI-powered
          resources. UniVise is provided for <span className={documentStyles.strongText}>informational and educational purposes only</span>. 
          We do not guarantee academic, career, or admission outcomes.
        </p>

        <h2 className={documentStyles.subtitle}>2. Eligibility</h2>
        <ul className={documentStyles.list}>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            You must be at least 13 years old to create an account.
          </li>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            If you are under 18, you must have permission from a parent or guardian.
          </li>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            By registering, you confirm that the information you provide is accurate and complete.
          </li>
        </ul>

        <h2 className={documentStyles.subtitle}>3. User Accounts</h2>
        <ul className={documentStyles.list}>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            You are responsible for maintaining the confidentiality of your account credentials.
          </li>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            You are responsible for all activity under your account.
          </li>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            We may suspend or terminate accounts that provide false information or violate these Terms.
          </li>
        </ul>

        <h2 className={documentStyles.subtitle}>4. Acceptable Use</h2>
        <p className={documentStyles.paragraph}>You agree not to:</p>
        <ul className={documentStyles.list}>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            Use UniVise for unlawful, harmful, or fraudulent purposes.
          </li>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            Upload or share offensive, abusive, or infringing content.
          </li>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            Interfere with UniVise's security, performance, or availability.
          </li>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            Reverse engineer, copy, or exploit UniVise without permission.
          </li>
        </ul>

        <h2 className={documentStyles.subtitle}>5. Data and Privacy</h2>
        <ul className={documentStyles.list}>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            UniVise collects and stores information you provide, such as survey responses, academic details, and account information.
          </li>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            We use third-party services including Supabase (for storage/authentication) and OpenAI (for AI responses).
          </li>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            By using UniVise, you consent to this data processing.
          </li>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            Your data will be handled in accordance with our Privacy Policy
          </li>
        </ul>

        <h2 className={documentStyles.subtitle}>6. AI-Generated Content Disclaimer</h2>
        <ul className={documentStyles.list}>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            AI recommendations are for informational purposes only.
          </li>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            We do not guarantee accuracy or suitability of AI outputs.
          </li>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            AI content should not replace professional advice from teachers, advisors, or universities.
          </li>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            You rely on AI content at your own risk.
          </li>
        </ul>

        <h2 className={documentStyles.subtitle}>7. Intellectual Property</h2>
        <ul className={documentStyles.list}>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            All intellectual property rights in UniVise are owned by UniVise or its licensors.
          </li>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            You retain ownership of your data, but grant UniVise a licence to use it for operating and improving the service.
          </li>
        </ul>

        <h2 className={documentStyles.subtitle}>8. Limitation of Liability</h2>
        <ul className={documentStyles.list}>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            To the fullest extent permitted by law, UniVise disclaims liability for indirect or consequential damages.
          </li>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            UniVise is provided "as is" without warranties of any kind.
          </li>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            Nothing in these Terms limits liability that cannot legally be excluded.
          </li>
        </ul>

        <h2 className={documentStyles.subtitle}>9. Termination</h2>
        <ul className={documentStyles.list}>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            You may stop using UniVise and request deletion of your account at any time.
          </li>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            We may suspend or terminate your access if you breach these Terms.
          </li>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            Upon termination, your right to use UniVise immediately ceases.
          </li>
        </ul>

        <h2 className={documentStyles.subtitle}>10. Changes to Terms</h2>
        <ul className={documentStyles.list}>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            We may update these Terms from time to time.
          </li>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            If material changes occur, we will notify you via the app or email.
          </li>
          <li className={documentStyles.listItem}>
            <div className={documentStyles.bulletPoint}></div>
            Continued use of UniVise after changes constitutes acceptance.
          </li>
        </ul>

        <h2 className={documentStyles.subtitle}>11. Governing Law</h2>
        <p className={documentStyles.paragraph}>
          These Terms are governed by the laws of New South Wales, Australia. Any 
          disputes will be subject to the exclusive jurisdiction of the courts of 
          New South Wales.
        </p>
      </div>
    </div>
  );
}