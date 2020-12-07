# IdCloud Transaction Data Digest

Javascript library to compute the digest of a JSON transaction data using the IdCloud transaction digest algorithm.

Usage:

```javascript
let txDigest = new IdcTxDigest();
txDigest.digest(`[
  { "amount" : "123" },
  { "beneficiary" : "John Smith" }
]`)
.then(res => {
  console.log("Digest is " + txDigest.toHex(res.digest))
})
.catch(err => {
  console.log("Error: " + err)
})
```

To allow processing of both the legacy and the new JSON format a second attribute must be set to true:

```javascript
txDigest.digest(`{
  "amount" : "123",
  "beneficiary" : "John Smith"
}`, true)
```

You can [test it here](https://opotonniee.github.io/idc-tx-digest/test/)
