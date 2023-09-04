require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());


// routers
const userRouter=require("./routes/Users")
app.use("/users", userRouter);


const db=require('./models')

db.sequelize.sync()
.then(()=>{
    app.listen(process.env.PORT, () => {
        console.log("server started on ", process.env.PORT);
    })
})
.catch((error)=>{
    console.log(error)
})

