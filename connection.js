var mysql = require("mysql");
var pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "proyek_soa"
});

module.exports= {
    executeQueryWithParam: async (query, param) => {
        return new Promise((resolve, reject) => {
            pool.query(query, param, (err, rows, fields) => {
                if (err) reject(err);
                else resolve(rows);
            })
        })
    },
    executeQuery: async (query) => {
        return new Promise((resolve, reject) => {
            pool.query(query, (err, rows, fields) => {
                if (err) reject(err);
                else resolve(rows);
            })
        })
    },
}