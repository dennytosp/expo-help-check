import AntsomiRnSDK from "@antsomicorp/antsomirnsdk";
import { useRoute } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import React, { useEffect } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

const Order = () => {
  const route = useRoute();
  const { id } = route.params as { id: string };

  useEffect(() => {
    AntsomiRnSDK.getPushUid().then((uid) => {
      Alert.alert("Push UID", `${uid}`, [
        {
          text: "Copy",
          onPress: () => Clipboard.setStringAsync(String(uid)),
        },
      ]);
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{`Order / ${id}`}</Text>
    </View>
  );
};

export { Order };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "black",
    fontSize: 20,
    fontWeight: "bold",
  },
});
