import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        
        {/* Logo 部分 */}
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="heart" size={60} color="white" />
        </View>

        <Text style={styles.title}>Peer Support</Text>
        <Text style={styles.subtitle}>
          Connect anonymously with MMU students, track your mood, and find support.
        </Text>

        {/* 按钮部分 */}
        <View style={styles.buttonContainer}>
          {/* Log In 按钮 - 暂时还没做登录页，先放着 */}
          <TouchableOpacity 
            style={[styles.button, styles.loginButton]}
            onPress={() => alert("Login page coming soon!")} 
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>

          {/* Create Account 按钮 - 跳转到注册页 */}
          <TouchableOpacity 
            style={[styles.button, styles.registerButton]}
            onPress={() => router.push('/register' as any)} 
          >
            <Text style={styles.registerButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#4F46E5', // Indigo-600
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    transform: [{ rotate: '-5deg' }],
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 50, lineHeight: 24 },
  buttonContainer: { width: '100%', gap: 15 },
  button: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButton: {
    backgroundColor: '#4F46E5',
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  loginButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  registerButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E0E7FF',
  },
  registerButtonText: { color: '#4F46E5', fontSize: 18, fontWeight: 'bold' },
});