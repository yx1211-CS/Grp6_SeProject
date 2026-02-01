import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  Modal,      
  Pressable   
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ScreenWrapper from '../../components/ScreenWrapper';
import { wp, hp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import Icon from '../../assets/icons';

export default function AdminDashboard() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [loading, setLoading] = useState(true);
  const [filterVisible, setFilterVisible] = useState(false); 
  
  const [stats, setStats] = useState({
    activeUsers: 0,
    totalReports: 0,
    newPosts: 0,
    chats: 0,
    moods: 0
  });

  useEffect(() => {
    fetchRealStats();
  }, [dateRange]);

  const fetchRealStats = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate = new Date();

      if (dateRange === 'Today') {
        startDate.setHours(0, 0, 0, 0); 
      } else if (dateRange === 'Last 7 Days') {
        startDate.setDate(now.getDate() - 7);
      } else if (dateRange === 'All Time') {
        startDate = new Date('2020-01-01'); 
      }

      const isoDate = startDate.toISOString();

      const [usersRes, reportsRes, postsRes, moodsRes] = await Promise.all([
        supabase.from('account').select('*', { count: 'exact', head: true }).gte('last_login', isoDate),
        supabase.from('reported_content').select('*', { count: 'exact', head: true }).gte('reporttime', isoDate),
        supabase.from('post').select('*', { count: 'exact', head: true }).gte('postcreatedat', isoDate),
        supabase.from('mood').select('*', { count: 'exact', head: true }).gte('moodcreatedat', isoDate),
      ]);

      setStats({
        activeUsers: usersRes.count || 0,
        totalReports: reportsRes.count || 0,
        newPosts: postsRes.count || 0,
        chats: 0, 
        moods: moodsRes.count || 0,
      });

    } catch (error) {
      console.log("Error fetching stats:", error);
      Alert.alert("Error", "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.log("Logout error (ignored):", err);
    } finally {
      router.replace('/login');
    }
  };

  const handleSelectFilter = (option: string) => {
    setDateRange(option);
    setFilterVisible(false); 
  };

  return (
    <ScreenWrapper bg="white">
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>Overview & Analytics</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Icon name="logout" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        {/* Filter Trigger Button */}
        <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Data Period:</Text>
            <TouchableOpacity 
                style={styles.filterButton} 
                onPress={() => setFilterVisible(true)} 
            >
                <Text style={styles.filterText}>{dateRange} ▼</Text>
            </TouchableOpacity>
        </View>

        {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
        ) : (
            <>
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: '#E8F2FF' }]}>
                        <View style={styles.iconContainer}>
                            <Icon name="user" size={24} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.statNumber}>{stats.activeUsers}</Text>
                        <Text style={styles.statLabel}>Active Users</Text> 
                    </View>

                    <View style={[styles.statCard, { backgroundColor: '#FFF0F0' }]}>
                        <View style={styles.iconContainer}>
                            {/* CHANGED: Report Icon */}
                            <Icon name="exclamation-circle" size={24} color="#FF3B30" />
                        </View>
                        <Text style={styles.statNumber}>{stats.totalReports}</Text>
                        <Text style={styles.statLabel}>New Reports</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Feature Usage ({dateRange})</Text>
                <View style={styles.usageCard}>
                    <View style={styles.usageRow}>
                        <Text style={styles.usageLabel}>Posts Created</Text>
                        <Text style={styles.usageValue}>{stats.newPosts}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.usageRow}>
                        <Text style={styles.usageLabel}>Mood Updates</Text>
                        <Text style={styles.usageValue}>{stats.moods}</Text>
                    </View>
                </View>
            </>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/admin/users')}>
                <Icon name="user" size={24} color="white" />
                <Text style={styles.actionBtnText}>Users</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FF3B30' }]} onPress={() => router.push('/admin/reports')}>
                {/* CHANGED: Report Icon */}
                <Icon name="exclamation-circle" size={24} color="white" />
                <Text style={styles.actionBtnText}>Reports</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#555' }]} onPress={() => router.push('/admin/settings')}>
                {/* CHANGED: Settings Icon */}
                <Icon name="sync" size={24} color="white" />
                <Text style={styles.actionBtnText}>Settings</Text>
            </TouchableOpacity>
        </View>

        {/* ———— DROP DOWN MODAL ———— */}
        <Modal
            animationType="fade"
            transparent={true}
            visible={filterVisible}
            onRequestClose={() => setFilterVisible(false)}
        >
            <Pressable style={styles.modalOverlay} onPress={() => setFilterVisible(false)}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select Time Period</Text>
                    
                    {['Today', 'Last 7 Days', 'All Time'].map((option) => (
                        <TouchableOpacity 
                            key={option} 
                            style={[
                                styles.modalOption, 
                                dateRange === option && styles.modalOptionSelected
                            ]}
                            onPress={() => handleSelectFilter(option)}
                        >
                            <Text style={[
                                styles.modalOptionText,
                                dateRange === option && { color: theme.colors.primary, fontWeight: 'bold' }
                            ]}>
                                {option}
                            </Text>
                            {dateRange === option && <Icon name="check" size={20} color={theme.colors.primary} />}
                        </TouchableOpacity>
                    ))}
                </View>
            </Pressable>
        </Modal>

      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: wp(5), paddingVertical: hp(2), paddingBottom: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: hp(3), fontWeight: 'bold', color: theme.colors.text },
  headerSubtitle: { fontSize: hp(1.6), color: '#888' },
  logoutButton: { padding: 10, backgroundColor: '#FFF0F0', borderRadius: 12 },
  
  filterContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  filterLabel: { fontSize: hp(1.8), color: '#666', marginRight: 10 },
  filterButton: { backgroundColor: '#F2F2F7', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  filterText: { fontSize: hp(1.6), fontWeight: '600', color: theme.colors.text },

  statsRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  statCard: { flex: 1, padding: 20, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  iconContainer: { marginBottom: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 50 },
  statNumber: { fontSize: hp(3.5), fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: hp(1.5), color: '#666', marginTop: 4, textAlign: 'center' },

  sectionTitle: { fontSize: hp(2.2), fontWeight: 'bold', color: theme.colors.text, marginBottom: 15 },
  usageCard: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#eee', padding: 20, marginBottom: 25, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  usageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  usageLabel: { fontSize: hp(1.8), color: '#555' },
  usageValue: { fontSize: hp(2), fontWeight: 'bold', color: theme.colors.text },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 10 },

  actionGrid: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, backgroundColor: theme.colors.primary, paddingVertical: 15, borderRadius: 12, alignItems: 'center', gap: 5 },
  actionBtnText: { color: 'white', fontWeight: 'bold', fontSize: hp(1.6) },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: theme.colors.text
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  modalOptionSelected: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0
  },
  modalOptionText: {
    fontSize: hp(1.8),
    color: '#333'
  }
});