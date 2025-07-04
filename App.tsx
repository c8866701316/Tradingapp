import React, { useEffect, useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Homescreen from './src/screens/Homescreen';
import { DeviceEventEmitter, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Sessionscreen from './src/screens/Sessionscreen';
import Tradesscreen from './src/screens/Tradesscreen';
import Accountsscreen from './src/screens/Accountsscreen';
import RejectionLogs from './src/screens/RejectionLogs';
import {clearStored, getStored, getUserDetails, Me, refreshAccessToken, saveStored, tokenExpired } from './src/Apicall/Axios';
import AppInitializer from './src/Websocket/AppInitializer';
import LoginScreen from './src/screens/Loginscreen';
import Portfolioscreen from './src/screens/Portfolioscreen';
import Selectmarketscreen from './src/screens/Selectmarketscreen';
import { UserProvider } from './src/screens/UserContext';
import { SoundProvider } from './src/contexts/SoundContext';
import MarketScriptScreen from './src/screens/MarketScriptScreen';
import { useNavigation } from '@react-navigation/native';
import CustomDrawerContent from './src/screens/CustomDrawerContent';
import TradeDeletelog from './src/screens/Drawerscreens/TradeDeletelog';
import Qtysettingscreen from './src/screens/Drawerscreens/Qtysettingscreen';
import Blocksettingscreen from './src/screens/Drawerscreens/Blocksettingscreen';
import RulesRegulation from './src/screens/Drawerscreens/RulesRegulation';
import FilterDrawerContent from './src/screens/FilterDrawerContent';
import SummaryReport from './src/screens/Drawerscreens/SummaryReport';
import PdfReportscreen from './src/screens/Drawerscreens/PdfReportscreen';
import Alertsettingsscreen from './src/screens/Drawerscreens/Alertsettingsscreen';
import ScriptListScreen from './src/screens/ScriptListScreen';

// import FilterDrawerContent from './src/screens/FilterDrawerContent';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const RightDrawer = createDrawerNavigator();

function TradeWithFilterDrawer() {
  const [filters, setFilters] = useState({});

  return (
    <RightDrawer.Navigator
      screenOptions={{
        drawerPosition: 'right',
        headerShown: false,
        drawerStyle: {
          width: 220,

        },
      }}
      drawerContent={(props) => <FilterDrawerContent {...props} onApplyFilters={setFilters} initialFilters={filters} />}
    >
      <RightDrawer.Screen name="TradesMain" >
        {(props) => <Tradesscreen {...props} filters={filters} />}
      </RightDrawer.Screen>
    </RightDrawer.Navigator>
  );
}
function RejectionWithFilterDrawer() {
  const [filters, setFilters] = useState({});
  return (
    <RightDrawer.Navigator
      screenOptions={{
        drawerPosition: 'right',
        headerShown: false,
        drawerStyle: {
          width: 220,

        },
      }}
      drawerContent={(props) => <FilterDrawerContent {...props} onApplyFilters={setFilters}
        initialFilters={filters} />}
    >
      <RightDrawer.Screen name="RejectionMain">
        {(props) => <RejectionLogs {...props} filters={filters} />}
      </RightDrawer.Screen>
    </RightDrawer.Navigator>
  );
}
function TradeEditWithFilterDrawer() {
  const [filters, setFilters] = useState({});

  return (
    <RightDrawer.Navigator
      screenOptions={{
        drawerPosition: 'right',
        headerShown: false,
        drawerStyle: {
          width: 220,

        },
      }}
      drawerContent={(props) => <FilterDrawerContent {...props} onApplyFilters={setFilters}
        initialFilters={filters} />}
    >
      <RightDrawer.Screen name="TradeEditMain">
        {(props) => <TradeDeletelog {...props} filters={filters} />}
      </RightDrawer.Screen>
    </RightDrawer.Navigator>
  );
}

// Drawer Navigator
function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="More"
      screenOptions={{
        drawerStyle: {
          backgroundColor: '#03415A',
          width: 250,
        },
        drawerLabelStyle: {
          color: 'white',
        },
        drawerActiveTintColor: '#129688',
        drawerInactiveTintColor: 'white',
      }}
    >
    </Drawer.Navigator>
  );
}

