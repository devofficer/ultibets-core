module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()
  
  await deploy("VRFv2SubscriptionManager", {
    from: deployer,
    log: true,
  });
};

module.exports.tags = ['VRFv2SubscriptionManager'];