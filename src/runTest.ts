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

  // await migration.migratePoolAssetTest()

  await migration.runMigration(
    '0xE75fa34968323219f4664080103746a605d18A47',
    '0x3b2A8De44C8C5E2e472c67B3f8da75f26294E875',
    '0x97f5f3065c2e82fefa3da199500930e9c6039f34',
    ['1', '1']
  )
}

run()