// Tab Navigator
function TabNavigator({ route }) {
  const { meData } = route.params || {};
  const navigation = useNavigation();

  return (

    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: 'yellow',
        tabBarInactiveTintColor: 'white',
      }}
    >
      <Tab.Screen
        name="Home"
        initialParams={{ meData }}
        component={Homescreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? '#012330' : 'transparent',
                top: 5,
                padding: 5,
                borderRadius: 8,
                height: 48,
                width: 55,
                alignItems: 'center',
              }}
            >
              <MaterialIcons name="area-chart" color={focused ? '#129688' : 'white'} size={26} />
              <Text style={{ bottom: 2, fontSize: 9, color: focused ? '#129688' : 'white', fontWeight: '800' }}>Watchlist</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Session"
        component={Sessionscreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? '#012330' : 'transparent',
                top: 5,
                padding: 5,
                borderRadius: 8,
                height: 48,
                width: 55,
                alignItems: 'center',
              }}
            >
              <MaterialIcons name="trending-up" color={focused ? '#129688' : 'white'} size={26} />
              <Text style={{ bottom: 2, fontSize: 9, color: focused ? '#129688' : 'white', fontWeight: '800' }}>Session</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Trades"
        component={TradeWithFilterDrawer}
        initialParams={{ meData }}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? '#012330' : 'transparent',
                top: 5,
                padding: 5,
                borderRadius: 8,
                height: 48,
                width: 55,
                alignItems: 'center',
              }}
            >
              <Ionicons name="list-circle" size={26} color={focused ? '#129688' : 'white'} />
              <Text style={{ bottom: 2, fontSize: 9, color: focused ? '#129688' : 'white', fontWeight: '800' }}>Trades</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Portfolio"
        component={Portfolioscreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <View style={styles.centerButton}>
              <View
                style={{
                  backgroundColor: focused ? '#012330' : '#129688',
                  height: 50,
                  width: 50,
                  borderRadius: 28,
                  margin: 5,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <MaterialIcons name="pie-chart" size={28} color={focused ? '#129688' : 'white'} />
              </View>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Accounts"
        component={Accountsscreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? '#012330' : 'transparent',
                top: 5,
                padding: 5,
                borderRadius: 8,
                height: 48,
                width: 55,
                alignItems: 'center',
              }}
            >
              <MaterialIcons name="account-box" color={focused ? '#129688' : 'white'} size={26} />
              <Text style={{ bottom: 2, fontSize: 9, color: focused ? '#129688' : 'white', fontWeight: '800' }}>Accounts</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Rejection"
        component={RejectionWithFilterDrawer}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? '#012330' : 'transparent',
                top: 5,
                padding: 5,
                borderRadius: 8,
                height: 48,
                width: 55,
                alignItems: 'center',
              }}
            >
              <Ionicons name="clipboard" color={focused ? '#129688' : 'white'} size={26} />
              <Text style={{ bottom: -1, fontSize: 8, color: focused ? '#129688' : 'white', fontWeight: '800' }}>Rejection</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={DrawerNavigator}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            navigation.openDrawer();
          },
        }}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? '#012330' : 'transparent',
                top: 5,
                padding: 5,
                borderRadius: 8,
                height: 48,
                width: 55,
                alignItems: 'center',
              }}
            >
              <Ionicons name="menu" color={focused ? '#129688' : 'white'} size={26} />
              <Text style={{ bottom: 2, fontSize: 9, color: focused ? '#129688' : 'white', fontWeight: '800' }}>More</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator (combines Stack and Drawer)
