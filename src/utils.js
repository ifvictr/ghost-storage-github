import Promise from 'bluebird'
import http from 'http'

export const isWorkingUrl = url => new Promise(resolve => {
    http.request(url, { method: 'HEAD' }, ({ statusCode }) => {
        resolve(statusCode >= 200 && statusCode < 400)
    })
})

export const removeLeadingSlash = str => str.replace(/^\/+/, '')