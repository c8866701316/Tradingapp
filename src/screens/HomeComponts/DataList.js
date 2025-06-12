import React, { useState, useCallback } from "react";
import { View, FlatList, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { getUserDetails } from "../api/AxiosApi";

const BASE_URL = "https://tradep.clustersofttech.com/api";

const DataItem = React.memo(({ item, onPress, onLongPress, selectionMode, isSelected, onItemSelect }) => (
  <TouchableOpacity onPress={() => !selectionMode && onPress(item)} onLongPress={onLongPress}>
    <View style={styles.dataCard}>
      {selectionMode && (
        <TouchableOpacity
          onPress={() => onItemSelect(item)}
          style={{
            width: 20,
            height: 20,
            marginRight: 10,
            borderWidth: 2,
            borderRadius: 4,
            borderColor: '#555',
            backgroundColor: isSelected ? '#4caf50' : '#fff',
            justifyContent: 'center',
            alignItems: 'center',
            margin: 8,
          }}
        >
          {isSelected && (
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>✓</Text>
          )}
        </TouchableOpacity>
      )}
      {selectionMode ? (
        <Text style={{ fontSize: 16, fontWeight: "bold", flex: 1, textAlign: "center" }}>{item.es}</Text>
      ) : (
        <>
          <View>
            <Text style={styles.databoldText}>{item.es}</Text>
            <Text style={styles.dateText}>{item.ed}</Text>
            <Text style={[styles.perText, { color: item.ch > 0 ? "green" : "red" }]}>{item.ch} ({item.chp}%)</Text>
          </View>
          <View style={styles.mainbox}>
            <View style={styles.row}>
              <Text style={styles.lowtext}>
                Low: <Text style={{ fontSize: 12, fontWeight: '500', color: '#03415A' }}>{item.lp}</Text>
              </Text>
              <Text style={[styles.textdata, { color: item.bidPriceColor || "black" }]}>{item.bp}</Text>
              <Text style={styles.qtytext}>
                Qty: <Text style={{ fontSize: 12 }}>0</Text>
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.hightext}>
                High: <Text style={{ fontSize: 12, fontWeight: '500', color: '#03415A' }}>{item.hp}</Text>
              </Text>
              <Text style={[styles.highTextData, { color: item.askPriceColor || "black" }]}>{item.ap}</Text>
              <Text style={styles.Ltptext}>
                LTP: <Text style={{ fontSize: 13, fontWeight: 'bold' }}>{item.ltp}</Text>
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  </TouchableOpacity>
));

const DataList = ({ data, setModalVisible, setSelectedItem, watchlist, selectedTabs }) => {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const handlePress = useCallback((item) => {
    setSelectedItem(item);
    setModalVisible(true);
  }, [setSelectedItem, setModalVisible]);

  const handleItemSelect = useCallback((item) => {
    setSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }, []);

  const handleCancel = useCallback(() => {
    setSelectionMode(false);
    setSelectedItems([]);
  }, []);

  const handleConfirm = useCallback(async () => {
    try {
      const userDetails = await getUserDetails();
      if (!userDetails?.accessToken) {
        throw new Error("Access token is missing.");
      }
      const selectedWatchlist = watchlist.find((w) => w.category === selectedTabs);
      const watchlistId = selectedWatchlist?.id;

      if (!watchlistId) {
        throw new Error("Watchlist ID not found for selected category.");
      }

      for (const item of selectedItems) {
        const payload = { watchlistId, scriptName: item.s, isRemove: false };
        const response = await fetch(`${BASE_URL}/StockApi/AddRemoveScriptToWatchlist`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userDetails.accessToken}`,
          },
          body: JSON.stringify(payload),
        });

        const status = response.status;
        const text = await response.text();
        const result = text ? JSON.parse(text) : null;

        if (status === 200 && result?.status === true) {
          Alert.alert("✅", result.message || "Script added successfully.");
          setData((prevData) => prevData.filter((d) => d.s !== item.s));
        } else {
          Alert.alert("❌ Error", result?.message || "Something went wrong.");
        }
      }
    } catch (error) {
      console.error("Error sending data to API:", error);
    }
    setSelectionMode(false);
    setSelectedItems([]);
  }, [selectedItems, selectedTabs, watchlist]);

  return (
    <>
      <FlatList
        data={data}
        keyExtractor={(item) => item.s}
        renderItem={({ item }) => (
          <DataItem
            item={item}
            onPress={handlePress}
            onLongPress={() => setSelectionMode(true)}
            selectionMode={selectionMode}
            isSelected={selectedItems.includes(item)}
            onItemSelect={handleItemSelect}
          />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "gray" }}>No Data Found</Text>
          </View>
        }
      />
      {selectionMode && (
        <View style={{ flexDirection: "row", justifyContent: "space-around", padding: 15 }}>
          <TouchableOpacity
            onPress={handleCancel}
            style={{
              backgroundColor: "red",
              padding: 10,
              borderRadius: 10,
              width: 70,
              alignItems: "center",
              marginLeft: 30,
            }}
          >
            <Text style={{ color: "white", fontSize: 15 }}>✖</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleConfirm}
            style={{
              backgroundColor: "green",
              padding: 10,
              borderRadius: 10,
              width: 70,
              alignItems: "center",
              marginRight: 30,
            }}
          >
            <Text style={{ color: "white", fontSize: 15 }}>✔</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

export default DataList;
const styles = StyleSheet.create({
  dataCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 5,
    margin: 4,
    marginHorizontal: 10,
    alignItems: 'center',
  },
  databoldText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#03415A',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 10,
    color: '#03415A',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  perText: {
    fontSize: 10,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  mainbox: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginRight: -20
  },
  row: {
    width: '35%',
    marginBottom: 5,
  },
  lowtext: {
    fontSize: 10,
    color: '#444',
    textAlign: 'center'
  },
  textdata: {
    fontSize: 17,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  highTextData: {
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 17,
  },
  qtytext: {
    fontSize: 13,
    color: '#03415A',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  hightext: {
    fontSize: 10,
    color: '#444',
    textAlign: 'right'
  },
  highprtdata: {
    fontSize: 16,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  Ltptext: {
    fontSize: 12,
    color: '#03415A',
    textAlign: 'right'
  },
})