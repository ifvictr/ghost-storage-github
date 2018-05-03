"use strict";

const Promise = require("bluebird");
const BaseStorage = require("ghost-storage-base");
const Octokit = require("@octokit/rest");
const fs = require("fs-extra");
const path = require("path");
const uuid = require('uuid');

const buildUrl = require("build-url");
const isUrl = require("is-url");
const readFile = Promise.promisify(fs.readFile);
const removeLeadingSlash = require("remove-leading-slash");
const request = Promise.promisify(require("request"));

class GitHubStorage extends BaseStorage {
    constructor(config) {
        super();

        this.client = new Octokit();
        this.config = config;
        config.branch = config.branch || "master";
        config.destination = config.destination || "";

        this.client.authenticate({
            type: config.type,
            username: config.user,
            password: config.password,
            token: config.token,
        });

        // Local storage path
        this.localPath = config.path ? config.path : "/";
    }
    
    getFilename (image) {
        const date = new Date()
        const timestamp = date.getTime()
        const year = this.padLeft(date.getYear() + 1900, 4)
        const month = this.padLeft(date.getMonth() + 1, 2)
        const day = this.padLeft(date.getDate(), 2)
    
        const random = Math.random().toString().substr(-8)
    
        const ext = path.extname(image.name)
        const name = path.basename(image.name, ext)
    
        const pathname = this.config.format.toLowerCase()
          .replace(/{timestamp}/g, timestamp)
          .replace(/{yyyy}/g, year)
          .replace(/{mm}/g, month)
          .replace(/{dd}/g, day)
          .replace(/{name}/g, name)
          .replace(/{ext}/g, ext)
          .replace(/{random}/g, random)
          .replace(/{uuid}/g, uuid())
    
        const filename = path.join(this.localPath, pathname)
        const pathObj = path.parse(filename)
    
        return fs.mkdirs(pathObj.dir).then(() => this.unique(pathObj))
    }

    delete() {
        // TODO: Find a way to get the blob SHA of the target file
        return Promise.reject("Not implemented");
    }

    exists(filename, targetDir) {
        const filepath = path.join(targetDir || this.getTargetDir(), filename);

        return request(this.getUrl(filepath))
            .then(res => res.statusCode === 200)
            .catch(() => false);
    }

    read(options) {
        // Not needed because absolute URLS are already used to link to the images
    }

    save(file, targetDir) {
        const {baseUrl, branch, repo, user} = this.config;
        const dir = targetDir || this.getTargetDir();

        return Promise.join(this.getFilename(file), readFile(file.path, "base64"), (filename, data) => {
            return this.client.repos.createFile({
                owner: user,
                repo: repo,
                branch: branch,
                message: "Add new image",
                path: this.getFilepath(filename),
                content: data
            });
        })
        .then(res => {
            let url = res.data.content.download_url;
            if(isUrl(baseUrl)) {
                url = this.getUrl(res.data.content.path);
            }
            return url;
        })
        .catch(Promise.reject);
    }

    serve() {
        return (req, res, next) => {
            next();
        };
    }

    getUrl(filename) {
        const {baseUrl, branch, repo, user} = this.config;
        let url = isUrl(baseUrl) ? baseUrl : `https://raw.githubusercontent.com/${user}/${repo}/${branch}`;
        url = buildUrl(url, {path: this.getFilepath(filename)});

        return url;
    }

    getFilepath(filename) {
        return removeLeadingSlash(path.join(this.config.destination, filename));
    }

    padLeft (num, length) {
        const prefix = new Array(length).join('0')
        return (prefix + num).substr(-length)
    }

    /**
     * ensure filename is unique
     */
    unique (pathObj, i) {
        const originalName = pathObj.name

        if (i !== undefined) {
        pathObj.name += '-' + i
        pathObj.base = pathObj.name + pathObj.ext
        }

        return this.exists(pathObj.base, pathObj.dir).then(exists => {
        if (!exists) return path.format(pathObj)
        pathObj.name = originalName
        return this.unique(pathObj, i + 1 || 1)
        })
    }
}

module.exports = GitHubStorage;