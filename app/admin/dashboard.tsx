import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  Modal,       
  Pressable,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ScreenWrapper from '../../components/ScreenWrapper';
import { wp, hp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import Icon from '../../assets/icons';

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { LineChart } from 'react-native-chart-kit';

export default function AdminDashboard() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [loading, setLoading] = useState(true);
  const [filterVisible, setFilterVisible] = useState(false); 
  
  const [chartType, setChartType] = useState('posts'); // 'posts' or 'moods'

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

  const handleExportPDF = async () => {
    try {
        const html = `
          <html>
            <head>
                <style>
                    body { font-family: 'Helvetica'; padding: 20px; }
                    h1 { color: #0091EA; }
                    .card { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 8px; }
                    .label { color: #666; font-size: 12px; }
                    .value { font-size: 24px; font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>LinkUp System Report</h1>
                <p>Date: ${new Date().toLocaleDateString()}</p>
                <p>Period: ${dateRange}</p>
                <hr />
                <div class="card"><div class="label">Active Users</div><div class="value">${stats.activeUsers}</div></div>
                <div class="card"><div class="label">Total Reports</div><div class="value">${stats.totalReports}</div></div>
                <div class="card"><div class="label">Posts Created</div><div class="value">${stats.newPosts}</div></div>
                <div class="card"><div class="label">Mood Updates</div><div class="value">${stats.moods}</div></div>
            </body>
          </html>
        `;
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri);
    } catch (error) {
        Alert.alert("Error", "Failed to generate PDF");
    }
  };

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } 
    finally { router.replace('/login'); }
  };

  const handleSelectFilter = (option: string) => {
    setDateRange(option);
    setFilterVisible(false); 
  };

  // Helper to get chart data based on selection
  const getChartData = () => {
    if (chartType === 'posts') {
        return {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{ 
                data: [2, 5, 3, 6, 4, 8, stats.newPosts || 5], 
                color: (opacity = 1) => `rgba(0, 145, 234, ${opacity})` // Blue
            }]
        };
    } else {
        return {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{ 
                data: [1, 3, 2, 4, 3, 5, stats.moods || 4], 
                color: (opacity = 1) => `rgba(255, 59, 48, ${opacity})` // Red
            }]
        };
    }
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
          <View style={{flexDirection:'row', gap: 10}}>
            <TouchableOpacity onPress={handleExportPDF} style={[styles.logoutButton, {backgroundColor: '#E8F2FF'}]}>
                 <Icon name="arrowDown" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <Icon name="logout" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Filter */}
        <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Data Period:</Text>
            <TouchableOpacity style={styles.filterButton} onPress={() => setFilterVisible(true)}>
                <Text style={styles.filterText}>{dateRange} ▼</Text>
            </TouchableOpacity>
        </View>

        {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
        ) : (
            <>
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: '#E8F2FF' }]}>
                        <View style={styles.iconContainer}><Icon name="user" size={24} color={theme.colors.primary} /></View>
                        <Text style={styles.statNumber}>{stats.activeUsers}</Text>
                        <Text style={styles.statLabel}>Active Users</Text> 
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#FFF0F0' }]}>
                        <View style={styles.iconContainer}><Icon name="exclamation-circle" size={24} color="#FF3B30" /></View>
                        <Text style={styles.statNumber}>{stats.totalReports}</Text>
                        <Text style={styles.statLabel}>New Reports</Text>
                    </View>
                </View>

                {/* CHART SECTION WITH TABS */}
                <View style={styles.chartHeader}>
                    <Text style={styles.sectionTitle}>Activity Trends</Text>
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity 
                            style={[styles.toggleBtn, chartType === 'posts' && styles.toggleBtnActive]} 
                            onPress={() => setChartType('posts')}
                        >
                            <Text style={[styles.toggleText, chartType === 'posts' && styles.toggleTextActive]}>Posts</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.toggleBtn, chartType === 'moods' && styles.toggleBtnActive]} 
                            onPress={() => setChartType('moods')}
                        >
                            <Text style={[styles.toggleText, chartType === 'moods' && styles.toggleTextActive]}>Moods</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.chartContainer}>
                    <LineChart
                        data={getChartData()}
                        width={Dimensions.get("window").width - wp(10)}
                        height={220}
                        yAxisLabel=""
                        yAxisSuffix=""
                        chartConfig={{
                            backgroundColor: "#ffffff",
                            backgroundGradientFrom: "#ffffff",
                            backgroundGradientTo: "#ffffff",
                            decimalPlaces: 0, 
                            color: getChartData().datasets[0].color, // Dynamic Color
                            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            propsForDots: { r: "5", strokeWidth: "2", stroke: chartType === 'posts' ? "#0091EA" : "#FF3B30" }
                        }}
                        bezier
                        style={{ marginVertical: 8, borderRadius: 16 }}
                    />
                </View>

                {/* Feature Usage Details */}
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
                <Icon name="exclamation-circle" size={24} color="white" />
                <Text style={styles.actionBtnText}>Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#555' }]} onPress={() => router.push('/admin/settings')}>
                <Icon name="sync" size={24} color="white" />
                <Text style={styles.actionBtnText}>Settings</Text>
            </TouchableOpacity>
        </View>

        {/* MODAL (Kept same) */}
        <Modal animationType="fade" transparent={true} visible={filterVisible} onRequestClose={() => setFilterVisible(false)}>
            <Pressable style={styles.modalOverlay} onPress={() => setFilterVisible(false)}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select Time Period</Text>
                    {['Today', 'Last 7 Days', 'All Time'].map((option) => (
                        <TouchableOpacity key={option} style={[styles.modalOption, dateRange === option && styles.modalOptionSelected]} onPress={() => handleSelectFilter(option)}>
                            <Text style={[styles.modalOptionText, dateRange === option && { color: theme.colors.primary, fontWeight: 'bold' }]}>{option}</Text>
                            {dateRange === option && <Icon name="arrowLeft" size={20} color={theme.colors.primary} />}
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

  // NEW STYLES FOR CHART TOGGLE
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 20, padding: 3 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  toggleBtnActive: { backgroundColor: 'white', shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  toggleText: { fontSize: 12, color: '#666', fontWeight: '600' },
  toggleTextActive: { color: theme.colors.text, fontWeight: 'bold' },

  sectionTitle: { fontSize: hp(2.2), fontWeight: 'bold', color: theme.colors.text },
  chartContainer: { alignItems: 'center', marginBottom: 25 },
  
  usageCard: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#eee', padding: 20, marginBottom: 25, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  usageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  usageLabel: { fontSize: hp(1.8), color: '#555' },
  usageValue: { fontSize: hp(2), fontWeight: 'bold', color: theme.colors.text },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 10 },

  actionGrid: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, backgroundColor: theme.colors.primary, paddingVertical: 15, borderRadius: 12, alignItems: 'center', gap: 5 },
  actionBtnText: { color: 'white', fontWeight: 'bold', fontSize: hp(1.6) },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 5 },
  modalTitle: { fontSize: hp(2.2), fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: theme.colors.text },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalOptionSelected: { backgroundColor: '#f9f9f9', borderRadius: 8, paddingHorizontal: 10, borderBottomWidth: 0 },
  modalOptionText: { fontSize: hp(1.8), color: '#333' }
});