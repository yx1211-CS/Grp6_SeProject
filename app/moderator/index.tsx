import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MOCK_REPORTS } from '../../constants/dummyData';

// Define a simple type interface for the report item
interface ReportItem {
  id: string;
  reportedUser: string;
  reason: string;
  content: string;
  timestamp: string;
  status: string;
}

export default function ModerationDashboard() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportItem[]>(MOCK_REPORTS);


  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive", 
     
          onPress: () => router.replace('/') 
        }
      ]
    );
  };

  const handleAction = (id: string, action: string) => {
    Alert.alert(
      action === 'delete' ? "Delete Content" : "Keep Content",
      `Are you sure you want to ${action} this content?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          style: action === 'delete' ? 'destructive' : 'default',
          onPress: () => {
            setReports((prev: ReportItem[]) => prev.filter(item => item.id !== id));
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: ReportItem }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.username}>User: {item.reportedUser}</Text>
        <Text style={styles.reason}>Reason: {item.reason}</Text>
      </View>
      <Text style={styles.content}>"{item.content}"</Text>
      <Text style={styles.timestamp}>{item.timestamp}</Text>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.btn, styles.keepBtn]}
          onPress={() => handleAction(item.id, 'keep')}
        >
          <Text style={styles.btnText}>Keep</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.btn, styles.deleteBtn]} 
          onPress={() => handleAction(item.id, 'delete')}
        >
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
  
      <View style={styles.navHeader}>
        
         <View style={styles.leftHeader}>
           
            <Text style={styles.title}>Moderation Queue</Text>
         </View>

        
         <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
         </TouchableOpacity>
      </View>

      <FlatList 
        data={reports}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  
 
  navHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: 20, 
    backgroundColor: '#fff' 
  },
  
 
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backText: { fontSize: 18, color: '#007AFF', marginRight: 15 },
  title: { fontSize: 20, fontWeight: 'bold' },

  logoutText: {
    fontSize: 16,
    color: '#FF3B30', 
    fontWeight: 'bold'
  },

  card: { backgroundColor: 'white', margin: 15, marginTop: 0, padding: 15, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, elevation: 3 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  username: { fontWeight: 'bold', fontSize: 16 },
  reason: { color: 'red', fontWeight: '600', fontSize: 14 },
  content: { fontSize: 16, color: '#333', marginBottom: 10, fontStyle: 'italic' },
  timestamp: { color: '#888', fontSize: 12, marginBottom: 15 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  btn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  keepBtn: { backgroundColor: '#4CAF50' },
  deleteBtn: { backgroundColor: '#FF3B30' },
  btnText: { color: 'white', fontWeight: 'bold' }
});