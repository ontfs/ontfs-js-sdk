const { num2hexstring, bool2VarByte, str2hexstr, StringReader, hexstr2str } = require("ontology-ts-sdk").utils
const { hex2sha256 } = require("./crypto")
const PREFIX_VERSION = 1
const PASSWORD_MAX_LEN = 16
const CRYPT_SALT_LEN = 16
const CRYPTO_HASH_LEN = 32
const REVERSED_LEN = 4
const PREFIX_LEN = 158

/**
 *  Prefix struct for File
 *
 * @class FilePrefix
 */
class FilePrefix {
    constructor(
        _version,
        _encrypt,
        _encryptPwdLen,
        _encryptPwd,
        _encryptSalt,
        _encryptHash,
        _fileSize,
        _reserved,
    ) {
        this.version = _version
        this.encrypt = _encrypt
        this.encryptPwdLen = _encryptPwdLen
        this.encryptPwd = _encryptPwd
        this.encryptSalt = _encryptSalt
        this.encryptHash = _encryptHash
        this.fileSize = _fileSize
        this.reserved = _reserved
    }
    /**
     * convert encrypted password to hex string
     *
     * @returns {string}
     * @memberof FilePrefix
     */
    encryptPwdToHex() {
        const pwd = this.encryptPwd.substr(0, this.encryptPwdLen)
        const pwdHex = str2hexstr(pwd)
        let remainZero = ''
        if (this.encryptPwdLen < 16) {
            remainZero = num2hexstring(0, 16 - this.encryptPwdLen, true)
        }
        return pwdHex + remainZero
    }

    /**
     * get password hash string
     *
     * @returns {string}
     * @memberof FilePrefix
     */
    getPasswordHash() {
        if (!this.encryptPwd || !this.encryptPwd.length) {
            return num2hexstring(0, CRYPTO_HASH_LEN, true)
        }
        const pwdHex = str2hexstr(this.encryptPwd)
        let zero16Bstr = num2hexstring(0, 16, true)
        let encryptSaltStr = this.encryptSalt ? this.encryptSalt : zero16Bstr
        const encryptData = pwdHex + encryptSaltStr
        return hex2sha256(encryptData)
    }

    /**
     * get file prefix object serialized string
     *
     * @returns {string}
     * @memberof FilePrefix
     */
    string() {
        this.version = this.version || PREFIX_VERSION
        if (this.encrypt) {
            this.encryptHash = this.getPasswordHash()
        } else {
            this.encryptHash = num2hexstring(0, CRYPTO_HASH_LEN, true)
        }
        let zero16Bstr = num2hexstring(0, 16, true)
        let zero4Bstr = num2hexstring(0, 4, true)
        let encryptSaltStr = this.encryptSalt ? this.encryptSalt : zero16Bstr
        let reservedStr = this.reserved ? this.reserved : zero4Bstr

        return num2hexstring(this.version, 1, true) +
            bool2VarByte(this.encrypt) +
            num2hexstring(this.encryptPwdLen, 1, true) +
            zero16Bstr + encryptSaltStr +
            this.encryptHash +
            num2hexstring(this.fileSize, 8, true) + reservedStr
    }

    /**
     * parse a hexstr to FilePrefix
     *
     * @param {string} hexStr
     * @memberof FilePrefix
     */
    fromString(hexStr) {
        let sr = new StringReader(hexStr)
        this.version = sr.readUint8();
        this.encrypt = sr.readBoolean()
        this.encryptPwdLen = sr.readUint8()
        this.encryptPwd = hexstr2str(sr.read(PASSWORD_MAX_LEN))
        this.encryptPwd = this.encryptPwd.replace(/\0/g, '')
        this.encryptSalt = hexstr2str(sr.read(CRYPT_SALT_LEN))
        this.encryptHash = hexstr2str(sr.read(CRYPTO_HASH_LEN))
        this.fileSize = sr.readUint64()
        this.reserved = hexstr2str(sr.read(REVERSED_LEN))
    }

    /**
     * print detail
     *
     * @memberof FilePrefix
     */
    print() {
        console.log(`this.version: ${this.version}\n,
        this.fileSize: ${this.fileSize}\n,
        this.encryptPwd: ${this.encryptPwd}\n,
        this.encryptPwdLen: ${this.encryptPwdLen}\n,
        this.encryptSalt: ${this.encryptSalt}\n,
        this.encryptHash:${this.encryptHash}\n`)
    }

    /**
     * verify a password 
     *
     * @param {string} password
     * @returns {boolean}
     * @memberof FilePrefix
     */
    verifyEncryptPassword(password) {
        const hash = hex2sha256(str2hexstr(password) + str2hexstr(this.encryptSalt))
        return hash == str2hexstr(this.encryptHash)
    }
}

/**
 * parse a file prefix from hex string and check if the file is encrypted
 *
 * @param {string} prefixHex
 * @returns {boolean}
 */
const getPrefixEncrypted = (prefixHex) => {
    const prefix = new FilePrefix()
    prefix.fromString(prefixHex)
    return prefix.encrypt
}

module.exports = {
    FilePrefix,
    PREFIX_VERSION,
    PREFIX_LEN,
    CRYPT_SALT_LEN,
    getPrefixEncrypted
} 