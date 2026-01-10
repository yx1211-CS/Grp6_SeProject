import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { supabase } from '../../lib/supabase';

export default function ModeratorDashboard() {
  const router = useRouter();
  const [uniqueReports, setUniqueReports] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // User Name State
  const [userName, setUserName] = useState("Moderator");

  // 👇 STATE: Sorting, Search, Filter
  const [sortOption, setSortOption] = useState("Newest");
  const [searchQuery, setSearchQuery] = useState(""); 
  const [activeFilter, setActiveFilter] = useState("All"); // Options: 'All' | 'HighRisk' | 'Hidden'

  // Stats State
  const [stats, setStats] = useState({
    totalPending: 0,
    highRisk: 0,
    autoHidden: 0,
  });

  // 1. Get Current User Profile
  const getUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data } = await supabase.from('account').select('username').eq('accountid', user.id).single();
        if (data?.username) setUserName(data.username);
    }
  };

  // 2. Fetch Reports from Database
  const fetchReports = async () => {
    setLoading(true);
    // Fetch textual data only (no images)
    const { data, error } = await supabase
      .from('reported_content')
      .select(`
        *,
        reporter:reporterid (username, email),
        post:postid (postcontent, ishidden, author:userid (username, email))
      `) 
      .eq('reportstatus', 'Pending'); 

    if (error) {
      console.log('Error fetching data:', error.message);
    } else {
      const rawData = data || [];

      // --- Grouping Logic ---
      const postsMap = {};
      rawData.forEach(item => {
        const pid = item.postid;
        if (!postsMap[pid]) {
            postsMap[pid] = {
                ...item,
                reportCount: 0,
                allReasons: new Set(), 
                allReporters: []
            };
        }
        postsMap[pid].reportCount += 1;
        if (item.reportreason) postsMap[pid].allReasons.add(item.reportreason);
        postsMap[pid].allReporters.push(item.reporter?.username || "Unknown");
      });

      let groupedData = Object.values(postsMap).map(post => ({
        ...post,
        combinedReasons: Array.from(post.allReasons).join(', '),
        latestReporter: post.allReporters[0]
      }));

      // --- Calculate Stats ---
      const highRiskCount = groupedData.filter(item => item.reportCount >= 3).length;
      const hiddenCount = groupedData.filter(item => item.post?.ishidden).length;

      setStats({
        totalPending: groupedData.length,
        highRisk: highRiskCount,
        autoHidden: hiddenCount,
      });

      setUniqueReports(groupedData);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    getUserProfile();
    fetchReports();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await getUserProfile();
    await fetchReports();
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) router.replace('/'); 
  };

  // 👇 CORE LOGIC: Get final display data (Filter -> Search -> Sort)
  const getDisplayData = () => {
    let data = [...uniqueReports];

    // 1. Stats Filter (Clicking the cards)
    if (activeFilter === 'HighRisk') {
        data = data.filter(item => item.reportCount >= 3);
    } else if (activeFilter === 'Hidden') {
        data = data.filter(item => item.post?.ishidden || item.reportCount >= 3);
    }

    // 2. Search Filter (Content OR Author)
    if (searchQuery.trim()) {
        const lowerQuery = searchQuery.toLowerCase();
        data = data.filter(item => 
            (item.post?.postcontent || "").toLowerCase().includes(lowerQuery) || 
            (item.post?.author?.username || "").toLowerCase().includes(lowerQuery)
        );
    }

    // 3. Sorting
    if (sortOption === 'Newest') {
        data.sort((a, b) => new Date(b.reporttime) - new Date(a.reporttime));
    } else if (sortOption === 'Oldest') {
        data.sort((a, b) => new Date(a.reporttime) - new Date(b.reporttime));
    } else if (sortOption === 'Most Reported') {
        data.sort((a, b) => b.reportCount - a.reportCount);
    }

    return data;
  };

  const displayData = getDisplayData(); 

  // --- COMPONENT: Clickable Stats Card ---
  const StatsCard = ({ label, count, color, bg, filterType }) => {
    const isActive = activeFilter === filterType;
    return (
        <TouchableOpacity 
            onPress={() => setActiveFilter(filterType)}
            style={[
                styles.statsCard, 
                { backgroundColor: bg, borderColor: isActive ? color : 'transparent' },
                isActive && styles.activeStatsCard // Add extra style if active
            ]}
        >
            <Text style={[styles.statsCount, { color: color }]}>{count}</Text>
            <Text style={[styles.statsLabel, isActive && {fontWeight: 'bold', color: color}]}>{label}</Text>
            {isActive && <View style={[styles.indicatorDot, {backgroundColor: color}]} />}
        </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => {
    const postContent = item.post?.postcontent || ""; 
    const isHighRisk = item.reportCount >= 3; // ⚠️ High Risk Check
    const accusedName = item.post?.author?.username || "Unknown"; 

    return (
      <TouchableOpacity 
        style={[
            styles.card,
            isHighRisk && styles.highRiskCard // ⚠️ Apply Red Border if High Risk
        ]}
        onPress={() => {
          router.push({
            pathname: '/moderator/reportDetails',
            params: {
              reportId: item.reportedcontentid, 
              postId: item.postid,
              reason: item.combinedReasons, 
              time: item.reporttime,
              content: postContent,
              reporterName: item.reportCount > 1 ? `${item.reportCount} Reporters` : item.latestReporter, 
              accusedName: accusedName,
              isHidden: (item.post?.ishidden || isHighRisk) ? 'true' : 'false',
              reportCount: item.reportCount,
            }
          });
        }}
      >
        <View style={styles.cardHeader}>
            <View style={{flexDirection:'row', alignItems:'center', gap: 5}}>
                <Text style={styles.authorLabel}>Author:</Text>
                <Text style={styles.authorName}>@{accusedName}</Text>
            </View>
            <Text style={styles.date}>
                {item.reporttime ? new Date(item.reporttime).toLocaleDateString() : 'N/A'}
            </Text>
        </View>

        <View style={styles.contentContainer}>
             <Text style={styles.previewText} numberOfLines={2}>
                {postContent ? `"${postContent}"` : "Content not found"}
            </Text>
        </View>

        <View style={styles.cardFooter}>
            {isHighRisk && (
                <View style={styles.riskBadge}>
                     <Text style={styles.riskText}>⚠️ High Risk ({item.reportCount} reports)</Text>
                </View>
            )}
            {!isHighRisk && (
                <Text style={styles.reasonLabel}>Reasons: {item.combinedReasons}</Text>
            )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper bg="#F5F5F5">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Moderator Dashboard</Text>
          <Text style={styles.subTitle}>Welcome, {userName}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={{color: 'white', fontWeight: '600', fontSize: 12}}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayData} 
        keyExtractor={item => item.postid.toString()} 
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 50, paddingTop: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        
        ListHeaderComponent={
            <View style={styles.dashboardSection}>
                
                {/* 👇 Search Bar */}
                <View style={styles.searchContainer}>
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Search content or author..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Filter Cards */}
                <View style={styles.statsGrid}>
                    <StatsCard label="All Pending" count={stats.totalPending} bg="white" color={theme.colors.primary} filterType="All" />
                    <StatsCard label="High Risk" count={stats.highRisk} bg="#FFF3E0" color="#E65100" filterType="HighRisk" />
                    <StatsCard label="Hidden" count={stats.autoHidden} bg="#FFEBEE" color="#C62828" filterType="Hidden" />
                </View>

                {/* Sort Buttons */}
                <View style={styles.sortSection}>
                    <Text style={styles.listTitle}>
                        {activeFilter === 'All' ? 'Recent Reports' : `${activeFilter} Reports`}
                    </Text>
                    <View style={styles.sortBtnRow}>
                        {['Newest', 'Oldest', 'Most Reported'].map((opt) => (
                            <TouchableOpacity 
                                key={opt} 
                                onPress={() => setSortOption(opt)}
                                style={[styles.sortBtn, sortOption === opt && styles.activeSortBtn]}
                            >
                                <Text style={[styles.sortBtnText, sortOption === opt && styles.activeSortBtnText]}>{opt}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        }
        
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{color: 'gray', fontSize: 16}}>
                {loading ? "Loading..." : "No reports match your filter."}
            </Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: wp(4), marginBottom: 10, marginTop: 10 },
  headerTitle: { fontSize: hp(3.2), fontWeight: theme.fonts.bold, color: theme.colors.text },
  subTitle: { color: theme.colors.textLight, fontSize: hp(1.8) },
  logoutBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#333', borderRadius: 20 },
  
  dashboardSection: { paddingHorizontal: wp(4), marginBottom: 15 },
  
  // 🔍 Search Styles
  searchContainer: { backgroundColor: 'white', padding: 12, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  searchInput: { fontSize: 15, color: '#333' },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statsCard: { width: '31%', paddingVertical: 15, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  activeStatsCard: { borderWidth: 2, transform: [{scale: 1.02}] }, // Enlarge slightly when active
  statsCount: { fontSize: 24, fontWeight: 'bold', marginBottom: 2 },
  statsLabel: { fontSize: 11, color: 'gray', fontWeight: '600' },
  indicatorDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },

  sortSection: { marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  sortBtnRow: { flexDirection: 'row', gap: 8 },
  sortBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  activeSortBtn: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  sortBtnText: { fontSize: 11, color: '#666', fontWeight: '600' },
  activeSortBtnText: { color: 'white' },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text },

  card: { backgroundColor: 'white', marginHorizontal: wp(4), marginBottom: 15, borderRadius: 16, borderWidth: 1, borderColor: '#E0E0E0', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, overflow: 'hidden' },
  
  // ⚠️ High Risk Styles
  highRiskCard: { borderColor: '#FF5252', borderWidth: 1.5, backgroundColor: '#FFFBFB' },
  riskBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  riskText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 12 },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: 'transparent' },
  authorLabel: { fontSize: 12, color: 'gray' },
  authorName: { fontSize: 14, fontWeight: 'bold', color: theme.colors.text },
  date: { fontSize: 12, color: '#999' },
  contentContainer: { padding: 15 },
  previewText: { fontSize: 16, color: '#333', fontWeight: '500', lineHeight: 22 },
  cardFooter: { padding: 12, paddingTop: 0 },
  reasonLabel: { fontSize: 12, color: 'gray', fontStyle: 'italic' },
  emptyState: { alignItems: 'center', marginTop: 50 }
});