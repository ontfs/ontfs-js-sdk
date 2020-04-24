module.exports = {
    password: {
        name: "password",
        desc: 'password',
        type: 'string',
    },
    label: {
        name: "label",
        desc: 'account label',
        type: 'string',
        default: "label",
    },
    config: {
        type: 'string',
        name: "config",
        nesc: "use `<filename>` to specifies the config file to initialize ont-fs-sdk daemon " +
            "or start ont-fs-sdk service.",
    },
    rpcport: {
        type: 'number',
        name: "rpcport",
        desc: "rpc port",
        default: 21336,
    },

    logLevel: {
        type: 'string',
        name: "loglevel",
        desc: "set the log level to `<level>` (0~6). 0:Trace 1:Debug 2:Info 3:Warn 4:Error 5:Fatal 6:MaxLevel",
    },
    clean: {
        type: 'boolean',
        name: "clean",
        desc: "disable log output to stdout, do not affect with log file",
    },
    fsRepoRoot: {
        type: 'string',
        name: "fsRepoRoot",
        desc: "",
        default: "./Sdk/OntFs",
    },
    fsFileRoot: {
        type: 'string',
        name: "fsFileRoot",
        desc: "",
        default: "./Sdk/Download",
    },
    dbPath: {
        type: 'string',
        name: "dbPath",
        desc: "db path",
        default: "./Sdk/DB",
    },

    walletAddr: {
        type: 'string',
        name: "walletAddr",
        desc: "wallet address",
    },
    nodeAddr: {
        type: 'string',
        name: "nodeAddr",
        desc: "node address",
    },
    ////////////////File Setting///////////////////
    fileHash: {
        type: 'string',
        name: "fileHash",
        desc: "`<hash>` of file",
    },
    hash: {
        type: 'string',
        name: "hash",
        desc: "`<hash>` of files, example: --hash hash1 --hash hash2",
    },
    filePath: {
        type: 'string',
        name: "filePath",
        desc: "`<path>` of file to be uploaded",
    },
    outFilePath: {
        type: 'string',
        name: "outFilePath",
        desc: "`<path>` of file to be download/decrypt",
    },
    fileDesc: {
        type: 'string',
        name: "desc",
        desc: "file description",
    },
    timeExpired: {
        type: 'string',
        name: "timeExpired",
        desc: "expired time, example format : \"2020-11-12 14:20:53\"",
    },
    copyNum: {
        type: 'number',
        name: "copyNum",
        desc: "copy Number of file storage",
        default: 3,
    },
    pdpInterval: {
        type: 'number',
        name: "pdpInterval",
        desc: "file pdp interval",
        default: 4 * 60 * 60,
    },
    encrypt: {
        type: 'boolean',
        name: "encrypt",
        desc: "encrypt file or not, default: false",
        default: false,
    },
    encryptPwd: {
        type: 'string',
        name: "encryptPwd",
        desc: "encrypt file password",
        default: ''
    },
    firstPdp: {
        type: 'boolean',
        name: "firstPdp",
        desc: "ontFs server need commit first pdp or not, if not, client can download file earlier, default: true",
        default: true,
    },
    storeType: {
        type: 'number',
        name: "storeType",
        desc: "store type, 0 means space tenant model, 1 means file model",
        default: 1,
    },
    link: {
        type: 'string',
        name: "link",
        desc: "`<link>` of file",
    },
    inorder: {
        type: 'boolean',
        name: "inorder",
        desc: "download file blocks inorder, only support true",
    },
    decryptPwd: {
        type: 'string',
        name: "decryptPwd",
        desc: "file decrypt password",
    },
    maxPeerCnt: {
        type: 'number',
        name: "maxPeerCnt",
        desc: "max fs nodes to download",
        default: 10,
    },
    url: {
        type: 'string',
        name: "url",
        desc: "file search url",
    },
    addTime: {
        type: 'number',
        name: "addTime",
        desc: "add file time, Units are seconds",
    },
    offset: {
        type: 'number',
        name: "offset",
        desc: "data column offset",
        default: 0,
    },
    taskType: {
        type: 'number',
        name: "taskType",
        desc: "task type",
        default: 0,
    },
    taskId: {
        type: 'string',
        name: "taskId",
        desc: "task id",
    },
    taskIds: {
        type: 'string',
        name: "taskIds",
        desc: "`<taskIds>` of files, example: --taskIds id1 --taskIds id2",
    },

    //Node setting
    limit: {
        type: 'number',
        name: "limit",
        desc: "data column limit",
        default: 50,
    },

    //Space setting
    spaceVolume: {
        type: 'string',
        name: "spaceVolume",
        desc: "space Volume unit kb, example 10GB=10*1024*1024, support B、kB、MB、GB、TB、PB、EB",
    },
    spaceCopyNum: {
        type: 'number',
        name: "spaceCopyNum",
        desc: "copy Number of file storage",
        default: 3,
    },
    spaceTimeExpired: {
        type: 'string',
        name: "spaceTimeExpired",
        desc: "expired time, example format : \"2020-11-12 14:20:53\"",
    },
}