import moment from 'moment';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from '../assets/icons';
import { theme } from '../constants/theme';
import { hp } from '../helpers/common';
import Avatar from './Avatar';

const CommentItem = ({ 
    item, 
    canDelete = false, 
    onDelete = () => {} 
}) => {
    // Format the date (e.g., "Jan 14")
    const createdAt = moment(item?.replycreatedat).format('MMM D');

    // Handle delete confirmation
    const handleDelete = () => {
        Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive', 
                onPress: () => onDelete(item) 
            }
        ]);
    }

    return (
        <View style={styles.container}>
            {/* User Avatar */}
            <Avatar uri={item?.user?.image} size={hp(4)} rounded={theme.radius.md} />
            
            <View style={styles.content}>
                {/* Header: Name, Date, Delete Icon */}
                <View style={styles.header}>
                    <View style={styles.userInfo}>
                        <Text style={styles.name}>{item?.user?.username}</Text>
                        <Text style={styles.text}>•</Text>
                        <Text style={styles.text}>{createdAt}</Text>
                    </View>
                    
                    {/* Only show delete icon if allowed */}
                    {
                        canDelete && (
                            <TouchableOpacity onPress={handleDelete}>
                                <Icon name="delete" size={20} color={theme.colors.rose} />
                            </TouchableOpacity>
                        )
                    }
                </View>
                
                {/* Comment Text */}
                <Text style={[styles.text, { color: theme.colors.textDark }]}>
                    {item?.replycontent}
                </Text>
            </View>
        </View>
    )
}

export default CommentItem

const styles = StyleSheet.create({
    container: { flex: 1, flexDirection: 'row', gap: 7 },
    content: { 
        backgroundColor: 'rgba(0,0,0,0.06)', 
        flex: 1, 
        gap: 5, 
        paddingHorizontal: 14, 
        paddingVertical: 10, 
        borderRadius: theme.radius.md, 
        borderCurve: 'continuous' 
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    userInfo: { flexDirection: 'row', gap: 5, alignItems: 'center' },
    name: { fontSize: hp(1.6), fontWeight: theme.fonts.bold, color: theme.colors.textDark },
    text: { fontSize: hp(1.6), fontWeight: theme.fonts.medium, color: theme.colors.textLight }
})