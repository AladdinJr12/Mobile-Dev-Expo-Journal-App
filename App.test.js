//---______This file consists of unit testing for all functions listed in database.js__________--------//

//---getting everything from the database---//
import * as database from "./database";
import * as Crypto from "expo-crypto";

//---so that we can later use to setup the fake database on---//
export let db;
export function setDb(mockDb) {
    db = mockDb;
}
//-----testing the entries related function----------------//
describe("Testing the functions affecting the diary entries", () => {
    //-----setting up the fake database-------//
    let fakeDb;
    beforeEach(() => {
        fakeDb = {
            //--the fake db will basically return this if we call runAsync with it----//
            runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1 })
        };
        //---replaces the real db with our fake mock db so we dont interfere with it at all----//
        database.setDb(fakeDb); 
    });

//______________________________________________________________________________________//

    it("This functions inserts a new entry to the entries table and returns the result", async () => {
        //---setting up the fake entry row----//
        const fakeEntry = {
            userId: 1,
            entryTitle: "My Test Entry",
            entryDate: "2025-08-31",
            entryLocation: "Home",
            content: "This is my test journal entry"
        };

        //----calling the function we are testing-----//
        const result = await database.addEntry(fakeEntry);

        //---Checking that runAsync was called with the correct parameters-----//
        expect(fakeDb.runAsync).toHaveBeenCalledWith(
            //--This checks that the first argument of the SQL query contains "INSERT INTO entries"---//
            expect.stringContaining("INSERT INTO entries"),
            expect.arrayContaining([
                fakeEntry.userId,
                fakeEntry.entryTitle,
                fakeEntry.entryLocation,
                expect.any(String),  //---for the ISO date string---//
                fakeEntry.entryDate,
                fakeEntry.content
            ])
        );

        //--ensuring that it returns the correct entry---//
        expect(result).toEqual({ lastInsertRowId: 1 });
    });

//______________________________________________________________________________________//

    it("This function retrieves a single entry row by matching it with the input entryId", async () => {
        //---setup the fake row we expect the database to return---//
        const fakeRow = {
            id: 1,
            user_id: 1,
            title: "My Test Entry",
            creation_date: "2025-08-31T00:00:00.000Z",
            entry_content: "This is my test journal entry"
        };

        //---replace getFirstAsync with a mock that returns fakeRow---//
        fakeDb.getFirstAsync = jest.fn().mockResolvedValue(fakeRow);

        //---call the function we’re testing---//
        const result = await database.getEntryByEntryId(1);

        //---check that the db method was called with the right SQL + params---//
        expect(fakeDb.getFirstAsync).toHaveBeenCalledWith(
            expect.stringContaining("SELECT * FROM entries WHERE id = ?"),
            [1]
        );

        //---check that the function returns the right row---//
        expect(result).toEqual(fakeRow);
    });

//______________________________________________________________________________________//

    it("This function retrieves all entry rows matching the input userId", async () => {
        // ---setup the fake rows we expect the database to return---
        const fakeRows = [
            {
                id: 1,
                user_id: 1,
                title: "Entry 1",
                creation_date: "2025-08-31T00:00:00.000Z",
                entry_content: "First test entry"
            },
            {
                id: 2,
                user_id: 1,
                title: "Entry 2",
                creation_date: "2025-08-30T00:00:00.000Z",
                entry_content: "Second test entry"
            }
        ];

        //---replace getAllAsync with a mock that returns fakeRow---//
        fakeDb.getAllAsync  = jest.fn().mockResolvedValue(fakeRows);

        const results = await database.getEntriesByUserId(1);

        //----checks that the testing function has the right parameters and sql logic---//
        expect(fakeDb.getAllAsync).toHaveBeenCalledWith(
            expect.stringContaining("SELECT * FROM entries WHERE user_id = ?"),
            [1]
        );

        // ---check that the function returns the right array---
        expect(results).toEqual(fakeRows);
    });

//________________________________________________________________________________________//
    it("This function updates the selected entry row' values", async () => {
        // ---setup the fake rows we expect the database to return---
        const fakeUpdate = {
            entryID: 1,
            entryTitle: "Updated Entry Title",
            entryDate: "2025-08-31",
            entryLocation: "Work",
            content: "Updated content"
        };
        
        //---replace getFirstAsync with a mock that returns the number 1: which represents it working---//
        fakeDb.runAsync  = jest.fn().mockResolvedValue({ changes: 1 });
        
        //---running the testing function----//
        const result = await database.updateEntry(fakeUpdate);
        
        //----checks that the testing function has the right parameters and sql logic---//
        expect(fakeDb.runAsync).toHaveBeenCalledWith(
            //--This checks that the first argument of the SQL query contains "INSERT INTO entries"---//
            expect.stringContaining(
                "UPDATE entries SET title = ?, created_at = ?, creation_date = ?, creation_date_text = ?,entry_content = ? WHERE id = ?"
            ),
            expect.arrayContaining([
                fakeUpdate.entryTitle,
                fakeUpdate.entryLocation,
                expect.any(String), //---ISO string for creation_date---//
                fakeUpdate.entryDate, //---creation_date_text---//
                fakeUpdate.content,
                fakeUpdate.entryID
            ])
        );
        
        // ---check that the function returns the right array---
        expect(result).toEqual({ changes: 1 });
    })
