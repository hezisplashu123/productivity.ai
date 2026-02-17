import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { 
  ChevronLeft, 
  User, 
  Mail, 
  Lock, 
  Trash2, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { lightColors as colors } from '../src/constants/colors';
import { useApp } from '../src/context/AppContext';
import { apiService } from '../src/services/api';
import { auth, updateProfile } from '../src/config/firebase';
import { updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useApp();
  const insets = useSafeAreaInsets();
  
  const [name, setName] = useState(user?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Validation State
  const [passwordError, setPasswordError] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Check Firebase providers to see if user has a password set (even if they are Social auth originally)
  const [hasPasswordProvider, setHasPasswordProvider] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      // Check if 'password' is in the provider list
      const providers = auth.currentUser.providerData.map(p => p.providerId);
      setHasPasswordProvider(providers.includes('password'));
    }
  }, []);

  // Determine if we should treat them as a password user (show Current Password field)
  const isPasswordUser = user?.provider === 'email' || hasPasswordProvider;

  // Determine if there are unsaved changes
  const hasChanges = useMemo(() => {
    const nameChanged = name !== (user?.name || '');
    const passwordChanged = newPassword.length > 0;
    return nameChanged || passwordChanged;
  }, [name, user?.name, newPassword]);

  // Robust back navigation
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/profile');
    }
  };

  const handleSave = async () => {
    // Reset errors initially
    setPasswordError('');
    setCurrentPasswordError('');
    setConfirmPasswordError('');

    if (!name.trim()) {
      Alert.alert("Required", "Name cannot be empty");
      return;
    }

    // Inline Password Validation
    if (newPassword) {
      if (newPassword.length < 6) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setPasswordError("Password must be at least 6 characters.");
        return; // Stop execution
      }
      if (newPassword !== confirmPassword) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setConfirmPasswordError("Passwords do not match.");
        return;
      }
    }
    
    setIsLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      // 1. Update Backend Profile
      await apiService.updateUser(user?.email || '', { name });
      
      // 2. Update Firebase Profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
      }

      // 3. Handle Password Update
      if (newPassword) {
        if (auth.currentUser) {
          // If they already have a password, they MUST re-auth with it
          if (isPasswordUser) {
            if (!currentPassword) {
              setCurrentPasswordError("Required to change password.");
              setIsLoading(false);
              return;
            }
            try {
              const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
              await reauthenticateWithCredential(auth.currentUser, credential);
            } catch (authErr: any) {
              console.error("Re-auth Error:", authErr);
              if (authErr.code === 'auth/invalid-credential' || authErr.code === 'auth/wrong-password') {
                setCurrentPasswordError("Incorrect current password.");
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                setIsLoading(false);
                return;
              }
              throw authErr; // Re-throw if it's something else
            }
          }
          
          // Update (or set) the password
          await updatePassword(auth.currentUser, newPassword);
          Alert.alert("Success", "Profile and password updated successfully.");
        }
      }

      // 4. Update Local State
      setUser({ ...user!, name });
      
      handleBack();
    } catch (error: any) {
      console.error("Save Error:", error);
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert("Security Check", "Session expired. Please log out and log back in to change password.");
      } else {
        Alert.alert("Error", error.message || "Failed to update profile.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Delete Account?",
      "For security, you must log in again to confirm permanent deletion. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Proceed to Login", 
          style: "destructive", 
          onPress: () => {
            // Use PUSH instead of replace/dismiss to maintain stack for sliding back
            router.push({
              pathname: '/auth',
              params: { 
                mode: 'delete_reauth', 
                email: user?.email // Pass email to prefill
              }
            });
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.iconBtn}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} /> 
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            contentContainerStyle={styles.content} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.form}>
                
                {/* PUBLIC INFO */}
                <Text style={styles.sectionTitle}>PUBLIC INFO</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>DISPLAY NAME</Text>
                  <View style={styles.inputWrapper}>
                    <User size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={name}
                      onChangeText={setName}
                      placeholder="Enter your name"
                      placeholderTextColor={colors.textLight}
                    />
                  </View>
                </View>

                {/* PRIVATE INFO */}
                <Text style={styles.sectionTitle}>PRIVATE DETAILS</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                  <View style={[styles.inputWrapper, styles.readOnlyInput]}>
                    <Mail size={20} color={colors.textLight} style={styles.inputIcon} />
                    {/* Centered Email Text via Disabled Input */}
                    <TextInput
                      style={[styles.textInput, { color: colors.textLight }]}
                      value={user?.email}
                      editable={false}
                    />
                  </View>
                  <Text style={styles.helperText}>Email cannot be changed.</Text>
                </View>

                {/* SECURITY SECTION */}
                <View style={styles.divider} />
                
                <View style={styles.passwordHeader}>
                  <ShieldCheck size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                  <Text style={styles.sectionTitle}>SECURITY</Text>
                </View>

                <View style={styles.passwordSection}>
                  {/* Current Password Field - Visible if user has a password set */}
                  {isPasswordUser && (
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, currentPasswordError ? { color: colors.error } : null]}>
                        CURRENT PASSWORD
                      </Text>
                      <View style={[
                        styles.inputWrapper, 
                        currentPasswordError ? { borderColor: colors.error } : null
                      ]}>
                        <Lock size={20} color={currentPasswordError ? colors.error : colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                          style={styles.textInput}
                          value={currentPassword}
                          onChangeText={(text) => {
                            setCurrentPassword(text);
                            if (currentPasswordError) setCurrentPasswordError('');
                          }}
                          placeholder="Required to change password"
                          placeholderTextColor={colors.textLight}
                          secureTextEntry
                        />
                      </View>
                      {currentPasswordError ? (
                        <View style={styles.inlineErrorContainer}>
                          <AlertCircle size={14} color={colors.error} />
                          <Text style={styles.inlineErrorText}>{currentPasswordError}</Text>
                        </View>
                      ) : null}
                    </View>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, passwordError ? { color: colors.error } : null]}>
                      NEW PASSWORD
                    </Text>
                    <View style={[
                      styles.inputWrapper, 
                      passwordError ? { borderColor: colors.error } : null
                    ]}>
                      <Lock size={20} color={passwordError ? colors.error : colors.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        value={newPassword}
                        onChangeText={(text) => {
                          setNewPassword(text);
                          if (passwordError) setPasswordError(''); // Clear error on type
                        }}
                        placeholder={isPasswordUser ? "Enter new password" : "Set new password"}
                        placeholderTextColor={colors.textLight}
                        secureTextEntry
                      />
                    </View>
                    {/* Inline Error Message */}
                    {passwordError ? (
                      <View style={styles.inlineErrorContainer}>
                        <AlertCircle size={14} color={colors.error} />
                        <Text style={styles.inlineErrorText}>{passwordError}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, confirmPasswordError ? { color: colors.error } : null]}>
                      CONFIRM PASSWORD
                    </Text>
                    <View style={[
                      styles.inputWrapper,
                      confirmPasswordError ? { borderColor: colors.error } : null
                    ]}>
                      <Lock size={20} color={confirmPasswordError ? colors.error : colors.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        value={confirmPassword}
                        onChangeText={(text) => {
                          setConfirmPassword(text);
                          if (confirmPasswordError) setConfirmPasswordError('');
                        }}
                        placeholder="Re-enter new password"
                        placeholderTextColor={colors.textLight}
                        secureTextEntry
                      />
                    </View>
                    {confirmPasswordError ? (
                      <View style={styles.inlineErrorContainer}>
                        <AlertCircle size={14} color={colors.error} />
                        <Text style={styles.inlineErrorText}>{confirmPasswordError}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* SAVE BUTTON */}
                <View style={styles.saveButtonContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.saveButton, 
                      (!hasChanges || !!passwordError || !!confirmPasswordError) && styles.saveButtonDisabled
                    ]} 
                    onPress={handleSave}
                    disabled={!hasChanges || isLoading}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={[
                        styles.saveButtonText,
                        !hasChanges && styles.saveButtonTextDisabled
                      ]}>Save Changes</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* DANGER ZONE */}
                <View style={styles.divider} />
                <Text style={[styles.inputLabel, { color: colors.error, marginBottom: 12 }]}>DANGER ZONE</Text>
                
                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                  <Trash2 size={18} color={colors.error} style={{ marginRight: 8 }} />
                  <Text style={styles.deleteButtonText}>Delete Account</Text>
                </TouchableOpacity>

                {/* Bottom Padding */}
                <View style={{ height: 40 }} />
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#FAFAFA',
    zIndex: 10,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  iconBtn: { padding: 8 },
  content: { padding: 24 },
  form: { gap: 24 },
  
  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: -8, letterSpacing: 0.5 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: colors.textLight, letterSpacing: 1 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: colors.border, 
    paddingHorizontal: 16, 
    height: 56,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1
  },
  inputIcon: { marginRight: 12 },
  textInput: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text, height: '100%' },
  readOnlyInput: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB', shadowOpacity: 0 },
  helperText: { fontSize: 12, color: colors.textLight, marginLeft: 4 },
  
  // Inline Error Styles
  inlineErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 4,
    gap: 6,
  },
  inlineErrorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
  },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  
  passwordHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: -8 },
  passwordSection: { gap: 16 },
  
  // Save Button Styles
  saveButtonContainer: {
    marginTop: 24,
    marginBottom: 8,
  },
  saveButton: { 
    backgroundColor: colors.primary, 
    height: 56, 
    borderRadius: 16, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: colors.primary, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 5,
  },
  saveButtonDisabled: {
    backgroundColor: '#E5E7EB', // Lighter grey background
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: '#D1D5DB'
  },
  saveButtonText: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: '700' 
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF' // Darker grey text for better readability
  },

  deleteButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 16, 
    borderRadius: 16, 
    backgroundColor: '#FEF2F2', 
    borderWidth: 1, 
    borderColor: '#FEE2E2' 
  },
  deleteButtonText: { color: colors.error, fontWeight: '700', fontSize: 15 },
});