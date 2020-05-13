
const DefaultPassportExpire = 9 //block count. passport expire for GetFileHashList
const DefaultNodeMinVolume = 1024 * 1024 //kb. min total volume with fsNode
const DefaultNodePerKbPledge = 1           //fsNode's pledge for participant
const DefaultMinDownLoadFee = 1 //min download fee for single task*
const DefaultGasPerKbForRead = 1 //cost for ontfs-sdk read from fsNode*
const DefaultGasPerKbForSaveWithFile = 1 //cost for ontfs-sdk save from fsNode*
const DefaultGasPerKbForSaveWithSpace = 1 //cost for ontfs-sdk save from fsNode*
const DefaultChallengeInterval = 4 * 60 * 60
const DefaultPdpHeightIV = 8   //pdp challenge height IV
const DefaultPerBlockSize = 256 //kb.
const DefaultPdpBlockNum = 32
const CHUNK_SIZE = DefaultPerBlockSize * 1024
const MAX_UPLOAD_FILE_SIZE = 32 * 1024 * 1024 * 1024
const PROTO_NODE_FILE_HASH_LEN = 46 // proto node file hash length
const RAW_NODE_FILE_HASH_LEN = 49 // raw node file hash length
const NEW_NODE_FILE_HASH_LEN = 48
const FILE_LINK_PREFIX = "ontfs://" // ontfs link header
const FILE_LINK_HASH_KEY = "hash"     // hash
const FILE_LINK_NAME_KEY = "name"     // filename
const FILE_LINK_SIZE_KEY = "size"     // size
const FILE_LINK_BLOCKNUM_KEY = "blocknum" // block count
const FILE_LINK_OWNER_KEY = "owner"    // owner
const P2P_REQUEST_WAIT_REPLY_TIMEOUT = 20 // 30s
const WAIT_FOR_GENERATEBLOCK_TIMEOUT = 10 // wait for generate timeout
const WAIT_FOR_TX_COMFIRME_TIMEOUT = 10 // wait for tx confirmed timeout
const DEFAULT_FS_NODES_LIST = 64 // default fs nodes list
const MAX_COPY_NUM = 64 // max copy num limit
const PER_SEND_BLOCK_SIZE = 1024 * 128 //network.PER_SEND_BLOCK_SIZE
const UPLOAD_WAIT_PDP_RECIRDS_INTERVAL = 6
const MAX_UPLOAD_WAIT_PDP_RECORDS_TIMEWAIT = 60
const DOWNLOAD_STREAM_WRITE_TIMEOUT = 2
const MAX_REQ_BLOCK_COUNT = 32 // max block count when request for download flights                                                                    // download stream timeout 128KB/2s 64KB/s 	// share blocks min speed 100 KB/S 	// timeout = DataSize / 100 KB/s = 81s
const DOWNLOAD_BLOCKFLIGHTS_TIMEOUT = (CHUNK_SIZE / PER_SEND_BLOCK_SIZE) * DOWNLOAD_STREAM_WRITE_TIMEOUT * MAX_REQ_BLOCK_COUNT // download block flights time out,  Notice: DOWNLOAD_BLOCKFLIGHTS_TIMEOUT <= DOWNLOAD_FILE_TIMEOUT / 2, 128s
const DOWNLOAD_FILE_TIMEOUT = DOWNLOAD_BLOCKFLIGHTS_TIMEOUT                                                            // download file time out, 128s 	// max p2p request timeout
const PROTO_NODE_PREFIX = "Qm"
const RAW_NODE_PREFIX = "zb"
const MAX_NETWORK_REQUEST_RETRY = 4  // max network request retry
const MAX_SEND_BLOCK_COUNT = 16 // max send block count for send flights
const ONTFS_CONTRACT_ADDRESS = "0b00000000000000000000000000000000000000"
module.exports = {
    DefaultPassportExpire,
    DefaultNodeMinVolume,
    DefaultNodePerKbPledge,
    DefaultMinDownLoadFee,
    DefaultGasPerKbForRead,
    DefaultGasPerKbForSaveWithFile,
    DefaultGasPerKbForSaveWithSpace,
    DefaultChallengeInterval,
    DefaultPdpHeightIV,
    DefaultPerBlockSize,
    DefaultPdpBlockNum,
    CHUNK_SIZE,
    MAX_UPLOAD_FILE_SIZE,
    PROTO_NODE_FILE_HASH_LEN,
    RAW_NODE_FILE_HASH_LEN,
    NEW_NODE_FILE_HASH_LEN,
    FILE_LINK_PREFIX,
    FILE_LINK_HASH_KEY,
    FILE_LINK_NAME_KEY,
    FILE_LINK_SIZE_KEY,
    FILE_LINK_BLOCKNUM_KEY,
    FILE_LINK_OWNER_KEY,
    P2P_REQUEST_WAIT_REPLY_TIMEOUT,
    WAIT_FOR_GENERATEBLOCK_TIMEOUT,
    WAIT_FOR_TX_COMFIRME_TIMEOUT,
    DEFAULT_FS_NODES_LIST,
    MAX_COPY_NUM,
    PER_SEND_BLOCK_SIZE,
    UPLOAD_WAIT_PDP_RECIRDS_INTERVAL,
    MAX_UPLOAD_WAIT_PDP_RECORDS_TIMEWAIT,
    DOWNLOAD_STREAM_WRITE_TIMEOUT,
    DOWNLOAD_BLOCKFLIGHTS_TIMEOUT,
    DOWNLOAD_FILE_TIMEOUT,
    PROTO_NODE_PREFIX,
    RAW_NODE_PREFIX,
    MAX_NETWORK_REQUEST_RETRY,
    MAX_REQ_BLOCK_COUNT,
    MAX_SEND_BLOCK_COUNT,
    ONTFS_CONTRACT_ADDRESS
}
