//---The page when the user wants to add in a new journal entry-----//
//----This is also the page when the user wants to edit a previous existing journal entry---//
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Image, Modal } from "react-native";

//---for the date selector functionality-----//
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState, useRef, useEffect, useContext, use } from "react";
import { SafeAreaView, withSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView } from "react-native-gesture-handler";
import { useRoute } from '@react-navigation/native';

//----for css/padding----//
import { RFPercentage } from "react-native-responsive-fontsize";

//---just icons for aesthetics---//
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'

//----for the emoji tab
import { Picker } from 'emoji-mart-native';

//----for the text editor---//
import { RichEditor, RichToolbar, actions } from "react-native-pell-rich-editor";
//---for pasting images inside the text editor------//
import * as ImagePicker from "expo-image-picker";

//---for using the device's camera---------//
import { CameraView, CameraType, useCameraPermissions, Camera } from 'expo-camera';

//----for the adding + saving post + delete post functions from the database.js file---//
import { addEntry, getUserId, updateEntry, getEntryByEntryId, deleteEntryById } from '../../database'

//-----for checking the user's logged in status-----------//
import { UserContext } from "../../App"


export default function JournalEntryPage({ navigation, route }) {
    //-----For updating/getting the user's logged in status----//
    const { user } = useContext(UserContext);
    
    //---for saving the title inputs----//
    const [entryTitle, setEntryTitle] = useState("");

//-----_____________states and functions for the date changing functionality_____________------//
    const [date, setDate] = useState(new Date()); //----This will default to today's date----//
    const [showDateChanger, setDateChanger] = useState(false);

    const handleDateChange = (event, selectedDate) => {
        //---on android this is necessary so that the button's functionality can repeat itself---//
        if (Platform.OS === "android") {
            setDateChanger(false); 
        }
        
        if (event.type === "set" && selectedDate) {
            setDate(selectedDate); //---updating the date upon the user confirming it
        }
    };
    
    //-----This function transforms the date data into text-------//
    const convertDateToText = date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
    
    //----This state is used for all error messages (delete if not in use)-----//
    const [errorMsg, setErrorMsg] = useState(null);
    
//-----_____________states and functions for the location changing functionality_____________------//
    const [ locationAddress, setLocationAddress] = useState(" No location has been selected yet")

    //--Extract the chosenLocation params from MapChanger.js---//
    const { chosenLocation } = route.params || {};

    useEffect(()=>{
        if(chosenLocation != {}){
            setLocationAddress(chosenLocation)
        }
    }, [chosenLocation])

//----__________The emoji UI Setup___________-----//
    //---This will be attached to the text editor so that we can add the emoji inside the text editor---//
    const richText = useRef(); 

    //---This state will affect whether the emoji picker shows up on the screen----//
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

//---______in case we got in here from clicking on a journal entry = we are editing said entry_____----//
    const { entryID } = route.params || false //---default is false here----//

    const [receivedEntryID, setReceivedEntryID] = useState( entryID || null);

    useEffect(() => {
        const fetchEntry = async () => {
            //--- if no entry id was sent here-----//
            if(!receivedEntryID){
                return
            }

            try {
                const editingEntry = await getEntryByEntryId(receivedEntryID);
                if (editingEntry) {
                    //----updating the form's details to contain details from the entry we retrieved---//
                    setDate(new Date(editingEntry.creation_date));
                    setEntryTitle(editingEntry.title);
                    setLocationAddress(editingEntry.created_at);
                    richText.current.setContentHTML(editingEntry.entry_content);
                } 

                else {
                    console.log("No entries found for this user for editing");
                }
            } 
            catch (error) {
                console.log("An error occurred when retrieving the editing diary entry", error);
            }
        };

        fetchEntry();
    }, [entryID]);


//----________Set up for using phone's gallery_______-----//
    //---for the gallery since  // const { status} = await ImagePicker.requestMediaLibraryPermissionsAsync(); would not work---//
    //-This affects whether the permission modal will appear---//
    const [showGalleryPermissionModal, setShowGalleryPermissionModal] = useState(false);

    //--This records whether the user gave permission to access its photo gallery media-----//
    const [galleryPermissionStatus, setGalleryPermissionsStatus] = useState(null);

    const allowingGalleryAccess = async() =>{
        //---since the user has selected something, we remove the permission modal---//
        setShowGalleryPermissionModal(false)
        //---so that it won't keep asking the user after the first click---//
        setGalleryPermissionsStatus("allow")
        
        //----Where the functionality for opening the phone's gallery and
        //  allow user to choose a photo to insert is written at---//
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            base64: true, //---so that we can paste the photo in directly
        });

        if (!result.canceled) {
            const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
            //----Placing it in a tag so that we can apply a style to it----//
            const imgTag = `<img src="${base64Uri}" style="width:40%; height:auto;" />`;
            //---adding the image inside the text editor--//
            richText.current?.insertHTML(imgTag);
        }
    }

    const denyGalleryAccess = async() =>{
        //---closing the permission modal since the user has asked it----//
        setShowGalleryPermissionModal(false);

        //---so that it won't keep asking the user after the first click---//
        setGalleryPermissionsStatus("denied");
        
        alert("Permission to phone's gallery was not permitted");
    }

    //----Opens the phone's gallery and allow user to choose a photo to insert---//
    const openGallery = async () => {

        //---Only asks the user's permission during the first click----//
        if(galleryPermissionStatus == null){
            setShowGalleryPermissionModal(true);
        }

        //---We then direct it based on whether the user allowed or didn't allow permission to the gallery during the first asking---// 
        else if(galleryPermissionStatus == "allow"){
            allowingGalleryAccess();
        }

        else if(galleryPermissionStatus == "denied"){
            denyGalleryAccess();
        }
        //---Note that the app will ask for gallery permission again each time this page is refreshed---//
    };
    
