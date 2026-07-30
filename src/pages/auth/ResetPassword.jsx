import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import styles from './Login.module.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { resetPassword, isLoading } = useAuthStore();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Supabase ouvre une session temporaire via le lien reçu par email.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    const result = await resetPassword(null, password, confirmPassword);
    if (result.success) {
      toast.success('Mot de passe mis à jour. Vous pouvez vous connecter.');
      navigate('/login');
    } else {
      toast.error(result.error || 'Erreur lors de la réinitialisation');
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.leftSide}>
        <div className={styles.decorativeElements}>
          <div className={styles.orb1} />
          <div className={styles.orb2} />
          <div className={styles.circleRing} />
        </div>
        <div className={styles.brandingContent}>
          <div>
            <h1 className={styles.brandingTitle}>Dar Al-Hayaa</h1>
            <p className={styles.brandingSubtitle}>Élégance &amp; Tradition</p>
          </div>
          <p className={styles.brandingDesc}>
            Choisissez un nouveau mot de passe pour sécuriser votre compte.
          </p>
        </div>
      </div>

      <div className={styles.rightSide}>
        <div className={styles.formContainer}>
          <div className={styles.mobileLogo}>
            <h1 className={styles.mobileLogoTitle}>Dar Al-Hayaa</h1>
            <p className={styles.mobileLogoSubtitle}>Élégance &amp; Tradition</p>
          </div>

          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Nouveau mot de passe</h2>
              <p className={styles.formSubtitle}>
                {ready
                  ? 'Saisissez votre nouveau mot de passe.'
                  : 'Ouvrez cette page depuis le lien reçu par email pour continuer.'}
              </p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.inputLabel}>
                  Nouveau mot de passe
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.input}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword" className={styles.inputLabel}>
                  Confirmer le mot de passe
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={styles.input}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !ready}
                className={styles.submitButton}
              >
                <span>{isLoading ? 'Enregistrement...' : 'Mettre à jour'}</span>
              </button>

              <div className={styles.registerPrompt}>
                <p>
                  <Link to="/login" className={styles.registerLink}>
                    Retour à la connexion
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
