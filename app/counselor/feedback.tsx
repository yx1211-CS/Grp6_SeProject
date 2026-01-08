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

const SERVICE_FEEDBACK = [
  { 
    id: 'f1', 
    type: 'Complaint', 
    student: 'student_ali', 
    content: 'My Peer Helper (John) was late for 15 mins and did not apologize.', 
    time: 'Yesterday',
    rating: '⭐',
    status: 'Pending'
  },
  { 
    id: 'f2', 
    type: 'Appreciation', 
    student: 'sarah_tan', 
    content: 'The session really helped me with my anxiety. Thank you!', 
    time: '2 hours ago',
    rating: '⭐⭐⭐⭐⭐',
    status: 'Unread'
  },
  { 
    id: 'f3', 
    type: 'Suggestion', 
    student: 'mike_low', 
    content: 'Can we have longer sessions? 30 mins is too short.', 
    time: '3 days ago',
    rating: '⭐⭐⭐',
    status: 'Pending'
  },
];

export default function CounselorFeedbackScreen() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState(SERVICE_FEEDBACK);

  const handleReview = (id: string, action: 'Acknowledge' | 'Reply') => {
    if (action === 'Reply') {
      
      Alert.alert("Reply", "Open reply box...");
    } else {
      Alert.alert("Success", "Feedback marked as read.", [
        { text: "OK", onPress: () => setFeedbacks(prev => prev.filter(f => f.id !== id)) }
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Student Feedback</Text>
        <View style={{width: 50}} /> 
      </View>

      <FlatList 
        data={feedbacks}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>📭 No New Feedback</Text>
            <Text style={styles.emptySubText}>Check back later.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            
            <View style={styles.cardHeader}>
              <View style={[
                styles.badge, 
                item.type === 'Complaint' ? {backgroundColor: '#FFEBEE'} : {backgroundColor: '#E8F5E9'}
              ]}>
                <Text style={[
                  styles.badgeText,
                  item.type === 'Complaint' ? {color: '#C62828'} : {color: '#2E7D32'}
                ]}>{item.type}</Text>
              </View>
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>

            
            <Text style={styles.studentName}>From: {item.student}</Text>
            <Text style={styles.timeText}>{item.time}</Text>
            <Text style={styles.content}>"{item.content}"</Text>

            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.btn, styles.replyBtn]} 
                onPress={() => handleReview(item.id, 'Reply')}
              >
                <Text style={styles.replyText}>Reply</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.btn, styles.ackBtn]} 
                onPress={() => handleReview(item.id, 'Acknowledge')}
              >
                <Text style={styles.ackText}>Mark as Read</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff' },
  backButton: { padding: 5 },
  backText: { fontSize: 16, color: '#4299E1', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#2D3748' },
  
  listContent: { padding: 20 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontWeight: '700', fontSize: 12 },
  ratingText: { fontSize: 14 },

  studentName: { fontWeight: 'bold', color: '#2D3748', fontSize: 15 },
  timeText: { color: '#A0AEC0', fontSize: 12, marginBottom: 10 },
  content: { fontSize: 15, color: '#4A5568', fontStyle: 'italic', marginBottom: 20, lineHeight: 22 },

  actionRow: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  replyBtn: { backgroundColor: '#E3F2FD' },
  replyText: { color: '#1565C0', fontWeight: 'bold' },
  ackBtn: { backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#EDF2F7' },
  ackText: { color: '#4A5568', fontWeight: 'bold' },

  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#2D3748' },
  emptySubText: { color: '#A0AEC0' }
});