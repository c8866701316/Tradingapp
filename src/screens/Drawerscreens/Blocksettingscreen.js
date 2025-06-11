import React from 'react'
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

function Blocksettingscreen({ navigation }) {
    return (
        <>
            <SafeAreaView style={{ flex: 1 }}>
                {/* <View style={styles.container}> */}
                <View>

                    {/* Trades Header */}
                    <View style={styles.header}>
                        <Pressable onPress={() => navigation.goBack()} style={{ left: 15, alignSelf: "center" }}>
                            <Ionicons name="chevron-back" size={24} color="#fff" />
                        </Pressable>
                        <Text style={styles.headerText}>Blocked Script</Text>

                    </View>

                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>NOTHING TO SHOW</Text>
                        <TouchableOpacity>
                            <Text style={styles.refreshText}>↻</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                {/* </View> */}

            </SafeAreaView>
        </>
    )
}

export default Blocksettingscreen
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    forexModeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        height: 40,
        paddingHorizontal: 10,
    },
    forexModeText: {
        fontSize: 11,
        color: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        // justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#03415A',
        paddingHorizontal: 10,
        height: 50,
    },
    headerText: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
        padding: 10,
        paddingHorizontal: 25,
    },
    settingsIcon: {
        padding: 5,
    },
    settingsText: {
        color: '#ffffff',
        fontSize: 18,
    },
    emptyContainer: {
        // flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginBottom: 10,
    },
    refreshText: {
        fontSize: 24,
        color: '#007AFF',
    },
})