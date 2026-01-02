import { createServer } from "./server";
import { db } from "./user.repostiory";

const port = process.env.PORT || 3002;
const server = createServer();

db.raw("SELECT 1").then(() => {
    console.log("PostgreSQL connected");
})
.catch((e) => {
    console.log("PostgreSQL not connected");
    console.error(e);
});


server.listen(port, () => {
    console.log("Listening on port " + port)    
});
