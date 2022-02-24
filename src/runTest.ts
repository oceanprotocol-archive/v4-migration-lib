import Web3 from 'web3'
import { Migration } from './migration/Migration'

const run = async () => {
  const provider = new Web3.providers.HttpProvider(
    'https://speedy-nodes-nyc.moralis.io/214f6439e2aaf21012c17787/eth/rinkeby'
  )

  const web3 = new Web3(provider)

  const account = web3.eth.accounts.privateKeyToAccount('')
  web3.eth.accounts.wallet.add(account)

  const migration = new Migration(web3)

  await migration.migratePoolAssetTest()
}

run()
