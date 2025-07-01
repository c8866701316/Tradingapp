import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  StyleSheet,
} from "react-native";
import { getUserDetails } from "../api/AxiosApi";
import { api } from "../../Apicall/Axios";

const BASE_URL = "https://tradep.clustersofttech.com/api";

const OrderModal = ({ modalVisible, setModalVisible, selectedItem, setSelectedItem }) => {
  const [selectedOrder, setSelectedOrder] = useState("Market Order");
  const [limitPrice, setLimitPrice] = useState("");
  const [qty, setQty] = useState("");
  const [lotQty, setLotQty] = useState("1");
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [dropdownData, setDropdownData] = useState([]);
  const [notification, setNotification] = useState({ message: "", type: "", visible: false });
  const [lastOrderId, setLastOrderId] = useState(null); 
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showNotification = useCallback(
    (message, type) => {
      setNotification({ message, type, visible: true });
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setTimeout(() => hideNotification(), 3000);
    },
    [fadeAnim]
  );

  const hideNotification = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setNotification((prev) => ({ ...prev, visible: false })));
  }, [fadeAnim]);

  const fetchDropdownData = useCallback(async () => {
    try {
      const response = await api.get('/Master/FillDropdown', {
        params: { key: "3A4FBF37-CDAA-436C-B8D6-CCD9F6E099EE", option: "Normal" },
      });
      if (response.data && response.data.data) {
        setDropdownData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  }, []);

  const handleOrder = useCallback(
    async (orderSide) => {
      if (!limitPrice || !qty || !lotQty || !selectedOrder || !selectedSymbol) {
        showNotification("All fields are required, including the selected symbol.", "error");
        return;
      }

      const payload = {
        orderType: selectedOrder === "Market Order" ? 2 : 1,
        limitPrice: parseFloat(limitPrice),
        qty: parseInt(qty),
        lotQty: parseInt(lotQty),
        orderSide: orderSide,
        symbol: selectedSymbol,
        isMarketPrice: true,
        isFrom: false,
        clientId: null,
      };

      try {
        const userDetails = await getUserDetails();
        if (!userDetails?.accessToken) {
          throw new Error("Access token is missing.");
        }

        const response = await fetch(`${BASE_URL}/OrderApi/AddOrder`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userDetails.accessToken}`,
          },
          body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        if (!responseText) {
          throw new Error(`Empty response from server for ${selectedSymbol}`);
        }

        const data = JSON.parse(responseText);
        const orderId = data.data?.orderId || data.data?.id || JSON.stringify(payload);

        setModalVisible(false);

        if (lastOrderId !== orderId) {
          setLastOrderId(orderId);
          if (data.status === true) {
            showNotification(data.message || "Order Placed Successfully", "success");
          } else {
            showNotification(data.message || "Order Failed. Pl ease try again.", "error");
          }
        }
      } catch (error) {
        console.error("Error placing order:", error);
        showNotification("Order Failed. " + (error.message || "Please try again."), "error");
        setModalVisible(false);
      }
    },
    [limitPrice, qty, lotQty, selectedOrder, selectedSymbol, lastOrderId, showNotification]
  );

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (selectedItem) {
      setLotQty("1");
      setQty(String(selectedItem.mls || ""));
      setSelectedSymbol(selectedItem.s);
    }
  }, [selectedItem]);

  return (
    <>
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ width: 330, backgroundColor: "white", borderRadius: 15 }}>

            {selectedItem &&
              <View>
                {/* Header */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", backgroundColor: '#03415B', padding: 10, borderTopLeftRadius: 15, borderTopRightRadius: 15 }}>
                  <Text style={{ fontSize: 18, fontWeight: "bold", color: 'white' }}>{selectedItem.es}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text style={{ fontSize: 17, color: "white" }}>✖</Text>
                  </TouchableOpacity>
                </View>

                {/* Centered Price & Percentage */}
                <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 10 }}>
                  <Text style={[styles.modalPrice, { color: selectedItem.bidPriceColor || "black" }]}>{selectedItem.ltp || "NO"}</Text>
                  <Text style={{ fontSize: 12, color: selectedItem.ch > 0 ? "green" : "red", marginLeft: 5 }}>{selectedItem.chp}%</Text>
                </View>

                {/* Max Position & Order Qty Section */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 8 }}>
                  <Text style={{ fontSize: 10, color: '#03415B', fontWeight: "bold" }}>Max Position : 0</Text>
                  <Text style={{ fontSize: 10, color: '#03415B', fontWeight: "bold" }}>Max Order Qty : 0</Text>
                </View>

                {selectedOrder === 'Limit Order' && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 8 }}>
                    <Text style={{ fontSize: 10, color: '#03415B', fontWeight: "bold" }}>LOW : {selectedItem.lp}</Text>
                    <Text style={{ fontSize: 10, color: '#03415B', fontWeight: "bold" }}>LTP : {selectedItem.ltp}</Text>
                    <Text style={{ fontSize: 10, color: '#03415B', fontWeight: "bold" }}>High : {selectedItem.hp}</Text>
                  </View>

                )}
                {/* Lot & Qty Section TextInput*/}
                <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 8 }}>
                  <View style={styles.labeledInput}>
                    <View style={styles.labelPart}>
                      <Text style={styles.labelText}>Lot:</Text>
                    </View>
                    <TextInput
                      style={styles.valuePart}
                      keyboardType="numeric"
                      value={lotQty}
                      onChangeText={setLotQty}
                    />
                  </View>
                  <View style={styles.labeledInput}>
                    <View style={styles.labelPart}>
                      <Text style={styles.labelText}>Qty:</Text>
                    </View>
                    <TextInput
                      style={styles.valuePart}
                      keyboardType="numeric"
                      value={qty}
                      onChangeText={setQty}
                    />
                  </View>
                </View>

                {/* Order Type Selection */}
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 10, color: '#03415B', padding: 8 }}>Select Order Type</Text>
                  {
                    dropdownData.length > 0 && (
                      <>
                        {/* Market Order Button */}
                        <TouchableOpacity
                          onPress={() => setSelectedOrder('Market Order')}
                          style={{
                            borderRadius: 8,
                            backgroundColor: selectedOrder === 'Market Order' ? '#03415B' : 'white',
                            width: '27%',
                            padding: 5,
                            alignItems: 'center'
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: selectedOrder === 'Market Order' ? "bold" : "normal",
                              color: selectedOrder === 'Market Order' ? '#FFF' : '#03415B',
                            }}
                          >
                            {dropdownData.find(order => order.text.includes('Market'))?.text || 'Market'}
                          </Text>
                        </TouchableOpacity>

                        {/* Limit Order Button */}
                        <TouchableOpacity
                          onPress={() => setSelectedOrder('Limit Order')}
                          style={{
                            borderRadius: 8,
                            backgroundColor: selectedOrder === 'Limit Order' ? '#03415B' : 'white',
                            width: '27%',
                            padding: 5,
                            alignItems: 'center',
                            right: 12
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: selectedOrder === 'Limit Order' ? "bold" : "normal",
                              color: selectedOrder === 'Limit Order' ? '#FFF' : '#03415B',
                            }}
                          >
                            {dropdownData.find(order => order.text.includes('Limit'))?.text || 'Limit / SL'}
                          </Text>
                        </TouchableOpacity>
                      </>

                    )}
                </View>

                <View style={{ padding: 10, justifyContent: 'center', alignItems: 'center' }}>
                  <View style={[styles.labeledInput, { width: '90%' }]}>
                    <View style={styles.labelPart}>
                      <Text style={styles.labelText}>Price:</Text>
                    </View>
                    <TextInput
                      style={styles.valuePart}
                      keyboardType="numeric"
                      value={limitPrice}
                      onChangeText={setLimitPrice}
                    />
                  </View>
                </View>

                {/* Buy & Sell Buttons */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 15 }}>
                  <TouchableOpacity style={[styles.button, { backgroundColor: "red" }]} onPress={() => {
                    console.log("Sell button clicked");
                    handleOrder("-1");
                  }}>
                    <Text style={{ color: "white", fontSize: 14, textAlign: 'center' }}>Sell Now @ </Text>
                    <Text style={{ color: "white", fontSize: 14, textAlign: 'center' }}>{selectedItem.bp}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, { backgroundColor: "green" }]} onPress={() => handleOrder("1")}>
                    <Text style={{ color: "white", fontSize: 14, textAlign: 'center' }}>Buy Now @ </Text>
                    <Text style={{ color: "white", fontSize: 14, textAlign: 'center' }}>{selectedItem.ap}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
          </View>
        </View>
      </Modal>

      {notification.visible && (
        <Animated.View
          style={[
            styles.notification,
            {
              backgroundColor: notification.type === "success" ? "#4CAF50" : "#F44336",
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.notificationText}>
            {notification.type === "success" ? "✅ " : "❌ "}
            {notification.message}
          </Text>
        </Animated.View>
      )}
    </>
  );
};

export default OrderModal;
const styles = StyleSheet.create({
  modalPrice: {
    fontSize: 25,
    fontWeight: "bold"
  },
  labeledInput: {
    flexDirection: 'row',
    width: '45%',
    height: 40,
    borderRadius: 8,
    backgroundColor: '#CDD9DE',
    overflow: 'hidden',
  },
  labelPart: {
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  labelText: {
    color: '#03415B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  valuePart: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#03415B',
    textAlign: 'center',
  },
  button: {
    width: 140,
    padding: 8,
    borderRadius: 5,
    alignItems: "center",
  },
  notification: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  notificationText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
})