import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'CodeMentor AI — AI-Powered Code Review Platform',
  description: 'Get instant AI code reviews with scores, bug detection, security analysis, and performance insights. Powered by Groq AI.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1a1a2e',
                color: '#f0f0f5',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
