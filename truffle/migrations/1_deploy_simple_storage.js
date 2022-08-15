const DemoUSDC = artifacts.require("DemoUSDC");

module.exports = function (deployer) {
  deployer.deploy(DemoUSDC);
};
