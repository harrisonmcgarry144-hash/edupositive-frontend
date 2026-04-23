import { C } from "../components/ui";

export default function Privacy() {
  return (
    <div style={{ padding:"20px 16px 100px", maxWidth:700, margin:"0 auto" }}>
      <h1 style={{ fontSize:28, fontWeight:800, color:C.text, marginBottom:4, fontFamily:"var(--font-serif)" }}>Privacy Policy</h1>
      <p style={{ fontSize:12, color:C.textMuted, marginBottom:32 }}>Last updated: April 2026</p>

      {[
        { title:"1. Who we are", body:"EduPositive is an A-Level revision platform operated as a sole trader in the United Kingdom. You can contact us at noreply@edupositive.xyz." },
        { title:"2. What data we collect", body:"We collect your name, email address, username, and password (hashed). We also collect usage data including lessons completed, flashcard progress, exam scores, and study time. This data is used to personalise your learning experience." },
        { title:"3. How we use your data", body:"Your data is used to provide the EduPositive service, personalise your lessons and study recommendations, track your progress, and send you relevant study reminders. We do not sell your data to third parties." },
        { title:"4. Data storage", body:"Your data is stored on Render (US-based servers) and managed through a PostgreSQL database. Passwords are hashed using bcrypt and never stored in plain text." },
        { title:"5. Third-party services", body:"We use Stripe for payment processing, Resend for email delivery, Cloudinary for image storage, and Google Gemini for AI features. Each of these services has their own privacy policy." },
        { title:"6. Your rights (GDPR)", body:"Under GDPR you have the right to access, correct, or delete your personal data. You can delete your account at any time from Settings → Account → Delete Account. This permanently removes all your data." },
        { title:"7. Cookies", body:"We use a single authentication token stored in localStorage. We do not use tracking cookies or third-party advertising cookies." },
        { title:"8. Children", body:"EduPositive is designed for students aged 16 and over (A-Level age). Users under 16 should have parental consent before using the service." },
        { title:"9. Changes", body:"We may update this policy. You will be notified by email of significant changes." },
        { title:"10. Contact", body:"For privacy concerns, email noreply@edupositive.xyz" },
      ].map(s => (
        <div key={s.title} style={{ marginBottom:24 }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:8 }}>{s.title}</h2>
          <p style={{ fontSize:14, color:C.textSec, lineHeight:1.7 }}>{s.body}</p>
        </div>
      ))}
    </div>
  );
}
