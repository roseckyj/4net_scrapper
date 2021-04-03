import axios from "axios";
import * as express from "express";
import * as dotenv from 'dotenv';
import { FourNetScrapper } from "./FourNetScrapper";

dotenv.config();

const EPG_FILENAME = "epg/all.xml"
const EPG_TMP_FILENAME = "epg/tmp.xml"

const scrapper = new FourNetScrapper(process.env.API_URL, process.env.TOKEN, "cs");
const app = express();
const port = process.env.PORT || 80;


let lastTime = new Date(0);
setInterval(() => {
    if (lastTime.getDate() !== new Date().getDate()) {
        console.log("Creating new EPG...");
        scrapper.createEpgFile(EPG_FILENAME, EPG_TMP_FILENAME, 3, 1);
        lastTime = new Date();
    }
}, 1000 * 60)



app.get('/', (req, res) => {
    res.send('OK');
});

app.get('/list', async (req, res) => {
    res.send(await scrapper.getBasePlaylist(req.protocol + '://' + req.get('host')));
});

app.get('/epg', (req, res) => {
    res.sendFile(EPG_FILENAME);
});

app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}/`);
});


// Heroku upkeeper
if (process.env.UPKEEP_URL) {
    setInterval(() => axios.get(process.env.UPKEEP_URL), 10000);
}