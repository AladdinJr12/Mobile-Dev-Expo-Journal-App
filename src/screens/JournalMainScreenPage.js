
import React, { useEffect, useState, useContext } from 'react';
import { SafeAreaView, ScrollView, View, Text, Button, StyleSheet, TouchableOpacity, Image } from 'react-native';
import {Cell, TableView} from 'react-native-tableview-simple';
import { RFPercentage } from "react-native-responsive-fontsize";
import { DrawerActions } from '@react-navigation/native';

//-----for checking the user's logged in status-----------//
import { UserContext } from "./../../App"

//------for entries made by the user------------//
import { getEntriesByUserId, getUserId } from '../../database'

//--Establishing this since I will be using it twice (Once in the css, and the other inside the <Section> )
const mainBackgroundColour = "#124170"

export default function JournalMainScreenPage({navigation}){
  //-----For updating/getting the user's logged in status----//
  const { user } = useContext(UserContext);
  const [diaryEntries, setDiaryEntries] = useState([]);

  useEffect(() => {
    const fetchEntries = async () => {
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

        const retrievedEntries = await getEntriesByUserId(userId);
        if (retrievedEntries) {
          // console.log("Entries retrieved successfully:", retrievedEntries);
          setDiaryEntries(retrievedEntries)
        } 
        else {
          console.log("No entries found for this user.");
        }
      } catch (error) {
        console.log("An error occurred when retrieving diary entries:", error);
      }
    };

    const timer = setTimeout(() => {
      fetchEntries();
    }, 500); //---wait 0.5s before running (we are delaying it so that the database is created before we run this)

    return () => clearTimeout(timer); //---cleanup the timer----//

  }, [user]);


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
          backgroundColor={mainBackgroundColour} 
        
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

  const StreakCell = (props) =>(
    <Cell
      {...props}
      cellStyle="Basic"
      contentContainerStyle={
        styles.streakBox
      }
      backgroundColor={mainBackgroundColour} 
    
      //-------Text changes based on whether the user is logged in------//
      cellContentView={
        <View style={styles.innerStreakView}>
           {!user ? (
             <Text style={styles.streakText}> Welcome to daily journal! </Text>
            ):(
              <Text style={styles.streakText}> Welcome back {user}! </Text>
           )}
        </View>
      }
    />
  )

  const TextCell = (props) =>(
    <Cell
      cellContentView= {
        <View>
          <Text> {props.textContent} </Text>
        </View>
      }
      contentContainerStyle = {styles.yearText}
    />
  )

  return(
    <SafeAreaView style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.HomepageScroll}>
        <View>
{/*------------------------- Header/Navgation bar ---------------------*/}
          <View style={styles.navHeader}>
            {/*---- The side menu button ---*/}
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
              <Text style={styles.navSideMenuBtn}> ☰ </Text> 
            </TouchableOpacity>

            {/*--- The App's title----*/}
            <Text style={styles.navHeaderTitle}> My Daily Journal </Text> 

            <View style={styles.navHeaderRight}>
              {/*---The search button ---*/}
              <TouchableOpacity 
                style={{ marginRight: 10 }}
                onPress={() => navigation.navigate("searchResults")}
              >
                  <Text>🔍</Text> 
              </TouchableOpacity>
            </View>

          </View>
{/*------------------------- Streak bar ---------------------*/}
          <TableView style={[styles.tableView, styles.streakView]} cellSpacing={0}>
            <StreakCell/>
          </TableView>

{/*------------Section showing diary entries added by the user---------------*/}
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
      {/*-----The add new journal entry button ----*/}
      <TouchableOpacity
        style={styles.addEntryBtn}
        onPress={() => navigation.navigate("JournalEntry")}
      >
        <Text style={styles.addEntryBtnText}>＋</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
//---___________css affecting most of the page___________-----//
  mainContainer: {
    flex: 1,
    backgroundColor: mainBackgroundColour,
  },
  HomepageScroll:{
    paddingBottom: 200,
  },
  tableView:{
    width: "100%",
    alignSelf: 'center',
    backgroundColor: "transparent",
    padding: 0,
    margin: 0,
    minHeight: 0,
  },

//---______________css affecting the Journal Entry Cell/Box______________-----//
  //---This affects the Journal entry cell (the literal box itself)----//
  JournalEntryBox: {
    backgroundColor: '#BBDCE5',
    borderWidth: 9,
    borderColor: "#5EABD6",
    width: "100%",
    alignItems: "center",   //----to center the text horizontally---//
    paddingVertical: "6%", //----this adjust the height of the entry box as well----//
    marginBottom: "10%",
    borderRadius: 9
  },

  //---This is the view section after the date + containing the title---// 
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

  JournalEntryTableView:{
    paddingHorizontal: "1.9%" //---This adjust the width of the entry box----//
  },

//____________________Css affecting just the Streak section___________________________//
  // This is for the view tag containing the streak related tags 
  streakView:{
    paddingTop: "10%",
    paddingBottom: "10%",
  },

  streakBox:{
    backgroundColor: "#0D1164",
    minHeight: RFPercentage(10), //---Can't use normal percentage since it increase padding rather than the element's height--//
    width: "95%",
    alignItems: "center",   //---to center the text horizontally---//
    justifyContent: "center", //---to center the text vertically---//
    borderRadius: 30,
    alignSelf: 'center', //----This centres the box/cell itself----//
  },  
  
  streakText:{
    color: 'white',
    fontSize: 23,
    textAlign: 'center', 
  },

  //---this is view inside the streakCell containing the streak tags----//
  innerStreakView:{
    alignItems: "center",   //---to center the text horizontally---//
    alignSelf: 'center', //----This centres the box/cell itself----//
    justifyContent: "center", //---to center the text vertically---//
    textAlign: "center",
  },

//___________Css affecting just the header navigation section___________________________//
//----For navigation header bar------//
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: 15,
    backgroundColor: '#1A2F50',
  },

  navSideMenuBtn: {
    fontSize: RFPercentage(4),
    color: 'white',
  },

  navHeaderTitle: {
    fontSize: RFPercentage(3),
    color: 'white',
    fontWeight: 'bold',
  },

  navHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
//___________End of Css affecting just the header navigation section___________________________//

//___________Css affecting just the "add entry" button section___________________________//
  addEntryBtn:{
    position: "absolute",
    bottom: 40, //----distance from bottom of the screen----//
    alignSelf: "center", //---center it horizontally----//
    backgroundColor: "#0D1164",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5, //----adds shadow for Android----//
    shadowColor: "#000", //---adds shadow for iOS----//
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  
  addEntryBtnText:{
    color: "white",
    fontSize: 28,
    lineHeight: 30,
  },
//___________End of Css affecting just the "add entry" button section____________________//

//___________Css affecting the other sections___________________________//
  yearText:{
    fontSize: RFPercentage(5), //---5% of screen height----//
    alignSelf: "flex-start", 
    textAlign: "left", 
    width: "100%",   //---makes the text fill the whole row so that textAlign works-----//
    paddingTop: "3%",
    paddingBottom: "3%",
    color: "white"
  },
//___________End of Css affecting the other sections___________________________//

});



