const express = require('express');
const app = express();
app.set('view engine', 'ejs');
app.use(express.static(`${__dirname}/assets`));
const model = require('./models');
const axios = require('axios').default;
const fs = require('fs');
const morgan = require('morgan');
const dbase = require("./connection")
const request = require('request');
// const session = require('express-session');
app.use(express.urlencoded({extended : false}));
const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
const port = process.env.PORT || 8080;
require('dotenv').config();
// console.log(process.env.secret);

app.use(morgan((tokens, req, res)=>{
    return [`Method:${tokens.method(req, res)+";"} URL:${tokens.url(req, res)}; Status:${tokens.status(req, res)}; Message: ${res.statusMessage}; DateTime: ${(new Date().getDate() < 10 ? "0" : "") + new Date().getDate() + '/' + ((new Date().getMonth() + 1 < 10 ? "0" : "") + (new Date().getMonth() + 1)) + '/' + new Date().getFullYear()}; ResponseTime: ${Math.floor(tokens['response-time'](req, res))+" ms"}`].join(' ')
},{stream:fs.createWriteStream('./logger.log', {flags:'a'},)}));

app.get("/", async(req, res) => {
    res.render("index", {
        message:"",
        errorMessage:"",
        resultArr:[]
    });
});

app.get("/login", async(req, res) => {
    res.render("login");
});

app.get("/register", async(req, res) => {
    res.render("register");
});

app.post("/developer/register", async(req, res) => {
    let input = req.body, errorResult = {}
    if (input.email.length < 1) {
        errorResult.email = `field email tidak boleh kosong`
    } else if (await model.checkBy("developer", "email", input.email) > 0) {
        errorResult.email = `email ${input.email} telah terdaftar pada sistem`
    } else if (!await model.validateEmail(input.email)) {
        errorResult.email = `email ${input.email} tidak valid`
    }
    if (input.username.length < 1) {
        errorResult.username = `field username tidak boleh kosong`
    } else if (await model.checkBy("developer", "username", input.username) > 0) {
        errorResult.username = `username ${input.username} telah terdaftar pada sistem`
    } else if (!await model.validateUsername(input.username)) {
        errorResult.username = `username ${input.username} tidak valid`
    }
    if (input.name.length < 1) {
        errorResult.name = `field name tidak boleh kosong`
    }
    if (input.password.length < 1) {
        errorResult.password = `field password tidak boleh kosong`
    }
    if (!(Object.entries(errorResult).length === 0)) {
        res.render('register', {
            errorResult: errorResult,
        })
    } else {
        let saltRounds = 10, hashedPassword = bcrypt.hashSync(input.password, saltRounds)
        try {
            if (await model.registerDeveloper(input.email, input.username, input.name, hashedPassword)) {
                res.render('login', {
                    message:`${input.username} berhasil register`,
                })
            }
        } catch (error) {
            console.log(error)
        }
    }
});

app.post('/developer/login', async(req, res) => {
    let input = req.body, errorResult = {}
    if (input.email.length < 1 || input.password.length < 1) {
        if (input.email.length < 1) errorResult.email = `field email tidak boleh kosong`
        if (input.password.length < 1) errorResult.password = `field password tidak boleh kosong`
    } else {
        if (await model.checkBy("developer", "email", input.email) <= 0) 
            errorResult.email = `email developer tidak terdaftar`
        else {
            let devPassword = await model.getPassword("developer", "email", input.email)
            if (!bcrypt.compareSync(input.password, devPassword)) 
                errorResult.password = `password developer tidak sesuai`
        }
    }
    if (!(Object.entries(errorResult).length === 0)) {
        res.render('login', {
            errorResult: errorResult,
        })
    } else {
        // console.log('login sukses')
        let token = jsonwebtoken.sign({
            email: input.email,
        }, process.env.secret, {expiresIn: "10m"})
        res.render('index', {
            errorResult: errorResult,
        })
    }
});

