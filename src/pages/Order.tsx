import { useRoute } from "@react-navigation/native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const Order = () => {
  const route = useRoute();
  const { id } = route.params as { id: string };

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
