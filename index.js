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

    read(options) {}

    save(file, targetDir) {
        const config = this.config;
        const dir = targetDir || this.getTargetDir();
        return Promise.join(this.getUniqueFileName(file, dir), Promise.promisify(fs.readFile)(file.path, "base64"), (filename, data) => {
            return this.client.repos.createFile({
                owner: config.user,
                repo: config.repo,
                branch: config.branch,
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
        const config = this.config;
        let url = "https://raw.githubusercontent.com/";
        url += `${config.user}/${config.repo}/`;
        url += `${config.branch}/`;
        url += `${this.getFilepath(filename)}`;
        return url;
    }

    getFilepath(filename) {
        return removeLeadingSlash(path.join(this.config.destination, filename));
    }
}

module.exports = GitHubStorage;