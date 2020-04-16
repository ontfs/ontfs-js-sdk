const MESSAGE_VERSION = "1"

const MSG_ERROR_CODE_NONE = 0     // success
const MSG_ERROR_CODE_PARAM_INVALID = 50001 // param invalid
const MSG_ERROR_CODE_DOWNLOAD_REFUSED = 50002 // download refused
const MSG_ERROR_CODE_FILE_NOT_EXIST = 50003 // file not found
const MSG_ERROR_CODE_TOO_MANY_TASKS = 50004 // too many tasks
const MSG_ERROR_CODE_FILE_UNITPRICE_ERROR = 50005 // file unitprice error
const MSG_ERROR_CODE_TASK_EXIST = 50006 // file task exist error
const MSG_ERROR_INTERNAL_ERROR = 50007 // internal err
const MSG_ERROR_CODE_FILE_NO_TX = 50008 // no tx info in file msg
const MSG_ERROR_CODE_FILE_TX_HEIGHT = 50009 // wait tx height error
const MSG_ERROR_CODE_FILE_GET_FILEINFO = 50010 // get fileInfo error
const MSG_ERROR_CODE_FILE_ACCOUNT_NO_MATCH = 50011 // account no match
const MSG_ERROR_CODE_FILE_BLOCKCOUNT_NO_MATCH = 50012 // block count no match
const MSG_ERROR_CODE_FILE_OWNER_NO_MATCH = 50013 // file owner no match
const MSG_ERROR_CODE_FILE_NO_PAYINFO = 50014 // no pay info
const MSG_ERROR_CODE_FILE_NODE_NO_SERVICE = 50015 // node is not on service
const MSG_ERROR_CODE_FILE_BLOCKSROOT_NO_MATCH = 50016 // file blocks root not match

const FILE_OP_NONE = 0    // no operation
const FILE_OP_UPLOAD_ASK = 1000 // client ask servers if available for upload
const FILE_OP_UPLOAD_ACK = 1001 // servers acknowledge upload ask from client
const FILE_OP_UPLOAD_RDY = 1002 // client is ready('rdy' as abbr.) for upload
const FILE_OP_UPLOAD_RDY_ACK = 1003 // server is acknowledge ready from client

const FILE_OP_UPLOAD_PAUSE = 1004 // client send to chosen servers to pause upload
const FILE_OP_UPLOAD_RESUME = 1005 // client send to chosen servers to resume upload
const FILE_OP_UPLOAD_CANCEL = 1006 // client cancel the upload session

const FILE_OP_DOWNLOAD_ASK = 2000 // client ask download file from servers
const FILE_OP_DOWNLOAD_ACK = 2001 // servers send ack to client
const FILE_OP_DOWNLOAD = 2003 // client send download msg to chosen servers
const FILE_OP_DOWNLOAD_OK = 2004 // client send download msg to chosen server
const FILE_OP_DOWNLOAD_CANCEL = 2005 // client send download cancel to chosen servers

const FILE_OP_DELETE = 4000 // client delete file of servers
const FILE_OP_DELETE_ACK = 4001 // server delete file ack


const BLOCK_FLIGHTS_OP_PUSH = 1 // client push block flights to server
const BLOCK_FLIGHTS_OP_PUSH_ACK = 2 // server ack for push block flights
const BLOCK_FLIGHTS_OP_GET = 3 // client get block flights from server
const BLOCK_FLIGHTS_OP_RESPONSE = 4 // server response for get blocks


const MSG_TYPE_NONE = "none"
const MSG_TYPE_BLOCK_FLIGHTS = "blockflights"
const MSG_TYPE_FILE = "file"
const MSG_TYPE_PAYMENT = "payment"

module.exports = {
    MESSAGE_VERSION,
    MSG_ERROR_CODE_NONE,
    MSG_ERROR_CODE_PARAM_INVALID,
    MSG_ERROR_CODE_DOWNLOAD_REFUSED,
    MSG_ERROR_CODE_FILE_NOT_EXIST,
    MSG_ERROR_CODE_TOO_MANY_TASKS,
    MSG_ERROR_CODE_FILE_UNITPRICE_ERROR,
    MSG_ERROR_CODE_TASK_EXIST,
    MSG_ERROR_INTERNAL_ERROR,
    MSG_ERROR_CODE_FILE_NO_TX,
    MSG_ERROR_CODE_FILE_TX_HEIGHT,
    MSG_ERROR_CODE_FILE_GET_FILEINFO,
    MSG_ERROR_CODE_FILE_ACCOUNT_NO_MATCH,
    MSG_ERROR_CODE_FILE_BLOCKCOUNT_NO_MATCH,
    MSG_ERROR_CODE_FILE_OWNER_NO_MATCH,
    MSG_ERROR_CODE_FILE_NO_PAYINFO,
    MSG_ERROR_CODE_FILE_NODE_NO_SERVICE,
    MSG_ERROR_CODE_FILE_BLOCKSROOT_NO_MATCH,
    BLOCK_FLIGHTS_OP_PUSH,
    BLOCK_FLIGHTS_OP_PUSH_ACK,
    BLOCK_FLIGHTS_OP_GET,
    BLOCK_FLIGHTS_OP_RESPONSE,
    FILE_OP_NONE,
    FILE_OP_UPLOAD_ASK,
    FILE_OP_UPLOAD_ACK,
    FILE_OP_UPLOAD_RDY,
    FILE_OP_UPLOAD_RDY_ACK,
    FILE_OP_UPLOAD_PAUSE,
    FILE_OP_UPLOAD_RESUME,
    FILE_OP_UPLOAD_CANCEL,
    FILE_OP_DOWNLOAD_ASK,
    FILE_OP_DOWNLOAD_ACK,
    FILE_OP_DOWNLOAD,
    FILE_OP_DOWNLOAD_OK,
    FILE_OP_DOWNLOAD_CANCEL,
    FILE_OP_DELETE,
    FILE_OP_DELETE_ACK, MSG_TYPE_NONE,
    MSG_TYPE_BLOCK_FLIGHTS,
    MSG_TYPE_FILE,
    MSG_TYPE_PAYMENT,


}