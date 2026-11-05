const test = require("node:test");
const assert = require("node:assert/strict");
const { hmacSignature } = require("../src/services/straumur");

// Example from https://docs.straumur.is/webhooks/payment/hmac-validation
test("Straumur payment HMAC matches the documented example", () => {
  const signature = hmacSignature(
    {
      checkoutReference: "9eh9g1loq8ygdmtj1kw47dbogkr2qyijyen53hnglpx2eq4213",
      payfacReference: "OOJWITWVQV42PSE8",
      merchantReference: "89807267361535",
      amount: "100000",
      currency: "ISK",
      reason: "383528:1111:03/2030",
      success: "true",
    },
    "42355b343e1a8879b54906abe30e25c0f4f2e1b7d29ad9f1"
  );
  assert.equal(signature, "V/iaRHNyBnmqVG1mRCZUQo7HTX2sZGgDsJzajV1hOVs=");
});

test("Straumur HMAC handles null values as empty strings", () => {
  const signature = hmacSignature(
    {
      checkoutReference: null,
      payfacReference: "ABC123",
      merchantReference: null,
      amount: "250000",
      currency: "ISK",
      reason: null,
      success: "true",
    },
    "46cf31c712a1eecbd52426e32589b2f85351c44b747913fa"
  );
  assert.equal(typeof signature, "string");
  assert.equal(signature.length, 44);
});
