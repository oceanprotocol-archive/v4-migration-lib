import datatokensTemplate from '@oceanprotocol/contracts/artifacts/DataTokenTemplate.json'
import factory from '@oceanprotocol/contracts/artifacts/DTFactory.json'
import { assert, use } from 'chai'
import Web3 from 'web3'
import { AbiItem } from 'web3-utils/types'
import { DataTokens } from '../../src/v3/datatokens/Datatokens'
import { Account, ServiceAccess } from '../../src/v3/lib'
import { Ocean } from '../../src/v3/ocean/Ocean'
import { ConfigHelper } from '../../src/v3/utils/ConfigHelper'
import { TestContractHandler } from '../V3TestContractHandler'
import { LoggerInstance } from '../../src/v3/utils'
import { Migration } from '../../src/migration/FixedRateExchangeMigration'
import { DDO as v3DDO } from '../../src/v3'
import { DDO as v4DDO } from '../../src/@types/DDO/DDO'
import { getDDO } from '../../src/DDO/importDDO'
import { getAndConvertDDO } from '../../src/DDO/convertDDO'

const web3 = new Web3('http://127.0.0.1:8545')
const url = 'https://people.sc.fsu.edu/~jburkardt/data/csv/homes.csv'
const v4ProviderUrl = 'https://v4.provider.ropsten.oceanprotocol.com'
const v3ProviderUri = 'http://localhost:8030'
const network = 'development'
const metadataCacheUri = 'https://aquarius.oceanprotocol.com'
const did1 = 'did:op:7Bce67697eD2858d0683c631DdE7Af823b7eea38'
const did2 = 'did:op:a2B8b3aC4207CFCCbDe4Ac7fa40214fd00A2BA71'
const did3 = 'did:op:50C48d3eE0Ed47479d3e2599FAe0076965cBD39c'
const nftAddress = ''
const erc20Address = ''
const encryptedFiles =
  '0x04f91f187587d76605c40d0ab6f92d1e75ee1a4f97bdc60ed0368884082240c20d03e799e1f54e038f953ec508454631b0a4c24fcfd9d8fb9657d4d5f6945f2c4c91eeb9a40c5f6580a7c785c44420223fd2cac6ad7e34403e5047b394706075653d359b46480fdd365d286f37ea460b9b0c9d9d7787210fbe5a0bab66de96d3a237d599d6876f547bdf996445498cb6f70fea47c9ec811c4a9a34dfc498f628583e5221c119'

describe('V3 flow', () => {
  let owner: Account,
    alice: Account,
    ddo,
    did: string,
    asset,
    assetInvalidNoName,
    contracts: TestContractHandler,
    datatoken: DataTokens,
    tokenAddress: string,
    service1: ServiceAccess,
    price: string,
    ocean: Ocean,
    data,
    blob,
    migration

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
    console.log('Alice', alice)
    data = { t: 1, url: config.metadataCacheUri }
    blob = JSON.stringify(data)
    await contracts.deployContracts(owner.getId())
    migration = new Migration(web3)
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

  it('Converts 1st DDO', async () => {
    const ddo1: v4DDO = await getAndConvertDDO(
      did1,
      '1234567890',
      nftAddress,
      erc20Address,
      metadataCacheUri,
      encryptedFiles
    )
    assert(
      ddo1.metadata.name === '🖼  DataUnion.app - Image & Annotation Vault  📸'
    )
    assert(ddo1.metadata.type === 'dataset')
  })
  it('Converts 2nd DDO', async () => {
    const ddo2: v4DDO = await getAndConvertDDO(
      did2,
      '1234567890',
      nftAddress,
      erc20Address,
      metadataCacheUri,
      encryptedFiles
    )
    assert(
      ddo2.metadata.name ===
        'Product Pages of 1’044’709 Products on Amazon.com (processed data)'
    )
    assert(ddo2.metadata.type === 'dataset')
  })
  it('Converts 3rd DDO', async () => {
    const ddo3: v4DDO = await getAndConvertDDO(
      did3,
      '1234567890',
      nftAddress,
      erc20Address,
      metadataCacheUri,
      encryptedFiles
    )
    assert(ddo3.metadata.name === 'Posthuman: DistilBERT QA inference Algo v2')
    assert(ddo3.metadata.type === 'algorithm')
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
    did = ddo.id
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
      const urlResponse = await ocean.provider.getAssetURL(alice, did, 1)
      assert(urlResponse !== undefined, 'Failed to get asset url')
      assert(urlResponse === url, 'Wrong or invalid url returned')
    } catch (error) {
      assert(error === null, 'Order should not throw error')
    }
  })
  it('Alice tries to get the asset URL using the migration', async () => {
    try {
      const urlResponse = await migration.getAssetURL(alice, did, network)
      assert(urlResponse !== undefined, 'Failed to get asset url')
      assert(urlResponse === url, 'Wrong or invalid url returned')
    } catch (error) {
      assert(error === null, 'Order should not throw error')
    }
  })
  it('Alice tries to get the encrypted Files using the migration', async () => {
    try {
      const encryptedFiles = await migration.getEncryptedFiles(
        v4ProviderUrl,
        alice,
        did,
        network
      )
      assert(encryptedFiles !== undefined, 'Failed to get asset url')
    } catch (error) {
      assert(error === null, 'Order should not throw error')
    }
  })
})
