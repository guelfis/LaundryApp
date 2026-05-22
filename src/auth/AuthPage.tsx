import { useState } from "react";
import { supabase } from "../lib/supabase";
import PageLayout from "../components/PageLayout";
import { useTranslation } from "react-i18next";

export default function AuthPage() {
  const { t } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      await supabase.auth.signUp({ 
        email, 
        password, 
        options: { data: { full_name: fullName } } 
      });
      /* 1. Localized Sign Up Email Confirmation Alert */
      alert(t('authPage.alert_signup_confirm', 'Check your email for the confirmation link!'));
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
  };

  return (
    <PageLayout>
      <form onSubmit={handleAuth} className="flex flex-col gap-4 p-10 max-w-sm mx-auto">
        {/* 2. Dynamic Title translation swapping */}
        <h2 className="text-2xl font-bold">
          {isSignUp ? t('authPage.title_signup', 'Create Account') : t('authPage.title_login', 'Login')}
        </h2>
        
        {isSignUp && (
          <input 
            className="border border-gray-300 dark:border-slate-700 p-2.5 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500" 
            placeholder={t('authPage.placeholder_name', 'Full Name')} 
            onChange={e => setFullName(e.target.value)} 
          />
        )}
        
        <input 
          className="border border-gray-300 dark:border-slate-700 p-2.5 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500" 
          type="email" 
          placeholder={t('authPage.placeholder_email', 'Email')} 
          value={email}
          onChange={e => setEmail(e.target.value)} 
        />

        <input 
          className="border border-gray-300 dark:border-slate-700 p-2.5 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500" 
          type="password" 
          placeholder={t('authPage.placeholder_password', 'Password')} 
          value={password}
          onChange={e => setPassword(e.target.value)} 
        />
        
        {/* 3. Dynamic Action Button text translation */}
        <button className="bg-blue-600 text-white p-2 rounded-xl font-bold shadow-md" type="submit">
          {isSignUp ? t('authPage.title_signup', 'Create Account') : t('authPage.title_login', 'Login')}
        </button>
        
        {/* 4. Dynamic Auth Mode toggle view link layout */}
        <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-blue-500 font-medium">
          {isSignUp 
            ? t('authPage.link_have_account', 'Do you have an account?') 
            : t('authPage.link_new_user', 'New here? Sign Up')}
        </button>
      </form>
    </PageLayout>
  );
}
