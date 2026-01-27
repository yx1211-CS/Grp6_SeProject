import { StyleSheet, Text, View, TouchableOpacity, Alert, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import { Header } from '../../components/Header' // Ensure you have a Header component or use simple Text
import { wp, hp } from '../../helpers/common'
import { theme } from '../../constants/theme'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'expo-router'
import Icon from '../../assets/icons'

const EditInterests = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [allInterests, setAllInterests] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if(user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        // 1. Fetch all available interests from DB
        const { data: interestsData } = await supabase.from('interest').select('*');
        if(interestsData) setAllInterests(interestsData);

        // 2. Fetch user's current interests
        const { data: userInterests } = await supabase
            .from('user_interest')
            .select('interestid')
            .eq('userid', user.id);
        
        if(userInterests) {
            setSelectedIds(userInterests.map(item => item.interestid));
        }
    }

    const toggleInterest = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(item => item !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    }

    const handleSave = async () => {
        setLoading(true);
        try {
            // Strategy: Delete all existing interests for user, then re-insert selected
            // 1. Delete old
            const { error: deleteError } = await supabase
                .from('user_interest')
                .delete()
                .eq('userid', user.id);
            
            if(deleteError) throw deleteError;

            // 2. Insert new (only if there are selected items)
            if (selectedIds.length > 0) {
                const updates = selectedIds.map(id => ({
                    userid: user.id,
                    interestid: id
                }));

                const { error: insertError } = await supabase
                    .from('user_interest')
                    .insert(updates);
                
                if(insertError) throw insertError;
            }

            Alert.alert("Success", "Interests updated!");
            router.back();

        } catch (error) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <ScreenWrapper bg="white">
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={()=> router.back()}>
                        <Icon name="arrowLeft" size={hp(3.2)} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Edit Interests</Text>
                    <TouchableOpacity onPress={handleSave} disabled={loading}>
                        <Text style={[styles.saveText, loading && {color: theme.colors.textLight}]}>
                            {loading ? "Saving..." : "Save"}
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.subTitle}>Select topics you enjoy to find similar friends</Text>

                <ScrollView contentContainerStyle={styles.tagsContainer}>
                    {allInterests.map((item) => {
                        const isSelected = selectedIds.includes(item.interestid);
                        return (
                            <TouchableOpacity 
                                key={item.interestid}
                                style={[styles.tag, isSelected && styles.selectedTag]}
                                onPress={() => toggleInterest(item.interestid)}
                            >
                                <Text style={[styles.tagText, isSelected && styles.selectedTagText]}>
                                    {item.interestname}
                                </Text>
                            </TouchableOpacity>
                        )
                    })}
                </ScrollView>
            </View>
        </ScreenWrapper>
    )
}

export default EditInterests

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: wp(4) },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    title: { fontSize: hp(2.5), fontWeight: theme.fonts.bold, color: theme.colors.text },
    saveText: { fontSize: hp(2.2), fontWeight: 'bold', color: theme.colors.primary },
    subTitle: { fontSize: hp(1.6), color: theme.colors.textLight, marginBottom: 20 },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    tag: {
        paddingHorizontal: 15, paddingVertical: 8,
        borderRadius: 20, borderWidth: 1, borderColor: theme.colors.gray,
        backgroundColor: 'white'
    },
    selectedTag: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    tagText: { color: theme.colors.text, fontSize: hp(1.8) },
    selectedTagText: { color: 'white', fontWeight: 'bold' }
})