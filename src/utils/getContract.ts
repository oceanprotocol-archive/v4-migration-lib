export default async function getContract(web3, Contract): Promise<any> {
  let instance = null
  // Get the contract instance.
  const networkId = await web3.eth.net.getId()
  const deployedNetwork = Contract.networks[networkId]

  if (deployedNetwork) {
    instance = new web3.eth.Contract(
      Contract.abi,
      deployedNetwork && deployedNetwork.address
    )
  } else {
    window.alert(
      'Sorry, the smart contract is not deployed to the current network.'
    )
  }

  return instance
}