//---_________set up for using the phone's camera_________---------------//
    //---for tracking whether we are using the front or back camera---//
    const [cameratype, setCameraType] = useState("back");
    const [cameraPermission, setCameraPermission] = useState(false);

    //----function for opening user's camera and pasting whatever they took inside the entry---//
    const openCamera = async () =>{
        //---seeking permission to device's phone----//
        const { status } = await Camera.requestCameraPermissionsAsync();
        if (status == "granted"){
            setCameraPermission(true)
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 1,
                base64: true, //---so that we can paste the photo in directly
            });

            if (!result.canceled) {
            const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
            richText.current?.insertImage(base64Uri);
            }
        }

        //----if permission is denied-------//
        else{
            alert("Camera permission is not granted")
            setCameraPermission(false)
        } 
    }

//---_______Setup the other writing tools (bold, italic and underline)________---//
    const boldText = async ()=>{
        richText.current?.sendAction(actions.setBold, "result");
    }

    const italicText = async () =>{
        richText.current?.sendAction(actions.setItalic, "result");
    }

    const underlineText = async () =>{
        richText.current?.sendAction(actions.setUnderline, "result");
    }
    
//----________functioinality for the post entry button_______---------//
    const addJournalEntry = async() => {

        //---in case the entry's title is empty------//
        if(!entryTitle || entryTitle.trim().length === 0){
            alert("The title is empty")
        }

        //-----where the diary entry adding function is done at--------//
        try {
            //---getting whatever the user wrote in the richEditor---//
            const content = await richText.current.getContentHtml();
            
            //----Get the user ID-----//
            let userId
            
            //---using default userId of 1 if the user is not logged in---//
            if(!user){
                userId = 1
            }

            //---getting the logged in user's user id-------//
            else{
                // console.log("Actually here-----")
                userId = await getUserId(user);
            }
          
//-----Reminder that parameters used here are: userId, entryTitle, entryDate, entryLocation, content---//
            const success= await addEntry({
                userId,
                entryTitle,
                entryDate: date,
                entryLocation: locationAddress,
                content
            });

            if (success) {
                //----navigate to main app page----//
                navigation.navigate("JournalApp"); 
            } 
            //------if there is an error---------//
            else {
                alert("Something went wrong, please try again")
            }
        } 
        catch (error) {
            console.log("An error occured when attempting to post diary entry:", error);
            alert("Something went wrong, please try again")
        }     
    }

