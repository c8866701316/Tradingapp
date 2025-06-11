import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Alert, TouchableOpacity } from 'react-native';
import { getUserDetails } from '../Apicall/Axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';


const BASE_URL = "https://tradep.clustersofttech.com/api";

const Accountsscreen = () => {

  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailView, setShowDetailView] = useState(false);
  const [userLedgerData, setUserLedgerData] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        setLoading(true);
        const userDetails = await getUserDetails();
        if (!userDetails?.accessToken) {
          throw new Error('Access token is missing.');
        }

        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);

        const dateFrom = sevenDaysAgo.toISOString();
        const dateTo = now.toISOString();

        const valan = `${dateFrom.slice(0, 10)}/${dateTo.slice(0, 10)}`;

        const requestBody = {
          IsShowZeroLedger: false,
          clientId: null,
          dateFrom: "2025-04-07T14:29:04.767Z",
          dateTo: "2025-04-12T14:29:04.767Z",
          masterId: null,
          segment: "",
          subBrokerId: null,
          valan: "2025-04-06/2025-04-12"
        };
        // console.log('📦 Request Body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${BASE_URL}/Account/GetLedger`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userDetails.accessToken}`,
          },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        console.log("📥 Ledger Data:", data);
        setLedgerData(data.data || []);
      } catch (error) {
        console.error("❌ Error fetching ledger:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, []);


  const handlepress = async (item) => {
    try {
      setLoading(true);
      // Store the selected client information
      setSelectedClient(item);

      const userDetails = await getUserDetails();
      if (!userDetails?.accessToken) throw new Error('Access token is missing.');

      const payload = {
        billMarketType: "",
        clientId: item.clientId, // Use selected row's clientId
        entryType: "",
        fromDate: "2025-04-01",
        sMasterId: null,
      };
      const response = await fetch(`${BASE_URL}/Account/GetUserWiseLedger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userDetails.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("📥 UserWiseLedger Response:", data);
      setUserLedgerData(data.data || []);
      setShowDetailView(true); // Show detail section after success
    } catch (error) {
      console.error("❌ Error in GetUserWiseLedger:", error);
      Alert.alert("Error", "Failed to load account details. Please try again.");
    }
    finally {
      setLoading(false);
    }
  };
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };


  const totalBalance = ledgerData.reduce((acc, item) => acc + (item.balance || 0), 0).toFixed(2);



  // Function to handle back button press
  const handleBackPress = () => {
    setShowDetailView(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        {showDetailView ? (
          // Header with back button when detail view is shown
          <View style={styles.headerWithBack}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
             <Text style={styles.header}>Accounts</Text>
          </View>
        ) : (
          // Regular header when table view is shown
          <Text style={styles.header}>Accounts</Text>
        )}
      </View>
      <ScrollView>
        {showDetailView ? (
          <>
            {/* Account Balance Box */}
            <View style={styles.balanceBox}>
              <Text style={styles.balanceText}>Account Balance</Text>
              <View style={styles.balanceAmountContainer}>
                <Text style={styles.balanceAmount}>
                  {userLedgerData.length > 0
                    ? userLedgerData[userLedgerData.length - 1]?.balance?.toFixed(2) || '0.00'
                    : '0.00'
                  }
                </Text>
                <Text style={styles.totalDeposit}>
                  Total Deposit: {userLedgerData.reduce((sum, item) => sum + (item.credit || 0), 0).toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.ledgerTableHeader}>
              <Text style={[styles.ledgerDateCell, styles.ledgerHeaderCell]}>Date</Text>
              <Text style={[styles.ledgerRemarksCell, styles.ledgerHeaderCell]}>Remarks</Text>
              <Text style={[styles.ledgerAmountCell, styles.ledgerHeaderCell]}>Debit</Text>
              <Text style={[styles.ledgerAmountCell, styles.ledgerHeaderCell]}>Credit</Text>
              <Text style={[styles.ledgerAmountCell, styles.ledgerHeaderCell]}>Balance</Text>
            </View>


            {/* Transaction Cards */}
            {loading ? (
              <ActivityIndicator size="large" color="#03415A" style={{ marginTop: 20 }} />
            ) : (
              userLedgerData.map((entry, index) => (
                <View key={index} style={styles.ledgerRow}>
                  <Text style={[styles.ledgerCell, styles.ledgerDateCell]}>{formatDate(entry.entryDate)}</Text>
                  <Text style={[styles.ledgerCell, styles.ledgerRemarksCell]}>{entry.entryTypeName}</Text>
                  <Text
                    style={[
                      styles.ledgerCell,
                      styles.ledgerAmountCell,
                      { color: 'red' },
                    ]}
                  >
                    {entry.debit ? entry.debit.toFixed(2) : '0.00'}
                  </Text>
                  <Text
                    style={[
                      styles.ledgerCell,
                      styles.ledgerAmountCell,
                      { color: 'green' },
                    ]}
                  >
                    {entry.credit ? entry.credit.toFixed(2) : '0.00'}
                  </Text>
                  <Text style={[styles.ledgerCell, styles.ledgerAmountCell]}>
                    {entry.balance ? entry.balance.toFixed(2) : '0.00'}
                  </Text>
                </View>
              ))
            )}

          </>
        ) : (
          <>
            {/* Header Row */}
            <View style={styles.tableHeader}>
              <Text style={[styles.cell, styles.nameCell, styles.headerCell]}>Name</Text>
              <Text style={[styles.cell, styles.balanceCell, styles.headerCell]}>Fatak Balance</Text>
              <Text style={[styles.cell, styles.balanceCell, styles.headerCell]}>Balance</Text>
            </View>

            {/* Ledger Rows */}
            {loading ? (
              <ActivityIndicator size="large" color="#03415A" style={{ marginTop: 20 }} />
            ) : (
              ledgerData.map((item, index) => (
                <Pressable key={index} style={styles.tableRow} onPress={() => handlepress(item)}  >
                  <Text style={[styles.cell, styles.nameCell]}>{item.clientName}</Text>
                  <Text style={[styles.cell, styles.balanceCell]}>{item.fatakBalance?.toFixed(2)}</Text>
                  <Text style={[styles.cell, styles.balanceCell]}>{item.balance?.toFixed(2)}</Text>
                </Pressable>
              ))
            )}

            {/* Total Row */}
            {!loading && ledgerData.length > 0 && (
              <View style={styles.tableFooter}>
                <Text style={[styles.cell, styles.nameCell, styles.footerText]}>Total</Text>
                <View style={{ flex: 1 }} />
                <Text style={[styles.cell, styles.balanceCell, styles.footerText]}>{totalBalance}</Text>
              </View>
            )}
          </>
        )
        }
      </ScrollView>
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: '#03415A',
    height: 50,
  },
  headerWithBack: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  backButton: {
    paddingHorizontal: 10,
    height: '100%',
    justifyContent: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    padding: 10,
  },
  item: {
    backgroundColor: 'white',
    margin: 8,
    padding: 10,
    borderRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#BECDD3',
    paddingVertical: 10,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
    margin: 5
  },
  tableFooter: {
    flexDirection: 'row',
    backgroundColor: '#f1f1f1',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 20,
  },
  cell: {
    fontSize: 14,
    color: '#03415B',
    fontWeight: 'bold',
  },
  headerCell: {
    fontWeight: 'bold',
  },
  footerText: {
    fontWeight: 'bold',
    color: '#03415B',
  },
  nameCell: {
    flex: 2,
  },
  balanceCell: {
    flex: 1.5,
    textAlign: 'right',
    color:'black'
  },
  balanceBox: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#03415A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 16,
    elevation: 3,
  },
  balanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff9900',
  },
  balanceAmountContainer: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#008000',
  },
  totalDeposit: {
    fontSize: 14,
    color: '#666',
  },
  ledgerTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e7ef',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  ledgerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  ledgerCell: {
    fontSize: 14,
    paddingHorizontal: 6,
    color:'black'
  },
  ledgerHeaderCell: {
    fontWeight: 'bold',
    color: '#1e3a5f',
    fontSize: 13,
    paddingHorizontal: 6,
  },
  ledgerDateCell: {
    flex: 1.5,
  },
  ledgerRemarksCell: {
    flex: 2.5,
    flexWrap: 'wrap',
    // lineHeight: 16,
    color: '#03415B',
    fontWeight: 'bold',
  },
  ledgerAmountCell: {
    flex: 1.2,
    textAlign: 'right',
  },

});

export default Accountsscreen;






