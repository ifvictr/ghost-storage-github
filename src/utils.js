import http from 'http'
import https from 'https'
import { URL } from 'url'

const adapters = {
    'http:': http,
    'https:': https
}

export const getProtocolAdapter = inputUrl => {
    const url = new URL(inputUrl)
    return adapters[url.protocol]
}

export const removeLeadingSlashes = str => str.replace(/^\/+/, '')

export const removeTrailingSlashes = str => str.replace(/\/+$/, '')