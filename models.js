const dbase = require("./connection");
const generateApiKey = require('generate-api-key');

module.exports = {
    checkBy: async(table, by, value) => {
        let result = await dbase.executeQueryWithParam(`select * from ${table} where lower(${by}) = lower(?)`,[value])
        return result.length
    },
    changePass: async(table, email, password) => {
        return await dbase.executeQueryWithParam(`UPDATE ${table} SET password=${password} WHERE email = ${email}`) 
    },
    updateData: async(table, email, name, tanggal_lahir, no_telp, saldo) => {
        return await dbase.executeQueryWithParam(`UPDATE ${table} SET nama=${name}, tanggal_lahir = '${tanggal_lahir}', no_telp = '${no_telp}', saldo = '${saldo}' WHERE email = ${email}`) 
    },
    getAllUser: async(role) => {
        let result = await dbase.executeQueryWithParam(`select * from client where role = lower('${role}')`)
        return result.length
    },
    checkPassword: async(table, email, password) => {
        let result = await dbase.executeQueryWithParam(`select * from ${table} where upper(email) = upper(?) and password = ?`,[email, password])
        return result.length
    },
    findBy: async(table, by, value) => {
        return await dbase.executeQueryWithParam(`select * from ${table} where upper(${by}) = upper(?)`,[value])
    },
    getUsername: async(table, by, value) => {
        let result = await dbase.executeQueryWithParam(`select username from ${table} where lower(${by}) = lower(?)`,[value])
        return result[0].username
    },
    getPassword: async(table, by, value) => {
        let result = await dbase.executeQueryWithParam(`select password from ${table} where upper(${by}) = upper(?)`,[value])
        return result[0].password
    },
    validateEmail: async(email) => {
        return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)
    },
    validateUsername: async(username) => {
        return /^[a-zA-Z0-9-_]+$/.test(username)
    },
    registerDeveloper: async(email, username, name, password) => {
        return await dbase.executeQueryWithParam(`insert into developer values(?,?,?,?,?,?,?,?)`,[email, username, name, , password, generateApiKey({method: 'string', length: 32}), 100, "free"])
    },
    uploadPhoto: async(photo, email) => {
        return await dbase.executeQuery(`update developer set profile_photo = ${photo} where email = ${email}`)
    },
    updateDeveloper: async(username, name, email) => {
        return await dbase.executeQuery(`update developer set username = '${username}', name = '${name}'  where email = ${email}`)
    },
    registerUser: async(email, username, name, password, tanggal_lahir, no_telp, saldo, role, api_hit) => {
        return await dbase.executeQuery(`insert into user_account values('${email}','${username}','${name}','${password}','${tanggal_lahir}','${no_telp}',${saldo}, '${role}', ${api_hit})`)
    },
    cekDataEmail: async(email) =>{
        return await dbase.executeQuery(`select * from user_account where email = '${email}'`);
    },
    cekDataUsername: async (username) =>{
        return await dbase.executeQuery(`select * from user_account where username = '${username}'`);
    },
    loginClient: async (email, password) =>{
        return await dbase.executeQuery(`select * from user_account where email = '${email}' and password = '${password}'`)
    },
    updateClient: async (email, username, name, no_telp) =>{
        return await dbase.executeQuery(`update user_account set username=${username}, name=${name}, no_telp=${no_telp} where email=${email}`)
    },
    updatePasswordClient: async (table, email, password) =>{
        return await dbase.executeQueryWithParam(`UPDATE ${table} SET password=${password} WHERE email = ${email}`)
    },
    deleteAccount: async (table, email) => {
        return await dbase.executeQueryWithParam(`delete from ${table} where email = ?`,[email])
    },
}