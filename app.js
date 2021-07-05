const express = require('express');
const app = express();
app.set('view engine', 'ejs');
app.use(express.static(`${__dirname}/assets`));
const model = require('./models');
const axios = require('axios').default;
const fs = require('fs');
const morgan = require('morgan');
const multer = require('multer');
const dbase = require("./connection");
app.use(express.urlencoded({extended : false}));
const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
const PORT = Process.env.PORT || 3000;
require('dotenv').config();

app.use(morgan((tokens, req, res) => {
    return [`Method:${tokens.method(req, res)}; URL:${tokens.url(req, res)}; Status:${tokens.status(req, res)}; Message: ${res.statusMessage}; DateTime: ${(new Date().getDate() < 10 ? "0" : "") + new Date().getDate() + '/' + ((new Date().getMonth() + 1 < 10 ? "0" : "") + (new Date().getMonth() + 1)) + '/' + new Date().getFullYear()}; ResponseTime: ${Math.floor(tokens['response-time'](req, res))} ms`].join(' ')
},{stream:fs.createWriteStream('./logger.log', {flags:'a'},)}));

const dir = './images', storage = multer.diskStorage({
    destination:function(req,file,callback){
        callback(null, dir);
    },
    filename:async function(req,file,callback){
        const extension = file.originalname.split('.')[file.originalname.split('.').length-1];
        const filename = req.developer.username;
        isFileExist(filename)
        callback(null,(filename+'.'+extension));
    }
});

function checkFileType(file,cb) {
    const filetypes= /jpeg|jpg|png|gif/;
    const extname=filetypes.test(file.originalname.split('.')[file.originalname.split('.').length-1]);
    const mimetype=filetypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null,true);
    } else {
        cb(error = 'Error : Image Format Type Only');
    }
}

function isFileExist(filename) {
    let arr_files = []
    fs.readdirSync(`${__dirname}\\images`).forEach(file => {
        arr_files.push(file)
    })
    arr_files.forEach(file => {
        if (filename == file.split(".")[0]) {
            fs.unlinkSync(`${__dirname}\\images\\${file}`)
        }
    })
}

const upload = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
});

app.get("/", async(req, res) => {
    res.render("index", {
        message:"",
        errorMessage:"",
        resultArr:[]
    });
});

// app.get("/login", async(req, res) => {
//     res.render("login");
// });

// app.get("/register", async(req, res) => {
//     res.render("register");
// });

