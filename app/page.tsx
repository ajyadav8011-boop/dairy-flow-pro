'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TermsLandingPage() {
  const [agreed, setAgreed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const accepted = localStorage.getItem('dairyTermsAccepted');
    if (accepted === 'true') {
      router.push('/auth');
    }
  }, [router]);

  const handleAllow = () => {
    if (agreed) {
      localStorage.setItem('dairyTermsAccepted', 'true');
      router.push('/auth');
    } else {
      alert('Kripya aage badhne ke liye terms ko allow karein.');
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '40px auto', padding: '25px', fontFamily: 'sans-serif', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginBottom: '20px', color: '#00796B', fontSize: '22px', fontWeight: 'bold' }}>Dairy Flow Pro - Terms & Conditions</h2>

      <div style={{ 
        height: '280px', 
        overflowY: 'scroll', 
        padding: '20px', 
        border: '1px solid #cbd5e1', 
        borderRadius: '8px',
        backgroundColor: '#f8fafc',
        marginBottom: '20px',
        lineHeight: '1.7',
        fontSize: '14px',
        color: '#334155'
      }}>
        Dairy Flow Pro is built with the primary purpose of helping dairy owners, workers, and farmers manage their daily milk collection, animal records, financial tracking, payment calculations, and operational summaries smoothly and efficiently, ensuring that everyone involved in the dairy ecosystem can keep track of their daily work transparently and without unnecessary complications. Every feature integrated into this platform has been designed specifically to support the daily workflow of managing milk distribution, maintaining daily shift records, tracking fat and SNF values, handling customer accounts, and generating reports digitally. However, while we provide this platform as a helpful management tool to make your daily routine easier, it is absolutely essential for every user, dairy owner, and farmer to understand how data, system usage, privacy, and liabilities are handled as you navigate through the application. As you move forward into the subsequent pages, explore the various dashboard features, enter daily data, and use the system regularly, please be explicitly aware of our strict liability terms regarding data security, system operations, and unexpected technical failures. We take absolutely no responsibility or liability whatsoever for any data loss, data corruption, financial loss, server downtime, system errors, data leaks, or security breaches that may occur on the platform under any circumstances whatsoever. The user, dairy owner, and farmer explicitly acknowledge, understand, and agree that we carry zero legal, operational, financial, or moral liability for what happens to the data entered, stored, or processed within the system, whether due to technical glitches, software bugs, unauthorized access, hacking attempts, third-party interference, or any unforeseen circumstances beyond our control. You are solely, entirely, and completely responsible for your own data security, account credentials, device safety, operational choices, and passwords. The service is provided strictly on an as-is and as-available basis without any warranties or guarantees of any kind, whether express or implied, meaning we do not guarantee uninterrupted access, error-free execution, or absolute perfection in system performance. By continuing to use this application, accessing the features, scrolling through the pages, and proceeding further into the system, you unconditionally accept that the platform provider bears no responsibility for any unexpected issues, breaches, losses, or damages, and you completely agree to these terms to proceed further.
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
        <input 
          type="checkbox" 
          id="termsCheck" 
          checked={agreed} 
          onChange={(e) => setAgreed(e.target.checked)}
          style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#00796B' }}
        />
        <label htmlFor="termsCheck" style={{ cursor: 'pointer', fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
          I have read and agree to all the terms and conditions. Allow access.
        </label>
      </div>

      <button 
        onClick={handleAllow}
        disabled={!agreed}
        style={{
          padding: '14px 32px',
          backgroundColor: agreed ? '#00796B' : '#cbd5e1',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: agreed ? 'pointer' : 'not-allowed',
          fontWeight: 'bold',
          transition: 'background-color 0.2s'
        }}
      >
        Allow & Continue
      </button>
    </div>
  );
}