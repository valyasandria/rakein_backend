const express = require('express')
const session = require('express-session');
const app = express()
const PORT = process.env.PORT || 1234
const { Client } = require('pg')
const bp = require('body-parser')
const bcrypt = require('bcrypt')
const alert = require('alert');

app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))

const salt = bcrypt.genSaltSync (10);



//database details
const db = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'rakein',
    password: 'postgres',
    port: 5432
})

//connect to database
db.connect((err) => {
    if (err) {
        console.log(err)
        return
    }
    console.log('Database is connected sucessfully!')
})

//app.set("view engine", "ejs")

app.get('/', (req, res) => {
    res.render("login.ejs")
})

//FEATURES
//1. REGISTER ACCOUNT
/*app.get('/register', (req, res)=>{
    res.render("register.ejs")
})*/
app.get('/register', (req, res) => {
    res.render("register.ejs")
})



app.post('/register', async(req, res) => {
    const myName = req.body.myName
    const username = req.body.username
    const email = req.body.email
    const password = bcrypt.hashSync(req.body.password,salt)

    console.log(myName)

    errors = []
    //Check Regex For User Name
    const isUsernameValid = username => {
        const checkRegex = /[_]*(?!.*\W).{5,12}/;
        return username.match(checkRegex) == null ? false : true;
    };

    //Check Regex For Password
    const isPasswordValid = password => {
        const checkRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,12}/;
        return password.match(checkRegex) == null ? false : true;
    };

    if (myName == null || username == null || email == null || password == null){
        errors.push({message: "Please fill in all the blanks!"})
    }

    else if (!isUsernameValid (req.body.username)) {
        errors.push({message: "Username must 5 - 12 character and not contains special character"})
    }

    else if (!isPasswordValid (req.body.password)){
        errors.push({message:"Password must 5 - 12 character and contains at least one number, uppercase and lowercase"});
    }

    /*if (errors.length > 0){
        return res.render("register.ejs", {errors})
    } */
    
    //PASSWORD HASHING
    else {
        //const hashed = bcrypt.hash(password, salt)
        console.log(password) //print hashed password

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
                db.query(`INSERT INTO users VALUES (default,'${myName}', '${username}','${email}', '${password}')`, (err, res)=>{
                    if(err){
                        throw err
                    }
                    console.log("Your account is registered!")
                })
                res.redirect('/login')
            }
        })
    }
})

//2. LOGIN
/*app.get('/login', (req, res)=>{
    res.render("login.ejs")
})*/

app.post('/login', async function(req, res){
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
                console.log("Username and Password Correct!")
                res.redirect('/home')
                
            }else{
                console.log("Password false")
                alert("Password Unmatched")
                res.redirect('/login')
            }
        })
        
        });

})

//3. HOME PAGE, SHOW STORE

//4. REGISTER STORE
/*app.get('/registerStore', (req, res)=>{
    //res.render("login.ejs")
})*/

app.post('/registerStore', async function (req, res){
    var storeName = req.body.storeName
    var phone = req.body.phone
    var storeDesc = req.body.storeDesc
    var storeType = req.body.storeType
    var storeAddress = req.body.storeAddress

    errors = []

    if (!storeName || !phone ||!storeDesc || !storeType || !storeAddress){
        errors.push({ message: "Please fill in all the blanks!" })
    }
    if (phone.length > 13){
        errors.push({ message: "Please enter the correct phone number!" })
    }
    /*if (errors.length > 0){
        return res.render("register.ejs", {errors})
    } */

    //store name duplication
    db.query(`SELECT * FROM store WHERE store_name = '${storeName}'`, (err, results)=>{
        if (err){
            throw err
        }
        if (results.rowCount > 0){
            errors.push({ message: "Your store name is already registered!" })
            console.log("Please register another name!")
            //res.render("register.ejs", {errors})
        }
        else { //registration success
            db.query(`INSERT INTO store VALUES (default,'${storeName}', '${phone}','${storeDesc}', '${storeType}', '${storeAddress}')`, (err, results)=>{
                if(err){
                    throw err
                }
                console.log(storeName)
                console.log("Your store is registered!")
            })
            res.redirect('/home')
        }
    })
    
})

//5. ADD PRODUCTS
//ADD PRODUCTS
/*app.get('/addproducts', (req, res) => {
    //res.render("add_prod.ejs")
})*/

app.post('/addProducts', async function (req, res){
    var prodName = req.body.prodName
    var prodDesc = req.body.prodDesc
    var prodType = req.body.prodType
    var stock = req.body.stock
    var prodPrice = req.body.prodPrice

    errors = []
    if (!prodName || !prodDesc || !prodType || !stock || !prodPrice){
        errors.push({ message: "Please fill in all the blanks!" })
    }
    
    else{
        const query = `INSERT INTO products VALUES (default, '${prodName}','${prodDesc}','${prodType}', '${stock}', '${prodPrice}')`;
        db.query(query, (err, results) => {
            if(err){
                throw err
            }
        console.log('New product added to catalog!')
        });
        res.redirect("/catalog")
    }
    
})

//6. PRODUCT DETAILS

//7. CATALOG
app.get('/catalogue', (req, res) => {
    db.query('SELECT * FROM products order by product_id asc', (err, result) => {
        if (err){
            throw err
        }
        //res.render("inventory.ejs", {'list': result.rows})
    })
})


//8. CHECKOUT OR CART
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

//9. GENERATE RECEIPTS
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

//10. SALES ACTIVITY
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
