"use strict";

const Promise = require("bluebird");
const BaseStorage = require("ghost-storage-base");
const GitHub = require("github");
const fs = require("fs");
const path = require("path");

const buildUrl = require("build-url");
const isUrl = require("is-url");
const readFile = Promise.promisify(fs.readFile);
const removeLeadingSlash = require("remove-leading-slash");
const request = Promise.promisify(require("request"));
const https = require("https");

class GitHubStorage extends BaseStorage {
    constructor(config) {
        super();

        this.client = new GitHub();
        this.config = config;
        config.branch = config.branch || "master";
        config.destination = config.destination || "";

        this.client.authenticate({
            type: config.type,
            username: config.user,
            password: config.password,
            token: config.token,
        });
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

    // 181229 Fixed an error that can not read favicon from ghost 2.9.x
    read(options) {
        options = options || {};
        options.path = (options.path || '').replace(/\/$|\\$/, '');
        var targetPath = this.storagePath ? path.join(this.storagePath, options.path) : options.path;

        return new Promise(function (resolve, reject) {
            https.get(targetPath, function (res) {
                var data = [];
                res.on('data', function (chunk) {
                    data.push(chunk);
                }).on('end', function () {
                    resolve(Buffer.concat(data))
                });
            });
        });
    }

    save(file, targetDir) {
        const {branch, repo, user} = this.config;
        const dir = targetDir || this.getTargetDir();

        return Promise.join(this.getUniqueFileName(file, dir), readFile(file.path, "base64"), (filename, data) => {
            return this.client.repos.createFile({
                owner: user,
                repo: repo,
                branch: branch,
                message: "Add new image",
                path: this.getFilepath(filename),
                content: data
            });
        })
            .then(res => res.data.content.download_url)
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
        // 181229 Fixed resize image path error from ghost 2.9.x.
        const filePath = path.join(this.config.destination, filename).replace(/\\/g, '/')
        return removeLeadingSlash(filePath);
    }
}

module.exports = GitHubStorage;