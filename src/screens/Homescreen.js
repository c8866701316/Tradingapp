import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, Pressable, TextInput, Animated, Alert, ScrollView } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import AutoScroll from "@homielab/react-native-auto-scroll";
import { SafeAreaView } from "react-native-safe-area-context";
import ConnectSignalR from "../Websocket/ConnectSignalR"; // Adjust the import path
import { UserContext } from "./UserContext";
import { api, getStored, getUserDetails } from "../Apicall/Axios"; // Adjust the import path
import WatchlistSubscription from "./HomeComponts/WatchlistSubscription";
import DataUpdateHandler from "./HomeComponts/DataUpdateHandler";
import OrderModal from "./HomeComponts/OrderModal";
import DataList from "./HomeComponts/DataList";

const BASE_URL = "https://tradep.clustersofttech.com/api";

const HomeScreen = ({ navigation }) => {
  const [watchlist, setWatchlist] = useState([]);
  const [selectedtabs, setSelectedTabs] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentScripts, setCurrentScripts] = useState([]);
  const [data, setData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const hasFetchedWatchlist = useRef(false);
  const [hasSelectedWatchlist, setHasSelectedWatchlist] = useState(false);


  // Ayto scroll into show the Date
  const formattedDate = useMemo(() => {
    const date = new Date();
    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear().toString().slice(-2);
    return `${day}, ${month}${year}`;
  }, []);

  // SingalR Connected
  const connectSignalR = useCallback(async () => {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        if (!ConnectSignalR || ConnectSignalR.state !== "Connected") {
          console.log(`Attempting SignalR connection (Attempt ${retryCount + 1}/${maxRetries})...`);
          await ConnectSignalR.start();
          console.log("SignalR connected successfully.");
          return true; // Indicate successful connection
        }
        console.log("SignalR already connected.");
        return true;
      } catch (error) {
        console.error(`SignalR connection attempt ${retryCount + 1} failed:`, error);
        retryCount++;
        if (retryCount === maxRetries) {
          console.error("Max SignalR connection retries reached.");
          Alert.alert("Connection Error", "Failed to connect to the server. Please try again later.");
          return false; // Indicate failure
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait before retrying
      }
    }
  }, []);
  // Me Api call and Show Watchlist Name
  const fetchWatchlist = useCallback(async () => {
    if (hasFetchedWatchlist.current) {
      console.log("fetchWatchlist already called, skipping...");
      return;
    }
    hasFetchedWatchlist.current = true;
    console.log("Fetching watchlist, hasSelectedWatchlist:", hasSelectedWatchlist);
    try {
      const userDetails = await getStored();
      if (!userDetails?.accessToken) {
        throw new Error("Access token is missing.");
      }
      // const response = await api.get('/Me');
      const response = await api.get('/Me', {
        headers: { Authorization: `Bearer ${userDetails.accessToken}` },
      });

      if (response?.data?.status === true || response?.data?.status === "true") {
        const watchlistData = response.data.data.watchList || {};
        const normalizedWatchlist = Object.entries(watchlistData).map(([key, items]) => {
          const [id, category] = key.split(":");
          return { fullKey: key, id, category, items };
        });

        console.log("Normalized watchlist:", normalizedWatchlist.map((w) => w.category));

        if (normalizedWatchlist.length > 0) {
          setWatchlist(normalizedWatchlist);
          if (!hasSelectedWatchlist) {
            const defaultWatchlist = normalizedWatchlist.find((w) => w.category === "MCX") || normalizedWatchlist[0];
            setCurrentScripts(defaultWatchlist.items);
            setActiveIndex(normalizedWatchlist.indexOf(defaultWatchlist));
            setSelectedTabs(defaultWatchlist.category);
            setData([]);
            console.log("Set default watchlist to:", defaultWatchlist.category);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      setWatchlist([]);
    }
  }, [hasSelectedWatchlist]);

  // Click on watchlist tab
  const handleWatchlistSelection = useCallback(
    (index, category) => {
      console.log(`Selecting watchlist: ${category}, index: ${index}`);
      setActiveIndex(index);
      setSelectedTabs(category);
      setHasSelectedWatchlist(true);
      const currentData = watchlist.find((item) => item.category === category);
      setCurrentScripts(currentData?.items || []);
      setData([]);
      setSelectedItem(null);
    },
    [watchlist]
  );

  // Call the connectsingalR/watchlist
  useEffect(() => {
    console.log("Running initialization useEffect...");
    const initialize = async () => {
      const isConnected = await connectSignalR(); // Ensure SignalR is connected
      if (isConnected) {
        await fetchWatchlist(); // Fetch watchlist only if connected
      } else {
        console.error("Skipping watchlist fetch due to SignalR connection failure.");
      }
    };
    initialize();
  }, [connectSignalR, fetchWatchlist]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={{ backgroundColor: '#03415A', borderBottomRightRadius: 8, borderBottomLeftRadius: 8 }}>
          <View style={styles.indexMargin}>
            <View style={[styles.box, styles.niftyBox]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.boldText}>NIFTY 50</Text>
                <Text style={styles.largeText}>19517.0</Text>
              </View>
              <View style={{ justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                <Text style={styles.greenText}>135.35 (0.69%)</Text>
              </View>
            </View>
            <View style={[styles.box, styles.sensexBox]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.boldText}>SENSEX</Text>
                <Text style={styles.largeText}>65721.25</Text>
              </View>
              <View style={{ justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                <Text style={styles.greenText}>480.57 (0.73%)</Text>
              </View>
            </View>
          </View>
          <View style={[styles.tagline, { backgroundColor: '#03415A' }]}>
            <AutoScroll style={styles.scrolling2} endPadding={50} duration={15000}>
              <Text style={styles.welcome}>
                EXPIRY ALERT: NG & NG-USD EXPIRES TODAY ({formattedDate}), SO KINDLY ROLLOVER YOUR POSITION BEFORE MARKET CLOSE, OTHERWISE SQUARE OFF BY-ASK RATE.
              </Text>
            </AutoScroll>
          </View>
        </View>

        {/* Watchlist Name */}
        <View style={{ backgroundColor: '#F1F2F4' }}>
          <ScrollView horizontal style={styles.menuScroll}>
            {watchlist.map((entry, index) => (
              <Pressable
                key={entry.category}
                style={[styles.menuButton, activeIndex === index && styles.activeMenuButton]}
                onPress={() => handleWatchlistSelection(index, entry.category)}
              >
                <Text style={activeIndex === index ? styles.activeText : styles.text}>
                  {entry.category}
                </Text>
              </Pressable>
            ))}
            <View style={styles.searchContainer}>
              <View style={{ flexDirection: "row", justifyContent: "center" }}>
                <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Selectmarket')}>
                  <Ionicons name="add" size={30} color="black" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <MaterialIcons name="tune" size={30} color="black" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="tv-outline" size={30} color="black" />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>

        <WatchlistSubscription currentScripts={currentScripts} />

        <DataUpdateHandler
          selectedTabs={selectedtabs}
          setData={setData}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
        />

        <DataList
          data={data}
          setModalVisible={setModalVisible}
          setSelectedItem={setSelectedItem}
          watchlist={watchlist}
          selectedTabs={selectedtabs}
        />

        <OrderModal
          modalVisible={modalVisible}
          setModalVisible={setModalVisible}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
        />

      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  indexMargin: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 8,
  },
  box: {
    width: 160,
    padding: 5,
    borderWidth: 1,
    borderRadius: 8,
  },
  niftyBox: {
    borderColor: "#577F8D",
    marginRight: 8,
  },
  sensexBox: {
    borderColor: "#577F8D",
  },
  boldText: {
    color: 'white',
    fontWeight: "bold",
    fontSize: 11,
  },
  largeText: {
    color: 'white',
    fontSize: 15,
    fontWeight: "bold",
  },
  greenText: {
    color: "green",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  tagline: {
    overflow: 'hidden',
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  scrolling2: {
    backgroundColor: "#03415A",
    width: '100%',
    padding: 5,
  },
  welcome: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  menuScroll: {
    marginVertical: 5,
    padding: 5,
  },
  menuButton: {
    height: 30,
    paddingHorizontal: 29,
    marginHorizontal: 3,
    justifyContent: 'center',
  },
  activeMenuButton: {
    backgroundColor: '#BECDD3',
    borderRadius: 9,
  },
  text: {
    color: '#BCBCBD',
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeText: {
    color: '#03415B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: "row",
    justifyContent: 'flex-end',
    paddingHorizontal: 35,
    borderRadius: 8,
  },
  iconButton: {
    marginVertical: 2,
    marginHorizontal: 10
  },
});