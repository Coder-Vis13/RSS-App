
/*FIX:
only show those feed data items which are provided

*/

const express = require('express');
const cors = require('cors');
require("dotenv").config();
const appRouter = require("./routes/routes");

const PORT = process.env.PORT;

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", appRouter);

app.use("/addSource", appRouter);




app.listen(PORT, () => console.log('Server running on port ' + PORT));