const INRCToken = artifacts.require("INRCToken");

module.exports = function (deployer) {
  deployer.deploy(INRCToken);
};
