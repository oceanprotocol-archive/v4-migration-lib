import datatokensTemplate from '@oceanprotocol/contracts/artifacts/DataTokenTemplate.json'
import factory from '@oceanprotocol/contracts/artifacts/DTFactory.json'
import { assert, use } from 'chai'
import Web3 from 'web3'
import { AbiItem } from 'web3-utils/types'
import { DataTokens } from '../../src/v3/datatokens/Datatokens'
import { Account, ServiceAccess } from '../../src/v3/lib'
import { Ocean } from '../../src/v3/ocean/Ocean'
import { ConfigHelper } from '../../src/v3/utils/ConfigHelper'
import { TestContractHandler } from './TestContractHandler'
import { LoggerInstance } from '../../src/v3/utils'
import { Migration } from '../../src/migration/FixedRateExchangeMigration'

const web3 = new Web3('http://127.0.0.1:8545')
const url = 'https://s3.amazonaws.com/testfiles.oceanprotocol.com/info.0.json'

describe('Get V3 URL flow', () => {
  let owner: Account
  let alice: Account
  let ddo
  let asset
  let assetInvalidNoName
  let contracts: TestContractHandler
  let datatoken: DataTokens
  let tokenAddress: string
  let service1: ServiceAccess
  let price: string
  let ocean: Ocean
  let data
  let blob

  it('Initialize Ocean contracts v3', async () => {
    contracts = new TestContractHandler(
      factory.abi as AbiItem[],
      datatokensTemplate.abi as AbiItem[],
      datatokensTemplate.bytecode,
      factory.bytecode,
      web3
    )
    const config = new ConfigHelper().getConfig('development')
    config.web3Provider = web3
    ocean = await Ocean.getInstance(config)
    owner = (await ocean.accounts.list())[0]
    alice = (await ocean.accounts.list())[1]
    data = { t: 1, url: config.metadataCacheUri }
    blob = JSON.stringify(data)
    await contracts.deployContracts(owner.getId())
  })

  it('Alice publishes a datatoken contract', async () => {
    datatoken = new DataTokens(
      contracts.factoryAddress,
      factory.abi as AbiItem[],
      datatokensTemplate.abi as AbiItem[],
      web3,
      LoggerInstance
    )
    tokenAddress = await datatoken.create(
      blob,
      alice.getId(),
      '10000000000',
      'AliceDT',
      'DTA'
    )
    assert(tokenAddress != null)
  })

  it('Generates metadata', async () => {
    asset = {
      main: {
        type: 'dataset',
        name: 'test-dataset',
        dateCreated: new Date(Date.now()).toISOString().split('.')[0] + 'Z', // remove milliseconds
        author: 'oceanprotocol-team',
        license: 'MIT',
        files: [
          {
            index: 0,
            url,
            checksum: 'efb2c764274b745f5fc37f97c6b0e761',
            contentLength: '4535431',
            contentType: 'text/csv',
            encoding: 'UTF-8',
            compression: 'zip'
          }
        ]
      }
    }
  })
  it('Should validate local metadata', async () => {
    const valid = await ocean.metadataCache.validateMetadata(asset)
    assert(valid.valid, 'This metadata should be valid')
  })
  it('Alice publishes all datasets', async () => {
    price = '10' // in datatoken
    const publishedDate = new Date(Date.now()).toISOString().split('.')[0] + 'Z'
    const timeout = 0
    service1 = await ocean.assets.createAccessServiceAttributes(
      alice,
      price,
      publishedDate,
      timeout
    )
    asset.main.datePublished = asset.main.dateCreated
    try {
      ddo = await ocean.assets.create(asset, alice, [service1], tokenAddress)
    } catch (error) {
      console.log('error', error)
    }
    assert(ddo.dataToken === tokenAddress)
    let storeTx
    try {
      storeTx = await ocean.onChainMetadata.publish(ddo.id, ddo, alice.getId())
    } catch (error) {
      console.log('error', error)
    }
    assert(storeTx)
    // wait for all this assets to be published
    await ocean.metadataCache.waitForAqua(ddo.id)
  })

  it('Alice tries to get the asset URL from the V3 provider', async () => {
    try {
      const did = ddo.id
      const urlResponse = await ocean.provider.getAssetURL(alice, did, 1)
      assert(urlResponse !== undefined, 'Failed to get asset url')
      assert(urlResponse === url, 'Wrong or invalid url returned')
    } catch (error) {
      assert(error === null, 'Order should not throw error')
    }
  })
  it('Alice tries to get the asset URL using the migration', async () => {
    try {
      const migration = new Migration(web3)
      const did = ddo.id
      const urlResponse = await migration.getAssetURL(
        web3,
        alice,
        did,
        'development'
      )
      assert(urlResponse !== undefined, 'Failed to get asset url')
      assert(urlResponse === url, 'Wrong or invalid url returned')
    } catch (error) {
      assert(error === null, 'Order should not throw error')
    }
  })
})
