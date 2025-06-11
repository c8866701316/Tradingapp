import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSound } from '../../contexts/SoundContext';

function Alertsettingsscreen({ navigation }) {
    // Use the sound context instead of local state
    const { isSoundEnabled, toggleSound } = useSound();

    console.log("hello");

    return (
        <>
            <SafeAreaView style={{ flex: 1 }}>
                <View>

                    {/* Trades Header */}
                    <View style={styles.header}>
                        <Pressable onPress={() => navigation.goBack()} style={{ left: 15, alignSelf: "center" }}>
                            <Ionicons name="chevron-back" size={24} color="#fff" />
                        </Pressable>
                        <Text style={styles.headerText}>Alert Settings</Text>
                    </View>
                    <View style={{ top: 10 }}>
                        <View style={styles.soundbox}>
                            <Text style={styles.soundtxt}>Alert Sound</Text>
                            <Switch
                                trackColor={{ false: '#767577', true: '#81b0ff' }}
                                thumbColor={isSoundEnabled ? '#f5dd4b' : '#f4f3f4'}
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={toggleSound}
                                value={isSoundEnabled}
                            />
                        </View>
                    </View>
                </View>
            </SafeAreaView>

        </>
    )
}

export default Alertsettingsscreen
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
    soundbox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 5,
        marginTop: 10,
    },
    soundtxt: {
        fontSize: 13,
        fontWeight: '500',
        color: '#333',
    },
    label: {
        fontSize: 22,
        marginBottom: 20
    }
})