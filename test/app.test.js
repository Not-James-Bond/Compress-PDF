const assert = require("assert");
const myServer = require("../app.js");

// Testing getOriginalFileName
describe("getOriginalFileName Test with Mocha", () => {
  it("should return the original filename", () => {
    let inputs = 'USC-OASIS-Enrollment history.pdf';
    let outputs = myServer.getOriginalFileName(inputs);
    assert.equal(outputs, 'USC_OASIS_Enrollment_history.pdf');
  });
});

// Testing getCompactedFileName
describe("getCompactedFileName Test with Mocha", () => {
  it("should return the compacted filename", () => {
    let inputs = 'USC-OASIS-Enrollment_history.pdf';
    let outputs = myServer.getCompactedFileName(inputs);
    assert.equal(outputs, 'USC-OASIS-Enrollment_history-compacted.pdf');
  });
});
