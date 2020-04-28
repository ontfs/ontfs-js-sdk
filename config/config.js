
const FSType = {
    FS_FILESTORE: 0,
    FS_BLOCKSTORE: 1
}


class Config {
    constructor(
        _logLevel,
        _DisableStdLog,
        _RpcPort,
        _DBPath,
        _FsRepoRoot,
        _FsFileRoot,
        _FsType
    ) {
        this.logLevel = _logLevel
        this.disableStdLog = _DisableStdLog
        this.rpcPort = _RpcPort
        this.dbPath = _DBPath
        this.fsRepoRoot = _FsRepoRoot
        this.fsFileRoot = _FsFileRoot
        this.fsType = _FsType
    }
}

var DaemonConfig

/**
 * generate a default config
 *
 * @returns {Config}
 */
const defaultConfig = () => {
    var cfg = new Config()
    cfg.logLevel = 1
    cfg.rpcPort = 21336
    cfg.dbPath = "./DB/dsp"
    cfg.fsRepoRoot = "./FS"
    cfg.fsFileRoot = "/"
    cfg.fsType = FSType.FS_FILESTORE
    return cfg
}


class SdkConfig {
    constructor(
        _walletPath,
        _walletPwd,
        _gasPrice,
        _gasLimit,
        _pdpVersion,
        _chainRpcAddr,
        _blockConfirm,
        _p2pProtocol,
        _p2pListenAddr,
        _p2pNetworkId
    ) {
        this.walletPath = _walletPath
        this.walletPwd = _walletPwd
        this.gasPrice = _gasPrice
        this.gasLimit = _gasLimit
        this.pdpVersion = _pdpVersion
        this.chainRpcAddr = _chainRpcAddr
        this.blockConfirm = _blockConfirm
        this.p2pProtocol = _p2pProtocol
        this.p2pListenAddr = _p2pListenAddr
        this.p2pNetworkId = _p2pNetworkId
    }
}


module.exports = {
    FSType,
    DaemonConfig,
    Config,
    SdkConfig,
    defaultConfig,
}