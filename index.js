const express = require('express')
const session = require('express-session');
const app = express()
const PORT = process.env.PORT || 1234
const { Client } = require('pg')
const bp = require('body-parser')
const bcrypt = require('bcrypt')
const alert = require('alert');
const { rows } = require('pg/lib/defaults');

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
                res.send('Register Success!')
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
app.get('/home', (req, res) => {
    db.query('SELECT store_name, store_type from store', (err, result) => {
        if (err){
            throw err
        }
        res.send({'my_store': result.rows})
    })
})

//4. REGISTER STORE
app.post('/registerStore', async function (req, res){
    var storeName = req.body.storeName
    var phone = req.body.phone
    var storeDesc = req.body.storeDesc
    var storeType = req.body.storeType
    var storeAddress = req.body.storeAddress

    console.log(storeName)
    errors = []

    if (!storeName || !phone ||!storeDesc || !storeType || !storeAddress){
        errors.push({ message: "Please fill in all the blanks!" })
    }
    if (phone.length > 13){
        errors.push({ message: "Please enter the correct phone number!" })
    }

    //check store name duplication
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


//6. CATALOG
app.get('/catalogue', (req, res) => {
    db.query('SELECT product_name, product_price, product_quantity FROM products order by product_id asc', (err, result) => {
        if (err){
            throw err
        }
        res.send({'product': result.rows})
    })
})

//6. PRODUCT DETAILS
app.get('/productDetails/:id', (req, res) => {
    var id = req.params.id
    const query = `SELECT * FROM products WHERE product_id = '${id}'`
    console.log(id)
    db.query(query,(err, result) => {
        if (err){
            throw err
        }
        res.send({'selected_product': result.rows})
    })
})

//EDIT CATALOGUE
//DELETE PRODUCT
app.get('/delete/:id', (req, res) => {
    var id = req.params.id
    db.query(`Delete from products where product_id = '${id}'`, (err, result) => {
        if (err){
            console.log(err)
            return
        }
        console.log(result)
    })
    res.redirect("/catalogue")
});

//8. CHECKOUT OR CART
app.all('/checkout/:id/:beli', (req, res) => {
    var id = req.params.id
    var beli = req.params.beli

    //choose product
    const query2 =`select * from products where product_id = '${id}'`
    
    db.query(query2, (err, results) => {
        if(err){
            console.log(err)
            return
        }
        var stock = results.rows[0].product_quantity
        console.log(stock) //current stock selected product

        //selected product
        const selected_product = results.rows[0].product_id
        const name = results.rows[0].product_name
        const price = results.rows[0].product_price
        const total = beli * results.rows[0].product_price
        console.log(name)

        if(stock == 0){
            alert("Product SOLD OUT")
        }
        else{
            const query3 =`insert into check_out values (default, CURRENT_timestamp, '${selected_product}', '${name}', '${beli}', '${price}', '${total}')`
            db.query(query3,(err,result2)=>{
                if(err){
                    console.log(err)
                    return
                }
                console.log("transaction created!")
            })
            
            var query4 = `update products set product_quantity = product_quantity - '${beli}' where product_id = '${id}'`
            db.query(query4, (err, result3) => {
                if (err){
                    console.log(err)
                    return
                }
                console.log("stock updated!")
            })
        }
    });
    res.redirect("/catalogue")
});

//9. GENERATE RECEIPT
app.get('/generateReceipt/:store_id/:id', (req, res) => {
    var id = req.params.id //transaction id
    var store_id = req.params.store_id

    db.query(`select store_name, store_address, store_number from store WHERE store_id = '${store_id}' `, (err, result) => {
        if (err){
            throw err
        }
        console.log({'Store': result.rows})

        //store information
        var str_name = result.rows[0].store_name
        var str_address = result.rows[0].store_address

        const query2 = `SELECT trans_date, product_id, product_name, quantity, product_price, total_price from check_out NATURAL JOIN products WHERE transaction_id = '${id}'`
        db.query(query2,(err, result) =>{
            if (err){
                throw err
            }
            console.log("transaction found!")
            console.log({'Transaction': result.rows})

            //product information
            //var transation = result.rows[0].trans_date
            var prod_id = result.rows[0].product_id
            var prod_name = result.rows[0].product_name
            var prod_qty = result.rows[0].quantity
            var prod_price = result.rows[0].product_price
            var product_totalPrice = result.rows[0].total_price

            const query3 =`insert into receipt values (default, '${str_name}', '${str_address}', '${prod_id}','${prod_name}', '${prod_qty}', '${prod_price}', '${product_totalPrice}')`
            db.query(query3,(err,result)=>{
                if(err){
                    console.log(err)
                    return
                }
                console.log("receipt created!")
            })

            const query4 =`insert into sales_activity values (default, '${prod_id}', '${prod_name}', '${prod_qty}', '${prod_price}','${product_totalPrice}')`
            db.query(query4,(err,result)=>{
                if(err){
                    console.log(err)
                    return
                }
                console.log("new transaction added!")
                res.send("Receipt generated successfully")
            })
            
        })
        
    })
    
})

//10. SALES ACTIVITY
app.get('/salesActivity', (req, res) => {
    db.query('select product_id, product_name, quantity, product_price, total_price from sales_activity natural join check_out order by product_id asc', (err, result) => {
        if (err){
            throw err
        }

        console.log(result)
        
        for(let i = 0; i < result.rowCount; i++ ){
            id_prod = result.rows[i].product_id               
            console.log(id_prod)
            //calculating profit (total pemasukan)
            const query2 = `select check_out.product_id as id, sum(quantity) as total_terjual, sum(total_price) as total_pemasukan from receipt natural join check_out where product_id = ${id_prod} group by check_out.product_id`
            db.query(query2,(err, rest) =>{
                if (err){
                    throw err
                }
                //console.log(rest.rows)
                for(let j = 0; j<rest.rowCount; j++){
                    id = rest.rows[j].id
                    total_terj = rest.rows[j].total_terjual
                    total_pem = rest.rows[j].total_pemasukan

                    const query3 =`update sales_activity set product_quantity = ${total_terj}, profit = ${total_pem} where product_id = ${id}`
                    db.query(query3,(err, result2) =>{
                        if(err){
                            console.log(err)
                        }
                    })
                }
            }
        )}

        db.query(`select sum(product_quantity) as sold, sum(profit) as total from sales_activity`,(err, finaldata) =>{
            if(err){
                console.log(err)
            }
            console.log(finaldata.rows[0].total)
            res.send({'sales activity': finaldata.rows})
        })
        
    })

})

//PORT SERVER
app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`)
})