//________________________________________________________________________________________//
    it("This function returns entries matching the search input", async () => {
        // ---Setting up fake data entries that the DB would return---//
        const fakeEntries = [
            { id: 1, user_id: 1, title: "Work", entry_content: "Busy day", creation_date_text: "2025-08-31",    entryLocation: "Singapore", },
            { id: 2, user_id: 1, title: "Holiday", entry_content: "Relaxing", creation_date_text: "2025-08-30", entryLocation: "Canada", }
        ];

        //----Mock getAllAsync to return only entries that match "Work"---//
        fakeDb.getAllAsync = jest.fn().mockResolvedValue(
            fakeEntries.filter(e => e.title.includes("Work") || e.entry_content.includes("Work") || e.creation_date_text.includes("Work"))
        );

        // ---Call the function we are testing---
        const results = await database.searchEntries(1, "Work");

        // ---Check that getAllAsync was called with correct SQL + parameters---//
        expect(fakeDb.getAllAsync).toHaveBeenCalledWith(
            expect.stringContaining("SELECT * FROM entries"),
            expect.arrayContaining([
            1,             //---The userId---//
            "%Work%",      //---The LIKE query----//
            "%Work%",
            "%Work%",
            "%Work%"
            ])
        );

        // ---Check that the returned results are correct---//
        expect(results.length).toBe(1);
        expect(results[0].title).toBe("Work");
    });

//________________________________________________________________________________________//

    it("This function deletes an entry by its ID and returns true if works", async () => {
        const entryId = 5;

        fakeDb.runAsync = jest.fn().mockResolvedValue({ changes: 1 }) //---This '1' represents a successful deletion--//
        const successfulResults = await database.deleteEntryById(entryId);

        // ---Check that runAsync was called with the correct SQL and parameter---
        expect(fakeDb.runAsync).toHaveBeenCalledWith(
            expect.stringContaining("DELETE FROM entries WHERE id = ?"),
            [entryId]
        );

        // ---Check that the function returned true---
        expect(successfulResults).toBe(true);

        //-----for failing results----//
        fakeDb.runAsync = jest.fn().mockRejectedValue(new Error("DB error"));
        const failedResults = await database.deleteEntryById(69);
        expect(failedResults).toBe(false)
     });
});


describe("Testing the functions affecting the users ", () => {
    let fakeDb;

    beforeEach(() => {
        //----Mock the database------//
        fakeDb = {
            runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1 })
        };
        //---replaces the real db with our fake mock db so we dont interfere with the real one at all----//
        database.setDb(fakeDb); 

        //---Mock the Crypto.digestStringAsync function to return a fake hash----//
        jest.spyOn(Crypto, "digestStringAsync").mockResolvedValue("FAKE_HASHED_PASSWORD");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

//________________________________________________________________________________________//
    it("This function hashes the password and inserts a new user into the database", async () => {
        const username = "testUser";
        const password = "password123";
        
        //---calling the function we are testing----//
        const result = await database.registerUser(username, password);

        //----Checking that the password has been hashed-----//
        expect(Crypto.digestStringAsync).toHaveBeenCalledWith(
            Crypto.CryptoDigestAlgorithm.SHA256,
            password
        );

        //-----Check that db.runAsync was called with the correct SQL + params-----//
        expect(fakeDb.runAsync).toHaveBeenCalledWith(
            expect.stringContaining("INSERT INTO users"),
            [username, "FAKE_HASHED_PASSWORD"]
        );

        //------Check that the function returns the expected result-------//
        expect(result).toEqual({ lastInsertRowId: 1 });
    });

//________________________________________________________________________________________//
    it("Testing that loginUser returns true when credentials match", async () => {
        const username = "testUser";
        const password = "password123";

        //----Mocking the db to return a row (when a user exists)
        fakeDb.getFirstAsync = jest.fn().mockResolvedValue({ id: 1, username, password_hash: "FAKE_HASHED_PASSWORD" });

        const result = await database.loginUser(username, password);

        expect(Crypto.digestStringAsync).toHaveBeenCalledWith(
            Crypto.CryptoDigestAlgorithm.SHA256,
            password
        );

        expect(fakeDb.getFirstAsync).toHaveBeenCalledWith(
            expect.stringContaining("SELECT * FROM users WHERE username = ? AND password_hash = ?"),
            [username, "FAKE_HASHED_PASSWORD"]
        );

        expect(result).toBe(true);
    });

//________________________________________________________________________________________//
    it("Testing that loginUser returns false when credentials do not match", async () => {
        const username = "testUser";
        const password = "wrongPassword";

        //---Mock DB to return null which represents the user not existing---//
        fakeDb.getFirstAsync = jest.fn().mockResolvedValue(null);


        const result = await database.loginUser(username, password);
        expect(result).toBe(false);
    });

//________________________________________________________________________________________//
    it("Testing that isUsernameTaken returns true if username exists", async () => {
        const username = "existingUser";
        fakeDb.getFirstAsync = jest.fn().mockResolvedValue({ id: 1, username });

        const result = await database.isUsernameTaken(username);

        expect(fakeDb.getFirstAsync).toHaveBeenCalledWith(
            expect.stringContaining("SELECT * FROM users WHERE username = ?"),
            [username]
        );
        expect(result).toBe(true);
    });

//________________________________________________________________________________________//
    it("Testing that isUsernameTaken returns false if username does not exist", async () => {
        const username = "newUser";

        //---Mock DB to return null which represents the searcherd username not existing---//
        fakeDb.getFirstAsync = jest.fn().mockResolvedValue(null);

        const result = await database.isUsernameTaken(username);
        expect(result).toBe(false);
    });

//________________________________________________________________________________________//

    //----- getUserId -----//
    it("testing that getUserId returns the user's id if found", async () => {
        const username = "testUser";
        fakeDb.getFirstAsync = jest.fn().mockResolvedValue({ id: 42, username });
        
        const result = await database.getUserId(username);
        expect(result).toBe(42);
    });

    it("testing that getUserId returns null if the inputted username is not found", async () => {
        const username = "unknownUser";
        fakeDb.getFirstAsync = jest.fn().mockResolvedValue(null);

        const result = await database.getUserId(username);
        expect(result).toBeNull();
    });

});






