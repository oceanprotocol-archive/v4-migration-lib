import Web3 from 'web3'
import { Migration } from './migration/Migration'

const run = async () => {
  const provider = new Web3.providers.HttpProvider(
    'https://speedy-nodes-nyc.moralis.io/214f6439e2aaf21012c17787/eth/rinkeby'
  )

  const web3 = new Web3(provider)

  const account = web3.eth.accounts.privateKeyToAccount(
    'e18d2dfabac99eba4fa0b68abae16e1e261fd7e15d95d5a4f1637caa608cdb49'
  )
  web3.eth.accounts.wallet.add(account)

  const migration = new Migration(web3)

  await migration.migratePoolAssetTest(web3, account.address)
}

run()