//----________functioinality for the save entry button_______---------//
    const saveJournalEntry = async() => {
        //-----where the diary entry adding function is done at--------//
        try {
            //---getting whatever the user wrote in the richEditor---//
            const content = await richText.current.getContentHtml();
            
            // entryID, entryTitle, entryDate, entryLocation, content
            const success= await updateEntry({
                entryID: receivedEntryID,
                entryTitle,
                entryDate: date,
                entryLocation: locationAddress,
                content,
            });

            if (success) {
                
                //----navigate to main app page----//
                navigation.navigate("JournalApp"); 
            } 
            //------if there is an error---------//
            else {
                alert("Something went wrong, please try again")
            }
        } 
        catch (error) {
            console.log("An error occured when attempting to save diary entry:", error);
            alert("Something went wrong, please try again")
        }     
    }

    //------for deleting an entry page------//
    const deleteJournalEntry = async() => {
        //-----where the diary entry adding function is done at--------//
        try {
            const success = await deleteEntryById(receivedEntryID);
            if (success) {
                //----navigate to main app page----//
                navigation.navigate("JournalApp"); 
            } 
            //------if there is an error---------//
            else {
                alert("Something went wrong, please try again")
            }
        } 
        catch (error) {
            console.log("An error occured when attempting to delete diary entry:", error);
            alert("Something went wrong, please try again")
        }    
    }


    return (
        <SafeAreaView style={styles.diaryEntryContainer} edges={['bottom', 'left', 'right']}>
            <ScrollView contentContainerStyle={styles.diaryEntryScroll}>
                <View style={styles.mainEntryContainer}>
                    <View style={styles.diaryEntryFirstRow}>
                        
                        {/*---The back button----*/}
                        <TouchableOpacity
                            onPress={()=> navigation.goBack()}
                            style={styles.backBtnTxt}
                        >
                                <FontAwesomeIcon icon={faArrowLeft} size={44} color="white" />  
                        </TouchableOpacity>

{/*---The button will show either a post button or a save button depending on whether an entry id was passed in----*/}
                        {receivedEntryID ? (
                            <View style={{ flexDirection: "row" }}>                            
                                {/* //----The save entry button---// */}
                                <TouchableOpacity style={styles.saveBtn} onPress={saveJournalEntry}>
                                    <Text style={styles.postBtnTxt}> SAVE </Text>
                                </TouchableOpacity>

                                {/*----the delete entry button---*/}
                                <TouchableOpacity style={styles.deleteBtn} onPress={deleteJournalEntry}>
                                    <Text style={styles.postBtnTxt}> DELETE </Text>
                                </TouchableOpacity>


                            </View>

                        ) : (
                            //----The post entry button----//
                            <TouchableOpacity style={styles.postBtn} onPress={addJournalEntry}>
                                <Text style={styles.postBtnTxt}> POST </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/*-------The date section---------*/}
                    <View style= {styles.dateRow}>
                        <Text style={styles.dateText}> {convertDateToText} </Text>

                        {/*-------The date changing btn---------*/}
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => {
                                    console.log("The showDateChanger is pressed: " + showDateChanger)
                                    setDateChanger(true)
                                }
                            }
                            >
                            <Text style={styles.dateButtonText}>📅</Text>
                        </TouchableOpacity>
                    </View>

                    {showDateChanger ? (
                        <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                        />
                    )
                    :null}

                    <TextInput
                        style={styles.titleTextBox}
                        placeholder="Title"
                        placeholderTextColor={"white"}
                        multiline
                        value={entryTitle}
                        onChangeText={setEntryTitle}
                    />

                    {/*-------The location/address section---------*/}
                    <View style={styles.locationView}>
                        <Text style={styles.locationText}>This journal entry was written at: </Text>
                        <Text style={styles.addressText}> {locationAddress} </Text>
                        <TouchableOpacity 
                            style= {styles.mapBtn}
                            onPress={() => 
                                navigation.navigate("MapChanger", {
                                    onGoBack: (chosenLocation) => {
                                        setLocationAddress(chosenLocation); //----updating the address---//
                                    },
                                })
                            }
                        >
                                <Text style={styles.mapBtnTxt}> 🗺️ </Text>
                        </TouchableOpacity>
                    </View>

                    <View>
                        <RichEditor
                            ref={richText}
                            style={styles.richEditor}
                            placeholder="Write down here…… ☺️ "
                        />

                        <RichToolbar
                            editor={richText}
                            iconTint = {"black"} //---This changes the colour of the icons----//
                            style = {styles.richToolbar}
                            actions={[
                                'textBold',
                                'textItalic',
                                'textUnderline',
                                actions.insertImage,
                                'useCamera', //-----custom action for opening camera------//
                                'addEmoji', //-----custom action for opening emoji tab----//
                            ]}
                            //---the icons shown on the tools bar-----//
                            iconMap={{
                                textBold: () => <Text style={styles.iconSymbols}>𝐁</Text>, 
                                textItalic: () => <Text style={styles.iconSymbols}>𝘐</Text>,
                                textUnderline: () => <Text style={styles.iconSymbols}>U̲</Text>,
                                useCamera: () => <Text style={ styles.iconSymbols }> 📸 </Text>,
                                addEmoji: () => <Text style= { styles.iconSymbols }>😊</Text>,
                            }}
                            
                            //----_____adding functinalities to each icon button____----//
                            textBold = {boldText}

                            textItalic = {italicText}

                            textUnderline = {underlineText}

                            onPressAddImage={openGallery}
                            
                            useCamera = {()=>{
                                openCamera()
                            }}

                            addEmoji = {() =>{
                                setShowEmojiPicker(!showEmojiPicker)
                            }}
                    
                        />
                    </View>
                </View>
            </ScrollView>

            {showEmojiPicker && (
                <View style={styles.emojiView}>
                    <Picker
                    theme="dark"
                    perLine={8} //----This affects the length of the emoji picker----//
                    rows={2} //---This affects the height of the emoji picker---//
                    onSelect = {((emoji, event) => {
                        richText.current?.insertText(emoji.native);
                    })}
        
                    />
                </View>
            )}

            {/*----Setting up a custom permission modal for the phone's gallery---- */} 
            
            {showGalleryPermissionModal && (
                <View> 
                    <Modal transparent visible={showGalleryPermissionModal} animationType="fade">
                    <View style={styles.permissionModalView}>
                        <View style={styles.permissionModalContent}>
                        <Text style={styles.permissionModalText}>
                            Allow My Daily Journal to access your gallery media?
                        </Text>
                        
                        {/* Adding in the "allow" and "dont allow" in the permission modal */}
                        <View style={styles.permissionModalBtnsView}>
                            <TouchableOpacity style={styles.modalBtn} onPress={allowingGalleryAccess}>
                            <Text style={styles.modalBtnText}> ONLY THIS TIME </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalBtn} onPress={denyGalleryAccess}>
                            <Text style={styles.modalBtnText}>DON'T ALLOW</Text>
                            </TouchableOpacity>
                        </View>
        
                        </View>
                    </View>
                    </Modal>
                </View>
            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
//-----______CSS affecting the page itself/most of the page/others______-----//
    diaryEntryContainer: {
        flex: 1,
        backgroundColor: "#131D4F",
        position: "relative"
    },
    diaryEntryScroll:{
        paddingBottom: "30%",
    },
    mainEntryContainer: {
        flex: 1,
        paddingTop: 0,
        paddingLeft:  "2%",
        paddingRight: "2%",
        paddingBottom: '5%'
    },

//----__________CSS affecting the Title of journal entry_____________------//
    titleTextBox:{
        fontSize: 20,
        borderWidth: 2,
        borderColor: "#77BEF0",
        minHeight: 10,
        borderRadius: 10,
        color: "white",
        marginBottom: "3%"
    },

//___________Css affecting the date changing button sections__________________//
    dateText:{
        fontSize: 32,
        fontWeight: "bold",
        color: "#77BEF0"
    },

    dateButton: {
        backgroundColor: "transparent",
        borderRadius: 8,
        width: "20%",
        height: "100%",
        alignItems: "center",
    
    },

    dateButtonText: {
        fontSize: 35,
    },

    dateRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
    },

//----________CSS affecting the first row which consists of the post, delete, save and back button_____-----//
    diaryEntryFirstRow:{
        flexDirection: "row",
        justifyContent: "space-between", // pushes children apart
        alignItems: "center",
        paddingTop: "3%",
        paddingBottom: "3%"  
    }, 

    postBtn: {
        backgroundColor: "#007AFF",
        padding: 16,
        borderRadius: 6,
        marginRight: RFPercentage(1),
    },

    postBtnTxt:{
        color: "white"
    },

    deleteBtn:{
        backgroundColor: "#007AFF",
        padding: 15,
        borderRadius: 6,
    },

    saveBtn:{
        backgroundColor: "#1E93AB",
        padding: 16,
        borderRadius: 6,
        marginRight: RFPercentage(8),
    },

    //---This is attached to the touchable opacity----//
    backBtnTxt:{
        backgroundColor: "#007AFF",
        marginLeft: RFPercentage(1),
        borderRadius: 6,
        padding: 5
    },

//---______CSS affecting just the location section_________----//
    locationView:{
        borderWidth: 2,
        borderColor: "#77BEF0",
        minHeight: 15,
        borderRadius: 10,
        marginTop: "2%",
        marginBottom: "5%",
        paddingTop: "1%",
        paddingBottom: "4%"
    },
    
    locationText: {
        color: "white"
    },

    addressText:{
        color: "#77BEF0"
    },

    mapBtnTxt:{
        fontSize: RFPercentage(4),
    },

    mapBtn:{
        backgroundColor: "#007AFF",
        width: "17%",
        borderWidth: 3,
        borderRadius: 9,
        borderColor: "#77BEF0",
        marginLeft: "1%"
    }, 

//--__________CSS affecting just the permission modal for gallery access________________--//
    permissionModalView: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },

    permissionModalContent: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 12,
        width: "80%",
    },

    permissionModalText: { 
        fontSize: 16, 
        marginBottom: 20, 
        textAlign: "center" 
    },

    //---This is the view containing the "allow" & "don't allow" buttons
    permissionModalBtnsView: { 
        flexDirection: "row", 
        justifyContent: "space-around" 
    },

    //---This affects the "allow" & "don't allow" buttons
    modalBtn: { 
        padding: 10 
    },

    modalBtnText: { 
        fontSize: 12, 
        color: "#007AFF", 
        fontWeight: "600" 
    },

//---______________css for the rich editor & its tool bar_____________-----//
    richToolbar:{
        marginTop: RFPercentage(1.5),
        borderWidth: 5,
        borderColor: "#77BEF0",
        minHeight: "8%"
    },
    
    iconSymbols:{
        fontSize: 16,
        paddingBottom: "20%"
    },
    
    richEditor: {
        minHeight: 300,
        backgroundColor: "#77BEF0",
        borderRadius: 10,
        padding: 7,
        color: "white",
    },

//-------________________css for just the emoji picker_________________--------//
    emojiView: {
        position: 'absolute',   //---Ensures that the picker float over everything----//
        bottom: RFPercentage(22), //---Ensures that the picker is above writing tools row----//
        left: 0,
        //---Note that this doesnt actually change the width of the emoji picker. It only positions it in the centre--//
        width: '100%',
        height: RFPercentage(20),
        borderTopWidth: 1,
        borderColor: 'transparent',
        backgroundColor: "transparent",
        zIndex: 10,             // make sure it overlays everything
    },
    
});

