import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// 1. Mock Data (Later this comes from Database)
const INITIAL_APPLICATIONS = [
  { id: '101', name: 'Ali bin Ahmad', studentId: '12111001', gpa: '3.85', reason: 'I want to help others.', status: 'Pending' },
  { id: '102', name: 'Sarah Lee', studentId: '12111005', gpa: '3.92', reason: 'Psychology major student.', status: 'Pending' },
  { id: '103', name: 'Muthu Sami', studentId: '12111022', gpa: '3.60', reason: 'Good listener.', status: 'Pending' },
];

export default function ReviewApplicationsScreen() {
  const router = useRouter();
  const [applications, setApplications] = useState(INITIAL_APPLICATIONS);

  const handleDecision = (id: string, name: string, decision: 'Approve' | 'Reject') => {
    Alert.alert(
      `Confirm ${decision}`,
      `Are you sure you want to ${decision.toLowerCase()} ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          style: decision === 'Reject' ? 'destructive' : 'default',
          onPress: () => {
            // Remove the item from list to simulate processing
            setApplications(prev => prev.filter(item => item.id !== id));
            // Optional: Show success message
            // Alert.alert("Success", `Student ${decision}d.`);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Pending Applications</Text>
        <View style={{width: 50}} /> 
      </View>

      {/* List */}
      <FlatList 
        data={applications}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>🎉 No pending applications!</Text>
            <Text style={styles.emptySubText}>All caught up for now.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            
            {/* Top Row: Name & GPA */}
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.studentId}>ID: {item.studentId}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>GPA {item.gpa}</Text>
              </View>
            </View>

            {/* Middle: Reason */}
            <Text style={styles.label}>Reason to join:</Text>
            <Text style={styles.reason}>"{item.reason}"</Text>

            {/* Bottom: Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.btn, styles.rejectBtn]} 
                onPress={() => handleDecision(item.id, item.name, 'Reject')}
              >
                <Text style={[styles.btnText, {color: '#C62828'}]}>Reject</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.btn, styles.approveBtn]} 
                onPress={() => handleDecision(item.id, item.name, 'Approve')}
              >
                <Text style={[styles.btnText, {color: '#1B5E20'}]}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FD' },
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 20, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  backButton: { padding: 5 },
  backText: { fontSize: 16, color: '#4299E1', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#2D3748' },

  listContent: { padding: 20 },

  // Card Styles
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#2D3748' },
  studentId: { fontSize: 14, color: '#A0AEC0', marginTop: 2 },
  
  badge: { backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#1565C0', fontWeight: '700', fontSize: 12 },

  label: { fontSize: 12, color: '#A0AEC0', fontWeight: '600', marginBottom: 4 },
  reason: { fontSize: 14, color: '#4A5568', fontStyle: 'italic', marginBottom: 20, lineHeight: 20 },

  actionRow: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { backgroundColor: '#FFEBEE' },
  approveBtn: { backgroundColor: '#E8F5E9' },
  btnText: { fontWeight: '700', fontSize: 14 },

  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', marginBottom: 8 },
  emptySubText: { color: '#A0AEC0' }
});