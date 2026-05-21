import { useState } from "react";
import { supabase } from "../lib/supabase";
import PageLayout from "../components/PageLayout";

export default function AuthPage() {
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
      alert("Check your email for the confirmation link!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
  };

  return (
    <PageLayout>
        <form onSubmit={handleAuth} className="flex flex-col gap-4 p-10 max-w-sm mx-auto">
        <h2 className="text-2xl font-bold">{isSignUp ? 'Create Account' : 'Login'}</h2>
        {isSignUp && (
            <input className="border p-2" placeholder="Full Name" onChange={e => setFullName(e.target.value)} />
        )}
        <input 
          className="border border-gray-300 dark:border-slate-700 p-2.5 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500" 
          type="email" 
          placeholder="Email" 
          value={email}
          onChange={e => setEmail(e.target.value)} 
        />

        <input 
          className="border border-gray-300 dark:border-slate-700 p-2.5 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500" 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={e => setPassword(e.target.value)} 
        />
        <button className="bg-blue-600 text-white p-2 rounded" type="submit">
            {isSignUp ? 'Create Account' : 'Login'}
        </button>
        <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-blue-500">
            {isSignUp ? 'Do you have an account?' : 'New here? Sign Up'}
        </button>
        </form>
    </PageLayout>
  );
}
