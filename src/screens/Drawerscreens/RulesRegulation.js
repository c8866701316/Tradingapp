import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

function RulesRegulation({ navigation }) {
    // Rules data
    const rulesEnglish = [
        "JOBBING AND ARBITRAGE IS STRICTLY PROHIBITED IN OUR PLATFORM",
        "CHEATING AND LINE AND CHAKRI TRADES ARE STRICTLY PROHIBITED IN OUR PLATFORM.",
        "IN TRADES IF SAME IP-ADDRESS FOUND IN MULTIPLE ACCOUNTS THEN TRADE WILL BE NOT COUNTED.",
        "DIVIDEND DECLARATION OR SHARE SPLIT ETC. ON ANY SHARE THEN POSITION WILL BE SQUARE OFF ON DAY BEFORE CLOSING RATE.",
        "IF FOUND SAME TRADES IN MULTIPLE ACCOUNTS THEN TRADES WILL BE NOT COUNTED.",
        "INCASE ABOVE TYPE OF ACTIVITY FOUND IN ANY ACCOUNT, TRADES WILL BE DELETED AND INFORMED TO CLIENT/MASTER/MANAGER DURING THE MARKET.",
        "OPEN POSITION WILL BE SQUARE OFF ON BUYER/SELLER QUOTE. NOT ON BHAVCOPY OR EXCHANGE SETTLEMENT PRICE.",
        "ANY TRADE FOUND DOUBTFUL THEN IT WILL DELETED.",
        "LOCKER / PARKING / STANDING TRADE SYSTEM NOT ALLOWED SO REQUEST YOU DO TRADE REGULARLY OTHERWISE ACTION WILL BE TAKEN.",
        "THIS APPLICATION IS ONLY FOR EDUCATION PURPOSE.",
        "THIS APPLICATION IS BY INVITATION ONLY. GENERAL PUBLIC REGISTRATION IS NOT AVAILABLE.",
        "THIS APPLICATION PROVIDES ‘SIMULATED STOCK MARKET ENVIRONMENT’.",
        "THE SOLE PURPOSE IS TO LEARN BASICS OF STOCK MARKET.",
        "ANY LOSS / PROFIT SHOWN ON THIS WEBSITE SHALL NOT INVOLVEMENT OF ANY MONETARY VALUE.",
        "USERS MUST NOT SHARE THEIR ACCOUNT CREDENTIALS WITH OTHERS.",
        "ANY UNAUTHORIZED ACCESS TO THE PLATFORM WILL RESULT IN ACCOUNT SUSPENSION.",
        "REGULAR UPDATES TO THE PLATFORM RULES MUST BE ACKNOWLEDGED BY USERS.",
        "TECHNICAL SUPPORT IS AVAILABLE ONLY DURING MARKET HOURS.",
        "VIOLATION OF THESE RULES MAY LEAD TO PERMANENT BAN FROM THE PLATFORM."

    ];
    const rulesHindi = [
        "हमारी प्लेटफॉर्म में जोबिंग और आर्बिट्राज सख्त वर्जित है।",
        "हमारी मंच में धोखाधड़ी और लाइन और चकरी व्यापार सख्त वर्जित है।",
        "अगर सेम आईपी एड्रेस से कई अकाउंट में ट्रेड मिले तो उसे डिलीट किया जाएगा।",
        "अगर किसी शेयर में डिविडेंड डिक्लेयर हो तो उसे क्लोजिंग रेट से पहले स्क्वायर ऑफ किया जाएगा।",
        "अगर कई अकाउंट में सेम ट्रेड्स मिले तो उसे डिलीट किया जाएगा।",
        "अगर ऊपर दिए गए प्रकार की कोई एक्टिविटी किसी अकाउंट में मिले तो ट्रेड्स डिलीट किए जाएंगे और क्लाइंट/मास्टर/मैनेजर को सूचित किया जाएगा।",
        "ओपन पोजिशन को बायर/सेलर कोट पर स्क्वायर ऑफ किया जाएगा न कि भाव कॉपी या एक्सचेंज सेटलमेंट प्राइस पर।",
        "अगर कोई ट्रेड संदिग्ध पाया गया तो उसे डिलीट कर दिया जाएगा।",
        "लॉकर/पार्किंग/स्टैंडिंग ट्रेड सिस्टम की अनुमति नहीं है इसलिए नियमित रूप से ट्रेड करने का अनुरोध है अन्यथा कार्रवाई की जाएगी।",
        " આ એપ્લિકેશન માત્ર શિક્ષણ માટે છે.",
        "આ એપ્લિકેશન ફક્ત આમંત્રણ દ્વારા ઉપલબ્ધ છે, સામાન્ય જનતા માટે નોંધણી ઉપલબ્ધ નથી.",
        "આ એપ્લિકેશન ‘સિમ્યુલેટેડ સ્ટોક માર્કેટ’ પર્યાવરણ પૂરું પાડે છે.",
        " આ એપ્લિકેશનનો એકમાત્ર હેતુ સ્ટોક માર્કેટની મૂળભૂત જાણકારી મેળવવાનો છે.",
        "આ વેબસાઇટ પર દર્શાવેલ નુકસાન / નફોનો કોઈપણ મૌદ્રિક મૂલ્ય સાથે સંબંધ નથી.",
        "ઉપયોગકર્તાઓએ પોતાના ખાતાની માહિતી બીજા સાથે શેર કરવી નહીં.",
        "પ્લેટફોર્મ પર કોઈપણ અનધિકૃત પ્રવેશ થવાથી ખાતું સ્થગિત થઈ શકે છે.",
        "નિયમિત અપડેટ્સને ઉપયોગકર્તાઓએ સ્વીકારવા પડશે.",
        "આ નિયમોનું ઉલ્લંઘન થવાથી પ્લેટફોર્મથી કાયમી નિષેધ થઈ શકે છે."


    ]

    return (
        <SafeAreaView style={{ flex: 1 }}>

            {/* Header Section */}
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </Pressable>
                <Text style={styles.headerText}>Rules And Regulation</Text>
            </View>

            {/* Rules Content */}
            <ScrollView style={styles.content}>
                <View>
                    <Text style={styles.title}>RULES & REGULATION</Text>
                </View>
                {rulesEnglish.map((rule, index) => (
                    <View key={index}>
                        <View style={styles.ruleItem}>
                            <Text style={styles.ruleNumber}>{index + 1}.</Text>
                            <Text style={styles.ruleText}>{rule}</Text>
                        </View>
                    </View>

                ))}
                <View>
                    <Text style={styles.title}>नियम और विनयम</Text>
                </View>
                {rulesHindi.map((rule, index) => (
                    <View key={index}>
                        <View style={styles.ruleItem}>
                            <Text style={styles.ruleNumber}>{index + 1}.</Text>
                            <Text style={styles.ruleText}>{rule}</Text>
                        </View>
                    </View>

                ))}
            </ScrollView>

        </SafeAreaView>
    );
}

export default RulesRegulation;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#03415A',
        height: 60,
        paddingHorizontal: 15,
    },
    backButton: {
        padding: 5,
    },
    headerText: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    content: {
        padding: 15,
    },
    title: {
        fontSize: 17,
        color: 'black',
        fontWeight: 'bold',
        textAlign: 'center',
        paddingVertical: 10

    },
    ruleItem: {
        flexDirection: 'row',
        marginBottom: 15,
        borderRadius: 5,
    },
    ruleNumber: {
        fontSize: 12,
        color: '#03415A',
        marginRight: 10,
    },
    ruleText: {
        fontSize: 11,
        color: '#03415A',
        flex: 1,
    },
});