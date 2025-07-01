import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Modal,
    Pressable,
    TextInput,
    Animated,
    Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, getUserDetails } from "../Apicall/Axios"; // Adjust the import path
import ConnectSignalR from "../Websocket/ConnectSignalR"; // Adjust the import path
import { UserContext } from "./UserContext";
import debounce from "lodash.debounce";

const BASE_URL = "https://tradep.clustersofttech.com/api";

// Memoized List Item Component
const DataItem = React.memo(({ item, onPress, onLongPress, selectionMode, selectedItems, onItemSelect }) => (
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
                        borderColor: "#555",
                        backgroundColor: selectedItems.includes(item) ? "#4caf50" : "#fff",
                        justifyContent: "center",
                        alignItems: "center",
                        margin: 8,
                    }}
                >
                    {selectedItems.includes(item) && (
                        <Text style={{ color: "#fff", fontWeight: "bold" }}>✓</Text>
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
                                Low: <Text style={{ fontSize: 12, fontWeight: "500", color: "#03415A" }}>{item.lp}</Text>
                            </Text>
                            <Text style={[styles.textdata, { color: item.bidPriceColor || "black" }]}>{item.bp}</Text>
                            <Text style={styles.qtytext}>
                                Qty: <Text style={{ fontSize: 12 }}>0</Text>
                            </Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.hightext}>
                                High: <Text style={{ fontSize: 12, fontWeight: "500", color: "#03415A" }}>{item.hp}</Text>
                            </Text>
                            <Text style={[styles.highprtdata, { color: item.askPriceColor || "black" }]}>{item.ap}</Text>
                            <Text style={styles.Ltptext}>
                                LTP: <Text style={{ fontSize: 13, fontWeight: "bold" }}>{item.ltp}</Text>
                            </Text>
                        </View>
                    </View>
                </>
            )}
        </View>
    </TouchableOpacity>
));

