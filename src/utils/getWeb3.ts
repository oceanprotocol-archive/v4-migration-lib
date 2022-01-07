import Web3 from 'web3'

export default function getWeb3() {
  const web3Provider = new Web.providers.WebsocketProvider(
    process.env.WEB3_PROVIDER_URL
  )
  const web3 = new Web3(web3Provider)
  return web3
}
