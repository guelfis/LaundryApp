import { useState } from "react";
import { IonInput, IonButton, IonItem, IonList, IonText, IonSpinner } from "@ionic/react";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import PageLayout from "../components/PageLayout";

export default function AuthPage() {
  const { t } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuthSubmit = async () => {
    // Prevent duplicate execution clicks
    if (isSubmitting) return;
    
    // Quick local verification checks
    if (!email || !password) {
      alert("Please fill in all mandatory credentials.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password, 
          options: { data: { full_name: fullName } } 
        });
        if (error) {
          alert(error.message);
        } else {
          alert(t('authPage.alert_signup_confirm'));
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          alert(error.message);
        }
        // NOTE: On success, AuthContext triggers an authStateChange, causing AppRoutes to swap views automatically!
      }
    } catch (err: Error | unknown) {
      alert((err as Error)?.message || "An unexpected system error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout>
      {/* 
        Container element centered cleanly via standard utility styles.
        Removing the parent HTML form avoids internal viewport submission drops.
      */}
      <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', width: '100%' }}>
        
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: 'var(--ion-text-color)' }}>
          {isSignUp ? t('authPage.title_signup') : t('authPage.title_login')}
        </h2>
        
        <IonList style={{ background: 'transparent' }}>
          {isSignUp && (
            <IonItem style={{ '--background': 'transparent', marginBottom: '12px' }}>
              <IonInput 
                type="text"
                fill="outline"
                shape="round"
                label={t('authPage.placeholder_name')}
                labelPlacement="stacked" 
                placeholder={t('authPage.placeholder_name')} 
                value={fullName}
                onIonInput={e => setFullName(e.detail.value || '')} 
                style={{ 
                  color: 'var(--ion-text-color)',
                  marginTop: '8px' /* Spacing between top label and border capsule */
                }}          
              />
            </IonItem>
          )}
          
          <IonItem style={{ '--background': 'transparent', marginBottom: '12px' }}>
            <IonInput 
              type="email" 
              fill="outline"
              shape="round"
              label={t('authPage.placeholder_email')}
              labelPlacement="stacked" 
              placeholder={t('authPage.placeholder_email')} 
              value={email}
              onIonInput={e => setEmail(e.detail.value || '')} 
              style={{ 
                color: 'var(--ion-text-color)',
                marginTop: '8px' /* Spacing between top label and border capsule */
              }}
            />
          </IonItem>

          <IonItem style={{ '--background': 'transparent', marginBottom: '20px' }}>
            <IonInput 
              type="password" 
              label={t('authPage.placeholder_password')}
              fill="outline"
              shape="round"
              labelPlacement="stacked"
              placeholder={t('authPage.placeholder_password')} 
              value={password}
              onIonInput={e => setPassword(e.detail.value || '')} 
              style={{ 
                color: 'var(--ion-text-color)',
                marginTop: '8px' /* Spacing between top label and border capsule */
              }}
            />
          </IonItem>
        </IonList>
        
        {/* 
          IonButton binds click interactions natively.
          We conditionally show an activity spinner when a web cycle is running.
        */}
        <IonButton 
          expand="block" 
          shape="round"
          color="primary"
          onClick={handleAuthSubmit}
          className="font-bold shadow-md mt-2"
        >
          {isSubmitting ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IonSpinner name="crescent" style={{ width: '20px', height: '20px' }} />
              <IonText>{t('authPage.logging_in')}</IonText>
            </div>
          ) : (
            isSignUp ? t('authPage.title_signup') : t('authPage.title_login')
          )}
        </IonButton>
        
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button 
            type="button" 

            onClick={() => {
              if (!isSubmitting) setIsSignUp(!isSignUp);
            }} 
            className="text-sm text-blue-500 font-medium text-center mt-2 focus:outline-none"

          >
            {isSignUp ? t('authPage.link_have_account') : t('authPage.link_new_user')}
          </button>
        </div>

      </div>
    </PageLayout>
  );
}