const ScriptListScreen = ({ route, navigation }) => {
    const { category, scripts } = route.params;
    const meData = React.useContext(UserContext);
    const [data, setData] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [dropdownData, setDropdownData] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState("Market Order");
    const [limitPrice, setLimitPrice] = useState("");
    const [qty, setQty] = useState("");
    const [lotQty, setLotQty] = useState("1");
    const [selectedSymbol, setSelectedSymbol] = useState(null);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [lastOrderId, setLastOrderId] = useState(null);
    const [notification, setNotification] = useState({ message: "", type: "", visible: false });
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const prevScriptsRef = useRef([]);
    const [ignore, setIgnore] = useState(false);

    const debouncedHandleNewData = useCallback(
        // debounce(
        (newData) => {
            if (!newData?.s || !category) {
                console.log("Invalid data or category:", { newData, category });
                return;
            }

            const watchlistPrefix = newData.s.split(":")[0];
            if (watchlistPrefix !== category) {
                console.log(`Ignoring update for ${newData.s}, current category: ${category}`);
                return;
            }

            console.log(`Processing update for ${newData.s}`);
            setData((prevData) => {
                const existingIndex = prevData.findIndex((item) => item.es === newData.es);
                if (existingIndex === -1) {
                    return [...prevData, { ...newData, bidPriceColor: "black", askPriceColor: "black", highPriceColor: "black", lowPriceColor: "black" }];
                }

                const prevItem = prevData[existingIndex];
                const newBidPrice = parseFloat(newData?.bp) || 0;
                const prevBidPrice = parseFloat(prevItem?.bp) || 0;
                const newAskPrice = parseFloat(newData?.ap) || 0;
                const prevAskPrice = parseFloat(prevItem?.ap) || 0;
                const prevLowPrice = parseFloat(prevItem?.lp) || 0;
                const newLowPrice = parseFloat(newData?.lp) || 0;
                const prevHighPrice = parseFloat(prevItem?.hp) || 0;
                const newHighPrice = parseFloat(newData?.hp) || 0;

                newData.bidPriceColor = newBidPrice > prevBidPrice ? "green" : newBidPrice < prevBidPrice ? "red" : prevItem.bidPriceColor;
                newData.askPriceColor = newAskPrice > prevAskPrice ? "green" : newAskPrice < prevAskPrice ? "red" : prevItem.askPriceColor;
                newData.highPriceColor = newHighPrice > prevHighPrice ? "green" : newHighPrice < prevHighPrice ? "red" : prevItem.highPriceColor;
                newData.lowPriceColor = newLowPrice < prevLowPrice ? "red" : newLowPrice > prevLowPrice ? "green" : prevItem.lowPriceColor;

                const updatedData = [...prevData];
                updatedData[existingIndex] = newData;

                return updatedData;
            });

            if (selectedItem?.es === newData.es) {
                setSelectedItem(newData);
            }
        },
        // }, 10),
        [selectedItem, category]
    );

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

    const connectSignalR = useCallback(async () => {
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                if (!ConnectSignalR || ConnectSignalR.state !== "Connected") {
                    console.log(`Attempting SignalR connection (Attempt ${retryCount + 1}/${maxRetries})...`);
                    await ConnectSignalR.start();
                }
                console.log("SignalR connected successfully.");
                return;
            } catch (error) {
                console.error(`SignalR connection attempt ${retryCount + 1} failed:`, error);
                retryCount++;
                if (retryCount === maxRetries) {
                    console.error("Max SignalR connection retries reached.");
                    showNotification("Failed to connect to real-time updates. Please try again.", "error");
                    return;
                }
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }
    }, [showNotification]);

    const handlePress = useCallback((item) => {
        setSelectedItem(item);
        setSelectedSymbol(item.s);
        setModalVisible(true);
    }, []);

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

            const watchlistId = meData?.watchList?.[`${category}`]?.id;
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
    }, [selectedItems, category, meData]);

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
                isFrom: 3,
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
                        showNotification(data.message || "Order Failed. Please try again.", "error");
                    }
                }
            } catch (error) {
                console.error("Error placing order:", error.message);
                showNotification("Order Failed. " + (error.message || "Please try again."), "error");
                setModalVisible(false);
            }
        },
        [limitPrice, qty, lotQty, selectedOrder, selectedSymbol, lastOrderId, showNotification]
    );

    const fetchDropdownData = useCallback(async () => {
        try {
            const response = await api.get('/Master/FillDropdown', {
                params: { key: "3A4FBF37-CDAA-436C-B8D6-CCD9F6E099EE", option1: "normal" },
            });
            if (response.data && response.data.data) {
                setDropdownData(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching dropdown data:", error);
        }
    }, []);

    useEffect(() => {
        const initialize = async () => {
            await connectSignalR();
            ConnectSignalR.on("ReceiveSubscribedScriptUpdateList", (newData) => {
                if (!category) return;
                const filteredData = newData.filter((item) => item.s && item.s.split(":")[0] === category);
                console.log(`Received initial data for ${category}:`, filteredData);
                setData(filteredData);
                setIgnore(false);
            });
            ConnectSignalR.on("ReceiveSubscribedScriptUpdate", debouncedHandleNewData);
            if (ignore) return;
            await fetchDropdownData();
        };

        initialize();

        return () => {
            ConnectSignalR.off("ReceiveSubscribedScriptUpdate");
            ConnectSignalR.off("ReceiveSubscribedScriptUpdateList");
            // debouncedHandleNewData.cancel();
        };
    }, [connectSignalR, fetchDropdownData, debouncedHandleNewData, category, ignore]);

    useEffect(() => {
        const connection = async () => {
            if (!scripts || scripts.length === 0) {
                if (prevScriptsRef.current.length > 0) {
                    try {
                        await ConnectSignalR.invoke("OnUnsubscribeNew", prevScriptsRef.current);
                        console.log("Unsubscribed from previous scripts:", prevScriptsRef.current);
                        prevScriptsRef.current = [];
                    } catch (error) {
                        console.error("Error unsubscribing previous scripts:", error);
                    }
                }
                return;
            }
            try {
                if (prevScriptsRef.current.length > 0) {
                    await ConnectSignalR.invoke("OnUnsubscribeNew", prevScriptsRef.current);
                    console.log("Unsubscribed from previous scripts:", prevScriptsRef.current);
                }
                await ConnectSignalR.invoke("OnSubscribeNew", scripts);
                setIgnore(true);
                console.log("Subscribed to new scripts:", scripts);
                prevScriptsRef.current = scripts;
            } catch (error) {
                console.error("Error in SignalR subscription:", error);
            }
        };
        connection();
    }, [scripts]);

    useEffect(() => {
        if (selectedItem) {
            setLotQty("1");
            setQty(String(selectedItem.mls || ""));
        }
    }, [selectedItem]);

    const formattedDate = useMemo(() => {
        const date = new Date();
        const day = date.getDate();
        const month = date.toLocaleString("default", { month: "short" });
        const year = date.getFullYear().toString().slice(-2);
        return `${day}, ${month}${year}`;
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>{category}</Text>
                <View style={styles.searchContainer}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Selectmarket")}>
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
            <FlatList
                data={data}
                keyExtractor={(item) => item.s}
                renderItem={({ item }) => (
                    <DataItem
                        item={item}
                        onPress={handlePress}
                        onLongPress={() => setSelectionMode(true)}
                        selectionMode={selectionMode}
                        selectedItems={selectedItems}
                        onItemSelect={handleItemSelect}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No Data Found</Text>
                    </View>
                }
            />
            {selectionMode && (
                <View style={styles.selectionButtons}>
                    <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                        <Text style={styles.buttonText}>✖</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
                        <Text style={styles.buttonText}>✔</Text>
                    </TouchableOpacity>
                </View>
            )}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        {selectedItem && (
                            <>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>{selectedItem.es}</Text>
                                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                                        <Text style={styles.closeButton}>✖</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.modalPrice}>
                                    <Text style={[styles.modalPriceText, { color: selectedItem.bidPriceColor || "black" }]}>{selectedItem.ltp || "NO"}</Text>
                                    <Text style={[styles.modalChange, { color: selectedItem.ch > 0 ? "green" : "red" }]}>{selectedItem.chp}%</Text>
                                </View>
                                <View style={styles.modalInfo}>
                                    <Text style={styles.infoText}>Max Position: 0</Text>
                                    <Text style={styles.infoText}>Max Order Qty: 0</Text>
                                </View>
                                {selectedOrder === "Limit Order" && (
                                    <View style={styles.modalLimitInfo}>
                                        <Text style={styles.infoText}>LOW: {selectedItem.lp}</Text>
                                        <Text style={styles.infoText}>LTP: {selectedItem.ltp}</Text>
                                        <Text style={styles.infoText}>High: {selectedItem.hp}</Text>
                                    </View>
                                )}
                                <View style={styles.inputContainer}>
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
                                <View style={styles.orderTypeContainer}>
                                    <Text style={styles.orderTypeLabel}>Select Order Type</Text>
                                    {dropdownData.length > 0 && (
                                        <>
                                            <TouchableOpacity
                                                onPress={() => setSelectedOrder("Market Order")}
                                                style={[styles.orderTypeButton, selectedOrder === "Market Order" && styles.activeOrderTypeButton]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.orderTypeText,
                                                        { fontWeight: selectedOrder === "Market Order" ? "bold" : "normal", color: selectedOrder === "Market Order" ? "#FFF" : "#03415B" },
                                                    ]}
                                                >
                                                    {dropdownData.find((order) => order.text.includes("Market"))?.text || "Market"}
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => setSelectedOrder("Limit Order")}
                                                style={[styles.orderTypeButton, selectedOrder === "Limit Order" && styles.activeOrderTypeButton, { right: 12 }]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.orderTypeText,
                                                        { fontWeight: selectedOrder === "Limit Order" ? "bold" : "normal", color: selectedOrder === "Limit Order" ? "#FFF" : "#03415B" },
                                                    ]}
                                                >
                                                    {dropdownData.find((order) => order.text.includes("Limit"))?.text || "Limit / SL"}
                                                </Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                                <View style={styles.priceInputContainer}>
                                    <View style={[styles.labeledInput, { width: "90%" }]}>
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
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity style={[styles.button, { backgroundColor: "red" }]} onPress={() => handleOrder("-1")}>
                                        <Text style={styles.buttonText}>Sell Now @ </Text>
                                        <Text style={styles.buttonText}>{selectedItem.bp}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.button, { backgroundColor: "green" }]} onPress={() => handleOrder("1")}>
                                        <Text style={styles.buttonText}>Buy Now @ </Text>
                                        <Text style={styles.buttonText}>{selectedItem.ap}</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F1F2F4",
    },
    header: {
        backgroundColor: "#03415A",
        padding: 15,
        borderBottomRightRadius: 8,
        borderBottomLeftRadius: 8,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerText: {
        color: "white",
        fontSize: 20,
        fontWeight: "bold",
    },
    searchContainer: {
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    iconButton: {
        marginVertical: 2,
        marginHorizontal: 10,
    },
    dataCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 5,
        margin: 4,
        marginHorizontal: 10,
        alignItems: "center",
    },
    databoldText: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#03415A",
        marginBottom: 5,
    },
    dateText: {
        fontSize: 10,
        color: "#03415A",
        marginBottom: 5,
        fontWeight: "bold",
    },
    perText: {
        fontSize: 10,
        marginBottom: 5,
        fontWeight: "bold",
    },
    mainbox: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        marginRight: -20,
    },
    row: {
        width: "35%",
        marginBottom: 5,
    },
    lowtext: {
        fontSize: 10,
        color: "#444",
        textAlign: "center",
    },
    textdata: {
        fontSize: 17,
        textAlign: "center",
        fontWeight: "bold",
    },
    qtytext: {
        fontSize: 13,
        color: "#03415A",
        fontWeight: "bold",
        textAlign: "center",
    },
    hightext: {
        fontSize: 10,
        color: "#444",
        textAlign: "right",
    },
    highprtdata: {
        fontSize: 16,
        textAlign: "right",
        fontWeight: "bold",
    },
    Ltptext: {
        fontSize: 12,
        color: "#03415A",
        textAlign: "right",
    },
    selectionButtons: {
        flexDirection: "row",
        justifyContent: "space-around",
        padding: 15,
    },
    cancelButton: {
        backgroundColor: "red",
        padding: 10,
        borderRadius: 10,
        width: 70,
        alignItems: "center",
        marginLeft: 30,
    },
    confirmButton: {
        backgroundColor: "green",
        padding: 10,
        borderRadius: 10,
        width: 70,
        alignItems: "center",
        marginRight: 30,
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContent: {
        width: 330,
        backgroundColor: "white",
        borderRadius: 15,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "#03415B",
        padding: 10,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "white",
    },
    closeButton: {
        fontSize: 17,
        color: "white",
    },
    modalPrice: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },
    modalPriceText: {
        fontSize: 25,
        fontWeight: "bold",
    },
    modalChange: {
        fontSize: 12,
        marginLeft: 5,
    },
    modalInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 8,
    },
    modalLimitInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 8,
    },
    infoText: {
        fontSize: 10,
        color: "#03415B",
        fontWeight: "bold",
    },
    inputContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 8,
    },
    labeledInput: {
        flexDirection: "row",
        width: "45%",
        height: 40,
        borderRadius: 8,
        backgroundColor: "#CDD9DE",
        overflow: "hidden",
    },
    labelPart: {
        paddingHorizontal: 20,
        justifyContent: "center",
    },
    labelText: {
        color: "#03415B",
        fontSize: 12,
        fontWeight: "bold",
    },
    valuePart: {
        flex: 1,
        paddingHorizontal: 8,
        fontSize: 14,
        fontWeight: "bold",
        color: "#03415B",
        textAlign: "center",
    },
    orderTypeContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 8,
    },
    orderTypeLabel: {
        fontSize: 10,
        color: "#03415B",
        padding: 8,
    },
    orderTypeButton: {
        borderRadius: 8,
        backgroundColor: "white",
        width: "27%",
        padding: 5,
        alignItems: "center",
    },
    activeOrderTypeButton: {
        backgroundColor: "#03415B",
    },
    orderTypeText: {
        fontSize: 12,
    },
    priceInputContainer: {
        padding: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    actionButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 15,
    },
    button: {
        width: 140,
        padding: 8,
        borderRadius: 5,
        alignItems: "center",
    },
    buttonText: {
        color: "white",
        fontSize: 14,
        textAlign: "center",
    },
    notification: {
        position: "absolute",
        top: 40,
        left: 20,
        right: 20,
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 3 },
    },
    notificationText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 14,
        textAlign: "center",
    },
    emptyContainer: {
        alignItems: "center",
        marginTop: 20,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "gray",
    },
});

export default ScriptListScreen;