// require("dotenv").config();
const mysql = require('mysql2/promise');

async function executeQuery({ query, values = [] }) {
    try {
        // Create the connection to the database
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
        });

        // Execute the query
        const [results] = await connection.execute(query, values);

        // Close the connection
        await connection.end();

        console.log(results); // Results contain rows returned by the server
        return results;
    } catch (error) {
        console.error("-Error: "+error); // Log the error
        throw new Error(error.message); // Rethrow the error
    }
}

module.exports = {
    executeQuery
};
