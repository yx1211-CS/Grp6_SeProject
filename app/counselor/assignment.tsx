import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// 1.(Open Cases)
const MOCK_CASES = [
  { id: 'c1', student: 'John Doe', issue: 'Exam Stress', severity: 'Medium', time: '2 hrs ago' },
  { id: 'c2', student: 'Jane Smith', issue: 'Feeling Lonely', severity: 'Low', time: '5 hrs ago' },
  { id: 'c3', student: 'Alex Tan', issue: 'Family Issues', severity: 'High', time: '1 day ago' },
];

// 2. Peer Helpers
const AVAILABLE_HELPERS = [
  { id: 'h1', name: 'Helper Sarah', status: 'Available' },
  { id: 'h2', name: 'Helper Mike', status: 'Available' },
  { id: 'h3', name: 'Helper Jenny', status: 'Busy' },
];

export default function AssignmentScreen() {
  const router = useRouter();
  const [cases, setCases] = useState(MOCK_CASES);
  
  // Modal 
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);

  
  const openAssignModal = (caseId: string) => {
    setSelectedCase(caseId);
    setModalVisible(true);
  };

  const handleAssign = (helperName: string) => {
    Alert.alert("Success", `Case assigned to ${helperName}`);
    
    setCases(prev => prev.filter(c => c.id !== selectedCase));
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Student Issues</Text>
        <View style={{width: 50}} /> 
      </View>

      <Text style={styles.subHeader}>Incoming Help Requests</Text>

      {/* Case List */}
      <FlatList 
        data={cases}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>✅ All Clear!</Text>
            <Text style={styles.emptySubText}>No new student issues reported.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.studentName}>{item.student}</Text>
              <View style={[styles.badge, item.severity === 'High' ? styles.badgeHigh : styles.badgeNormal]}>
                <Text style={[styles.badgeText, item.severity === 'High' ? {color:'#C62828'} : {color:'#1565C0'}]}>
                  {item.severity} Priority
                </Text>
              </View>
            </View>
            
            <Text style={styles.issueTitle}>Issue: {item.issue}</Text>
            <Text style={styles.timeText}>Reported: {item.time}</Text>

            <TouchableOpacity 
              style={styles.assignBtn}
              onPress={() => openAssignModal(item.id)}
            >
              <Text style={styles.assignBtnText}>Assign to Helper</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Helper Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a Peer Helper</Text>
            <Text style={styles.modalSub}>Who should handle this case?</Text>

            {AVAILABLE_HELPERS.map((helper) => (
              <TouchableOpacity 
                key={helper.id} 
                style={[styles.helperOption, helper.status === 'Busy' && styles.helperBusy]}
                disabled={helper.status === 'Busy'}
                onPress={() => handleAssign(helper.name)}
              >
                <Text style={styles.helperName}>{helper.name}</Text>
                <Text style={[styles.helperStatus, helper.status === 'Busy' ? {color:'red'} : {color:'green'}]}>
                  ● {helper.status}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity 
              style={styles.cancelBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FD' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff' },
  backButton: { padding: 5 },
  backText: { fontSize: 16, color: '#4299E1', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#2D3748' },

  subHeader: { fontSize: 20, fontWeight: 'bold', margin: 20, marginBottom: 10, color: '#2D3748' },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },

  // Card
  card: { backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  studentName: { fontSize: 18, fontWeight: 'bold', color: '#2D3748' },
  
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeNormal: { backgroundColor: '#E3F2FD' },
  badgeHigh: { backgroundColor: '#FFEBEE' },
  badgeText: { fontSize: 12, fontWeight: 'bold' },

  issueTitle: { fontSize: 16, color: '#4A5568', marginBottom: 5 },
  timeText: { fontSize: 13, color: '#A0AEC0', marginBottom: 15 },

  assignBtn: { backgroundColor: '#4299E1', padding: 12, borderRadius: 10, alignItems: 'center' },
  assignBtnText: { color: 'white', fontWeight: 'bold' },

  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#2D3748' },
  emptySubText: { color: '#A0AEC0', marginTop: 5 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  modalSub: { fontSize: 14, color: '#A0AEC0', marginBottom: 20, textAlign: 'center' },
  
  helperOption: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  helperBusy: { opacity: 0.5 },
  helperName: { fontSize: 16, fontWeight: '600', color: '#2D3748' },
  helperStatus: { fontSize: 14 },
  
  cancelBtn: { marginTop: 20, padding: 15, alignItems: 'center', backgroundColor: '#F7FAFC', borderRadius: 10 },
  cancelText: { color: '#4A5568', fontWeight: 'bold' }
});