import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { theme } from "../constants/theme";
import { hp } from "../helpers/common";

const MOOD_OPTIONS = [
  { label: "Happy", icon: "smile", color: "#4CAF50" },
  { label: "Good", icon: "thumbs-up", color: "#8BC34A" },
  { label: "Neutral", icon: "meh", color: "#FF9800" },
  { label: "Sad", icon: "frown", color: "#2196F3" },
  { label: "Anxious", icon: "activity", color: "#9C27B0" },
  { label: "Tired", icon: "battery", color: "#607D8B" },
];

const MoodInputModal = ({ visible, onClose, onSave }) => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!selectedMood) return;
    setLoading(true);
    await onSave(selectedMood.label, note);
    setLoading(false);
    setNote("");
    setSelectedMood(null);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>How are you feeling today?</Text>

          {/* Emoji Grid */}
          <View style={styles.grid}>
            {MOOD_OPTIONS.map((m, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.moodItem,
                  selectedMood?.label === m.label && styles.selectedItem,
                  { borderColor: m.color },
                ]}
                onPress={() => setSelectedMood(m)}
              >
                <Feather
                  name={m.icon}
                  size={28}
                  color={selectedMood?.label === m.label ? "white" : m.color}
                />
                <Text
                  style={[
                    styles.moodLabel,
                    selectedMood?.label === m.label && { color: "white" },
                  ]}
                >
                  {m.label}
                </Text>

                {selectedMood?.label === m.label && (
                  <View style={[styles.bgFill, { backgroundColor: m.color }]} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Note Input */}
          <TextInput
            style={styles.input}
            placeholder="Add a note (optional)..."
            value={note}
            onChangeText={setNote}
            multiline
          />

          {/* Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, !selectedMood && styles.disabledBtn]}
              disabled={!selectedMood || loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.saveText}>Share Mood</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default MoodInputModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    minHeight: hp(45),
  },
  title: {
    fontSize: hp(2.2),
    fontWeight: "bold",
    color: theme.colors.textDark,
    marginBottom: 20,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 20,
  },
  moodItem: {
    width: "30%",
    aspectRatio: 1,
    borderWidth: 1.5,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  selectedItem: { borderWidth: 0 },
  bgFill: { position: "absolute", width: "100%", height: "100%", zIndex: -1 },
  moodLabel: {
    marginTop: 5,
    fontSize: hp(1.4),
    fontWeight: "600",
    color: theme.colors.textLight,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 15,
    height: 80,
    textAlignVertical: "top",
    fontSize: hp(1.6),
    marginBottom: 20,
  },
  footer: { flexDirection: "row", gap: 15 },
  cancelBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  saveBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
  },
  disabledBtn: { backgroundColor: "#A0A0A0" },
  saveText: { color: "white", fontWeight: "bold" },
  cancelText: { color: theme.colors.textDark, fontWeight: "600" },
});
