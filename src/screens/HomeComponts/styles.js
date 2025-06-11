import { StyleSheet } from "react-native";

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
});