app.post("/developer/register", async(req, res) => {
    let input = req.body, errorResult = {}
    if (input.email.length < 1) {
        errorResult.email = `field email tidak boleh kosong`
    } else if (await model.checkBy("developer_account", "email", input.email) > 0) {
        errorResult.email = `email ${input.email} telah terdaftar pada sistem`
    } else if (!await model.validateEmail(input.email)) {
        errorResult.email = `email ${input.email} tidak valid`
    }
    if (input.username.length < 1) {
        errorResult.username = `field username tidak boleh kosong`
    } else if (await model.checkBy("developer_account", "username", input.username) > 0) {
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
        res.status(400).json({
            listError: errorResult,
        })
        // res.render('register', {
        //     errorResult: errorResult,
        // })
    } else {
        let saltRounds = 10, hashedPassword = bcrypt.hashSync(input.password, saltRounds)
        try {
            if (await model.registerDeveloper(input.email, input.username, input.name, hashedPassword)) {
                res.status(201).json({
                    message:`Developer ${input.username} berhasil register`,
                })
                // res.render('login', {
                //     message:`${input.username} berhasil register`,
                // })
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
        if (await model.checkBy("developer_account", "email", input.email) <= 0) 
            errorResult.email = `email developer tidak terdaftar`
        else {
            let devPassword = await model.getPassword("developer_account", "email", input.email)
            if (!bcrypt.compareSync(input.password, devPassword)) 
                errorResult.password = `password developer tidak sesuai`
        }
    }
    if (!(Object.entries(errorResult).length === 0)) {
        res.status(400).json({
            listError: errorResult,
        })
        // res.render('login', {
        //     errorResult: errorResult,
        // })
    } else {
        res.status(200).json({
            message: `Developer ${await model.getUsername("developer_account", "email", input.email)} berhasil login`,
            token: jsonwebtoken.sign({email: input.email,}, process.env.SECRET_KEY, {expiresIn: "10m"}),
        })
        // res.render('index', {
        //     errorResult: errorResult,
        // })
    }
});

function verifyAuthToken(req, res, next) {
    if (!req.headers["x-auth-token"]) {
        return res.status(401).json({error: "Token Authentication Not Found"});
    }
    let developer = {};
    try {
        developer = jsonwebtoken.verify(req.headers["x-auth-token"], process.env.SECRET_KEY);
    } catch (error) {
        return res.status(401).json({error: "Invalid Token Authentication"});
    }
    req.developer = developer;
    next();
}

app.get('/developer/', verifyAuthToken, async(req, res) => {
    let data = await model.findBy("developer_account", "email", req.developer.email);
    delete data[0].profile_photo;
    delete data[0].password;
    return res.status(200).json(data);
})

app.post('/developer/photo', verifyAuthToken, upload.single("photo"), async(req, res) => {
    if (!req.file) {
        return res.status(400).json({
            error: "Profile Photo tidak boleh kosong",
        })
    }
    try {
        if (await model.uploadPhoto(req.file.filename, req.developer.email)) {
            let username = await model.getUsername("developer_account", "email", req.developer.email);
            return res.status(200).json({
                message:`Developer ${username} Berhasil Upload Profile Photo`,
            })
        }
    } catch (error) {
        return res.status(500).json({error: "Upload Profile Photo Gagal"});
    }
})

app.put('/developer/', verifyAuthToken, async(req, res) => {
    let input = req.body
    if (input.username.length < 1) {
        errorResult.username = `field username tidak boleh kosong`
    } else if (await model.checkBy("developer_account", "username", input.username) > 0) {
        errorResult.username = `username ${input.username} telah terdaftar pada sistem`
    } else if (!await model.validateUsername(input.username)) {
        errorResult.username = `username ${input.username} tidak valid`
    }
    if (input.name.length < 1) {
        errorResult.name = `field name tidak boleh kosong`
    }
    if (!(Object.entries(errorResult).length === 0)) {
        res.status(400).json({
            listError: errorResult,
        })
    } else {
        let old_data = await model.findBy("developer_account", "email", req.developer.email);
        try {
            if (await model.updateDeveloper(input.username, input.name, req.developer.email)) {
                return res.status(200).json({
                    old_username: old_data[0].username,
                    old_name: old_data[0].name,
                    new_username: input.username,
                    new_name: input.name,
                    message: `Update Account Profile Berhasil`,
                })
            }
        } catch (error) {
            return res.status(500).json({error: "Update Account Profile Gagal"});
        }
    }
})

app.put('/developer/changePassword', verifyAuthToken, async(req, res) => {
    if (req.body.new_password.length < 1) {
        res.status(400).json({
            error: `Field New Password tidak boleh kosong`
        })
    } else if (req.body.confirm_password.length < 1) {
        res.status(400).json({
            error: `Field Confirm Password tidak boleh kosong`
        })
    } else if (req.body.new_password != req.body.confirm_password) {
        res.status(400).json({
            error: `Field New Password dan Confirm Password tidak sama`
        })
    }
    try {
        let saltRounds = 10, hashedPassword = bcrypt.hashSync(req.body.new_password, saltRounds)
        if (await model.changePass('developer_account', hashedPassword, req.developer.email)) {
            let username = await model.getUsername("developer_account", "email", req.developer.email);
            res.status(200).json({
                message: `Developer ${username} Ganti Password Berhasil`,
            })
        }
    } catch (error) {
        return res.status(500).json({error: "Ganti Password Gagal"});
    }
})

<<<<<<< HEAD
app.post('/user/register', verifyAuthToken, async(req,res)=>{
    let errorResult = {}, email = req.body.email, username = req.body.username, name = req.body.name, password = req.body.password, cpass = req.body.confirm_password, no_telp = req.body.no_telp, role = req.body.role.toLowerCase(), saldo = 0, api_hit = 0, temp = req.body.tanggal_lahir.split('/'), tanggal_lahir = `${temp[2]}-${temp[1]}-${temp[0]}`;
    if (email.length < 1){
        errorResult.email = 'Field tidak boleh kosong';
    }else if (!await model.validateEmail(email)){
        errorResult.email = 'Format Salah';
    }else if(!await model.cekDataEmail(email)){
        errorResult.email = 'Email Sudah Terdaftar';
=======
app.post('/user/register', async(req,res)=>{
    let errorResult = {}, email = req.body.email, username = req.body.username, name = req.body.name, password = req.body.password,
        cpass = req.body.confirm_password, no_telp = req.body.no_telp,  role = req.body.role.toLowerCase();
    let saldo = 0, api_hit = 0;
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
            await model.registerUser(email, username, name, hashedPassword, tanggal_lahir, no_telp, saldo, role, api_hit)
            let result = {
                "Email" : email,
                "Username" : username,
                "Name" : name,
                "Tanggal Lahit" : tanggal_lahir,
                "Nomor Telepon" : no_telp,
                "Saldo " : "Rp "+saldo,
                "Role" : role,
                "Api_hit" : api_hit
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
    /*let input = req.body, errorResult = {}
    if (input.email.length < 1) {
        errorResult.email = `field email tidak boleh kosong`
    } else if (await model.checkBy("developer_account", "email", input.email) > 0) {
        errorResult.email = `email ${input.email} telah terdaftar pada sistem`
    } else if (!await model.validateEmail(input.email)) {
        errorResult.email = `email ${input.email} tidak valid`
>>>>>>> c68099c281d5fb93236d580d024d18f0fde83a74
    }
    if(username.length < 1){
        errorResult.username = 'Field tidak boleh kosong';
    }
    else if(!await model.cekDataUsername(username)){
        errorResult.email = 'Username Sudah terdaftar';
    }
    if(name.length < 1){
        errorResult.name = 'Field tidak boleh kosong';
    }
    if (password.length < 1){
        errorResult.password = 'Field tidak boleh kosong';
    }
    if (cpass.length < 1){
        errorResult.confirm_password = 'Field tidak boleh kosong';
    }
    if (password != cpass){
        errorResult.password = 'Password dan Confirm Password tidak sama';
    }
    if (isNaN(no_telp)){
        errorResult.no_telp = 'Input wajib angka';
    }
    if (role != 'dokter' &&  role != 'client' && role != 'receptionist') {
        errorResult.role = 'Role User tidak sesuai';
    }
    if (!(Object.entries(errorResult).length === 0)) {
        res.status(400).json({
            listError: errorResult,
        })
    } else {
        let saltRounds = 10, hashedPassword = bcrypt.hashSync(password, saltRounds)
        try{
            await model.registerUser(email, username, name, hashedPassword, tanggal_lahir, no_telp, saldo, role, api_hit)
            return res.status(201).send({
                "Email" : email,
                "Username" : username,
                "Name" : name,
                "Tanggal Lahir" : tanggal_lahir,
                "Nomor Telepon" : no_telp,
                "Saldo " : `Rp ${saldo}`,
                "Role" : role,
                "Api_hit" : api_hit,
                message:`User ${username} berhasil register`,
            });
        }catch (ex) {
            console.log(ex);
        }
    }*/
})

<<<<<<< HEAD

app.post('/user/login', verifyAuthToken, async(req,res,next)=>{
    let input = req.body, errorResult = {}
    if (input.email.length < 1 || input.password.length < 1) {
        if (input.email.length < 1) errorResult.email = `field email tidak boleh kosong`
        if (input.password.length < 1) errorResult.password = `field password tidak boleh kosong`
    } else {
        if (await model.checkBy("user_account", "email", input.email) <= 0) 
            errorResult.email = `email user tidak terdaftar`
        else {
            let devPassword = await model.getPassword("user_account", "email", input.email)
            if (!bcrypt.compareSync(input.password, devPassword)) 
                errorResult.password = `password user tidak sesuai`
=======
//client login
app.post('/user/login', async(req,res)=>{
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
>>>>>>> c68099c281d5fb93236d580d024d18f0fde83a74
        }
    }
<<<<<<< HEAD
    if (!(Object.entries(errorResult).length === 0)) {
        res.status(400).json({
            listError: errorResult,
        })
    } else {
        let data = await model.findBy("user_account", "email", input.email)
        res.status(200).json({
            message: `User ${data[0].username} berhasil register`,
            token: jsonwebtoken.sign({email: input.email, role: data[0].role}, `${process.env.USER_SECRET_KEY}`, {expiresIn: "10m"}),
        })
=======
    else{
        try {
            let bcryptPass = await model.getPassword("user_account", "email", email)
            let user = await dbase.executeQuery(`select * from user_account where email = '${email}'`)
            let username = user[0].username;
            let name = user[0].name;
            let saldo = user[0].saldo;
            let api_hit = user[0].api_hit;
            let role = user[0].role;
            let secret = "";
            if (!bcrypt.compareSync(password, bcryptPass)){
                result = {
                    "Message" : "Password Salah"
                }
                return res.status(400).send(result);
            }else{
                let token = jsonwebtoken.sign({
                    "email" : email,
                    "name" : name,
                    "saldo" : saldo,
                    "api_hit" : api_hit,
                    "role" : "client"
                }, "user", {'expiresIn':'30m'});
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
>>>>>>> c68099c281d5fb93236d580d024d18f0fde83a74
    }
})

function verifyUserAccessToken(req, res, next) {
    if (!req.headers["user-access-token"]) {
        return res.status(401).json({error: "User Token Access Not Found"});
    }
    let user = {};
    try {
        user = jsonwebtoken.verify(req.headers["user-access-token"], `${process.env.USER_SECRET_KEY}`);
    } catch (error) {
        return res.status(401).json({error: "Invalid User Token Access"});
    }
    req.user = user;
    next();
}

function UserIsClient(req, res) {
    if (req.user.role != "client") {
        return res.status(403).json({error: "Role User Bukan Client"});
    }
<<<<<<< HEAD
}

function UserIsDokter(req, res) {
    if (req.user.role != "dokter") {
        return res.status(403).json({error: "Role User Bukan Dokter"});
    }
}

function UserIsReceptionist(req, res) {
    if (req.user.role != "receptionist") {
        return res.status(403).json({error: "Role User Bukan Receptionist"});
=======
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
        let bcryptPass = await model.getPassword("user_account", "email", email)
        let user = await dbase.executeQuery(`select * from user_account where email = '${email}'`)
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
        }
>>>>>>> c68099c281d5fb93236d580d024d18f0fde83a74
    }
}

app.get('/client/', [verifyAuthToken, verifyUserAccessToken, UserIsClient], async(req, res) => {
    let data = await model.findBy("user_account", "email", req.user.email);
    delete data[0].password;
    return res.status(200).json(data);
})

app.put('/client/', [verifyAuthToken, verifyUserAccessToken, UserIsClient], async (req,res)=>{
    let username = req.body.username_baru, name = req.body.name_baru, no_telp = req.body.no_telp_baru;
    if (username.length < 1){
        errorResult.username = 'Field Username tidak boleh kosong';
    } else if (await model.checkBy("user_account", "username", username) > 0) {
        errorResult.username = `username ${username} telah terdaftar pada sistem`
    } else if (!await model.validateUsername(username)) {
        errorResult.username = `username ${username} tidak valid`
    }
    if (name.length < 1){
        errorResult.name = 'Field Name tidak boleh kosong';
    }
    if (isNaN(no_telp)){
        errorResult.no_telp = 'Input Nomor Telepon wajib angka';
    }
    if (!(Object.entries(errorResult).length === 0)) {
        res.status(400).json({
            listError: errorResult,
        })
    } else {
        try {
            await model.updateClient(req.user.email, username, name, no_telp)
            return res.status(200).json({message: `User ${username} Update Profile Berhasil`})
        } catch (error) {
            return res.status(500).json({error: "Update Profile Gagal"});
        }
    }
})


app.put('/client/changePassword', [verifyAuthToken, verifyUserAccessToken, UserIsClient], async (req, res) =>{
    if (req.body.new_password.length < 1) {
        res.status(400).json({
            error: `Field New Password tidak boleh kosong`
        })
    } else if (req.body.confirm_password.length < 1) {
        res.status(400).json({
            error: `Field Confirm Password tidak boleh kosong`
        })
    } else if (req.body.new_password != req.body.confirm_password) {
        res.status(400).json({
            error: `Field New Password dan Confirm Password tidak sama`
        })
    }
    try {
        let saltRounds = 10, hashedPassword = bcrypt.hashSync(req.body.new_password, saltRounds)
        if (await model.changePass('user_account', hashedPassword, req.user.email)) {
            let username = await model.getUsername("user_account", "email", req.user.email);
            res.status(200).json({
                message: `User ${username} Ganti Password Berhasil`,
            })
        }
    } catch (error) {
        return res.status(500).json({error: "Ganti Password Gagal"});
    }
})

app.post('/client/refresh', [verifyAuthToken, verifyUserAccessToken, UserIsClient], async (req, res)=>{
    try {
        let data = await model.findBy("user_account", "email", req.user.email)
        res.status(200).json({
            message: `User ${data[0].username} berhasil refresh token`,
            new_token: jsonwebtoken.sign({email: req.user.email, role: req.user.role}, `${process.env.USER_SECRET_KEY}`, {expiresIn: "10m"}),
        })
    } catch (error) {
        return res.status(500).json({error: "gagal refresh token"});
    }
})

app.delete('/client', [verifyAuthToken, verifyUserAccessToken, UserIsClient], async (req, res)=>{
    let data = await model.findBy("user_account", "email", req.user.email)
    try {
        if (await model.deleteAccount("user_account", req.user.email)) {
            res.status(200).json({
                message: `User ${data[0].username} berhasil delete account`
            })
        }
    } catch (error) {
        return res.status(500).json({error: `User ${data[0].username} gagal delete account`});
    } 
})

app.post('/client/topup', [verifyAuthToken, verifyUserAccessToken, UserIsClient], async (req, res)=>{
    let saldo = req.body.saldo, cpass = req.body.confirm_password, data = await model.findBy("user_account", "email", req.user.email)
    if (saldo.length < 1){
        errorResult.saldo = 'Field Saldo tidak boleh kosong';
    } else if (isNaN(saldo)){
        errorResult.saldo = 'Input wajib angka';
    }
    if (cpass.length < 1){
        errorResult.confirm_password = 'Field Confirm Password tidak boleh kosong';
    } else {
        if (!bcrypt.compareSync(cpass, data[0].password)) 
            errorResult.password = `Field Confirm Password tidak sesuai`
    }
    if (!(Object.entries(errorResult).length === 0)) {
        res.status(400).json({
            listError: errorResult,
        })
    } else {
        try {
<<<<<<< HEAD
            let new_saldo = saldo + data[0].saldo
            await dbase.executeQuery(`update user_account set saldo = '${saldo}' + saldo where email = '${req.user.email}'`)
            return res.status(200).json({
                saldo_awal: data[0].saldo,
                saldo_akhir: new_saldo,
                message: `User ${data[0].username} berhasil top up saldo`,
            })
        } catch (error) {
            return res.status(500).json({error: `User ${data[0].username} gagal top up saldo`});
=======
            let bcryptPass = await model.getPassword("user_account", "email", email)
            if (!bcrypt.compareSync(password, bcryptPass)){
                result = {
                    "Message" : "Password Salah"
                }
                return res.status(400).send(result);
            }else{
                let saltRounds = 10, hashedPassword = bcrypt.hashSync(password_baru, saltRounds)
                let users = await dbase.executeQuery(`update user_account set password = '${hashedPassword}' where email = '${email}'`);
                result = {
                    "message" : "sukses"
                }
                return res.status(200).send(result);
            }
        }catch (e) {
            console.log(e);
>>>>>>> c68099c281d5fb93236d580d024d18f0fde83a74
        }
    }
})

<<<<<<< HEAD
app.post('/client/subscription', [verifyAuthToken, verifyUserAccessToken, UserIsClient], async (req,res)=>{
    let saldo = req.body.saldo, cpass = req.body.confirm_password, data = await model.findBy("user_account", "email", req.user.email)
    if (saldo.length < 1){
        errorResult.saldo = 'Field Saldo tidak boleh kosong';
    } else if (isNaN(saldo)){
        errorResult.saldo = 'Input Saldo wajib angka';
    } else if (saldo < 100000) {
        errorResult.saldo = 'Saldo tidak mencukupi';
    }
    if (cpass.length < 1){
        errorResult.confirm_password = 'Field Confirm Password tidak boleh kosong';
    } else {
        if (!bcrypt.compareSync(cpass, data[0].password)) 
            errorResult.password = `Field Confirm Password tidak sesuai`
    }
    if (!(Object.entries(errorResult).length === 0)) {
        res.status(400).json({
            listError: errorResult,
        })
    } else {
        try {
            let new_saldo = saldo + data[0].saldo, new_api_hit = 50 + data[0].api_hit
            await dbase.executeQuery(`update user_account set saldo = '${saldo}' + saldo, api_hit = ${new_api_hit} where email = '${req.user.email}'`)
            return res.status(200).json({
                saldo_awal: data[0].saldo,
                api_hit_awal: data[0].api_hit,
                saldo_akhir: new_saldo,
                api_hit_akhir: new_api_hit,
                message: `User ${data[0].username} berhasil Subcription`,
            })
        } catch (error) {
            return res.status(500).json({error: `User ${data[0].username} gagal Subcription`});
=======
    let cek = await dbase.executeQuery(`select * from user_account where email = ${email} and password = ${password}`);
    if (cek.length == 0){
        let result = {
            "Message" : "Password salah"
        }
        return res.status(401).send(result)
    }
    else {
        let bcryptPass = await model.getPassword("user_account", "email", email)
        let user = await dbase.executeQuery(`select * from user_account where email = '${email}'`)
        let username = user[0].username;
        if (!bcrypt.compareSync(password, bcryptPass)){
            result = {
                "Message" : "Password Salah"
            }
            return res.status(400).send(result);
        }else{
            let saltRounds = 10, hashedPassword = bcrypt.hashSync(password_baru, saltRounds)
            let client = await dbase.executeQuery(`update user_account set password=${hashedPassword} where email=${email}`);
            let result = {
                "Message" : "Change Password Success"
            }
            return res.status(200).send(result);
>>>>>>> c68099c281d5fb93236d580d024d18f0fde83a74
        }
    }
})

app.get('/client/consultation/', [verifyAuthToken, verifyUserAccessToken, UserIsClient], async (req,res)=> {
    let data = await model.findBy("consultation", "email_user", req.user.email)
    delete data.id
    return res.status(200).json(data)
})

app.get(`/dokter/`,[verifyAuthToken, verifyUserAccessToken, UserIsDokter],async(req, res) =>{
    let data = await model.findBy("user_account", "email", req.user.email);
    delete data[0].password;
    return res.status(200).json(data);
})

app.put(`/dokter/`,[verifyAuthToken, verifyUserAccessToken, UserIsDokter], async(req, res) =>{
    let username = req.body.username_baru, name = req.body.name_baru, no_telp = req.body.no_telp_baru;
    if (username.length < 1){
        errorResult.username = 'Field Username tidak boleh kosong';
    } else if (await model.checkBy("user_account", "username", username) > 0) {
        errorResult.username = `username ${username} telah terdaftar pada sistem`
    } else if (!await model.validateUsername(username)) {
        errorResult.username = `username ${username} tidak valid`
    }
    if (name.length < 1){
        errorResult.name = 'Field Name tidak boleh kosong';
    }
<<<<<<< HEAD
    if (isNaN(no_telp)){
        errorResult.no_telp = 'Input Nomor Telepon wajib angka';
    }
    if (!(Object.entries(errorResult).length === 0)) {
        res.status(400).json({
            listError: errorResult,
        })
    } else {
        try {
            await model.updateClient(req.user.email, username, name, no_telp)
            return res.status(200).json({message: `User ${username} Update Profile Berhasil`})
        } catch (error) {
            return res.status(500).json({error: "Update Profile Gagal"});
=======
    try{
        let bcryptPass = await model.getPassword("user_account", "email", email)
        let user = await dbase.executeQuery(`select * from user_account where email = '${email}'`)
        let username = user[0].username;
        let saldo = user[0].saldo;
        let api_hit = user[0].api_hit;
        if (!bcrypt.compareSync(password, bcryptPass)){
            result = {
                "Message" : "Password Salah"
            }
            return res.status(400).send(result);
        }else{
            let token = jsonwebtoken.sign({
                "email" : email,
                "username" : username,
                "saldo" : saldo,
                "api_hit" : api_hit,
                "role" : "client"
            }, "user", {'expiresIn':'30m'});
            result = {
                "Email" : email,
                "Username" : username,
                "Token Baru" : token
            }
            return res.status(200).send(result);
>>>>>>> c68099c281d5fb93236d580d024d18f0fde83a74
        }
    }
})

<<<<<<< HEAD

app.put('/dokter/changePassword', [verifyAuthToken, verifyUserAccessToken, UserIsDokter], async (req, res) =>{
    if (req.body.new_password.length < 1) {
        res.status(400).json({
            error: `Field New Password tidak boleh kosong`
        })
    } else if (req.body.confirm_password.length < 1) {
        res.status(400).json({
            error: `Field Confirm Password tidak boleh kosong`
        })
    } else if (req.body.new_password != req.body.confirm_password) {
        res.status(400).json({
            error: `Field New Password dan Confirm Password tidak sama`
        })
    }
    try {
        let saltRounds = 10, hashedPassword = bcrypt.hashSync(req.body.new_password, saltRounds)
        if (await model.changePass('user_account', hashedPassword, req.user.email)) {
            let username = await model.getUsername("user_account", "email", req.user.email);
            res.status(200).json({
                message: `User ${username} Ganti Password Berhasil`,
            })
=======
//delete client account yg sedang login
app.delete('/client', async (req, res)=>{
    let email = req.body.email;
    let password = req.body.password;
    let result = {};
    try{
        let bcryptPass = await model.getPassword("user_account", "email", email)
        let user = await dbase.executeQuery(`select * from user_account where email = '${email}'`)
        let username = user[0].username;
        if (!bcrypt.compareSync(password, bcryptPass)){
            result = {
                "Message" : "Password Salah"
            }
            return res.status(400).send(result);
        }else{
            let users = await dbase.executeQuery(`delete from user_account where email = '${email}'`);
            result = {
                "Message" : "Delete Account Success"
            }
            return res.status(200).send(result);
>>>>>>> c68099c281d5fb93236d580d024d18f0fde83a74
        }
    } catch (error) {
        return res.status(500).json({error: "Ganti Password Gagal"});
    }
})

app.post('/dokter/refresh', [verifyAuthToken, verifyUserAccessToken, UserIsDokter], async (req, res)=>{
    try {
        let data = await model.findBy("user_account", "email", req.user.email)
        res.status(200).json({
            message: `User ${data[0].username} berhasil refresh token`,
            new_token: jsonwebtoken.sign({email: req.user.email, role: req.user.role}, `${process.env.USER_SECRET_KEY}`, {expiresIn: "10m"}),
        })
    } catch (error) {
        return res.status(500).json({error: "gagal refresh token"});
    }
<<<<<<< HEAD
=======
    try{
        user = jsonwebtoken.verify(token, "user");
    }catch (e) {
        console.log(e);
    }
    let email = user.email;
    let users = await dbase.executeQuery(`select * from user_account where email = '${email}'`);
    let username = users[0].username;
    let name = users[0].name;
    let password = users[0].password;
    let tanggal_lahir = users[0].tanggal_lahir;
    let saldo = users[0].saldo;
    let result = {
        "Email" : email,
        "Username" : username,
        "Name" : name,
        "Password" : password,
        "Tanggal Lahir" : tanggal_lahir,
        "Saldo" : saldo
    }
    return res.status(200).send(result);
>>>>>>> c68099c281d5fb93236d580d024d18f0fde83a74
})

app.delete('/dokter', [verifyAuthToken, verifyUserAccessToken, UserIsDokter], async (req, res)=>{
    let data = await model.findBy("user_account", "email", req.user.email)
    try {
        if (await model.deleteAccount("user_account", req.user.email)) {
            res.status(200).json({
                message: `User ${data[0].username} berhasil delete account`
            })
        }
    } catch (error) {
        return res.status(500).json({error: `User ${data[0].username} gagal delete account`});
    } 
})



app.get(`/receptionist/`, [verifyAuthToken, verifyUserAccessToken, UserIsReceptionist],async(req, res) =>{
    let data = await model.findBy("user_account", "email", req.user.email);
    delete data[0].password;
    return res.status(200).json(data);
})

app.put(`/receptionist/`,[verifyAuthToken, verifyUserAccessToken, UserIsReceptionist], async(req, res) =>{
    let username = req.body.username_baru, name = req.body.name_baru, no_telp = req.body.no_telp_baru;
    if (username.length < 1){
        errorResult.username = 'Field Username tidak boleh kosong';
    } else if (await model.checkBy("user_account", "username", username) > 0) {
        errorResult.username = `username ${username} telah terdaftar pada sistem`
    } else if (!await model.validateUsername(username)) {
        errorResult.username = `username ${username} tidak valid`
    }
    if (name.length < 1){
        errorResult.name = 'Field Name tidak boleh kosong';
    }
<<<<<<< HEAD
    if (isNaN(no_telp)){
        errorResult.no_telp = 'Input Nomor Telepon wajib angka';
    }
    if (!(Object.entries(errorResult).length === 0)) {
        res.status(400).json({
            listError: errorResult,
        })
    } else {
        try {
            await model.updateClient(req.user.email, username, name, no_telp)
            return res.status(200).json({message: `User ${username} Update Profile Berhasil`})
        } catch (error) {
            return res.status(500).json({error: "Update Profile Gagal"});
        }
    }
})


app.put('/receptionist/changePassword', [verifyAuthToken, verifyUserAccessToken, UserIsReceptionist], async (req, res) =>{
    if (req.body.new_password.length < 1) {
        res.status(400).json({
            error: `Field New Password tidak boleh kosong`
        })
    } else if (req.body.confirm_password.length < 1) {
        res.status(400).json({
            error: `Field Confirm Password tidak boleh kosong`
        })
    } else if (req.body.new_password != req.body.confirm_password) {
        res.status(400).json({
            error: `Field New Password dan Confirm Password tidak sama`
        })
=======
    else {
        let email = user.email;
        let users = await dbase.executeQuery(`select * from user_account where email = '${email}'`);
        let saldo_awal = users[0].saldo;
        let saldo = parseInt(saldo_awal) + parseInt(temp);
        result = {
            "saldo_awal" : saldo_awal,
            "Saldo_akhir" : saldo
        }
        let topup = await dbase.executeQuery(`update user_account set saldo = '${saldo}' where email = '${email}'`)
        return res.status(200).send(result);
    }
})

app.post('/client/subscription', async (req,res)=>{
    const token = req.header("x-auth-token");
    let user = {}, result = {};
    if(!token){
        return res.status(401).send("Unauthorized");
    }
    try {
        user = jsonwebtoken.verify(token, "user");
    }catch (e) {
        return res.status(401).send("Unauthorized");
    }
    if (user.role != "client"){
        return res.status(401).send("Unauthorized");
    }
    if (user.saldo < 100){
        return res.status(400).send("Saldo tidak cukup");
    }
    else{
        let email = user.email;
        let users = await dbase.executeQuery(`select * from user_account where email = '${email}'`);
        let temp = users[0].saldo;
        let api_temp = users[0].api_hit;
        let api_hit = parseInt(api_temp) + 10;
        let saldo = parseInt(temp) - 100;

        let subs = await dbase.executeQuery(`update user_account set saldo = '${saldo}', api_hit = '${api_hit}' where email = '${email}'`)
        result = {
            "Saldo_awal" : "Rp "+ temp,
            "Api_hit_awal" : api_temp,
            "Saldo_ahir " : saldo,
            "Api_hit" : api_hit
        }
        return res.status(200).send(result);

    }
})

app.get('/client/consultation', async (req,res)=>{
    const token = req.header("x-auth-token");
    let user = {};
    let result = {};
    if (!token){
        return res.status(401).send("Unauthoriezed");
    }
    try{
        user = jsonwebtoken.verify(token, "user");
    }catch (e) {
        return res.status(401).send("Unauthorized");
    }
    if(user.role != "client"){
        return res.status(400).send("Harus Role User");
    }
    else {
        let email = user.email;
        let users = await dbase.executeQuery(`select * from user_account where email = '${email}'`);
        let api_hit_awal = users[0].api_hit;
        if(api_hit_awal < 1){
            return res.status(402).send("Silahkan Lakukan Subscripstion");
        }
        else{
            let api_hit = parseInt(api_hit_awal) - 1;
            let client = await dbase.executeQuery(`update user_account set api_hit = '${api_hit}' where email = '${email}'`);
            let consul = await dbase.executeQuery(`select * from consul where email_user = '${email}'`);
            if(consul.length == 0){
                return res.status(200).send("Belum ada riwayat check up");
            }
            else{
                let ress = [];
                for (i of consul){
                    result = {
                        "Id_consul" : i.id_consul,
                        "Email" : i.email_user,
                        "Name" : i.name,
                        "Doctor_name" : i.doctor_name,
                        "Info" : i.info
                    }
                    ress.push(result);
                }
                return res.status(200).send(ress);
            }
        }
    }
})


app.get(`/receptionist`,async(req, res) =>{
    const token = req.header("x-auth-token");
    let user = {}, errorResult = {}
    if(!token){
        errorResult.token = "Unauthorized"
        res.status(401).send("Unauthorized");
>>>>>>> c68099c281d5fb93236d580d024d18f0fde83a74
    }
    try {
        let saltRounds = 10, hashedPassword = bcrypt.hashSync(req.body.new_password, saltRounds)
        if (await model.changePass('user_account', hashedPassword, req.user.email)) {
            let username = await model.getUsername("user_account", "email", req.user.email);
            res.status(200).json({
                message: `User ${username} Ganti Password Berhasil`,
            })
        }
    } catch (error) {
        return res.status(500).json({error: "Ganti Password Gagal"});
    }
})

app.post('/receptionist/refresh', [verifyAuthToken, verifyUserAccessToken, UserIsReceptionist], async (req, res)=>{
    try {
        let data = await model.findBy("user_account", "email", req.user.email)
        res.status(200).json({
            message: `User ${data[0].username} berhasil refresh token`,
            new_token: jsonwebtoken.sign({email: req.user.email, role: req.user.role}, `${process.env.USER_SECRET_KEY}`, {expiresIn: "10m"}),
        })
    } catch (error) {
        return res.status(500).json({error: "gagal refresh token"});
    }
<<<<<<< HEAD
=======
    let email = user.email;
    let users = await dbase.executeQuery(`select * from user_account where email = '${email}'`);
    let username = users[0].username;
    let name = users[0].name;
    let password = users[0].password;
    let tanggal_lahir = users[0].tanggal_lahir;
    let saldo = users[0].saldo;
    let tgl = dateFormat(tanggal_lahir);
    let result = {
        "Email" : email,
        "Username" : username,
        "Name" : name,
        "Password" : password,
        "Tanggal Lahir" : tgl,
        "Saldo" : saldo
    }
    return res.status(200).send(result);
>>>>>>> c68099c281d5fb93236d580d024d18f0fde83a74
})

app.delete('/receptionist', [verifyAuthToken, verifyUserAccessToken, UserIsReceptionist], async (req, res)=>{
    let data = await model.findBy("user_account", "email", req.user.email)
    try {
        if (await model.deleteAccount("user_account", req.user.email)) {
            res.status(200).json({
                message: `User ${data[0].username} berhasil delete account`
            })
        }
    } catch (error) {
        return res.status(500).json({error: `User ${data[0].username} gagal delete account`});
    } 
})

app.get('/jadwal/:', async (req, res)=>{
    const token = req.header("x-auth-token");
    let tgl = req.body.tanggal.split('/');
    let tanggal= tgl[2]+"-"+tgl[1]+"-"+tgl[0];
    let users = await dbase.executeQueryWithParam(`select * from schedule where tanggal = '${tanggal}'`);
    let user = {}, result = {};
    let ress = [];
    if(!token){
        msg = "Unauthorized"
        res.status(401).send("Unauthorized");
    }
    try{
        user = jsonwebtoken.verify(token,"218116679");
    }catch(err){
        msg = "token salah"
        res.status(401).send("Token Invalid");
    }
    for(i of users){
        result = {
            "Email" : i.email,
            "Doctor_name" : i.doctor_name,
            "No_Telp" : i.no_telp
        }
        ress.push(result);
    }
    return res.status(200).send(ress);
})

app.post(`/jadwal/dokter`, async(req,res) =>{
    const token = req.header("x-auth-token");
    let user = {}
    let tanggal = req.body.tanggal_praktek.split('/');
    let tanggal_jadwal = tanggal[2]+"-"+tanggal[1]+"-"+tanggal[0];
    let jam = req.body.waktu_praktek
    if(!token){
        msg = "Unauthorized"
        res.status(401).send("Unauthorized");
    }
    try{
        user = jwt.verify(token,process.env.SECRET_KEY);
    }catch(err){
        msg = "token salah"
        res.status(401).send("Token Invalid");
    }
    if (user.role != "dokter") {
        res.status(404).send("Anda bukanlah dokter")
    }
    let dokter = await model.findBy("user_account", "email", user.email)
    if(await dbase.executeQuery(`INSERT into schedule value('${dokter[0]['nama']}', '${tanggal_jadwal}', '${jam}',)`)){
        let jadwal_now = await model.findBy("schedule", "tanggal", tanggal_jadwal)
        return res.status(200).send(jadwal_now)
    }
})

app.get("/login/priaid",async function (req,res) {
    const data = await axios.get("https://www.ehealthme.com/api/v1/ds/ginger/fever/");
    console.log(data)

    // var axios = require("axios").default;

    // var options = {
    //     method: 'GET',
    //     url: 'https://priaid-symptom-checker-v1.p.rapidapi.com/body/locations/15',
    //     params: {language: 'en-gb'},
    //     headers: {
    //       'x-rapidapi-key': 'a908fdc4e8msh48a917bda46e947p11d46ajsn7ccfe213a09e',
    //       'x-rapidapi-host': 'priaid-symptom-checker-v1.p.rapidapi.com'
    //     }
    //   };
      
    //   axios.request(options).then(function (response) {
    //       console.log(response.data);
    //   }).catch(function (error) {
    //       console.error(error);
    //   });
    
});

app.listen(PORT, () => {
    console.log(`Running to port ${PORT}`);
});

// function dateFormat(dateTime) {
//     var date = new Date(dateTime.getTime());
//     date.setHours(0, 0, 0, 0);
//     return date;
// }
