"use strict";

/**
 * IdcTxDigest library entry point
 * @constructor
 */
let IdcTxDigest = function() {

  /**
  * Utility method to convert byte array to hexa string
  * @param {array} byteArray - a byte array
  * @returns {string} the hexadecimal string representation of the array value
  */
 function _toHex(byteArray) {
    return Array.from(byteArray, function (byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('').toUpperCase();
  }

  /**
  * Computes the digest of a transaction data
  * @param {string or object} json - the JSON transaction data (as string or json object), which comply to the IdCloud transaction data format
  * @param {boolean} legacy - If true, both legacy and new JSON format are supported. If false only the new format is accepted.
  * @returns {Promise} a Promise which may
  *   - resolve with an object containing 2 fields:
  *     -- `digest` is the computed digest in a UInt8Array
  *     -- `tlvs` is the array of computed TLV values, for debugging
  *   - reject, the returned value is then the error message
  */
  async function _digest(json, legacy) {

    const MAX_ENTRIES = 10;
    const MAX_SIZE = 255;
    let tlvsConcat = [];
    let tlvs = [];
    let keys = [];
    var obj = typeof json === "string" ? JSON.parse(json) : json;

    function addKeyVAlue(index, key, value) {
      if (index > MAX_ENTRIES) {
        throw new Error("Too many entries (max is " + MAX_ENTRIES + ")");
      }
      if (!key || typeof key !== 'string' ) {
        throw new Error("Invalid key: " + JSON.stringify(key));
      }
      if (keys.includes(key)) {
        throw new Error("Duplicate key: " + key);
      }
      if (!value || typeof value !== 'string' ) {
        throw new Error("Invalid value: " + JSON.stringify(value));
      }
      let kv = key + ":" + value;
      if (kv.length > MAX_SIZE) {
        throw new Error("Key+value too long (> " + MAX_SIZE + "): " + name);
      }
      keys.push(key);
      let tlv = [0xDF, (0x70 + index), kv.length];
      for (let i = 0; i < kv.length; ++i) {
        tlv.push(kv.charCodeAt(i));
      }
      tlvs.push(tlv);
      tlvsConcat = tlvsConcat.concat(tlv);
    }

    if (Array.isArray(obj) && obj !== null) {
      // NEW FORMAT: Array of key value pairs
      obj.forEach((val, idx) =>  {
        if ((typeof val !== 'object') || (Object.keys(val).length != 1)) {
          throw new Error("Invalid entry: " + JSON.stringify(val));
        }
        let key = Object.keys(val)[0];
        addKeyVAlue(idx+1, key, val[key]);
      });
    } else if (legacy && (typeof obj === 'object') && (obj !== null)) {
      // LEGACY FORMAT: Key value pairs
      let idx = 1;
      for (let [key, value] of Object.entries(obj))  {
        addKeyVAlue(idx++, key, value);
      }
    } else {
      throw new Error("Invalid input format");
    }
    if (keys.length == 0) {
      throw new Error("Empty list");
    }
    // Digest
    return crypto.subtle.digest("SHA-256",
          new Uint8Array(tlvsConcat)).then( (hash) => {
      return {
        tlvs: tlvs,
        //digest: Array.from(new Uint8Array(hash))
        digest: new Uint8Array(hash)
      }
    })
    .catch((err) => {
      throw new Error("Digest error: " + err);
    });
  }

  return {
    digest: _digest,
    toHex: _toHex
  };
};
