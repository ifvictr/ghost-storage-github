import Promise from 'bluebird'
import http from 'http'

export const isWorkingUrl = url => new Promise(resolve => {
    const req = http.request(url, { method: 'HEAD' }, res => {
        resolve(res.statusCode >= 200 && res.statusCode < 400)
    })
    req.end()
})

export const removeLeadingSlash = str => str.replace(/^\/+/, '')