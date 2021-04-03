export interface getSourcesResponse {
    success: boolean,
    linear_protocol_order: linearProtocolOrder[],
    stream_profiles: {[key: string]: streamProfile},
    channels: channel[]
}

export interface getEpgByDateResponse {
    success: boolean,
    broadcasts: {[key: string]: broadcast[]}
}

export interface getBroadcastDetailResponse {
    success: boolean,
    broadcast: broadcastDetail
}


export interface linearProtocolOrder {
    id: number,
    name: string,
    code: string,
    prefix: string,
    trickplay: boolean
}

export interface streamProfile {
    name: string,
    bitrate: number,
    codec_code: string,
    resolution: {
        width: number,
        height: number
    }
}

export interface channel {
    id: number,
    id_epg: number,
    hd: boolean,
    interface: 'tv' | 'radio',
    name: string,
    timeshift: boolean,
    catchup_length: number,
    pvr: boolean,
    broadcast_time: {
        from?: timestamp,
        to?: timestamp
    },
    parental_lock: {
        enabled: boolean,
        from?: timestamp,
        to?: timestamp
    },
    content_sources: contentSource[]
}

export interface contentSource {
    id_protocol: number,
    id_content_source: number,
    requires_authorization: boolean,
    weight: number,
    utilization_factor: number,
    stream_profile_urls: { [key: string]: URL },
    adaptive_codec: string
}

export interface broadcast {
    csfd?: number,
    thumbnail: string,
    episode_id?: number,
    liveShortDescription: string,
    program_id?: number,
    name: string,
    realLengthInMinutes: number,
    epg_id: number,
    id: number,
    endTimestamp: timestamp,
    live: boolean,
    startTimestamp: timestamp,
    thumbnail_source: string,
    thumbnail_default: boolean
}

export interface broadcastDetail {   
    id: number,
    tag_ids: number[], 
    country_ids: number[],
    program_id?: number,
    name: string,
    longDescription: string,
    genre?: string,
    country?: string,
    year?: string,
    length?: number,
    format?: string,
    csfd?: number,
    youtube_id?: number,
    images: {
      poster: URL,
      photo?: URL
    }
}

type URL = string;
type timestamp = number;