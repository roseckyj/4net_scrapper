import { FourNetApi } from "./FourNetApi"
import { broadcast, broadcastDetail } from "./types"
import * as fs from 'fs';
import axios from "axios";

export class FourNetScrapper {
    private api: FourNetApi;
    private initialized: boolean = false;

    constructor(apiUrl: string, token: string, private language: string = "en") {
        this.api = new FourNetApi(apiUrl, token);
    }
    
    private async init() {
        await this.api.init();
        this.initialized = true;
    }

    private async getDeepEpgByDate(date: Date, epgIds: number[]): Promise<broadcastsWithDetail> {
        const epgs = await this.api.getEpgByDate(date, epgIds);
        const result: broadcastsWithDetail = {};
        for (const id in epgs.broadcasts) {
            result[id] = await Promise.all(epgs.broadcasts[id].map(async (bc) => {
                try {
                    const detail = (await this.api.getBroadcastDetail(bc.id)).broadcast;
                    return {...bc, ...detail};
                } catch {
                    return {...bc} as broadcastWithDetail;
                }
            }));
        }
        return result;
    }

    public async createEpgFile(path: string, tmpPath: string, daysFwd: number, daysBack: number = 0) {
        if (!this.initialized) await this.init();

        const channels = await (await this.api.getSources()).channels;
        const epgIds = channels.map((channel) => channel.id_epg);

        const stream = fs.createWriteStream(tmpPath);
        stream.write('<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE tv SYSTEM "xmltv.dtd">\n<tv>\n\n');

        channels.forEach((channel) => {
            stream.write(`<channel id="${channel.id_epg}.dvb.guide">\n<display-name>${channel.name}</display-name>\n</channel>\n\n`);
        })

        for (let i = -daysBack; i <= daysFwd; i++) {
            console.log(`Fetching day ${i}`);
            const date = new Date();
            date.setDate(date.getDate() + i + 1);

            const epg = await this.getDeepEpgByDate(date, epgIds);

            Object.keys(epg).forEach((key) => {
                epg[key].forEach((detail) => {
                    stream.write(`<programme start="${this.formatXMLDate(detail.startTimestamp)}" stop="${this.formatXMLDate(detail.endTimestamp)}" channel="${detail.epg_id}.dvb.guide">\n`);
                    stream.write(`<title lang="${this.language}">${this.htmlEncode(detail.name)}</title>\n`);
                    stream.write(`<sub-title lang="${this.language}">${this.htmlEncode(detail.liveShortDescription)}</sub-title>\n`);
                    stream.write(`<desc lang="${this.language}">${this.htmlEncode(detail.longDescription) + (detail.csfd ? ` (ČSFD ${detail.csfd}%)` : '')}</desc>\n`);
                    if (detail.format) stream.write(`<category lang="${this.language}">${this.htmlEncode(detail.format)}</category>\n`);
                    if (detail.images && detail.images.poster) stream.write(`<icon src="${detail.images.poster}"></icon>\n`);
                    stream.write(`</programme>\n\n`);
                })
            })
            console.log(`Day ${i} completed`);
        }

        stream.write('</tv>');
        stream.close();
        console.log("EPG file generated!");
        fs.rename(tmpPath, path, () => console.log("Moved!"));
    }

    public async getBasePlaylist(catchupUrl: string) {
        if (!this.initialized) await this.init();

        const sources = await this.api.getSources();
        let result = "#EXTM3U\n";

        sources.channels.map((channel) => {
            const logo = `https://red-cache.poda.4net.tv/channel/logo/${channel.id}.png`;
            const name = channel.name;
            const src = channel.content_sources[0].stream_profile_urls.adaptive;
            const epgId = `${channel.id_epg}.dvb.guide`;

            result += `#EXTINF:-1 catchup="default" catchup-source="${catchupUrl}?start={utc}&end={utcend}&channel=${channel.id}" catchup-days="1" tvg-ID="${epgId}" tvg-logo="${logo}", ${name}\n`;
            result += src + '\n\n';
        })

        return result;
    }

    public async getCatchup(channelId: number, startTimestamp: number, endTimestamp: number) {
        if (!this.initialized) await this.init();
        const content = await this.api.getContent(channelId, startTimestamp, endTimestamp);

        return new Promise((resolve, reject) => {
            axios
                .get(content.stream_uri)
                .then((response) => {
                    var pathArray = content.stream_uri.split( '/' );
                    var protocol = pathArray[0];
                    var host = pathArray[2];
                    var url = protocol + '//' + host;
                    resolve((response.data as string).replace("/at/", url + "/at/"));
                })
                .catch((e) => {
                    console.error(e);
                    reject('Cannot load catchup playlist');
                });
        });
    }

    private htmlEncode(s?: string) {
        if (!s) {
            return "";
        }
        return s.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/'/g, '&#39;')
            .replace(/"/g, '&#34;');
    }

    private formatXMLDate(timestamp: number) {
        const date = new Date(timestamp * 1000);
        return `${date.getUTCFullYear()}${
            (date.getUTCMonth() + 1).toString().padStart(2, '0')}${
            date.getUTCDate().toString().padStart(2, '0')}${
            date.getUTCHours().toString().padStart(2, '0')}${
            date.getUTCMinutes().toString().padStart(2, '0')}${
            date.getUTCSeconds().toString().padStart(2, '0')} +0000`;
    }
}

interface broadcastWithDetail extends broadcast, broadcastDetail { }
type broadcastsWithDetail = { [key: string]: broadcastWithDetail[] };