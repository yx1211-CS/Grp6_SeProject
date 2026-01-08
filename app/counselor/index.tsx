import { useRouter } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function CounselorDashboard() {
  const router = useRouter();

  
  const pendingCount = 5;
  const approvedToday = 12;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* 1. Header Area */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.roleTitle}>Counselor (Staff)</Text>
          </View>
          <TouchableOpacity 
            style={styles.logoutBtn} 
            onPress={() => router.replace('/')} // Logout
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Statistics Cards  */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsContainer}>
          {/* Card 1: Pending Requests */}
          <View style={[styles.statCard, {backgroundColor: '#E3F2FD'}]}>
            <Text style={[styles.statNumber, {color: '#1565C0'}]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending Requests</Text>
          </View>
          
          {/* Card 2: Approved Today */}
          <View style={[styles.statCard, {backgroundColor: '#E8F5E9'}]}>
            <Text style={[styles.statNumber, {color: '#2E7D32'}]}>{approvedToday}</Text>
            <Text style={styles.statLabel}>Processed Today</Text>
          </View>
        </View>

        {/* 3. Main Menu / Quick Actions */}
        <Text style={styles.sectionTitle}>Menu</Text>
        
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/counselor/review')}
        >
          <View style={[styles.iconBox, {backgroundColor: '#FFF3E0'}]}>
            <Text style={styles.icon}>📋</Text>
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Review Applications</Text>
            <Text style={styles.actionDesc}>Check student peer helper applications</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        {/* Button: Student Issues */}
       <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/counselor/assignment')} 
            >
            <View style={[styles.iconBox, {backgroundColor: '#F3E5F5'}]}>
                <Text style={styles.icon}>💬</Text>
            </View>
            <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Student Issues</Text>
                <Text style={styles.actionDesc}>View & assign cases to helpers</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity 
  style={styles.actionCard}
  onPress={() => router.push('/counselor/feedback' as any)} 
>
  <View style={[styles.iconBox, {backgroundColor: '#E0F7FA'}]}>
 
    <Text style={styles.icon}>⭐</Text>
  </View>
  <View style={styles.actionTextContainer}>
    <Text style={styles.actionTitle}>Service Feedback</Text>
    <Text style={styles.actionDesc}>Complaints & compliments from students</Text>
  </View>
  <Text style={styles.arrow}>→</Text>
</TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FD' },
  content: { padding: 24 },

  // Header
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 30,
    marginTop: 10
  },
  greeting: { fontSize: 16, color: '#A0AEC0' },
  roleTitle: { fontSize: 24, fontWeight: 'bold', color: '#2D3748' },
  logoutBtn: { backgroundColor: '#FFEBEE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  logoutText: { color: '#C62828', fontWeight: '600', fontSize: 12 },

  // Statistics
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#2D3748', marginBottom: 15 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statCard: { 
    width: '48%', 
    padding: 20, 
    borderRadius: 16, 
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
  },
  statNumber: { fontSize: 32, fontWeight: 'bold', marginBottom: 5 },
  statLabel: { fontSize: 13, color: '#555', fontWeight: '500' },

  // Action Cards
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
  },
  iconBox: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  icon: { fontSize: 24 },
  actionTextContainer: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D3748' },
  actionDesc: { fontSize: 13, color: '#A0AEC0', marginTop: 2 },
  arrow: { fontSize: 20, color: '#CBD5E0', fontWeight: 'bold' }
});