//---This is where the database for the journal app is set up at-----//
import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite'

let db;
export async function initDB() {
    db = await SQLite.openDatabaseAsync('journal.db');
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            hashed_password TEXT
        );

        CREATE TABLE IF NOT EXISTS entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT,
            created_at TEXT,
            creation_date DATE,
            creation_date_text TEXT,
            entry_content TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id) 
        );
    `);
    //---checks if a guestUser exists-----------//
    const guestExists = await db.getFirstAsync(
        `SELECT id FROM users WHERE username = ?`,
        ['guestUser']
    );
    
    // ----Insert guest user if it is not already present (This will be used by non-logged in users)----//
    if (!guestExists) {
        await db.runAsync(
        `INSERT INTO users (username, hashed_password) VALUES (?, ?)`,
        ['guestUser', ''] // no password for guest
        );
        console.log("Guest user created.");
    }

    console.log("Databases created.")

}

//----only for testing-----//
export function setDb(mockDb) {
  db = mockDb;
}


//---for hashing the password
async function hashPassword(password) {
    const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
    );

    return digest;
}

//----function that checks whether the username is taken yet-----//
export async function isUsernameTaken(username) {
    try {
        const row = await db.getFirstAsync(
            `SELECT * FROM users WHERE username = ? `,
            [username]
        );

        if (row) {
            console.log("This username has already been taken: ", username);
            return true; //----matching----//
        } 
        else {
            console.log("This username has yet been taken: ", username);
            return false; //-----no match--------//
        }
    } 
    catch (error) {
        console.log("An SQL error has occured in isUsernameTaken:", error);
        throw error;
    }
}


//--------the function that is called when the user creates a new account---------//
export async function registerUser(username, password) {
    const passwordHash = await hashPassword(password);

    try {
        const result = await db.runAsync(
            `INSERT INTO users (username, hashed_password) VALUES (?, ?)`,
            [username, passwordHash]
        );

        console.log("Successfully added user:", username);
        console.log("SQLite result:", result);
        return result; 
    } 
    catch (error) {
        console.log("An SQL error has occured in registerUser:", error);
        throw error;
    }
}

//---the function that calls when the user tries to login to their account----//
export async function loginUser(username, password) {
    const passwordHash = await hashPassword(password);

    try {
        const row = await db.getFirstAsync(
            `SELECT * FROM users WHERE username = ? AND hashed_password = ?`,
            [username, passwordHash]
        );

        if (row) {
            console.log("Successfully logged in:", username);
            return true;  //----login successful-----//
        } 
        else {
            console.log("Invalid credentials for:", username);
            return false; //-----no match--------//
        }
    } 
    catch (error) {
        console.log("An SQL error has occured in the loginUser function: ", error);
        throw error;
    }
}

//----function for adding diary entries to the entries table-----//
export async function addEntry({ userId, entryTitle, entryDate, entryLocation, content }) {
  try {
    //----Convert creationDate into an ISO string so that it can be
    const creationDate = new Date(entryDate).toISOString();

    const result = await db.runAsync(
      `INSERT INTO entries (user_id, title, created_at, creation_date, creation_date_text, entry_content) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, entryTitle, entryLocation, creationDate, entryDate ,content]
    );

    console.log("SQLite result for adding in a new journal entry:", result);
    return result;
  } 
  catch (error) {
    console.log("An SQL error has occured in addEntry:", error);
    throw error;
  }
}

//----function for updating an entry from the entries table---------//
export async function updateEntry({ entryID, entryTitle, entryDate, entryLocation, content }) {
  try {
    //----Convert creationDate into an ISO string so that it can be
    const creationDate = new Date(entryDate).toISOString();
    const result = await db.runAsync(
      `UPDATE entries SET title = ?, created_at = ?, creation_date = ?, creation_date_text = ?,entry_content = ? WHERE id = ?`,
      [entryTitle, entryLocation, creationDate, entryDate ,content, entryID]
    );

    console.log("SQLite result for updating the journal entry:", result);
    return result;
  } 

  catch (error) {
    console.log("An SQL error has occured in updating the journal entry:", error);
    throw error;
  }
}

//------____Getting the user id based on its username____-----//
export async function getUserId(username) {
  try {
    const result = await db.getFirstAsync(
      `SELECT id FROM users WHERE username = ?`,
      [username]
    );

    if (result) {
      return result.id;  //---returns a numeric id----//
    } 
    else {
      console.log("No user found with username:", username);
      return null;
    }
  } 
  catch (error) {
    console.error("SQL error in getUserId:", error);
    throw error;
  }
}

//----This retrive all entries that matches with the input user id----------//
export async function getEntriesByUserId(userId) {
    try {
        const results = await db.getAllAsync(
            `SELECT * FROM entries WHERE user_id = ? ORDER BY creation_date DESC`,
            [userId]
        );

        console.log(`${results.length} entries has been retrieved for the userId: ${userId}`);
        return results; //---this will be an array of entry objects---//
    }

    catch (error) {
        console.error("Error retrieving entries with their user ID:", error);
        throw error;
    }
}

//----This retrive the entry that matches with the input entry id (----------//
export async function getEntryByEntryId(entryId) {
    try {
        const result = await db.getFirstAsync(
            `SELECT * FROM entries WHERE id = ? ORDER BY creation_date DESC`,
            [entryId]
        );
        console.log(`${result} entries has been retrieved for the entryID: ${entryId}`);
        return result; //----this will return a single resut----//
    }

    catch (error) {
        console.error("Error retrieving entries with their entry ID:", error);
        throw error;
    }
}

//-----Search entries by keyword across all of fields exxcept for entryID------//
export async function searchEntries(userId, searchInput) {
  try {
    const likeQuery = `%${searchInput}%`;
    console.log("_------searched input is:---------------")
    console.log(searchInput)
    const results = await db.getAllAsync(
      `
      SELECT * FROM entries
      WHERE user_id = ?
        AND (
          title LIKE ?
          OR entry_content LIKE ?
          OR created_at LIKE ?
          OR creation_date_text LIKE ?
        )
      ORDER BY creation_date DESC
      `,
      [userId, likeQuery, likeQuery, likeQuery, likeQuery]
    );

    console.log(`Found ${results.length} matching entries for "${searchInput}"`);
    return results;
  } 
  catch (error) {
    console.error("Error searching entries:", error);
    throw error;
  }
}

//---Delete entry by ID---//
export async function deleteEntryById(entryId) {
  try {
    //----Just in case----//
    if (!db) {
      throw new Error("Database is not initialized.");
    }

    //-----Delete the entry row where id matches-----//
    await db.runAsync(
      `DELETE FROM entries WHERE id = ?`,
      [entryId]
    );

    console.log(`Entry row with the ID ${entryId} was deleted successfully.`);
    return true; //---delete was successful---//
  } 
  catch (error) {
    console.error("Error when deleting entry:", error);
    return false; //---It ended in failure-----//
  }
}
