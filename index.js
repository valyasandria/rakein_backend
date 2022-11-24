const express = require('express')
const session = require('express-session');
const app = express()
const PORT = process.env.PORT || 1234
const { Client } = require('pg')
const bp = require('body-parser')
const { text } = require('body-parser')
const bcrypt = require('bcrypt')
const alert = require('alert');
const { rows } = require('pg/lib/defaults');

var temp
var username, pass;

app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))

//database details
const db = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'rakein',
    password: 'postgres',
    port: 5432,
})

//connect to database
db.connect((err) => {
    if (err) {
        console.log(err)
        return
    }
    console.log('Database is connected sucessfully!')
})

app.set("view engine", "ejs")

app.get('/', (req, res) => {
    res.render("login.ejs")
})


//REGISTER ACCOUNT
app.get('/register', (req, res)=>{
    res.render("register.ejs")
})

app.post('/register', async function (req, res){
    var myName = req.body.myName
    var username = req.body.username
    var email = req.body.email
    var password = req.body.password

    errors = []

    if (!myName || !username ||!email || !password){
        errors.push({ message: "Please fill in all the forms!" })
    }

    if (password.length < 8 || password.length > 20){
        errors.push({ message: "Password must be 8-20 characters long!" })
    }

    /*if (errors.length > 0){
        return res.render("register.ejs", {errors})
    } */
    
    //PASSWORD HASHING
    else {
        const hashed = await bcrypt.hash(password, 10)
        console.log(hashed) //print hashed password

        //checking username duplication 
        db.query(`SELECT * FROM users WHERE username = '${username}'`, (err, results)=>{
            if (err){
                throw err
            }
            if (results.rowCount > 0){
                errors.push({ message: "Username is already registered!" })
                //res.render("register.ejs", {errors})
            }
            else{
                //registration success
                db.query(`INSERT INTO users VALUES (default,'${myName}', '${username}','${email}', '${hashed}')`, (err, results)=>{
                    if(err){
                        throw err
                    }
                    results.send('Your account is registered!')
                })
                res.redirect('/login')
            }
        })
    }
})

//LOGIN
app.get('/login', (req, res)=>{
    res.render("login.ejs")
})

app.post('/login', async function(req,res){
    var username = req.body.username
    var password_login = req.body.password_login
    console.log(username, password_login)

    const query = `select password from users where username = '${username}'`
    db.query(query, (err, results) => {
        if(err){
            console.log(err)
            return
        }
        
        //console.log(results.rows)
        var hash = results.rows[0].password
        console.log(hash)
        console.log(password_login)
        console.log(results.rows[0])
        
        bcrypt.compare(password_login, hash, function(err, data){
            if(err){
                console.log(err)
                return
            }
            console.log(data)

            if(data == true){
                console.log("TRUE")
                res.redirect('/home')
                
            }else{
                console.log("Password false")
                alert("Password Unmatched")
                //res.render("login.ejs")
            }
        })
        
        });

})

//HOME PAGE (CATALOG, SHOW PRODUCTS LIST)
app.get('/home', (req, res) => {
    db.query('SELECT * FROM products order by product_id asc', (err, result) => {
        if (err){
            throw err
        }
        //res.render("inventory.ejs", {'list': result.rows})
    })
})

//MY ACCOUNT PAGE
app.get('/account', (req, res) => {
    db.query('SELECT * FROM users', (err, result) => {
        if (err){
            throw err
        }
        //res.render("home.ejs", {'list': result.rows})
    })
})

//REGISTER STORE
app.get('/registerStore', (req, res)=>{
    //res.render("login.ejs")
})

app.post('/registerStore', async function (req, res){
    var storeName = req.body.storeName
    var phone = req.body.phone
    var storeDesc = req.body.storeDesc
    var storeType = req.body.storeType
    var storeAddress = req.body.storeAddress

    errors = []

    if (!storeName || !phone ||!storeDesc || !storeType || !storeAddress){
        errors.push({ message: "Please fill in all the forms!" })
    }
    if (phone.length > 13){
        errors.push({ message: "Please enter the correct phone number!" })
    }
    /*if (errors.length > 0){
        return res.render("register.ejs", {errors})
    } */
    else { //registration success
        db.query(`INSERT INTO store VALUES (default,'${storeName}', '${phone}','${storeDesc}', '${storeType}', '${storeAddress}')`, (err, results)=>{
            if(err){
                throw err
            }
            results.send('Your store is registered!')
        })
        es.redirect('/login')
        }
})