app.post('/developer/login/changePassword', async(req, res) =>{
    //belum tak cek soale gtw respond kemana tapi haruse bisa aq dah buatin model buat change password jga
    const token = req.header("x-auth-token");
    let user = {}
    let input = req.body, errorResult = {}
    if(!token){
        errorResult.token = `token belum ada`
    }
    try{
        user = jsonwebtoken.verify(token,process.env.secret);
    }catch(err){
        errorResult.token = `token invalid`
    }
    if (input.password.length < 1) {
        errorResult.password = `field password tidak boleh kosong`
    } else if (input.confirmPass.length < 1) {
        errorResult.confirmPass = `field confirmation tidak boleh kosong`
    } else if (input.password == input.confirmPass) {
        let saltRounds = 10, hashedPassword = bcrypt.hashSync(input.password, saltRounds)
        if (await model.changePassDev(user.email, hashedPassword)) {
            //aku gak tahu mau respond kemana ini tinggal respond render
            res.render('changePassword', {
                message:`${input.username} Ubah password berhasil`,
            })
        }
    }else{
        errorResult.confirmPass = `password dan confirmation password tidak sama`
    }
    
})

<<<<<<< HEAD


app.post('/user/register', async (req,res)=>{
    let errorResult = {}, email = req.body.email, username = req.body.username, name = req.body.name, password = req.body.password,
    cpass = req.body.confirm_password, no_telp = req.body.no_telp,  role = req.body.role.toLowerCase();
let saldo = 0;
let temp = req.body.tanggal_lahir.split('/');
let tanggal_lahir = temp[2]+"-"+temp[1]+"-"+temp[0];
if (email.length < 1){
    errorResult.email = 'Field tidak boleh kosong';
    return res.status(400).send(errorResult);
}else if (!await model.validateEmail(email)){
    errorResult.email = 'Format Salah';
    return res.status(400).send(errorResult);
}else if(!await model.cekDataEmail(email)){
    errorResult.email = 'Email Sudah Terdaftar';
    return res.status(400).send(errorResult);
}
if(username.length < 1){
    errorResult.username = 'Field tidak boleh kosong';
    return res.status(400).send(errorResult);
}
else if(!await model.cekDataUsername(username)){
    errorResult.email = 'Username Sudah terdaftar';
    return res.status(400).send(errorResult);
}
if(name.length < 1){
    errorResult.name = 'Field tidak boleh kosong';
    return res.status(400).send(errorResult);
}
if (password.length < 1){
    errorResult.password = 'Field tidak boleh kosong';
    return res.status(400).send(errorResult);
}
if (cpass.length < 1){
    errorResult.confirm_password = 'Field tidak boleh kosong';
    return res.status(400).send(errorResult);
}
if (password != cpass){
    errorResult.password = 'Password dan Confirm Password tidak sama';
    return res.status(400).send(errorResult);
}
if (isNaN(no_telp)){
    errorResult.no_telp = 'Input wajib angka';
    return res.status(400).send(errorResult);
}
if (role != 'dokter' ||  role != 'client' || role != 'receptionist') {
    errorResult.role = 'Role tidak sesuai';
    return res.status(400).send(errorResult);
}
else{
    console.log(role)
    let saltRounds = 10, hashedPassword = bcrypt.hashSync(password, saltRounds)
    try{
        await model.registerUser(email, username, name, hashedPassword, tanggal_lahir, no_telp, saldo, role)
        let result = {
            "Email" : email,
            "Username" : username,
            "Name" : name,
            "Tanggal Lahit" : tanggal_lahir,
            "Nomor Telepon" : no_telp,
            "Saldo " : "Rp "+saldo,
            "Role" : role
=======
app.post('/user/register', async (req,res)=>{
    let errorResult = {}, email = req.body.email, username = req.body.username, name = req.body.name, password = req.body.password,
    cpass = req.body.confirm_password, no_telp = req.body.no_telp,  role = req.body.role.toLowerCase();
    let saldo = 0;
    let temp = req.body.tanggal_lahir.split('/');
    let tanggal_lahir = temp[2]+"-"+temp[1]+"-"+temp[0];
    if (email.length < 1){
        errorResult.email = 'Field tidak boleh kosong';
        return res.status(400).send(errorResult);
    }else if (!await model.validateEmail(email)){
        errorResult.email = 'Format Salah';
        return res.status(400).send(errorResult);
    }else if(!await model.cekDataEmail(email)){
        errorResult.email = 'Email Sudah Terdaftar';
        return res.status(400).send(errorResult);
    }
    if(username.length < 1){
        errorResult.username = 'Field tidak boleh kosong';
        return res.status(400).send(errorResult);
    }
    else if(!await model.cekDataUsername(username)){
        errorResult.email = 'Username Sudah terdaftar';
        return res.status(400).send(errorResult);
    }
    if(name.length < 1){
        errorResult.name = 'Field tidak boleh kosong';
        return res.status(400).send(errorResult);
    }
    if (password.length < 1){
        errorResult.password = 'Field tidak boleh kosong';
        return res.status(400).send(errorResult);
    }
    if (cpass.length < 1){
        errorResult.confirm_password = 'Field tidak boleh kosong';
        return res.status(400).send(errorResult);
    }
    if (password != cpass){
        errorResult.password = 'Password dan Confirm Password tidak sama';
        return res.status(400).send(errorResult);
    }
    if (isNaN(no_telp)){
        errorResult.no_telp = 'Input wajib angka';
        return res.status(400).send(errorResult);
    }
    if (role == 'dokter' ||  role == 'client' || role == 'receptionist') {
        console.log(role)
        let saltRounds = 10, hashedPassword = bcrypt.hashSync(password, saltRounds)
        try{
            await model.registerUser(email, username, name, hashedPassword, tanggal_lahir, no_telp, saldo, role)
            let result = {
                "Email" : email,
                "Username" : username,
                "Name" : name,
                "Tanggal Lahit" : tanggal_lahir,
                "Nomor Telepon" : no_telp,
                "Saldo " : "Rp "+saldo,
                "Role" : role
            }
            return res.status(201).send(result);
        }catch (ex) {
            console.log(ex);
        }
    }
    else{
        errorResult.role = 'Role tidak sesuai';
        return res.status(400).send(errorResult);
    }
})
//client login
app.post('/user/login', async (req,res)=>{
    let result = {};
    let email = req.body.email;
    let password = req.body.password;
    if (email.length < 1){
        result = {
            "Message" : "Email wajib diisi"
        }
        return res.status(400).send(result)
    }else if(!await model.cekDataEmail(email)){
        result = {
            "Message" : "Email tidak terdaftar"
        }
        return res.status(400).send(result);
    }
    if (password.length < 1){
        result = {
            "Message" : "Password wajib diisi"
        }
        return res.status(400).send(result)
    }
    else{
        try {
            let bcryptPass = await model.getPassword("client", "email", email)
            let user = await dbase.executeQuery(`select * from client where email = '${email}'`)
            let username = user[0].username;
            if (!bcrypt.compareSync(password, bcryptPass)){
                result = {
                    "Message" : "Password Salah"
                }
                return res.status(400).send(result);
            }else{
                let token = jsonwebtoken.sign({
                    "email" : email,
                    "role" : "client"
                }, process.env.secret, {'expiresIn':'30m'});
                result = {
                    "Email" : email,
                    "Username" : username,
                    "Token" : token
                }
                return res.status(200).send(result);
            }
        }catch (e) {
            console.log(e);
        }
    }
})

//update data client
app.put('/client', async (req,res)=>{
    const token = req.header("x-auth-token");
    let email = req.body.email, username = req.body.username_baru, name = req.body.name_baru, password = req.body.password,
        no_telp = req.body.no_telp_baru;
    if (email.length < 1){
        errorResult.email = 'Field tidak boleh kosong';
        return res.status(400).send(errorResult);
    }
    if(!await model.cekDataEmail(email)){
        if (password.length < 1){
            errorResult.password = 'Field tidak boleh kosong';
            return res.status(400).send(errorResult);
        }
        if(username.length < 1){
            errorResult.username = 'Field tidak boleh kosong';
            return res.status(400).send(errorResult);
        }
        if(!await model.cekDataUsername(username)){
            errorResult.email = 'Username Sudah terdaftar';
            return res.status(400).send(errorResult);
        }
        if(name.length < 1){
            errorResult.name = 'Field tidak boleh kosong';
            return res.status(400).send(errorResult);
        }
        if (isNaN(no_telp)){
            errorResult.no_telp = 'Input wajib angka';
            return res.status(400).send(errorResult);
        }
        let bcryptPass = await model.getPassword("client", "email", email)
        let user = await dbase.executeQuery(`select * from client where email = '${email}'`)
        let username = user[0].username;
        if (!bcrypt.compareSync(password, bcryptPass)){
            result = {
                "Message" : "Password Salah"
            }
            return res.status(400).send(result);
        }
        else{
            await model.updateClient(username, name, no_telp)
            return res.status(200).send(result)
>>>>>>> ad2f25b56fee52423bfea67fbbe1ecd84720c3a9
        }
    }
})
//change password client
app.put('/client/changePassword', async (req, res) =>{
    let result = {};
    let email = req.body.email;
    let password_baru = req.body.password_baru;
    let cpass = req.body.confirm_password;
    let password = req.body.password;
    if (email.length < 1){
        result = {
            "Message" : "Email Harus Diisi"
        }
        return res.status(401).send(result);
    }
    if (password.length < 1){
        result = {
            "Message" : "Password Harus Diisi"
        }
        return res.status(401).send(result);
    }
    if (password_baru.length < 1){
        result = {
            "Message" : "Password Baru Harus Diisi"
        }
        return res.status(401).send(result);
    }
    if (cpass.length < 1){
        result = {
            "Message" : "Confrim Password Harus Diisi"
        }
        return res.status(401).send(result);
    }
    if (!await model.cekDataEmail(email)){
        result = {
            "Message" : "Akun tidak terdadftar"
        }
        return res.status(401).send(result);
    }
    else{
        if (password_baru != cpass){
            result = {
                "Message" : "Password dan Confirm Password harus sama"
            }
            return res.status(401).send(result);
        }
        try {
            let bcryptPass = await model.getPassword("client", "email", email)
            if (!bcrypt.compareSync(password, bcryptPass)){
                result = {
                    "Message" : "Password Salah"
                }
                return res.status(400).send(result);
            }else{
                let saltRounds = 10, hashedPassword = bcrypt.hashSync(password_baru, saltRounds)
                let users = await dbase.executeQuery(`update client set password = '${hashedPassword}' where email = '${email}'`);
                result = {
                    "message" : "sukses"
                }
                return res.status(200).send(result);
            }
        }catch (e) {
            console.log(e);
        }
    }

    let cek = await dbase.executeQuery(`select * from client where email = ${email} and password = ${password}`);
    if (cek.length == 0){
        let result = {
            "Message" : "Password salah"
        }
        return res.status(401).send(result)
    }
    else {
        let bcryptPass = await model.getPassword("client", "email", email)
        let user = await dbase.executeQuery(`select * from client where email = '${email}'`)
        let username = user[0].username;
        if (!bcrypt.compareSync(password, bcryptPass)){
            result = {
                "Message" : "Password Salah"
            }
            return res.status(400).send(result);
        }else{
            let saltRounds = 10, hashedPassword = bcrypt.hashSync(password_baru, saltRounds)
            let client = await dbase.executeQuery(`update client set password=${hashedPassword} where email=${email}`);
            let result = {
                "Message" : "Change Password Success"
            }
            return res.status(200).send(result);
        }
    }
})
// get token baru user yg sedang login
app.post('/client/refresh', async (req, res)=>{
    let token = req.header("x-auth-token");
    let email = req.body.email;
    let password = req.body.password;
    if (email.length < 1){
        result = {
            "Message" : "Email wajib diisi"
        }
        return res.status(400).send(result)
    }else if(!await model.cekDataEmail(email)){
        result = {
            "Message" : "Email tidak terdaftar"
        }
        return res.status(400).send(result);
    }
    if (password.length < 1){
        result = {
            "Message" : "Password wajib diisi"
        }
        return res.status(400).send()
    }
    try{
        let bcryptPass = await model.getPassword("client", "email", email)
        let user = await dbase.executeQuery(`select * from client where email = '${email}'`)
        let username = user[0].username;
        if (!bcrypt.compareSync(password, bcryptPass)){
            result = {
                "Message" : "Password Salah"
            }
            return res.status(400).send(result);
        }else{
            let token = jsonwebtoken.sign({
                "email" : email,
                "role" : "client"
            }, process.env.secret, {'expiresIn':'30m'});
            result = {
                "Email" : email,
                "Username" : username,
                "Token Baru" : token
            }
            return res.status(200).send(result);
        }
    }catch (e) {
        console.log(e);
    }
})
//delete client account yg sedang login
app.delete('/client', async (req, res)=>{
    let email = req.body.email;
    let password = req.body.password;
    let result = {};
    try{
        let bcryptPass = await model.getPassword("client", "email", email)
        let user = await dbase.executeQuery(`select * from client where email = '${email}'`)
        let username = user[0].username;
        if (!bcrypt.compareSync(password, bcryptPass)){
            result = {
                "Message" : "Password Salah"
            }
            return res.status(400).send(result);
        }else{
            let users = await dbase.executeQuery(`delete from client where email = '${email}'`);
            result = {
                "Message" : "Delete Account Success"
            }
            return res.status(200).send(result);
        }
    }catch (e) {
        console.log(e);
    }
})
// cek data client yang sedang login
app.get(`/client`,async(req, res) =>{
    const token = req.header("x-auth-token");
    let user = {}, errorResult = {}
    if(!token){
        errorResult.token = "Unauthorized"
        res.status(401).send("Unauthorized");
    }
    try{
        user = jwt.verify(token, process.env.secret);
    }catch(err){
        errorResult.token = "token salah"
        res.status(401).send("Token Invalid");
    }
    if(await model.findBy('developer', 'email', user.email)){
        let result = await model.getAllUser('client')
        return res.status(200).send(result)
    }
})


app.get(`/receptionist`,async(req, res) =>{
    const token = req.header("x-auth-token");
    let user = {}, errorResult = {}
    if(!token){
        errorResult.token = "Unauthorized"
        res.status(401).send("Unauthorized");
    }
    try{
        user = jwt.verify(token, process.env.secret);
    }catch(err){
        errorResult.token = "token salah"
        res.status(401).send("Token Invalid");
    }
    if(await model.findBy('developer', 'email', user.email)){
        let result = await model.getAllUser('receptionist')
        return res.status(200).send(result)
    }
})

app.get(`/dokter`,async(req, res) =>{
    const token = req.header("x-auth-token");
    let user = {}, errorResult = {}
    if(!token){
        errorResult.token = "Unauthorized"
        res.status(401).send("Unauthorized");
    }
    try{
        user = jwt.verify(token, process.env.secret);
    }catch(err){
        errorResult.token = "token salah"
        res.status(401).send("Token Invalid");
    }
    if(await model.findBy('developer', 'email', user.email)){
        let result = await model.getAllUser('dokter')
        return res.status(200).send(result)
    }
})
<<<<<<< HEAD
=======



>>>>>>> ad2f25b56fee52423bfea67fbbe1ecd84720c3a9
//put dokter/developer/client sama tinggal ubah dikit aq blm cek ini jadi gak langsung ta copas"
app.put(`/receptionist`, async(req, res) =>{
    const token = req.header("x-auth-token");
    let nama = req.body.nama, tgl_lahir = req.body.tanggal_lahir, telp = req.body.no_telp, saldo = req.body.saldo
    let user = {}, errorResult = {}
    if(!token){
        errorResult.token = "Unauthorized"
        res.status(401).send("Unauthorized");
    }
    try{
        user = jwt.verify(token, process.env.secret);
    }catch(err){
        errorResult.token = "token salah"
        res.status(401).send("Token Invalid");
    }
    if (nama.length < 1) {
        errorResult.nama = 'Nama tidak boleh kosong'
    }
    if (tgl_lahir.length < 1) {
        errorResult.tanggal_lahir = 'tanggal lahir tidak boleh kosong'
    }
    if (telp.length < 1) {
        errorResult.telephon = 'no telp tidak boleh kosong'
    }
    if (saldo.length < 1) {
        errorResult.saldo = 'saldo tidak boleh kosong'
    }
    let result = {
        email : user.email,
        nama : nama,
        tanggal_lahir : tgl_lahir,
        no_telp : telp,
        saldo : saldo
    }
    if(await model.cekDataEmail(user.email)){
        await model.updateData('client', user.email, nama, tgl_lahir, telp, saldo)
        return res.status(200).send(result)
    }
})
app.listen(port, () => {
    console.log(`Running to port ${port}`);
});