//----For the searched results + search page-----//
import React, { useState, useContext } from 'react';
import { SafeAreaView, ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import {Cell, Section, TableView} from 'react-native-tableview-simple';

//-----for checking the user's logged in status-----------//
import { UserContext } from "./../../App"

//---just icons for aesthetics---//
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faArrowLeft, faSearch } from "@fortawesome/free-solid-svg-icons";

//------for the searching functionality------------//
import { searchEntries, getUserId } from '../../database'

export default function SearchResultsPage({navigation}){
    //---for storing the searchInput----//
    const [searchedTerm, setSearchedTerm] = useState("");

    //---for storing entries found by the search----//
    const [diaryEntries, setDiaryEntries] = useState([]);

    //-----For updating/getting the user's logged in status----//
    const { user } = useContext(UserContext);

    //----Each diary entry----//
    const JournalEntryCell = (props) => (
        //---Making sure that the entry diary cells are clickable---//
        <TouchableOpacity 
        onPress={ ()=> 
            navigation.navigate("JournalEntry", {'entryID': props.entryID})
        }
        activeOpacity={0.7}
        >
            <Cell
            {...props}
            cellStyle="Basic"
            contentContainerStyle={{
                ...styles.JournalEntryBox,
            }}
            hideSeparator={true}
            backgroundColor={124170} 
            
            cellContentView={
                <View>
                <Text style={styles.diaryEntryText}> {props.entryTitle} </Text>
                <View style={styles.diaryEntryView}>
                    <Text style={styles.dateText}> {props.date} </Text> 
                </View>
                </View>
            }
            />
        </TouchableOpacity>
    )

    //----the search button's functionality-----//
    const handleSearch = async () => {
        try {
            //---Get the user ID----//
            let userId
            
            //---using default userId of 1 if the user is not logged in---//
            if(!user){
                userId = 1
            }
            //---getting the logged in user's user id-------//
            else{
                userId = await getUserId(user);
            }

            const retrievedEntries = await searchEntries(userId, searchedTerm);

            if (retrievedEntries) {
                console.log("Entries searched successfully");
                setDiaryEntries(retrievedEntries)
            } 
            else {
                console.log("No entries found from the searched term.");
            }
        } 
        catch (error) {
            console.log("An error occurred when searching through the diary entries:", error);
        }

    };

    return(
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.HomepageScroll}>
            <View style={styles.navHeader}>
                {/*-----The back button-------*/}
                <TouchableOpacity 
                    onPress={() => navigation.navigate("JournalApp")}
                    style={styles.backBtnTxt}
                >
                    <FontAwesomeIcon icon={faArrowLeft} size={29} color="white" />  
                </TouchableOpacity>

                {/*------The title containing what the user searched for---- */}
                <Text style={styles.navHeaderTitle}>
                    Results for: {searchedTerm}
                </Text>

                {/*----A placeholder for layout purposes------*/}
                <View style={{ width: 40 }} /> 
            </View>

           {/*------Search Bar Section-----*/}
            <View style={styles.searchBarContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search entries..."
                    placeholderTextColor="#888"
                    value={searchedTerm}
                    onChangeText={setSearchedTerm}
                />
                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                    <FontAwesomeIcon icon={faSearch} size={20} color="white" />
                </TouchableOpacity>
            </View>

            {/*----Searched Results Section---*/}
            <View style={styles.searchContainer}>
        {/*------------Section showing diary entries searched by the user---------------*/}
                <TableView style={styles.JournalEntryTableView}>
                    {diaryEntries.map((entry, index) => (
                    <JournalEntryCell
                        key={index} //----The key for the list---//
                        entryTitle={entry.title} 
                        //---converting the date to a readable text version---//
                        date={new Date(entry.creation_date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        })}
                        //---getting the entry's id---//
                        entryID = {entry.id}
                    />
                    ))}
                </TableView>
            </View>

            </ScrollView>
        </SafeAreaView>
    )
}

const mainBackgroundColour = "#124170"
const styles = StyleSheet.create({
//----______css affecting the main body of the page------//
    mainContainer: {
        flex: 1,
        backgroundColor: mainBackgroundColour,
    },

    HomepageScroll:{
        paddingBottom: 200,
    },

//----______css affecting just the nav bar_____------//
    navHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 20,
        paddingHorizontal: "1%",
        paddingVertical: "5%",
        backgroundColor: '#1A2F50',
    },

    navHeaderTitle: {
        fontSize: RFPercentage(3),
        color: 'white',
        fontWeight: 'bold',
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: RFPercentage(2.5)
    },

    backBtnTxt:{
        backgroundColor: "#007bff",
        paddingVertical: "2%",
        paddingHorizontal: "3.2%",
        marginLeft: RFPercentage(0),
        borderRadius: 6,
        padding: 5
    },

//-----____________css for the searched bar_____________------//
    searchBarContainer: {
        flexDirection: "row",
        alignItems: "center",
        margin: "2%",
        backgroundColor: "#1A2F50",
        borderRadius: 10,
        paddingHorizontal: "2%",
        paddingVertical: "4%",
    },

    searchInput: {
        flex: 1,
        color: "white",
        fontSize: 16,
        paddingVertical: 8,
    },

    searchBtn: {
        backgroundColor: "#007bff",
        padding: 10,
        borderRadius: 8,
        marginLeft: 8,
    },

//----______________CSS for the search containr + its cells___________----------//
    searchContainer: {
        marginTop: 20,
        padding: 15,
    },

//-----_________CSS afffecting each diary entry cell__________---------//
    diaryEntryView:{
        paddingBottom: "3%",
        backgroundColor: "#3396D3",
    },
    
    diaryEntryText:{
        fontSize: RFPercentage(5), //---5% of screen height----//
        paddingBottom: "1%",
        color: "#001BB7"
    },
    
    dateText:{
        color: "#BBDCE5",
        justifyContent: "center" //---to center the text vertically---//
    },

    //---This affects the Journal entry cell (the literal box itself)----//
    JournalEntryBox: {
        backgroundColor: '#BBDCE5',
        borderWidth: 9,
        borderColor: "#5EABD6",
        width: "100%",
        alignItems: "center",   //---to center the text horizontally---//
        paddingVertical: "6%", //----this adjust the height of the entry box as well----//
        marginBottom: "10%",
        borderRadius: 9
    },

    JournalEntryTableView:{
        paddingHorizontal: "1.9%" //---This adjust the width of the entry box----//
    },

})