//ADD PRODUCTS
app.get('/addproducts', (req, res) => {
    //res.render("add_prod.ejs")
})

app.post('/addproducts',async (req, res)=>{
    var prodName = req.body.prodName
    var prodDesc = req.body.prodDesc
    var prodType = req.body.prodType
    var stock = req.body.stock
    var prodPrice = req.body.prodPrice

    const query = `insert into products (product_name, product_desc, product_type, product_quantity, product_price) values ('${prodName}','${prodDesc}',${prodType}, ${stock}, ${prodPrice})`;
    db.query(query, (err, results) => {
        if(err){
            console.log(err)
            return
        }
        results.send('New produts added to catalog!')
        });
    res.redirect("/catalog")
})

//CHECKOUT
app.get('/checkout', (req, res) => {
    //res.render("checkout.ejs")
})

app.all('/checkout/:id', (req, res) => {
    var id = req.params.id
    const query2 =`select * from products where product_id = '${id}'`
    
    db.query(query2, (err, results) => {
        if(err){
            console.log(err)
            return
        }
        var stok = results.rows[0].jumlah_stok
        
        console.log(stok)
        const produk = results.rows[0].id_produk
        if(stok < 1){
            alert("Barang tidak boleh kurang dari 0")
        }
        else{
            //const query3 =`insert into history_barang values (${produk},CURRENT_timestamp,'Penjualan',1)`

            db.query(query3,(err,result2)=>{
                if(err){
                    console.log(err)
                    return
                }
            })

            var query4 = `update stok_barang set jumlah_stok = jumlah_stok - 1 where id_produk = '${id}'`
            db.query(query4, (err, result3) => {
                if (err){
                    console.log(err)
                    return
                }
            })
        }
    });
    res.redirect("/inventory")
});

//GENERATE RECEIPTS
app.get('/generaterecipt', (req, res) => {
    //res.render("receipt.ejs")
})

app.get('/generaterecipt', (req, res) => {
    db.query('SELECT * from checkout NATURAL JOIN products', (err, result) => {
        if (err){
            throw err
        }
        const query2 = `select * from store`
        db.query(query2,(err, rest) =>{
            if (err){
                throw err
             }
        })
    })
})

//SALES ACTIVITY
app.get('/salesactivity', (req, res) => {
    db.query('SELECT * from sales_activity NATURAL JOIN products order by product_id asc', (err, result) => {
        if (err){
            throw err
        }

        for(let i = 0; i < result.rowCount; i++ ){
                id_prod = result.rows[i].product_id               
                //console.log(id_pro)
                    //calculating profit (total pemasukan)
                    const query2 = `select products.product_id as id, sum(product_quantity) as total_terjual, sum(product_price) as total_pemasukan from checkout natural join products where product_id = ${id_prod}`
                    db.query(query2,(err, rest) =>{
                      if (err){
                          throw err
                       }
                       //console.log(rest.rows)
                       for(let j = 0;j<rest.rowCount;j++){
                            id = rest.rows[j].id
                            total_terj = rest.rows[j].total_terjual
                            total_pem = rest.rows[j].total_pemasukan
                            //console.log(total_terj,total_prof)
                            const query3 =`update sales_activity set product_quantity = ${total_terj}, profit = ${total_pem} where product_id = ${id}`
                            db.query(query3,(err, result2) =>{
                                if(err){
                                    console.log(err)
                                }
                            })
                        }
                    })}

        db.query(`select sum(product_quantity) as SOLD, sum(profit) as PROFIT from sales_activity`,(err, finaldata) =>{
            console.log(finaldata.rows[0].terjual)
            /*res.render("finance.ejs", {
                'list': result.rows,
                'final': finaldata.rows
            })*/
        })
        
    })

})

//PORT SERVER
app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`)
})
