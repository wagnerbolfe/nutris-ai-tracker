import { Colors } from '../../constants/Colors';
import { useClerk, useSignUp, useSSO } from '@clerk/expo';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { createUserProfile } from '../../lib/firestore';

WebBrowser.maybeCompleteAuthSession();

const { height } = Dimensions.get('window');

type Step = 'register' | 'verify';

export default function SignUpScreen() {
  const { signUp, fetchStatus } = useSignUp();
  const { setActive } = useClerk();
  const router = useRouter();
  const { startSSOFlow } = useSSO();

  const [step, setStep] = useState<Step>('register');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [codeFocused, setCodeFocused] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const onSignUp = useCallback(async () => {
    setError('');
    try {
      const { error: signUpError } = await signUp.password({
        emailAddress: email,
        password,
        firstName: fullName.split(' ')[0],
        lastName: fullName.split(' ').slice(1).join(' ') || undefined,
      });

      if (signUpError) {
        setError(signUpError.message ?? 'Sign up failed. Please try again.');
        return;
      }

      // Send email verification code
      await signUp.verifications.sendEmailCode();
      setStep('verify');
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      setError(clerkError?.errors?.[0]?.message ?? 'Sign up failed. Please try again.');
    }
  }, [signUp, fullName, email, password]);

  const onVerify = useCallback(async () => {
    setError('');
    try {
      await signUp.verifications.verifyEmailCode({ code });

      if (signUp.status === 'complete') {
        const userId = signUp.createdUserId;
        const sessionId = signUp.createdSessionId;

        // Save user profile to Firestore first
        if (userId) {
          try {
            await createUserProfile(userId, {
              fullName,
              email,
              imageUrl: null,
            });
            console.log('[Firestore] User profile saved for:', userId);
          } catch (fsErr) {
            console.warn('[Firestore] Failed to save profile:', fsErr);
          }
        }

        // Activate session and navigate
        if (sessionId && setActive) {
          await setActive({ session: sessionId });
        }
        // The RootLayout AuthGuard will automatically redirect to /(home) when isSignedIn changes to true
      } else {
        setError('Verification could not be completed. Please try again.');
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      setError(clerkError?.errors?.[0]?.message ?? 'Verification failed. Please try again.');
    }
  }, [signUp, code, fullName, email, router]);

  const onGoogleSignUp = useCallback(async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive, signUp: oAuthSignUp } = await startSSOFlow({
        strategy: 'oauth_google',
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        // Save Google user profile to Firestore if new user
        if (oAuthSignUp?.createdUserId) {
          try {
            await createUserProfile(oAuthSignUp.createdUserId, {
              fullName: `${oAuthSignUp.firstName ?? ''} ${oAuthSignUp.lastName ?? ''}`.trim(),
              email: oAuthSignUp.emailAddress ?? null,
              imageUrl: null,
            });
            console.log('[Firestore] Google user profile saved for:', oAuthSignUp.createdUserId);
          } catch (fsErr) {
            console.warn('[Firestore] Failed to save Google profile:', fsErr);
          }
        }
        // The RootLayout AuthGuard will automatically redirect to /(home) when isSignedIn changes to true
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      setError(clerkError?.errors?.[0]?.message ?? 'Google sign up failed.');
    } finally {
      setGoogleLoading(false);
    }
  }, [startSSOFlow, router]);

  const isLoading = fetchStatus === 'fetching';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background gradient */}
      <LinearGradient
        colors={Colors.backgroundGradient}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <View style={styles.blob3} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo + Brand */}
          <View style={styles.brandSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/logo.svg')}
                style={styles.logo}
                contentFit="contain"
              />
            </View>
            <Text style={styles.appName}>Nutris AI</Text>
            <Text style={styles.tagline}>Your smart calories companion</Text>
          </View>

          {/* ─── STEP 1: Registration ─── */}
          {step === 'register' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Create Account ✨</Text>
              <Text style={styles.cardSubtitle}>Start tracking your nutrition journey</Text>

              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>⚠️  {error}</Text>
                </View>
              ) : null}

              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={[styles.inputWrapper, nameFocused && styles.inputWrapperFocused]}>
                  <Text style={styles.inputIcon}>👤</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Your full name"
                    placeholderTextColor={Colors.placeholderText}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    selectionColor={Colors.primary}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                  <Text style={styles.inputIcon}>✉️</Text>
                  <TextInput
                    ref={emailRef}
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={Colors.placeholderText}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    selectionColor={Colors.primary}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    ref={passwordRef}
                    style={styles.input}
                    placeholder="Create a strong password"
                    placeholderTextColor={Colors.placeholderText}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={onSignUp}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    selectionColor={Colors.primary}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Terms hint */}
              <Text style={styles.termsText}>
                By continuing, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> &{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>

              {/* Create Account Button */}
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={onSignUp}
                activeOpacity={0.85}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  style={styles.primaryBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Create Account</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or sign up with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Button */}
              <TouchableOpacity
                style={styles.googleBtn}
                onPress={onGoogleSignUp}
                activeOpacity={0.85}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <ActivityIndicator color={Colors.primary} size="small" />
                ) : (
                  <>
                    <Text style={styles.googleIcon}>G</Text>
                    <Text style={styles.googleBtnText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ─── STEP 2: Email Verification ─── */}
          {step === 'verify' && (
            <View style={styles.card}>
              <View style={styles.verifyIconWrapper}>
                <Text style={styles.verifyEmoji}>📬</Text>
              </View>
              <Text style={styles.cardTitle}>Check your inbox</Text>
              <Text style={styles.cardSubtitle}>
                We've sent a 6-digit code to{'\n'}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>

              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>⚠️  {error}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Verification Code</Text>
                <View style={[styles.inputWrapper, styles.codeWrapper, codeFocused && styles.inputWrapperFocused]}>
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    placeholder="000000"
                    placeholderTextColor={Colors.placeholderText}
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    returnKeyType="done"
                    onSubmitEditing={onVerify}
                    onFocus={() => setCodeFocused(true)}
                    onBlur={() => setCodeFocused(false)}
                    selectionColor={Colors.primary}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={onVerify}
                activeOpacity={0.85}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  style={styles.primaryBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Verify & Continue</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => { setStep('register'); setError(''); }}
              >
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Sign In Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.06,
    paddingBottom: 40,
  },

  blob1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.blob1,
    opacity: 0.25,
    top: -80,
    left: -80,
  },
  blob2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.blob2,
    opacity: 0.3,
    bottom: 100,
    right: -60,
  },
  blob3: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.blob3,
    opacity: 0.1,
    top: 180,
    right: 30,
  },

  brandSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.logoBackground,
    borderWidth: 1.5,
    borderColor: Colors.logoBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '400',
  },

  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 24,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },

  errorBanner: {
    backgroundColor: Colors.errorBackground,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.errorText,
    fontSize: 13,
    fontWeight: '500',
  },

  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: Colors.inputLabel,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    height: 54,
  },
  inputWrapperFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.inputFocusedBackground,
  },
  codeWrapper: {
    justifyContent: 'center',
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    fontWeight: '400',
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 12,
  },
  eyeBtn: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 16,
  },

  termsText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '600',
  },

  primaryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 22,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnGradient: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.divider,
  },
  dividerText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 12,
  },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.googleButtonBorder,
    backgroundColor: Colors.cardBackground,
    gap: 10,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.googleIcon,
    fontFamily: 'serif',
  },
  googleBtnText: {
    color: Colors.googleText,
    fontSize: 15,
    fontWeight: '600',
  },

  // Verify step
  verifyIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: Colors.logoBackground,
    borderWidth: 1.5,
    borderColor: Colors.logoBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyEmoji: {
    fontSize: 32,
  },
  emailHighlight: {
    color: Colors.primary,
    fontWeight: '600',
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  backBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
