import { Colors } from '../../constants/Colors';
import { useClerk, useSignIn, useSSO } from '@clerk/expo';
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

WebBrowser.maybeCompleteAuthSession();

const { height } = Dimensions.get('window');

export default function SignInScreen() {
  const { signIn, fetchStatus } = useSignIn();
  const { setActive } = useClerk();
  const router = useRouter();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  const onSignIn = useCallback(async () => {
    setError('');
    try {
      const { error: signInError } = await signIn.password({
        emailAddress: email,
        password,
      });

      if (signInError) {
        setError(signInError.message ?? 'Sign in failed. Please try again.');
        return;
      }

      if (signIn.status === 'complete') {
        await setActive({ session: signIn.createdSessionId });
        // The RootLayout AuthGuard will automatically redirect to /(home) when isSignedIn changes to true
      } else {
        setError('Sign in could not be completed. Please try again.');
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      setError(clerkError?.errors?.[0]?.message ?? 'Sign in failed. Please try again.');
    }
  }, [signIn, email, password, router, setActive]);

  const onGoogleSignIn = useCallback(async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        // The RootLayout AuthGuard will automatically redirect to /(home) when isSignedIn changes to true
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      setError(clerkError?.errors?.[0]?.message ?? 'Google sign in failed.');
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

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back 👋</Text>
            <Text style={styles.cardSubtitle}>Sign in to continue your health journey</Text>

            {/* Error */}
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠️  {error}</Text>
              </View>
            ) : null}

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
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

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.placeholderText}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={onSignIn}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  selectionColor={Colors.primary}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={onSignIn}
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
                  <Text style={styles.primaryBtnText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Button */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={onGoogleSignIn}
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

          {/* Sign Up Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Create Account</Text>
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
    paddingTop: height * 0.07,
    paddingBottom: 40,
  },

  // Decorative blobs
  blob1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.blob1,
    opacity: 0.25,
    top: -80,
    right: -80,
  },
  blob2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.blob2,
    opacity: 0.3,
    bottom: 100,
    left: -60,
  },
  blob3: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.primaryDark,
    opacity: 0.15,
    bottom: 300,
    right: 20,
  },

  // Brand
  brandSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: Colors.logoBackground,
    borderWidth: 1.5,
    borderColor: Colors.logoBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    overflow: 'hidden',
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '400',
  },

  // Card
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
  },

  // Error
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

  // Inputs
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
  eyeBtn: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 16,
  },

  // Forgot
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 22,
    marginTop: -4,
  },
  forgotText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },

  // Primary button
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

  // Divider
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

  // Google button
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

  // Footer
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
