"use strict";

let out = $("#out");
let txDigest = new IdcTxDigest();

async function doDigest() {
  try {
    out.html("");
    let json = $("textarea").val();
    let legacy = $("#legacy").is(":checked");

    txDigest.digest(json, legacy)
    .then( (res) => {
      out.append("<p>TLVs:</p>");
      $.each(res.tlvs, (idx, tlv) => {
        out.append("<div class='tlv'> TLV" + idx + ": " + txDigest.toHex(tlv) + "</div>");
      });
      out.append("<p>Digest: <strong>" + txDigest.toHex(res.digest) + "<strong></p>");
    })
    .catch((err) => {
      out.append("<p>ERROR: " + err + "</p>");
    });

  } catch (err) {
    out.append("<p>EXCEPTION: " + err + "</p>");
  }
}

let examples = {
  "new format": [`
  [
    { "amount" : "123" },
    { "beneficiary" : "John Smith" }
  ]
  `, "51E365925D1571641FD35B4502D4603A326B8EA6CB7DF02FAE38B3ACFDA2E3AA"],
  "legacy format": [`
  {
    "amount" : "123",
    "beneficiary" : "John Smith"
  }
  `, "51E365925D1571641FD35B4502D4603A326B8EA6CB7DF02FAE38B3ACFDA2E3AA"],
  "invalid: undefined": [`
  `, "SyntaxError"],
  "invalid: bad JSON": [`
    this is not JSON
  `, "SyntaxError"],
  "invalid: empty name": [`
  {
    "" : "123"
  }
  `, "(SyntaxError|Invalid )"],
  "invalid: empty value": [`
  {
    "amount" : ""
  }
  `, "(SyntaxError|Invalid )"],
  "invalid: empty array": [`
  []
  `, "Empty"],
  "invalid: empty array entry": [`
  [{}]
  `, "Invalid"],
  "invalid: empty object": [`
  {}
  `, "(Empty|Invalid )"],
  "invalid: neither object nor array": [`
    "amount"
  `, "Invalid"],
  "invalid: neither object nor array": [`
    123
  `, "Invalid"],
  "invalid: neither object nor array": [`
    true
  `, "Invalid"],
  "invalid: invalid object": [`
  {
    "amount" : "123",
    "beneficiary"
  }
  `, "Invalid"],
  "invalid: invalid object": [`
  {
    true
  }
  `, "Invalid"],
  "invalid: invalid object": [`
  {
    123
  }
  `, "Invalid"],
  "invalid: invalid object": [`
  {
    "array": [ "name", "value" ]
  }
  `, "Invalid"],
  "invalid: invalid array": [`
  [
    { "amount" : "123" },
    "beneficiary"
  ]
  `, "Invalid"],
  "invalid: invalid array": [`
  [
    true
  ]
  `, "Invalid"],
  "invalid: entry too long": [`
  [
    { "amount" : "11111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111" }
  ]
  `, "too long"],
  "invalid: entry too many entries": [`
  [
    { "one" : "1" },
    { "two" : "2" },
    { "three" : "3" },
    { "four" : "4" },
    { "five" : "5" },
    { "six" : "6" },
    { "seven" : "7" },
    { "eigth" : "8" },
    { "nine" : "9" },
    { "ten" : "10" },
    { "eleven" : "11" },
    { "twelve" : "11" }
  ]
  `, "Too many entries"],
  "invalid: duplicate key": [`
  [
    { "one" : "1" },
    { "two" : "2" },
    { "three" : "3" },
    { "one" : "4" }
  ]
  `, "Duplicate"],
}

function testAll() {
  let
    nErr = 0,
    nOk = 0;
  const TOTAL = Object.keys(examples).length;
  out.html("");
  let legacy = $("#legacy").is(":checked");

  function total() {
    if (nErr + nOk >= TOTAL) {
      out.append("<p>Failed: " + nErr + "</p>");
      out.append("<p>Sucess: " + nOk + "</p>");
    }
  }
  function isErr(name, msg) {
    out.append("<p>" + name + ": " + msg + "</p>");
    nErr++;
    total();
  }
  function isOk() {
    nOk++;
    total();
  }

  $.each(examples, (name, value) => {
    try {
      txDigest.digest(value[0], legacy)
      .then((res)=>{
        if (name.startsWith("invalid")) {
          isErr(name, "UNEXPECTED DIGEST SUCCESS!");
        } else if (txDigest.toHex(res.digest) != value[1]) {
          isErr(name, "DOES NOT MATCH");
        } else {
          isOk();
        }
      })
      .catch((err) => {
        if (!name.startsWith("invalid")) {
          isErr(name, "UNEXPECTED ERROR (" + err + ")");
        } else if (!err.toString().match(value[1])){
          isErr(name, "UNEXPECTED ERROR STATUS (" + err + ")");
        } else {
          isOk();
        }
      });
    } catch (err) {
      isErr(name, "[Exception] " + err);
    }
  });
}

let exselect = $("#examples");
$.each(examples, (name, value) => {
  exselect.append("<option value='"+ name +"'>" + name + "</option>")
});
exselect.change(() => {
  $("textarea").val(examples[exselect.val()][0]);
});
exselect.change();

$("#doDigest").click(doDigest);
$("#testAll").click(testAll);
