"use strict";

const BaseStorage = require("ghost-storage-base");
const fs = require("fs");
const GitHub = require("github");
const path = require("path");
const Promise = require("bluebird");
const removeLeadingSlash = require("remove-leading-slash");
const request = Promise.promisify(require("request"));

class GitHubStorage extends BaseStorage {
    constructor(config) {
        super();

        this.client = new GitHub();
        this.config = config;

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

    read(options) {}

    save(file, targetDir) {
        const dir = targetDir || this.getTargetDir();
        return Promise.join(this.getUniqueFileName(file, dir), Promise.promisify(fs.readFile)(file.path, "base64"), (filename, data) => {
            return this.client.repos.createFile({
                owner: this.config.user,
                repo: this.config.repo,
                branch: this.config.branch || "master",
                message: "Add new image",
                path: removeLeadingSlash(filename),
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
        const config = this.config;
        return `https://raw.githubusercontent.com/${config.user}/${config.repo}/${config.branch || "master"}/${removeLeadingSlash(filename)}`;
    }
}

module.exports = GitHubStorage;