function MainNavigator({ meData }) {
  const [role, setRole] = useState<string | undefined>();

  const fetchRole = async () => {
    const stored = await getUserDetails();
    setRole(stored?.userDetails?.role);   // "Master", "Client", etc.
  };

  useEffect(() => {
    fetchRole();                          // run once at mount
    // re‑fetch after a successful login so the drawer updates immediately
    const sub = DeviceEventEmitter.addListener('onLoginSuccess', fetchRole);
    return () => sub.remove();
  }, []);
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 260
        },
        drawerPosition: 'left',
        drawerLabelStyle: {
          color: '#03415A',
          // textAlign: 'center',
          fontSize: 13
        },
        drawerActiveTintColor: '#129688',
        drawerInactiveTintColor: '#03415A',
      }}
    >
      <Drawer.Screen
        name="Tabs"
        component={TabNavigator}
        initialParams={{ meData }}
        options={{
          drawerItemStyle: { display: 'none' }, // This hides it from drawer
        }}
      />
      {role === 'Master' &&
        <Drawer.Screen
          name="Summary Report"
          component={SummaryReport} // Replace with your actual component
          options={{
            drawerIcon: ({ color }) => (
              <View style={{ backgroundColor: '#BECDD3', padding: 8, borderRadius: 20, marginVertical: 10 }}>
                <Ionicons name="add" size={16} color={color} />
              </View>
            ),
          }}
        />}
      {/* Change Password is now handled by a modal in CustomDrawerContent */}
      <Drawer.Screen
        name="Trade Edit / Delete Logs"
        component={TradeEditWithFilterDrawer}
        options={{
          drawerIcon: ({ color }) => (
            <View style={{ backgroundColor: '#BECDD3', padding: 8, borderRadius: 20, marginVertical: 10 }}>
              <AntDesign name="creditcard" size={16} color={color} />
            </View>
          ),
        }}
      />
      <Drawer.Screen
        name="Qty Setting"
        component={Qtysettingscreen}
        options={{
          drawerIcon: ({ color }) => (
            <View style={{ backgroundColor: '#BECDD3', padding: 8, borderRadius: 20, marginVertical: 10 }}>
              <Ionicons name="settings-outline" size={16} color={color} />
            </View>
          ),
        }}
      />
      <Drawer.Screen
        name="Blocked Script Setting"
        component={Blocksettingscreen}
        options={{
          drawerIcon: ({ color }) => (
            <View style={{ backgroundColor: '#BECDD3', padding: 8, borderRadius: 20, marginVertical: 10 }}>
              <Ionicons name="checkmark-done-circle-outline" size={16} color={color} />
            </View>
          ),
        }}
      />
      <Drawer.Screen
        name="Rules And Regulation"
        component={RulesRegulation}
        options={{
          drawerIcon: ({ color }) => (
            <View style={{ backgroundColor: '#BECDD3', padding: 8, borderRadius: 20, marginVertical: 10 }}>
              <Ionicons name="shield-checkmark-outline" size={16} color={color} />
            </View>
          ),
        }}
      />
      <Drawer.Screen
        name="Alert Setting"
        component={Alertsettingsscreen}
        options={{
          drawerIcon: ({ color }) => (
            <View style={{ backgroundColor: '#BECDD3', padding: 8, borderRadius: 20, marginVertical: 10 }}>
              <Ionicons name="alert-circle-outline" size={16} color={color} />
            </View>
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [meData, setMeData] = useState(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const stored = await getStored();

      if (stored?.accessToken && !tokenExpired(stored.accessToken)) {
        setIsLoggedIn(true);
        const me = await Me();
        setMeData(me);
      } else if (stored?.refreshToken) {
        try {
          const fresh = await refreshAccessToken(stored.refreshToken);
          await saveStored(fresh);
          setIsLoggedIn(true);
          const me = await Me();
          setMeData(me);
        } catch {
          await clearStored();
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();
  }, []);


  if (isLoggedIn === null) {
    return null; // Optionally show Splashscreen
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>

      <SoundProvider>
        <UserProvider userData={meData}>
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{ headerShown: false }}
              initialRouteName={isLoggedIn ? 'Home' : 'Login'}
            >
              <Stack.Screen name="Home">
                {(props) => <MainNavigator {...props} meData={meData} />}
              </Stack.Screen>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="AppInitializer" component={AppInitializer} />
              <Stack.Screen name="Selectmarket" component={Selectmarketscreen} />
              <Stack.Screen name="Marketscript" component={MarketScriptScreen} />
              <Stack.Screen name="PdfReport" component={PdfReportscreen} />
              <Stack.Screen name="DataListScreen" component={ScriptListScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </UserProvider>
      </SoundProvider>
    </SafeAreaView>
  );
}

export default App;

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#03415A',
    height: 50,
  },
  centerButton: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: '#F1F2F4',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
