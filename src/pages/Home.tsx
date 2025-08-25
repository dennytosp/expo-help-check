import AntsomiRnSDK from "@antsomicorp/antsomirnsdk";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

const Home = () => {
  const navigation = useNavigation();

  useEffect(() => {
    AntsomiRnSDK.getPushUid().then((item) => {
      console.log("Push UID", item);
    });
  }, []);

  const onPress = () => {
    // @ts-ignore
    navigation.navigate("order" as never, { id: "1" } as never);
  };

  return (
    <View style={styles.container}>
      <Text onPress={onPress} style={styles.text}>
        Home
      </Text>
    </View>
  );
};

export { Home };

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
