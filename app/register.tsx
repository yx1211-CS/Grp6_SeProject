import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const INTEREST_OPTIONS = [
  "Gaming", "Music", "Study", "Art", "Coding", 
  "Fitness", "Reading", "Movies", "Food", "Travel"
];

export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = Credentials, 2 = Interests
  
  // 表单数据
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // 第一步：填写账号密码
  const handleStep1 = () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setStep(2); // 进入第二步
  };

  // 切换兴趣选择
  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  // 第二步：完成注册 (包含 Business Rule 检查)
  const handleComplete = () => {
    if (selectedInterests.length < 3) {
      Alert.alert("Requirement", "Please select at least 3 interests to continue.");
      return;
    }
    
    // 注册成功逻辑
    Alert.alert("Success", "Account created successfully!");
    // 这里通常会保存用户数据，然后跳转
    // router.replace('/(tabs)/home'); // 假设你以后做了主页
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step === 1 ? router.back() : setStep(1)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#64748B" />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step {step} of 2</Text>
      </View>

      <View style={styles.content}>
        
        {step === 1 ? (
          // --- STEP 1: 邮箱和密码 ---
          <>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Let's get you set up with a secure profile.</Text>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Feather name="mail" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Student Email" 
                  style={styles.input} 
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Feather name="lock" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Password" 
                  style={styles.input} 
                  secureTextEntry 
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <TouchableOpacity style={styles.mainButton} onPress={handleStep1}>
                <Text style={styles.mainButtonText}>Next Step</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // --- STEP 2: 选择兴趣 ---
          <>
            <Text style={styles.title}>Pick Your Interests</Text>
            <Text style={styles.subtitle}>Select at least <Text style={{color: '#4F46E5', fontWeight: 'bold'}}>3 topics</Text> to find peers.</Text>

            <ScrollView style={styles.interestsContainer} contentContainerStyle={styles.interestsGrid}>
              {INTEREST_OPTIONS.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <TouchableOpacity 
                    key={interest} 
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => toggleInterest(interest)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{interest}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.footer}>
              <Text style={styles.selectionCount}>
                Selected: {selectedInterests.length} 
                {selectedInterests.length < 3 && <Text style={{color: '#E11D48'}}> (Min 3)</Text>}
              </Text>
              
              <TouchableOpacity 
                style={[styles.mainButton, selectedInterests.length < 3 && styles.disabledButton]} 
                onPress={handleComplete}
                disabled={selectedInterests.length < 3}
              >
                <Text style={styles.mainButtonText}>Complete Registration</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backButton: { padding: 8, borderRadius: 20, backgroundColor: '#F1F5F9' },
  stepIndicator: { fontSize: 14, color: '#94A3B8', fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 30, paddingTop: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#64748B', marginBottom: 30 },
  
  form: { gap: 16 },
  inputContainer: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', 
    borderRadius: 16, paddingHorizontal: 16, height: 56 
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#334155' },

  mainButton: { 
    backgroundColor: '#4F46E5', flexDirection: 'row', 
    alignItems: 'center', justifyContent: 'center', 
    height: 56, borderRadius: 16, gap: 8, marginTop: 20,
    shadowColor: "#4F46E5", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4
  },
  mainButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  disabledButton: { backgroundColor: '#CBD5E1', shadowOpacity: 0, elevation: 0 },

  interestsContainer: { flex: 1, marginTop: 10 },
  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 20 },
  chip: { 
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, 
    borderWidth: 2, borderColor: '#E2E8F0', backgroundColor: 'white' 
  },
  chipSelected: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  chipTextSelected: { color: 'white' },

  footer: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 20, paddingBottom: 20 },
  selectionCount: { fontSize: 14, color: '#64748B', marginBottom: 10, textAlign: 'center' }
});