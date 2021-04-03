import axios from 'axios';
import { getBroadcastDetailResponse, getContentResponse, getEpgByDateResponse, getSourcesResponse } from './types'

export class FourNetApi {
    private session: string;

    constructor(private apiUrl: string, private token: string) {
        if (!apiUrl.endsWith('/')) {
            apiUrl += '/';
        }
    }

    public async init() {
        this.session = await this.getSession();
    }

    public async getSources(): Promise<getSourcesResponse> {
        return new Promise((resolve, reject) => {
            if (!this.session) reject('Session not initialized');

            axios
                .post(this.apiUrl + 'getSources', undefined, this.headers)
                .then((response) => {
                    resolve(response.data);
                })
                .catch((e) => {
                    reject('Error fetching sources');
                });
        });
    }

    public async getEpgByDate(date: Date, epgIds: number[]): Promise<getEpgByDateResponse> {
        return new Promise((resolve, reject) => {
            if (!this.session) reject('Session not initialized');

            const body = {
                date: `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`,
                epg_ids: epgIds
            }

            axios
                .post(this.apiUrl + 'getEpgByDate', body, this.headers)
                .then((response) => {
                    resolve(response.data);
                })
                .catch((e) => {
                    reject('Error fetching EPG');
                });
        });
    }
    
    public async getBroadcastDetail(broadcastId: number): Promise<getBroadcastDetailResponse> {
        return new Promise((resolve, reject) => {
            if (!this.session) reject('Session not initialized');

            const body = {
                id_broadcast: broadcastId
            }

            axios
                .post(this.apiUrl + 'getBroadcastDetail', body, this.headers)
                .then((response) => {
                    resolve(response.data);
                })
                .catch((e) => {
                    reject('Error fetching broadcast detail');
                });
        });
    }

    public async getContent(channelId: number, startTimestamp: number, endTimestamp: number): Promise<getContentResponse> {
        return new Promise((resolve, reject) => {
            if (!this.session) reject('Session not initialized');

            const body = {
                channel_id: channelId,
                start: startTimestamp,
                end: endTimestamp
            }

            axios
                .post(this.apiUrl + 'getContent', body, this.headers)
                .then((response) => {
                    resolve(response.data);
                })
                .catch((e) => {
                    reject('Error fetching content');
                });
        });
    }


    private get headers() {
        return {
            headers: {
                Cookie: "device_token=c363bc1a552bc14c689e18329df47917" + (this.session ? ("; PHPSESSID=" + this.session) : ''),
            },
        }
    }

    private async getSession(): Promise<string> {
        return new Promise((resolve, reject) => {
            axios
                .post(this.apiUrl + 'getDeviceSettings', undefined, this.headers)
                .then((response) => {
                    try {
                        resolve(response.headers['set-cookie'][0].split("=")[1].split(";")[0]);
                    } catch (e) {
                        reject('Error parsing received headers');
                    }
                })
                .catch(() => {
                    reject('Error fetching session');
                });
        });
    }
}
