import Promise from 'bluebird'
import http from 'http'
import https from 'https'
import { URL } from 'url'

export const getProtocolAdapter = inputUrl => {
    const url = new URL(inputUrl)
    const adapters = {
        'http:': http,
        'https:': https
    }

    return adapters[url.protocol]
}

export const isWorkingUrl = url => new Promise(resolve => {
    const req = getProtocolAdapter(url).request(url, { method: 'HEAD' }, res => {
        resolve(res.statusCode >= 200 && res.statusCode < 400)
    })
    req.end()
})

export const removeLeadingSlashes = str => str.replace(/^\/+/, '')

export const removeTrailingSlashes = str => str.replace(/\/+$/, '')